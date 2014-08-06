define( [
    'osg/Notify',
    'osg/Uniform',
    'osg/Texture',
    'osg/Map',
    'osgShader/utils/sprintf',
    'osgShader/ShaderNode'
], function ( Notify, Uniform, Texture, Map, sprintf, ShaderNode ) {
    'use strict';

    var Compiler = function ( state, attributes, textureAttributes, scene, shaderProcessor ) {

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
                    var tName = tuTarget.getName();
                    if ( tType === 'Texture' ) {
                        var texUnit = j;
                        if ( tName === undefined ) {
                            tName = tType + texUnit;
                            tuTarget.setName( tName );
                        }
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

        Variable: function ( type, varname ) {
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
                name += '1';
            }
            var v = new ShaderNode.Variable( type, name );
            this._variables[ name ] = v;
            return v;
        },

        Uniform: function ( type, varname ) {
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

            var v = new ShaderNode.Uniform( type, name );
            this._variables[ name ] = v;
            return v;
        },

        Varying: function ( type, varname ) {
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
            var v = new ShaderNode.Varying( type, name );
            this._variables[ name ] = v;
            return v;
        },

        Sampler: function ( type, varname ) {
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
            var v = new ShaderNode.Sampler( type, name );
            this._variables[ name ] = v;
            return v;
        },

        declareUniforms: function () {

            if ( this._material ) {
                var uniformMap = this._material.getOrCreateUniforms();
                var uniformMapKeys = uniformMap.getKeys();

                for ( var m = 0, ml = uniformMapKeys.length; m < ml; m++ ) {

                    var kk = uniformMapKeys[ m ];
                    var kkey = uniformMap[ kk ];
                    this.Uniform( kkey.type, kkey.name );

                }
            }
        },


        getFinalColor: function () {
            var finalColor = this.Variable( 'vec4' );

            var opFinalColor = new ShaderNode.Add();
            opFinalColor.comment( 'finalColor = ???' );
            opFinalColor.connectOutput( finalColor );

            for ( var i = 0, l = arguments.length; i < l; ++i ) {
                if ( arguments[ i ] ) {
                    opFinalColor.connectInputs( arguments[ i ] );
                }
            }

            if ( opFinalColor.getInputs().length === 0 )
                opFinalColor.connectInputs( new ShaderNode.InlineConstant( 'vec4( 0.0, 0.0, 0.0, 1.0 )' ) );


            return finalColor;
        },



        getOrCreateLightNodes: function () {
            var lights = this._lights;
            var lightNodes = this._lightNodes;
            if ( lightNodes.length === lights.length )
                return lightNodes;
            for ( var i = 0, l = lights.length; i < l; i++ ) {
                var nodeLight = new ShaderNode.Light( lights[ i ] );
                nodeLight.init( this );
                lightNodes.push( nodeLight );
            }
            return lightNodes;
        },

        getOrCreateInputNormal: function () {
            return this.Varying( 'vec3', 'FragNormal' );
        },

        getOrCreateFrontNormal: function () {
            var inputNormal = this.getOrCreateInputNormal();
            var frontNormal = this.Variable( 'vec3', 'frontNormal' );
            new ShaderNode.FrontNormal( inputNormal, frontNormal );

            return frontNormal;
        },

        getOrCreateInputPosition: function () {
            return this.Varying( 'vec3', 'FragEyeVector' );
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
            var normalizeNormalAndVector = new ShaderNode.NormalizeNormalAndEyeVector( frontNormal, inputPosition );

            // get or create normalized normal
            var outputNormal = this._variables[ 'normal' ];
            if ( outputNormal === undefined ) outputNormal = this.Variable( 'vec3', 'normal' );

            // get or create normalized position
            var outputPosition = this._variables[ 'eyeVector' ];
            if ( outputPosition === undefined ) outputPosition = this.Variable( 'vec3', 'eyeVector' );

            normalizeNormalAndVector.connectOutputNormal( outputNormal );
            normalizeNormalAndVector.connectOutputEyeVector( outputPosition );
        },

        getPremultAlpha: function ( finalColor, alpha ) {
            if ( alpha === undefined )
                return finalColor;
            var tmp = this.Variable( 'vec4' );
            new ShaderNode.SetAlpha( finalColor, alpha, tmp );
            var premultAlpha = this.Variable( 'vec4' );
            new ShaderNode.PreMultAlpha( tmp, premultAlpha );
            return premultAlpha;
        },

        getSrgbColor: function ( finalColor ) {
            var gamma = this.Variable( 'float' );
            gamma.setValue( ShaderNode.LinearTosRGB.defaultGamma );
            var finalSrgbColor = this.Variable( 'vec3' );
            new ShaderNode.LinearTosRGB( finalColor, finalSrgbColor, gamma );

            return finalSrgbColor;
        },


        getLambertOutput: function ( diffuseColor, normal ) {

            if ( diffuseColor === undefined )
                return undefined;

            var lightNodes = this.getOrCreateLightNodes();

            if ( !lightNodes.length )
                return undefined;

            var diffuseOutput = this.Variable( 'vec3', 'diffuseOutput' );
            var nodeLambert = new ShaderNode.Lambert( diffuseColor, normal, diffuseOutput );
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

            var specularOutput = this.Variable( 'vec3', 'specularOutput' );
            var nodeCookTorrance = new ShaderNode.CookTorrance( specularColor, normal, specularHardness, specularOutput );
            nodeCookTorrance.connectLights( lightNodes );
            nodeCookTorrance.createFragmentShaderGraph( this );

            return specularOutput;
        },

        getVertexColor: function ( diffuseColor ) {
            if ( diffuseColor === undefined )
                return undefined;
            var vertexColor = this.Varying( 'vec4', 'VertexColor' );
            var vertexColorUniform = this.Uniform( 'float', 'ArrayColorEnabled' );
            var tmp = this.Variable( 'vec4' );

            var str = [ '',
                sprintf( '%s.rgb = %s.rgb;', [ tmp.getVariable(), diffuseColor.getVariable() ] ),
                sprintf( 'if ( %s == 1.0) {', [ vertexColorUniform.getVariable() ] ),
                sprintf( '  %s *= %s.rgba;', [ tmp.getVariable(), vertexColor.getVariable() ] ),
                '}'
            ].join( '\n' );

            var operator = new ShaderNode.InlineCode( diffuseColor, vertexColorUniform, vertexColor );
            operator.connectOutput( tmp );
            operator.setCode( str );
            operator.comment( 'diffuse color = diffuse color * vertex color' );
            return tmp;
        },


        getOrCreateUniformSharedOnTextureUnit: function ( unit ) {
            var map = this.uniformsSharedOnTextureUnit;

            if ( map )
                return map;

            // handle texture unit uniform here
            // Here there is an issue because we need to add the used uniform for
            // this channel name
            var uniforms = {};

            var uniformTextureUnitName = 'Texture' + unit.toString();
            if ( !uniforms[ uniformTextureUnitName ] ) {
                uniforms[ uniformTextureUnitName ] = Uniform.createInt( 0, uniformTextureUnitName );
            }

            var uniformName = 'u' + unit + 'Factor';
            uniforms[ unit ] = Uniform.createFloat1( uniformName );


            this.uniformsSharedOnTextureUnit = new Map( uniforms );

            return this.uniformsSharedOnTextureUnit;
        },

        getOrCreateUniforms: function ( unit ) {
            var obj = this.uniforms;

            if ( obj[ unit ] ) return obj[ unit ];

            var uniformMap = this.getOrCreateUniformSharedOnTextureUnit( unit );
            obj[ unit ] = uniformMap;

            return obj[ unit ];
        },
        getTexture: function ( name ) {
            var textures = this._textures;
            var tex, texUnit = 0;
            if ( name === undefined ) {
                tex = textures[ texUnit ];
                name = 'Texture' + texUnit;
            }

            tex = this._texturesByName[ name ];
            if ( tex === undefined )
                return undefined;

            var texColor = tex.variable;
            return texColor;
        },

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
                            textureSampler = this.Sampler( 'sampler2D', samplerName );
                        } else if ( texture.className() === 'TextureCubeMap' ) {
                            textureSampler = this.Sampler( 'samplerCube', samplerName );
                        }
                    }

                    var texCoordUnit = t;

                    var texCoord = this.getVariable( 'FragTexCoord' + texCoordUnit );
                    if ( texCoord === undefined ) {
                        texCoord = this.Varying( 'vec2', 'FragTexCoord' + texCoordUnit );
                    }
                    var output;

                    output = this.createTexturesDiffuseColor( texture, textureSampler, texCoord );

                    // if the texture channel is valid we register it

                    if ( output !== undefined ) {
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
            }
        },

        createTexturesDiffuseColor: function ( texture, textureSampler, texCoord ) {
            var output, node, texel, srgb2linearTmp;
            texel = this.Variable( 'vec4' );
            var premult = this.Variable( 'vec3' );
            node = new ShaderNode.TextureRGBA( textureSampler, texCoord, texel );
            srgb2linearTmp = this.Variable( 'vec4' );
            node = new ShaderNode.sRGBToLinear( texel, srgb2linearTmp );
            node = new ShaderNode.PreMultAlpha( srgb2linearTmp, premult );
            output = premult;
            return output;
        },


        createTexturesAlphaOpacity: function ( texture, textureSampler, texCoord ) {
            var node;
            var useTextureIntensity = false;
            // TODO it look that this part should be rewritten
            // check if we want luminance
            if ( texture.getImage() !== undefined &&
                texture.getImage().getURL() &&
                texture.getImage().getURL().length < 1024 ) { // dont check inline image
                var src = texture.getImage().getURL().toLowerCase();
                if ( src.indexOf( '.jpg' ) !== -1 ||
                    src.indexOf( '.jpeg' ) !== -1 ) {
                    useTextureIntensity = true;
                }
            }
            if ( texture.getInternalFormat() === Texture.LUMINANCE || useTextureIntensity ) {
                node = new ShaderNode.TextureIntensity( textureSampler, texCoord );
            } else {
                node = new ShaderNode.TextureAlpha( textureSampler, texCoord );
            }
            var output = this.Variable( 'float' );
            node.connectOutput( output );
            return output;
        },

        createTexturesSpecularColor: function ( textureSampler, texCoord ) {
            var node = new ShaderNode.TextureRGB( textureSampler, texCoord );
            var output = this.Variable( 'vec3' );
            node.connectOutput( output );
            return output;
        },

        createTexturesShininess: function ( textureSampler, texCoord ) {
            var node = new ShaderNode.TextureIntensity( textureSampler, texCoord );
            var output = this.Variable( 'float' );
            node.connectOutput( output );
            return output;
        },

        createTexturesEmissionColor: function ( texture, textureSampler, texCoord ) {
            var node;
            var output = this.Variable( 'vec3' );
            var texel, srgb2linearTmp;
            if ( texture.getPremultiplyAlpha() ) {
                texel = this.Variable( 'vec4' );
                node = new ShaderNode.TextureRGBA( textureSampler, texCoord, texel );
                var premult = this.Variable( 'vec3' );
                if ( texture.getSRGB() ) {
                    srgb2linearTmp = this.Variable( 'vec4' );
                    node = new ShaderNode.sRGBToLinear( texel, srgb2linearTmp );
                    node = new ShaderNode.PreMultAlpha( srgb2linearTmp, premult );
                } else {
                    node = new ShaderNode.PreMultAlpha( texel, premult );
                }
                output = premult;
            } else {
                texel = this.Variable( 'vec3' );
                node = new ShaderNode.TextureRGB( textureSampler, texCoord, texel );
                if ( texture.getSRGB() ) {
                    srgb2linearTmp = this.Variable( 'vec3' );
                    node = new ShaderNode.sRGBToLinear( texel, srgb2linearTmp );
                    output = srgb2linearTmp;
                } else {
                    output = texel;
                }
            }
            return output;
        },

        createTexturesMirror: function ( textureSampler, texCoord ) {
            var node = new ShaderNode.TextureIntensity( textureSampler, texCoord );
            var output = this.Variable( 'float' );
            node.connectOutput( output );
            return output;
        },

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

            this._fragmentShader.push( [
                ''
            ].join( '\n' ) );

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

        createFragmentShaderGraphStateSet: function () {

            var finalColor = [ 1.0, 1.0, 1.0, 1.0 ];

            var alpha = new ShaderNode.InlineConstant( '1.0' );


            // diffuse color
            var diffuseColor = this.getTexture();
            diffuseColor = this.getVertexColor( diffuseColor );
            finalColor = this.getFinalColor( diffuseColor );
            if ( diffuseColor ) {
                finalColor = this.getPremultAlpha( finalColor, diffuseColor.alpha );
            }

            // get srgb color and apply alpha
            var fragColor = new ShaderNode.FragColor();
            new ShaderNode.SetAlpha( this.getSrgbColor( finalColor ), alpha, fragColor );

            return fragColor;
        },
        createFragmentShaderGraph: function () {
            this.declareUniforms();
            this.declareTextures();

            if ( !this._material ) return this.createFragmentShaderGraphStateSet();

            var uniforms = this._material.getOrCreateUniforms();
            var materialDiffuseColor = this.getVariable( uniforms.diffuse.name );
            var materialAmbientColor = this.getVariable( uniforms.ambient.name );
            var materialEmissionColor = this.getVariable( uniforms.emission.name );
            var materialSpecularColor = this.getVariable( uniforms.specular.name );
            var materialShininess = this.getVariable( uniforms.shininess.name );
            //var materialOpacity = this.getVariable( uniforms.opacity.name );


            var inputNormal = this.Varying( 'vec3', 'FragNormal' );
            var inputPosition = this.Varying( 'vec3', 'FragEyeVector' );
            var normal = this.Variable( 'vec3', 'normal' );
            var eyeVector = this.Variable( 'vec3', 'eyeVector' );


            var normalizeNormalAndVector = new ShaderNode.NormalizeNormalAndEyeVector( inputNormal, inputPosition );
            normalizeNormalAndVector.connectOutputNormal( normal );
            normalizeNormalAndVector.connectOutputEyeVector( eyeVector );

            // diffuse color
            var diffuseColor = this.getTexture();
            if ( diffuseColor === undefined ) {
                diffuseColor = materialDiffuseColor;
            }
            diffuseColor = this.getVertexColor( diffuseColor );

            //var alpha =  materialOpacity || new shaderNode.InlineConstant( '1.0' );
            var alpha = new ShaderNode.InlineConstant( '1.0' );

            var finalColor;

            if ( this._lights.length > 0 ) {
                var lightedOutput = this.Variable( 'vec4', 'lightOutput' );
                var nodeLight = new ShaderNode.Lighting( this._lights, normal, diffuseColor, materialAmbientColor, materialSpecularColor, materialShininess, lightedOutput );
                nodeLight.createFragmentShaderGraph( this );
                // get final color
                finalColor = this.getFinalColor( materialEmissionColor, lightedOutput );
            } else {
                finalColor = this.getFinalColor( diffuseColor );
            }

            // premult alpha
            if ( true ) {
                var premultAlpha = this.Variable( 'vec4' );
                var tmp = this.Variable( 'vec4' );
                new ShaderNode.SetAlpha( finalColor, alpha, tmp );
                new ShaderNode.PreMultAlpha( tmp, premultAlpha );
                finalColor = premultAlpha;
            }

            // get srgb color
            var srgbColor = this.getSrgbColor( finalColor );

            var fragColor = new ShaderNode.FragColor();
            new ShaderNode.SetAlpha( srgbColor, alpha, fragColor );

            return fragColor;
        }
    };

    return Compiler;

} );
