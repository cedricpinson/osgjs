define( [
    'osg/Notify',
    'osg/utils',
    'osg/Uniform',
    'osgShader/nodeFactory',
    'osgShader/node/functions',
    'osgShader/utils'
], function ( Notify, MACROUTILS, Uniform, factory, functions, utils ) {
    'use strict';

    var sprintf = utils.sprintf;
    var defaultGamma = functions.LinearTosRGB.defaultGamma;

    var Compiler = function ( attributes, textureAttributes, shaderProcessor ) {

        this._attributes = attributes;
        this._textureAttributes = textureAttributes;

        this._variables = {};
        this._vertexShader = [];
        this._fragmentShader = [];

        // global stuffs
        this._shaderProcessor = shaderProcessor;
        this._texturesByName = {};

        // separate Material / Light / Texture
        // because this shader generator is specific for this
        var lights = [];
        var material;

        for ( var i = 0, l = attributes.length; i < l; i++ ) {

            var type = attributes[ i ].className();

            // Test one light at a time
            if ( type === 'Light' ) { // && lights.length === 0) {

                lights.push( attributes[ i ] );

            } else if ( type === 'Material' ) {

                if ( material !== undefined ) Notify.warn( 'Multiple Material attributes latest Chosen ' );
                material = attributes[ i ];

            }

        }


        var texturesNum = textureAttributes.length;
        var textures = new Array( texturesNum );

        for ( var j = 0; j < texturesNum; j++ ) {

            var tu = textureAttributes[ j ];
            if ( tu !== undefined ) {

                for ( var t = 0, tl = tu.length; t < tl; t++ ) {

                    var tuTarget = tu[ t ];

                    var tType = tuTarget.className();

                    if ( tType === 'Texture' ) {

                        var texUnit = j;
                        var tName = tType + texUnit;
                        tuTarget.setName( tName );

                        textures[ texUnit ] = tuTarget;
                        this._texturesByName[ tName ] = {
                            'variable': undefined,
                            'textureUnit': texUnit
                        };

                    }
                }
            }
        }

        this._lights = lights;
        this._material = material;
        this._textures = textures;
    };

    Compiler.prototype = {

        getVariable: function ( name ) {
            return this._variables[ name ];
        },

        // if doesn't exist create a new on
        // if name given and var already exist, create a varname +
        getOrCreateVariable: function ( type, varname, deepness ) {

            var name = varname;

            if ( name === undefined ) {

                var len = Object.keys( this._variables ).length;
                name = 'tmp_' + len;

            } else if ( this._variables[ name ] ) {
                // create a new variable
                // if we want to reuse a variable we should NOT
                // call this function in the first place and do the
                // test before...
                // however for uniform, varying and sampler, we return
                // the variable if it already exists, because they are
                // meant to be read only
                name = name + deepness;
                if ( deepness === undefined ) {
                    return this.getOrCreateVariable( type, varname, 1 );
                } else if ( this._variables[ name ] ) {
                    deepness++;
                    return this.getOrCreateVariable( type, varname, deepness );
                }

            }

            var v = factory.getNode( 'Variable' , type, name );
            this._variables[ name ] = v;
            return v;
        },

        getOrCreateStateAttributeUniforms: function ( stateAttribute, prefix ) {

            var uniforms = stateAttribute.getOrCreateUniforms();
            var keys = Object.keys( uniforms );
            var object = {};

            var prefixUniform = prefix ? prefix : '';

            for ( var i = 0; i < keys.length; i++ ) {
                var k = prefixUniform + keys[i];
                object[ k ] = this.getOrCreateUniform( uniforms[ keys[i] ] );
            }

            return object;
        },

        getOrCreateUniform: function ( type, varname ) {

            var name = varname;

            // accept uniform as parameter to simplify code
            if ( type instanceof Uniform ) {

                var uniform = type;
                type = uniform.getType();
                name = uniform.getName();

            } else if ( name === undefined ) {

                var len = Object.keys( this._variables ).length;
                name = 'tmp_' + len;

            }

            var exist = this._variables[ name ];
            if ( exist ) {
                // see comment in Variable function
                return exist;
            }

            var v = factory.getNode( 'Uniform' , type, name );
            this._variables[ name ] = v;
            return v;
        },


        getOrCreateVarying: function ( type, varname ) {

            var name = varname;
            if ( name === undefined ) {

                var len = Object.keys( this._variables ).length;
                name = 'tmp_' + len;

            } else {

                var exist = this._variables[ name ];
                if ( exist ) {
                    // see comment in Variable function
                    return exist;
                }

            }
            var v = factory.getNode( 'Varying',  type, name );
            this._variables[ name ] = v;
            return v;
        },


        getOrCreateSampler: function ( type, varname ) {

            var name = varname;
            if ( name === undefined ) {

                var len = Object.keys( this._variables ).length;
                name = 'sampler_' + len;

            } else {

                var exist = this._variables[ name ];
                if ( exist ) {
                    // see comment in Variable function
                    return exist;
                }

            }
            var v = factory.getNode( 'Sampler', type, name  );
            this._variables[ name ] = v;
            return v;
        },

        declareAttributeUniforms: function( attribute ) {

            var uniformMap = attribute.getOrCreateUniforms();
            var uniformMapKeys = uniformMap.getKeys();

            for ( var m = 0, ml = uniformMapKeys.length; m < ml; m++ ) {

                var kk = uniformMapKeys[ m ];
                var kkey = uniformMap[ kk ];
                this.getOrCreateUniform( kkey.type, kkey.name );

            }

        },

        declareUniforms: function () {

            if ( this._material ) {
                this.declareAttributeUniforms( this._material );
            }

            for ( var t = 0; t < this._lights.length; t++ ) {
                this.declareAttributeUniforms( this._lights[ t ] );
            }

        },


        getOrCreateInputNormal: function () {
            return this.getOrCreateVarying( 'vec3', 'FragNormal' );
        },


        getOrCreateFrontNormal: function () {
            var inputNormal = this.getOrCreateInputNormal();
            var frontNormal = this.getOrCreateVariable( 'vec3', 'frontNormal' );

            factory.getNode( 'FrontNormal' )
                .inputs( inputNormal )
                .outputs( frontNormal );

            return frontNormal;
        },


        getOrCreateInputPosition: function () {
            return this.getOrCreateVarying( 'vec3', 'FragEyeVector' );
        },


        getOrCreateNormalizedNormal: function () {
            var normal = this._variables[ 'normal' ];
            if ( normal )
                return normal;
            this.normalizeNormalAndEyeVector();
            return this._variables[ 'normal' ];
        },


        getOrCreateNormalizedPosition: function () {
            var eye = this._variables[ 'eyeVector' ];
            if ( eye )
                return eye;
            this.normalizeNormalAndEyeVector();
            return this._variables[ 'eyeVector' ];
        },


        // It should be called by getOrCreateNormalizedNormal or getOrCreateNormalizedPosition ONLY
        normalizeNormalAndEyeVector: function () {

            var frontNormal = this.getOrCreateFrontNormal();
            var inputPosition = this.getOrCreateInputPosition();

            // get or create normalized normal
            var outputNormal = this.getOrCreateVariable( 'vec3', 'normal' );

            // get or create normalized position
            var outputPosition = this.getOrCreateVariable( 'vec3', 'eyeVector' );

            //
            factory.getNode( 'NormalizeNormalAndEyeVector' )
                .inputs( {
                    'normal' : frontNormal,
                    'position': inputPosition
                } )
                .outputs( {
                    'normal' : outputNormal,
                    'eyeVector' : outputPosition
                } );

        },


        getPremultAlpha: function ( finalColor, alpha ) {

            if ( alpha === undefined )
                return finalColor;

            var premultAlpha = this.getOrCreateVariable( 'vec4' );

            factory.getNode( 'PreMultAlpha' )
                .inputs( {
                    color: finalColor,
                    alpha: alpha
                })
                .outputs( premultAlpha );

            return premultAlpha;
        },


        getColorsRGB: function ( finalColor ) {
            var finalSrgbColor = this.getOrCreateVariable( 'vec3' );
            factory.getNode( 'LinearTosRGB' )
                .inputs( {
                    'color': finalColor,
                    'gamma': defaultGamma.defaultGamma.toString()
                } )
                .outputs( finalSrgbColor );

            return finalSrgbColor;
        },


        // Declare variable / varying to handle vertex color
        // return a variable that contains the following operation
        // newDiffuseColor = diffuseColor * vertexColor
        // TODO: this code should move in the shader instead
        getVertexColor: function ( diffuseColor ) {

            if ( diffuseColor === undefined )
                return undefined;

            var vertexColor = this.getOrCreateVarying( 'vec4', 'VertexColor' );
            var vertexColorUniform = this.getOrCreateUniform( 'float', 'ArrayColorEnabled' );
            var tmp = this.getOrCreateVariable( 'vec4' );

            factory.getNode( 'InlineCode' )
                .code([ '',

                        '%color.rgb = %diffuse.rgb;',
                        'if ( %hasVertexColor == 1.0)',
                        '  %color *= %vertexColor.rgba;',

                      ].join('\n') )
                .inputs( {
                    diffuse: diffuseColor,
                    hasVertexColor: vertexColorUniform,
                    vertexColor: vertexColor
                } )
                .outputs( {
                    color: tmp
                })
                .comment('diffuse color = diffuse color * vertex color');

            return tmp;
        },


        getDiffuseColorFromTextures: function () {

            var texturesInput = [];
            var textures = this._texturesByName;

            for ( var tex in textures ) {

                if ( textures.hasOwnProperty( tex ) ) {
                    var texture = textures[ tex ];
                    if ( !texture ) {
                        continue;
                    }
                    texturesInput.push( texture.variable );
                }

            }

            // if multi texture multiply them all with diffuse
            // but if only one, return the first
            if ( texturesInput.length > 1 ) {

                var texAccum = this.getOrCreateVariable( 'vec3', 'texDiffuseAccum' );

                factory.getNode( 'Mult' )
                .inputs( texturesInput )
                .outputs( texAccum );
                return texAccum;

            } else if ( texturesInput.length === 1 ) {

                return texturesInput[ 0 ];
            }

            return undefined;
        },


        // return the first texture valid in texture unit
        getFirstValidTexture: function () {

            var keys = Object.keys( this._texturesByName );
            if ( !keys.length )
                return undefined;

            return this._texturesByName[ keys[ 0 ] ].variable;

        },



        // declare sampler2D or samplerCube
        // declare varying FragTexCoordX corresponding to the texture unit
        // create a textureNode that could be referenced later by the compiler
        declareTexture: function( unit, texture ) {

            var samplerName = 'Texture' + unit.toString();
            var textureSampler = this.getVariable( samplerName );

            if ( textureSampler === undefined ) {

                if ( texture.className() === 'Texture' ) {
                    textureSampler = this.getOrCreateSampler( 'sampler2D', samplerName );
                } else if ( texture.className() === 'TextureCubeMap' ) {
                    textureSampler = this.getOrCreateSampler( 'samplerCube', samplerName );
                }

            }

            // texture coordinates are automatically mapped to unit texture number
            // it means that for Texture0 we will search for FragTexCoord0,
            // Texture1 -> FragTexCoord1 ...
            var texCoordUnit = unit;
            var texCoord = this.getVariable( 'FragTexCoord' + texCoordUnit );
            if ( texCoord === undefined ) {
                texCoord = this.getOrCreateVarying( 'vec2', 'FragTexCoord' + texCoordUnit );
            }

            // instanciate and reference a texture node
            var output = this.createTextureRGBA( texture, textureSampler, texCoord );

            // this part would need to be checked/updated
            // not sure texturesByName makes sense
            var name = texture.getName();
            if ( name === undefined ) {
                name = 'Texture' + texCoordUnit;
            }

            // create/update texture entry (texture, textureUnit)
            var textureMaterial = this._texturesByName[ name ];
            if ( textureMaterial === undefined ) {

                this._texturesByName[ name ] = {
                    'variable': output,
                    'textureUnit': unit
                };

            } else {

                textureMaterial.variable = output;
                textureMaterial.textureUnit = unit;

            }

        },

        // check for all textures found in the State
        // and reference sampler associated to texture and uv channels
        declareTextures: function () {

            var textures = this._textures;
            var nbTextures = textures.length;

            for ( var t = 0, tl = nbTextures; t < tl; t++ ) {

                var texture = textures[ t ];
                if ( !texture )
                    continue;

                if ( texture.getType() === 'Texture' )
                    this.declareTexture( t, texture );

            }
        },


        createLighting: function() {

            var output = this.getOrCreateVariable( 'vec4' );
            var lightList = [];


            var enumToNodeName = {
                'DIRECTION' : 'SunLight',
                'SPOT' : 'SpotLight',
                'POINT' : 'PointLight'
            };

            var materialUniforms = this.getOrCreateStateAttributeUniforms( this._material, 'material' );
            for ( var i = 0; i < this._lights.length; i++ ) {

                var light = this._lights[ i ];

                var lightedOutput = this.getOrCreateVariable( 'vec4' );
                var nodeName = enumToNodeName [  light.getLightType() ] ;


                // create uniforms from stateAttribute and mix them with materials
                // to pass the result as input for light node
                var lightUniforms = this.getOrCreateStateAttributeUniforms( this._lights[i], 'light' );

                var inputs = MACROUTILS.objectMix( {}, lightUniforms );
                inputs = MACROUTILS.objectMix( inputs, materialUniforms );

                inputs.normal = this.getOrCreateNormalizedNormal();
                inputs.eyeVector = this.getOrCreateNormalizedPosition();

                factory.getNode( nodeName )
                    .inputs( inputs )
                    .outputs( lightedOutput );

                lightList.push( lightedOutput );
            }

            // add emission too
            lightList.push( materialUniforms.emission );

            factory.getNode( 'Add' ).inputs( lightList ).outputs( output );

            return output;

        },


        // but we could later implement srgb inside and read differents flag
        // as read only in the texture
        createTextureRGBA: function ( texture, textureSampler, texCoord ) {

            var texel = this.getOrCreateVariable( 'vec4' );
            factory.getNode( 'TextureRGBA' )
            .inputs( {
                'sampler': textureSampler,
                'uv': texCoord
            })
            .outputs( texel );

            return texel;
        },


        // TODO: add a visitor to debug the graph
        traverse: function ( functor, node ) {

            var inputs = node.getInputs();
            if ( !Array.isArray( inputs ) ) {
                var keys = Object.keys( inputs );
                var objectToArray = [];
                for ( var j = 0; j < keys.length; j++ )
                    objectToArray.push( inputs[keys[j] ] );
                inputs = objectToArray;
            }

            for ( var i = 0, l = inputs.length; i < l; i++ ) {
                node.checkInputsOutputs();

                var child = inputs[i];

                if ( child !== undefined &&
                    child !== node ) {
                    this.traverse( functor, child );
                }
            }
            functor.call( functor, node );
        },

        evaluateGlobalFunctionDeclaration: function ( node ) {

            var func = function ( node ) {

                if ( node.globalFunctionDeclaration &&
                    this._map[ node.type ] === undefined ) {

                    this._map[ node.type ] = true;
                    var c = node.globalFunctionDeclaration();
                    this._text.push( c );

                }

            };

            func._map = {};
            func._text = [];
            this.traverse( func, node );

            return func._text.join( '\n' );
        },

        evaluateGlobalVariableDeclaration: function ( node ) {

            var func = function ( node ) {

                if ( this._map[ node._id ] === undefined ) {

                    this._map[ node._id ] = true;

                    if ( node.globalDeclaration !== undefined ) {

                        var c = node.globalDeclaration();
                        if ( c !== undefined ) {
                            this._text.push( c );
                        }

                    }
                }
            };

            func._map = {};
            func._text = [];
            this.traverse( func, node );
            return func._text.join( '\n' );
        },


        evaluate: function ( node ) {

            var func = function ( node ) {

                if ( this._mapTraverse[ node._id ] !== undefined ) {
                    return;
                }

                var c = node.computeFragment();
                if ( c !== undefined ) {

                    if ( node.getComment !== undefined ) {

                        var comment = node.getComment();
                        if ( comment !== undefined ) {
                            this._text.push( comment );
                        }

                    }

                    this._text.push( c );
                }
                this._mapTraverse[ node._id ] = true;
            };

            func._text = [];
            func._mapTraverse = [];
            this.traverse( func, node );
            this._fragmentShader.push( func._text.join( '\n' ) );
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
                '  FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));',
                '  FragEyeVector = vec3(ModelViewMatrix * vec4(Vertex,1.0));',
                '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
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

        createVertexShader: function () {
            // Call to specialised inhenrited shader Compiler
            this.createVertexShaderGraph();
            var shader = this._vertexShader.join( '\n' );

            shader = this._shaderProcessor.processShader( shader );
            return shader;
        },

        createFragmentShader: function () {

            this.declareUniforms();
            this.declareTextures();

            // Call to specialised inhenrited shader Compiler
            var root = this.createFragmentShaderGraph();

            this._fragmentShader.push( [ '',
                'uniform mat4 NormalMatrix;',
                ''
            ].join( '\n' ) );


            var vars = Object.keys( this._variables );

            this._fragmentShader.push( this.evaluateGlobalVariableDeclaration( root ) );
            this._fragmentShader.push( '\n' );
            this._fragmentShader.push( this.evaluateGlobalFunctionDeclaration( root ) );


            this._fragmentShader.push( 'void main() {' );

            var variables = [];
            variables.push( '// vars\n' );

            for ( var j = 0, jl = vars.length; j < jl; j++ ) {

                var d = this._variables[ vars[ j ] ].declare();
                if ( d !== undefined ) {
                    variables.push( this._variables[ vars[ j ] ].declare() );
                }

            }
            variables.push( '\n// end vars\n' );
            // declare variable in main
            this._fragmentShader.push( variables.join( ' ' ) );

            this.evaluate( root );

            this._fragmentShader.push( '}' );
            var shader = this._fragmentShader.join( '\n' );
            //osg.log('Fragment Shader');

            shader = this._shaderProcessor.processShader( shader );

            Notify.debug( shader );
            return shader;
        },


        // This function is used when no material
        // is present. If you inherit from this Compiler
        // you could change the default behavior
        createDefaultFragmentShaderGraph: function () {

            return factory.getNode( 'FragColor' ).inputs( 'vec4( 1.0, 0.0, 1.0, 0.7 )' );

        },


        // this is the main function that will generate the
        // fragment shader. If you need to improve / add your own
        // you could inherit and override this function
        createFragmentShaderGraph: function () {

            // no material then return a default shader
            if ( !this._material )
                return this.createDefaultFragmentShaderGraph();


            var materialUniforms = this.getOrCreateStateAttributeUniforms( this._material );

            // diffuse color
            var diffuseColor = this.getDiffuseColorFromTextures();

            if ( diffuseColor === undefined ) {

                diffuseColor = materialUniforms.diffuse;

            } else {

                factory.getNode( 'InlineCode' )
                    .code('%color.rgb *= %diffuse.rgb;')
                    .inputs( {
                        diffuse: materialUniforms.diffuse
                    } )
                    .outputs( {
                        'color': diffuseColor
                    });
            }

            // vertex color needs to be computed to diffuse
            diffuseColor = this.getVertexColor( diffuseColor );


            // compute alpha
            var alpha = this.getOrCreateVariable( 'float' );

            var textureTexel = this.getFirstValidTexture();

            var alphaCompute;
            if ( textureTexel ) // use alpha of the first valid texture if has texture
                alphaCompute = '%alpha = %color.a * %texelAlpha.a;';
            else
                alphaCompute = '%alpha = %color.a;';

            factory.getNode( 'InlineCode' )
                .code( alphaCompute )
                .inputs( {
                    color: materialUniforms.diffuse,
                    texelAlpha: textureTexel
                } )
                .outputs( {
                    'alpha': alpha
                });



            // 2 codes path
            // if we have light we compute a subgraph that will generate
            // color from lights contribution...
            // if we dont have light we will use the diffuse color found as default
            // fallback
            var finalColor;

            if ( this._lights.length > 0 ) {

                // creates lights nodes
                var lightedOutput = this.createLighting();
                finalColor = lightedOutput;

            } else {

                // no light use diffuse color
                finalColor = diffuseColor;

            }

            // premult alpha
            finalColor = this.getPremultAlpha( finalColor, alpha );

            var fragColor = factory.getNode( 'FragColor' );

            // todo add gamma corrected color, but it would also
            // mean to handle correctly srgb texture. So it should be done
            // at the same time. see osg.Tetxure to implement srgb
            factory.getNode( 'SetAlpha' )
                .inputs( finalColor, alpha )
                .outputs( fragColor );

            return fragColor;
        }
    };

    return Compiler;

} );
