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

        initTextureAttributes: function () {
            var textureAttributes = this._textureAttributes;
            var texturesNum = textureAttributes.length;
            var textures = this._textures;
            var shadowTextures = this._shadowsTextures;
            textures.length = shadowTextures.length = texturesNum;

            for ( var j = 0; j < texturesNum; j++ ) {

                var tu = textureAttributes[ j ];
                if ( tu === undefined )
                    continue;

                for ( var t = 0, tl = tu.length; t < tl; t++ ) {

                    var tuTarget = tu[ t ];

                    var tType = tuTarget.className();

                    var texUnit;
                    var tName;
                    if ( tType === 'Texture' ) {

                        texUnit = j;
                        tName = tuTarget.getName();
                        if ( tuTarget.getName() === undefined ) {
                            tName = tType + texUnit;
                            tuTarget.setName( tName );
                        }
                        textures[ texUnit ] = tuTarget;

                        this._texturesByName[ tName ] = {
                            variable: undefined,
                            textureUnit: texUnit,
                            shadow: ( ( tuTarget.preventDiffuseAcc === undefined ) ? false : true )
                        };

                    } else if ( tType === 'ShadowTexture' ) {

                        texUnit = j;
                        tName = tuTarget.getName();
                        if ( tuTarget.getName() === undefined ) {
                            tName = tType + texUnit;
                            tuTarget.setName( tName );
                        }
                        shadowTextures[ texUnit ] = tuTarget;

                        this._texturesByName[ tName ] = {
                            'variable': undefined,
                            'textureUnit': texUnit,
                            'shadow': true
                        };
                    }
                    // TODO: cubemap

                }
            }
        },
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
            var finalColor;

            if ( this._lights.length > 0 ) {

                // creates lights nodes
                var lightedOutput = this.createLighting( {
                    materialdiffuse: diffuseColor
                } );
                finalColor = lightedOutput;

            } else {

                // no light use diffuse color
                finalColor = diffuseColor;

            }


            // premult alpha
            finalColor = this.getPremultAlpha( finalColor, alpha );

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
        //
        // TODO: change into node based graph shader system.
        declareVertexVariables: function () {

            var texCoordMap = {};
            var textures = this._textures;
            var texturesMaterial = this._texturesByName;

            this._vertexShader.push( [ '',
                'attribute vec3 Vertex;',
                'attribute vec4 Color;',
                'attribute vec3 Normal;',
                '',
                'uniform float ArrayColorEnabled;',
                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',
                'uniform mat4 NormalMatrix;',
                '',
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

            var i, ll;
            var hasShadows = false;
            for ( i = 0, ll = this._shadowsTextures.length; i < ll; i++ ) {

                var shadowTexture = this._shadowsTextures[ i ];
                if ( shadowTexture === undefined )
                    continue;
                if ( !hasShadows ) {
                    hasShadows = true;
                    this._vertexShader.push( 'uniform mat4 ModelWorldMatrix;' );
                }

                var shadowTextureUniforms = shadowTexture.getOrCreateUniforms( i );
                var viewMat = shadowTextureUniforms.ViewMatrix;
                var projMat = shadowTextureUniforms.ProjectionMatrix;
                var depthRange = shadowTextureUniforms.DepthRange;
                var mapSize = shadowTextureUniforms.MapSize;
                // uniforms
                this._vertexShader.push( 'uniform mat4 ' + projMat.getName() + ';' );
                this._vertexShader.push( 'uniform mat4 ' + viewMat.getName() + ';' );
                this._vertexShader.push( 'uniform vec4 ' + depthRange.getName() + ';' );
                this._vertexShader.push( 'uniform vec4 ' + mapSize.getName() + ';' );
                // varyings
                this._vertexShader.push( 'varying vec4 ' + shadowTexture.getVaryingName( 'VertexProjected' ) + ';' );
                this._vertexShader.push( 'varying vec4 ' + shadowTexture.getVaryingName( 'Z' ) + ';' );
                hasShadows = true;
            }

            for ( var t = 0, tl = this._textures.length; t < tl; t++ ) {
                var texCoordUnit = this.getTexCoordUnit( t );
                if ( texCoordUnit === undefined || texCoordMap[ texCoordUnit ] !== undefined )
                    continue;
                this._vertexShader.push( 'attribute vec2 TexCoord' + texCoordUnit + ';' );
                this._vertexShader.push( 'varying vec2 FragTexCoord' + texCoordUnit + ';' );
                texCoordMap[ texCoordUnit ] = true;
            }

        },


        declareVertexMain: function () {


            /////////////// reproj
            var temporalAttribute = this.getAttributeType( 'Temporal' );
            var velocityAttribute = this.getAttributeType( 'Velocity' );
            if ( temporalAttribute ) {

                this._vertexShader.push( [ '',
                    '  vec4 viewPos = ModelViewMatrix * vec4(Vertex,1.0);',
                    '  mat4 projMat = ProjectionMatrix;',
                    '  //projection space',
                    '  FragScreenPos = projMat * viewPos;',
                    '',
                    '  //if (temporalEnable == 1 && FrameNum > 1.0){',
                    '    // original paper stretch to -1,1 but neighbour pixel will',
                    '    // overwrite over neighbour pixel',
                    '    // here it doesnt as it spreads over - 0.5 + 0.5 ',
                    '     projMat[2][0] += ((SampleX ) - 0.5) / (RenderSize.x );',
                    '     projMat[2][1] += ((SampleY ) - 0.5) / (RenderSize.y );',
                    '  //}',
                    '  vec4 position = projMat * viewPos;',
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


            this._vertexShader.push( [
                '',
                '  FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));',
                '  FragEyeVector = viewPos.xyz;',
                '  if (ArrayColorEnabled == 1.0)',
                '    VertexColor = Color;',
                '  else',
                '    VertexColor = vec4(1.0,1.0,1.0,1.0);',
                '  gl_PointSize = 1.0;',
                ''
            ].join( '\n' ) );

            var texCoordMap = {};

            for ( var tt = 0; tt < this._textures.length; tt++ ) {
                var texCoordUnit = this.getTexCoordUnit( tt );
                if ( texCoordUnit === undefined || texCoordMap[ texCoordUnit ] !== undefined )
                    continue;
                this._vertexShader.push( 'FragTexCoord' + texCoordUnit + ' = TexCoord' + texCoordUnit + ';' );
                texCoordMap[ texCoordUnit ] = true;
            }

            var hasShadows = false;
            for ( var i = 0, ll = this._shadowsTextures.length; i < ll; i++ ) {
                var shadowTexture = this._shadowsTextures[ i ];
                if ( !shadowTexture )
                    continue;
                if ( !hasShadows ) {
                    hasShadows = true;
                    this._vertexShader.push( 'vec4 worldPosition = ModelWorldMatrix * vec4(Vertex,1.0);' );
                }

                // uniforms
                var shadowTextureUniforms = shadowTexture.getOrCreateUniforms( i );
                var shadowView = shadowTextureUniforms.ViewMatrix.getName();
                var shadowProj = shadowTextureUniforms.ProjectionMatrix.getName();

                // varyings
                var shadowVertProj = shadowTexture.getVaryingName( 'VertexProjected' );
                var shadowZ = shadowTexture.getVaryingName( 'Z' );


                this._vertexShader.push( ' ' + shadowZ + ' = ' + shadowView + ' *  worldPosition;' );
                this._vertexShader.push( ' ' + shadowVertProj + ' = ' + shadowProj + ' * ' + shadowZ + ';' );
            }
        },
        // Meanwhile, here it is.
        createVertexShaderGraph: function () {
            this.declareVertexVariables();
            this._vertexShader.push( 'void main() {' );
            this.declareVertexMain();
            this._vertexShader.push( '}' );
        }

    } );

} )();
