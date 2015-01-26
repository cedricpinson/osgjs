var CustomCompiler;
( function () {
    'use strict';
    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;
    var factory = osgShader.nodeFactory;


    // this compiler use basic lighting and add a node to demonstrate how to
    // customize the shader compiler
    CustomCompiler = function () {
        osgShader.Compiler.apply( this, arguments );
    };


    CustomCompiler.prototype = osg.objectInherit( osgShader.Compiler.prototype, {


        // this is the main code that instanciate and link nodes together
        // it's a simplified version of the curent osgjs compiler
        // it could also be simpler
        createFragmentShaderGraph: function () {

            var velocityAttribute = this.getAttributeType( 'Velocity' );
            if ( velocityAttribute )
                return this.velocity( velocityAttribute );

            // no material then return a default shader
            // you could do whatever you want here
            // if you want to return a debug color
            // just to be sure that you always have
            // valid material in your scene, in our case we suppose
            // it exists in the scene
            if ( !this._material )
                return this.createDefaultFragmentShaderGraph();


            var materialUniforms = this.getOrCreateStateAttributeUniforms( this._material );

            // diffuse color
            // use texture if we have some, check code of Compiler
            // to see the default behaviour
            var diffuseColor = this.getDiffuseColorFromTextures();


            // no texture then we use the material diffuse value
            if ( diffuseColor === undefined ) {
                diffuseColor = materialUniforms.diffuse;
            } else {
                factory.getNode( 'InlineCode' ).code( '%color.rgb *= %diffuse.rgb;' ).inputs( {
                    diffuse: materialUniforms.diffuse
                } ).outputs( {
                    color: diffuseColor
                } );
            }

            // vertex color needs to be computed to diffuse
            diffuseColor = this.getVertexColor( diffuseColor );

            // compute alpha
            var alpha = this.createVariable( 'float' );
            var textureTexel = this.getFirstValidTexture();

            var alphaCompute;
            if ( textureTexel ) // use alpha of the first valid texture if has texture
                alphaCompute = '%alpha = %color.a * %texelAlpha.a;';
            else
                alphaCompute = '%alpha = %color.a;';

            factory.getNode( 'InlineCode' ).code( alphaCompute ).inputs( {
                color: materialUniforms.diffuse,
                texelAlpha: textureTexel
            } ).outputs( {
                alpha: alpha
            } );

            // 2 codes path
            // if we have light we compute a subgraph that will generate
            // color from lights contribution...
            // if we dont have light we will use the diffuse color found as default
            // fallback
            var fragTempColor = this.createVariable( 'vec4' );
            if ( this._lights.length > 0 ) {
                // creates lights nodes
                var lightedOutput = this.createLighting( {
                    materialdiffuse: diffuseColor
                } );
                fragTempColor = lightedOutput;
            } else {
                // no lights use a default behaviour
                fragTempColor = diffuseColor;
            }


            // premult alpha
            var finalColor = this.getPremultAlpha( fragTempColor, alpha );
            var fragTempFinalColor = this.createVariable( 'vec4' );

            // todo add gamma corrected color, but it would also
            // mean to handle correctly srgb texture. So it should be done
            // at the same time. see osg.Tetxure to implement srgb
            factory.getNode( 'SetAlpha' ).inputs( {
                color: finalColor,
                alpha: alpha
            } ).outputs( {
                color: fragTempFinalColor
            } );

            var fragColor = factory.getNode( 'FragColor' );
            this.temporal( fragColor, fragTempFinalColor );
            return fragColor;
        },

        // This function is used when no material
        // is present. If you inherit from this Compiler
        // you could change the default behavior
        createDefaultFragmentShaderGraph: function () {
            var nothing = this.createVariable( 'vec4' ).setValue( 'vec4(1.0, 0.0, 1.0, 0.7)' );

            var fragColor = factory.getNode( 'FragColor' );
            this.temporal( fragColor, nothing );

            return fragColor;
        },
        // ======================================================
        // my custom attribute temporal
        // it's here I connect ouput of light result with my temporal
        // ======================================================
        temporal: function ( fragColor, input ) {
            var output = input;
            var temporalAttribute = this.getAttributeType( 'Temporal' );
            if ( temporalAttribute ) {
                var temporalResult = this.createVariable( 'vec4' );

                factory.getNode( 'Temporal' ).inputs( {
                    color: input,
                    enable: this.getOrCreateUniform( temporalAttribute.getOrCreateUniforms().enable ),
                    frameNum: this.getOrCreateUniform( 'float', 'FrameNum' ),
                    fragScreenPos: this.getOrCreateVarying( 'vec4', 'FragScreenPos' ),
                    prevFragScreenPos: this.getOrCreateVarying( 'vec4', 'FragPrevScreenPos' ),
                    texture2: this.getOrCreateSampler( 'sampler2D', 'Texture2' )
                } ).outputs( {
                    color: temporalResult
                } );
                output = temporalResult;
            }

            // no temporal use a default behaviour
            factory.getNode( 'InlineCode' ).code( '%color = %fragTempColor;' ).inputs( {
                fragTempColor: output
            } ).outputs( {
                color: fragColor
            } );

        },
        // ======================================================
        // my custom attribute velocity
        // it's here I connect ouput of light result with my velocity
        // ======================================================
        velocity: function ( velocityAttribute ) {

            var fragColor = factory.getNode( 'FragColor' );


            var res = this.createVariable( 'vec4' );
            factory.getNode( 'Velocity' ).inputs( {
                enable: this.getOrCreateUniform( velocityAttribute.getOrCreateUniforms().enable ),
                fragScreenPos: this.getOrCreateVarying( 'vec4', 'FragScreenPos' ),
                prevFragScreenPos: this.getOrCreateVarying( 'vec4', 'FragPrevScreenPos' )
            } ).outputs( {
                color: res
            } );

            //
            factory.getNode( 'InlineCode' ).code( '%color = %fragTempColor;' ).inputs( {
                fragTempColor: res
            } ).outputs( {
                color: fragColor
            } );

            return fragColor;
        },
        createVertexShaderGraph: function () {

            var texCoordMap = {};
            var textures = this._textures;
            var texturesMaterial = this._texturesByName;

            this._vertexShader.push( [ '',
                'attribute vec3 Vertex;',
                'attribute vec4 Color;',
                'attribute vec3 Normal;',
                'uniform float ArrayColorEnabled;',
                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',
                'uniform mat4 NormalMatrix;',
                'varying vec4 VertexColor;',
                'varying vec3 FragNormal;',
                'varying vec3 FragEyeVector;',
                '',
                ''
            ].join( '\n' ) );
            ////////////////////:
            var temporalAttribute = this.getAttributeType( 'Temporal' );
            var velocityAttribute = this.getAttributeType( 'Velocity' );
            if ( temporalAttribute ) {

                this._vertexShader.push( [ '',
                    'uniform mat4 PrevModelViewMatrix;',
                    'uniform mat4 PrevProjectionMatrix;',
                    '',
                    'uniform vec2 RenderSize;',
                    'uniform float SampleX;',
                    'uniform float SampleY;',
                    'uniform float FrameNum;',
                    'uniform int temporalEnable;',
                    '',
                    '// frame screenpos',
                    'varying vec4  FragScreenPos;',
                    '// previous frame screenpos',
                    'varying vec4  FragPrevScreenPos;',
                    '',
                ].join( '\n' ) );

            } else if ( velocityAttribute ) {

                this._vertexShader.push( [ '',
                    'uniform mat4 PrevModelViewMatrix;',
                    'uniform mat4 PrevProjectionMatrix;',
                    '',
                    'uniform vec2 RenderSize;',
                    'uniform int velocityEnable;',
                    '',
                    '// frame screenpos',
                    'varying vec4  FragScreenPos;',
                    '// previous frame screenpos',
                    'varying vec4  FragPrevScreenPos;',
                    '',
                ].join( '\n' ) );
            }
            /////////////
            for ( var t = 0, tl = textures.length; t < tl; t++ ) {

                var texture = textures[ t ];

                if ( texture !== undefined ) {

                    // no method to retrieve textureCoordUnit, we maybe dont need any uvs
                    var textureMaterial = texturesMaterial[ texture.getName() ];
                    if ( !textureMaterial && !textureMaterial.textureUnit )
                        continue;

                    var texCoordUnit = textureMaterial.textureUnit;
                    if ( texCoordUnit === undefined ) {
                        texCoordUnit = t; // = t;
                        textureMaterial.textureUnit = 0;
                    }

                    if ( texCoordMap[ texCoordUnit ] === undefined ) {

                        this._vertexShader.push( 'attribute vec2 TexCoord' + texCoordUnit + ';' );
                        this._vertexShader.push( 'varying vec2 FragTexCoord' + texCoordUnit + ';' );
                        texCoordMap[ texCoordUnit ] = true;

                    }

                }
            }

            this._vertexShader.push( [ '',
                'void main() {',
                ''
            ].join( '\n' ) );

            if ( temporalAttribute ) {

                this._vertexShader.push( [ '',
                    '  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);',
                    '  mat4 projMat = ProjectionMatrix;',
                    '  //projection space',
                    '  FragScreenPos = projMat * pos;',
                    '',
                    '  if (temporalEnable == 1 && FrameNum > 1.0){',
                    '    // original paper stretch to -1,1 but neighbour pixel will',
                    '    // overwrite over neighbour pixel',
                    '    // here it doesnt as it spreads over - 0.5 + 0.5 ',
                    '     projMat[2][0] += ((SampleX ) - 0.5) / (RenderSize.x );',
                    '     projMat[2][1] += ((SampleY ) - 0.5) / (RenderSize.y );',
                    '  }',
                    '  vec4 position = projMat * pos;',
                    '  gl_Position = position;',
                    '',
                    '   // compute prev clip space position',
                    '  vec4 prevPos = PrevModelViewMatrix * vec4(Vertex,1.0);',
                    '  // get previous screen space position:',
                    '  vec4 prevPosition = PrevProjectionMatrix * prevPos;',
                    '  // projection space',
                    '  FragPrevScreenPos = prevPosition;',
                    ''
                ].join( '\n' ) );
                /////////////
            } else if ( velocityAttribute ) {

                this._vertexShader.push( [ '',
                    '  vec4 viewPos = ModelViewMatrix * vec4(Vertex,1.0);',
                    '  mat4 projMat = ProjectionMatrix;',
                    '  //projection space',
                    '  FragScreenPos = projMat * viewPos;',
                    '',
                    '  vec4 position = FragScreenPos;',
                    '  gl_Position = position;',
                    '',
                    '   // compute prev clip space position',
                    '  vec4 prevPos = PrevModelViewMatrix * vec4(Vertex,1.0);',
                    '  // get previous screen space position:',
                    '  vec4 prevPosition = PrevProjectionMatrix * prevPos;',
                    '  // projection space',
                    '  FragPrevScreenPos = prevPosition;',
                    ''
                ].join( '\n' ) );
                /////////////
            } else {
                this._vertexShader.push( [ '',
                    '  vec4 viewPos = ModelViewMatrix * vec4(Vertex,1.0);',
                    '  gl_Position = ProjectionMatrix * viewPos;',
                    ''
                ].join( '\n' ) );
            }

            this._vertexShader.push( [ '',
                '  FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));',
                '  FragEyeVector = viewPos.xyz;',
                '  if (ArrayColorEnabled == 1.0)',
                '    VertexColor = Color;',
                '  else',
                '    VertexColor = vec4(1.0,1.0,1.0,1.0);',
                '  gl_PointSize = 1.0;',
                '',
                ''
            ].join( '\n' ) );

            var self = this;
            ( function () {
                var texCoordMap = {};

                for ( var tt = 0, ttl = textures.length; tt < ttl; tt++ ) {

                    if ( textures[ tt ] !== undefined ) {

                        var texture = textures[ tt ];
                        var textureMaterial = texturesMaterial[ texture.getName() ];

                        // no method getTexCoordUnit, maybe we dont need it at all
                        if ( !textureMaterial && !textureMaterial.textureUnit )
                            continue;

                        var texCoordUnit = texture.textureUnit;
                        if ( texCoordUnit === undefined ) {
                            texCoordUnit = tt;
                            textureMaterial.textureUnit = texCoordUnit;
                        }

                        if ( texCoordMap[ texCoordUnit ] === undefined ) {
                            self._vertexShader.push( 'FragTexCoord' + texCoordUnit + ' = TexCoord' + texCoordUnit + ';' );
                            texCoordMap[ texCoordUnit ] = true;
                        }
                    }
                }
            } )();




            this._vertexShader.push( '}' );
        },


    } );

} )();