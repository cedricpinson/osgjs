define( [
    'osg/Notify',
    'osg/Uniform',
    'osg/Texture',
    'osg/Map',
    'osgShader/utils',
    'osgShader/node'
], function ( Notify, Uniform, Texture, Map, utils, shaderNode ) {
    'use strict';

    var sprintf = utils.sprintf;

    var Compiler = function ( state, attributes, textureAttributes, shaderProcessor ) {

        this._state = state;
        this._variables = {};
        this._vertexShader = [];
        this._fragmentShader = [];

        // global stuffs
        this._shaderProcessor = shaderProcessor;
        this._lightNodes = [];
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

            } else {
                Notify.warn( 'Compiler, does not know type ' + type );
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
        this._state = state;

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

            var v = new shaderNode.Variable( type, name );
            this._variables[ name ] = v;
            return v;
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

            var v = new shaderNode.Uniform( type, name );
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
            var v = new shaderNode.Varying( type, name );
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
            var v = new shaderNode.Sampler( type, name );
            this._variables[ name ] = v;
            return v;
        },

        declareUniforms: function () {

            var uniformMap;
            var uniformMapKeys;
            var kk;
            var kkey;
            var m, ml;

            if ( this._material ) {

                uniformMap = this._material.getOrCreateUniforms();
                uniformMapKeys = uniformMap.getKeys();

                for ( m = 0, ml = uniformMapKeys.length; m < ml; m++ ) {

                    kk = uniformMapKeys[ m ];
                    kkey = uniformMap[ kk ];
                    this.getOrCreateUniform( kkey.type, kkey.name );

                }

            }

            var l = this._lights;
            for ( var t = 0, tl = l.length; t < tl; t++ ) {

                uniformMap = l[ t ].getOrCreateUniforms();
                uniformMapKeys = uniformMap.getKeys();

                for ( m = 0, ml = uniformMapKeys.length; m < ml; m++ ) {

                    kk = uniformMapKeys[ m ];
                    kkey = uniformMap[ kk ];
                    this.getOrCreateUniform( kkey.type, kkey.name );

                }
            }
        },


        // final color = arg0 + arg1 + argx
        // or
        // final color = debug color ( FF00FF )
        getFinalColor: function () {

            var finalColor = this.getOrCreateVariable( 'vec4' );

            var opFinalColor = new shaderNode.Add( finalColor, Array.prototype.slice.call( arguments, 0 ) );

            // DEBUG COLOR if no inputs
            if ( opFinalColor.getInputs().length === 0 ) {
                opFinalColor.connectInputs( new shaderNode.InlineConstant( 'vec4( 1.0, 0.0, 1.0, 0.7 )' ) );
            }

            return finalColor;
        },



        getOrCreateLightNodes: function () {

            var lights = this._lights;
            var lightNodes = this._lightNodes;

            if ( lightNodes.length === lights.length )
                return lightNodes;

            for ( var i = 0, l = lights.length; i < l; i++ ) {

                var nodeLight = new shaderNode.Light( lights[ i ] );
                nodeLight.init( this );
                lightNodes.push( nodeLight );

            }

            return lightNodes;
        },


        getOrCreateInputNormal: function () {
            return this.getOrCreateVarying( 'vec3', 'FragNormal' );
        },


        getOrCreateFrontNormal: function () {
            var inputNormal = this.getOrCreateInputNormal();
            var frontNormal = this.getOrCreateVariable( 'vec3', 'frontNormal' );
            new shaderNode.FrontNormal( frontNormal, inputNormal );
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

            new shaderNode.NormalizeNormalAndEyeVector( outputNormal, outputPosition, frontNormal, inputPosition );
        },


        getPremultAlpha: function ( finalColor, alpha ) {

            if ( alpha === undefined )
                return finalColor;

            var premultAlpha = this.getOrCreateVariable( 'vec4' );
            new shaderNode.PreMultAlpha( premultAlpha, finalColor, alpha );
            return premultAlpha;
        },


        getColorsRGB: function ( finalColor ) {
            var gamma = this.getVariable( 'gamma' );
            gamma.setValue( shaderNode.LinearTosRGB.defaultGamma );
            var finalSrgbColor = this.getOrCreateVariable( 'vec3' );
            new shaderNode.LinearTosRGB( finalSrgbColor, finalColor, gamma );

            return finalSrgbColor;
        },


        getLambertOutput: function ( diffuseColor, normal ) {

            if ( diffuseColor === undefined )
                return undefined;

            var lightNodes = this.getOrCreateLightNodes();

            if ( !lightNodes.length )
                return undefined;

            var diffuseOutput = this.getOrCreateVariable( 'vec3', 'diffuseOutput' );
            var nodeLambert = new shaderNode.Lambert( diffuseColor, normal, diffuseOutput );
            nodeLambert.connectLights( lightNodes );
            nodeLambert.createFragmentShaderGraph( this );

            return diffuseOutput;
        },


        getCookTorranceOutput: function ( specularColor, normal, specularHardness ) {

            if ( specularColor === undefined || specularHardness === undefined )
                return undefined;

            var lightNodes = this.getOrCreateLightNodes();

            if ( !lightNodes.length )
                return undefined;

            var specularOutput = this.getOrCreateVariable( 'vec3', 'specularOutput' );
            var nodeCookTorrance = new shaderNode.CookTorrance( specularColor, normal, specularHardness, specularOutput );
            nodeCookTorrance.connectLights( lightNodes );
            nodeCookTorrance.createFragmentShaderGraph( this );

            return specularOutput;
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

            var str = [ '',
                sprintf( '%s.rgb = %s.rgb;', [ tmp.getVariable(), diffuseColor.getVariable() ] ),
                sprintf( 'if ( %s == 1.0) {', [ vertexColorUniform.getVariable() ] ),
                sprintf( '  %s *= %s.rgba;', [ tmp.getVariable(), vertexColor.getVariable() ] ),
                '}'
            ].join( '\n' );

            var operator = new shaderNode.InlineCode( diffuseColor, vertexColorUniform, vertexColor );
            operator.connectOutput( tmp );
            operator.setCode( str );
            operator.comment( 'diffuse color = diffuse color * vertex color' );
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

            if ( texturesInput.length > 1 ) {

                var texAccum = this.getOrCreateVariable( 'vec3', 'texDiffuseAccum' );
                new shaderNode.Mult( texAccum, texturesInput );
                return texAccum;

            } else if ( texturesInput.length === 1 ) {

                return texturesInput[ 0 ];
            }

            return undefined;
        },


        // return the first texture valid in texture unit
        getFirstValidTexture: function () {
            var keys = Object.keys(this._texturesByName);
            if ( !keys.length )
                return undefined;

            return this._texturesByName[ keys[0] ].variable;
        },


        // check for all textures found in the State
        // and reference sampler associated to texture and uv channels
        //
        // TODO: this function is too big we should split it
        declareTextures: function () {

            var textures = this._textures;
            var nbTextures = textures.length;

            for ( var t = 0, tl = nbTextures; t < tl; t++ ) {

                var texture = textures[ t ];
                if ( !texture ) {
                    continue;
                }

                var textureClassName = texture.className();
                if ( textureClassName === 'Texture' ) {

                    var samplerName = 'Texture' + t.toString();
                    var textureSampler = this.getVariable( samplerName );
                    if ( textureSampler === undefined ) {
                        if ( texture.className() === 'Texture' ) {
                            textureSampler = this.getOrCreateSampler( 'sampler2D', samplerName );
                        } else if ( texture.className() === 'TextureCubeMap' ) {
                            textureSampler = this.getOrCreateSampler( 'samplerCube', samplerName );
                        }
                    }


                    // texture coordinates are automatically mapped to unit texture number
                    // it means that on for Texture0 we will search for FragTexCoord0,
                    // Texture1 -> FragTexCoord1 ...
                    var texCoordUnit = t;
                    var texCoord = this.getVariable( 'FragTexCoord' + texCoordUnit );
                    if ( texCoord === undefined ) {
                        texCoord = this.getOrCreateVarying( 'vec2', 'FragTexCoord' + texCoordUnit );
                    }

                    var output = this.createTextureRGBA( texture, textureSampler, texCoord );
                    var textureUnit = texCoordUnit;

                    var name = texture.getName();
                    if ( name === undefined ) {
                        name = 'Texture' + texCoordUnit;
                    }

                    var textureMaterial = this._texturesByName[ name ];
                    if ( textureMaterial === undefined ) {

                        this._texturesByName[ name ] = {
                            'variable': output,
                            'textureUnit': textureUnit
                        };

                    } else {
                        textureMaterial.variable = output;
                        textureMaterial.textureUnit = textureUnit;
                    }

                }
            }
        },


        // but we could later implement srgb inside and read differents flag
        // as read only in the texture
        createTextureRGBA: function ( texture, textureSampler, texCoord ) {

            var texel = this.getOrCreateVariable( 'vec4' );
            new shaderNode.TextureRGBA( textureSampler, texCoord, texel );

            return texel;
        },


        // TODO: add a visitor to debug the graph
        traverse: function ( functor, node ) {

            for ( var i = 0, l = node.getInputs().length; i < l; i++ ) {
                var child = node.getInputs()[ i ];

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
            //osg.log('Vertex Shader');
            //osg.log(shader);
            shader = this._shaderProcessor.processShader( shader );
            return shader;
        },

        createFragmentShader: function () {
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

            var defaultColor = new shaderNode.InlineConstant( 'vec4( 1.0, 0.0, 1.0, 0.7 )' );
            var fragColor = new shaderNode.FragColor( defaultColor );

            return fragColor;
        },


        // this is the main function that will generate the
        // fragment shader. If you need to improve / add your own
        // you could inherit and override this function
        createFragmentShaderGraph: function () {

            this.declareUniforms();
            this.declareTextures();

            // no material then return a default shader
            if ( !this._material )
                return this.createDefaultFragmentShaderGraph();

            var uniforms = this._material.getOrCreateUniforms();
            var materialDiffuseColor = this.getOrCreateUniform( uniforms.diffuse );
            var materialAmbientColor = this.getOrCreateUniform( uniforms.ambient );
            var materialEmissionColor = this.getOrCreateUniform( uniforms.emission );
            var materialSpecularColor = this.getOrCreateUniform( uniforms.specular );
            var materialShininess = this.getOrCreateUniform( uniforms.shininess );

            var normal = this.getOrCreateNormalizedNormal();
            var eyeVector = this.getOrCreateNormalizedPosition();

            // diffuse color
            var diffuseColor = this.getDiffuseColorFromTextures();

            if ( diffuseColor === undefined ) {

                diffuseColor = materialDiffuseColor;

            } else {

                var str = sprintf( '%s.rgb *= %s.rgb;', [ diffuseColor.getVariable(), materialDiffuseColor.getVariable() ] );
                var operator = new shaderNode.InlineCode( materialDiffuseColor );
                operator.connectOutput( diffuseColor );
                operator.setCode( str );

            }

            // vertex color needs to be computed to diffuse
            diffuseColor = this.getVertexColor( diffuseColor );


            // compute alpha
            var alpha = this.getOrCreateVariable( 'float' );

            var textureTexel = this.getFirstValidTexture();
            var operatorAlpha = new shaderNode.InlineCode( materialDiffuseColor, textureTexel );

            var alphaCompute = '%s = %s.a;';
            if ( textureTexel ) { // use alpha of the first valid texture if has texture
                alphaCompute = '%s = %s.a * %s.a;';
            }
            operatorAlpha.connectOutput( alpha ).setCode( sprintf( alphaCompute, [ alpha.getVariable(), materialDiffuseColor.getVariable(), textureTexel ] ) );


            var finalColor;

            if ( this._lights.length > 0 ) {

                var lightedOutput = this.getOrCreateVariable( 'vec4', 'lightOutput' );
                var nodeLight = new shaderNode.Lighting( lightedOutput, this._lights, normal, eyeVector, materialAmbientColor, diffuseColor, materialSpecularColor, materialShininess );
                nodeLight.createFragmentShaderGraph( this );
                // get final color
                finalColor = this.getFinalColor( materialEmissionColor, lightedOutput );

            } else {

                finalColor = this.getFinalColor( diffuseColor );

            }

            // premult alpha
            finalColor = this.getPremultAlpha( finalColor, alpha );

            var fragColor = new shaderNode.FragColor();

            // todo add gamma corrected color, but it would also
            // mean to handle correctly srgb texture. So it should be done
            // at the same time. see osg.Tetxure to implement srgb

            new shaderNode.SetAlpha( fragColor, finalColor, alpha );

            return fragColor;
        }
    };

    return Compiler;

} );
