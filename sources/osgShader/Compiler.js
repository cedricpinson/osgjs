/*global define */

define( [
    'osg/Utils',
    'osg/Uniform',
    'osg/Texture',
    'osgShader/utils/sprintf',
    'osgShader/TextureMaterial',
    'osgShader/ShaderNode',
    'osgShader/ShaderProcessor'


], function ( MACROUTILS, Uniform, Texture, sprintf, TextureMaterial, ShaderNode, ShaderProcessor ) {


    var shaderProcessor;
    function getOrCreateShaderProcessor() {

        if ( shaderProcessor === undefined ) {
            shaderProcessor = new ShaderProcessor();
        }
        return shaderProcessor;

    }


    var Compiler = function ( state, attributes, textureAttributes, scene ) {
        this._state = state;
        this._variables = {};
        this._vertexShader = [];
        this._fragmentShader = [];
        this._scene = scene;
        this._shaderProcessor = getOrCreateShaderProcessor();

        // separate Material / Light / TextureMaterial
        // because this shader generator is specific for this
        var lights = [];
        var material;
        for ( var i = 0, l = attributes.length; i < l; i++ ) {
            var type = attributes[ i ].className();
            // Test one light at a time
            if ( type === 'Light' ) { // && lights.length === 0) {
                lights.push( attributes[ i ] );
            } else if ( type === 'Material' ) {
                material = attributes[ i ];
            } else {
                MACROUTILS.warn( 'Compiler, does not know type ' + type );
            }
        }

        var textures = new Array( textureAttributes.length );
        for ( var j = 0, jl = textureAttributes.length; j < jl; j++ ) {
            var tu = textureAttributes[ j ];
            if ( tu !== undefined ) {
                for ( var t = 0, tl = tu.length; t < tl; t++ ) {
                    var ttype = tu[ t ].className();
                    if ( ttype === 'TextureMaterial' || ttype === 'TextureEnvironment' ) {
                        textures[ j ] = tu[ t ];
                    }
                }
            }
        }

        this._lights = lights;
        this._material = material;
        this._textures = textures;

        // global stuffs
        this._lightNodes = [];
        this._texturesChannels = {};
        this._environmentTextures = {};
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

            var uniformMap = this._material.getOrCreateUniforms();
            var uniformMapKeys = uniformMap.getKeys();

            for ( var m = 0, ml = uniformMapKeys.length; m < ml; m++ ) {

                var kk = uniformMapKeys[ m ];
                var kkey = uniformMap[ kk ];
                this.Uniform( kkey.type, kkey.name );

            }
        },

        createFragmentShaderGraph: function () {
            this.declareUniforms();
            this.declareTextures();

            var finalColor;

            // alpha
            var alpha = this.getTextureChannel( 'Opacity' ) || new ShaderNode.InlineConstant( '1.0' );
            // emit color
            var emitColor = this.getTextureChannel( 'EmitColor' );

            // diffuse color
            var diffuseColor = this.getTextureChannel( 'DiffuseColor' );
            diffuseColor = this.getVertexColor( diffuseColor );
            if ( this._material.getShadeless() === false ) {
                // by default geometryNormal is normal, but can change with normal map / bump map
                var normal = this.getOrCreateGeometryNormal();

                // diffuse intensity
                var diffuseIntensity = this.getTextureChannel( 'DiffuseIntensity' );
                diffuseColor = this.getDiffuseIntensity( diffuseColor, diffuseIntensity );
                // diffuse output after the lambertian operation
                var diffuseOutput = this.getLambertOutput( diffuseColor, normal );

                // specular color
                var specularColor = this.getTextureChannel( 'SpecularColor' );
                // specular hardness
                var specularHardness = this.getTextureChannel( 'SpecularHardness' );
                // specular output after the cook torrance operation
                var specularOutput = this.getCookTorranceOutput( specularColor, normal, specularHardness );

                // get environments
                var envOutput = this.getEnvironment( diffuseColor, normal, specularColor );

                // get final color
                finalColor = this.getFinalColor( emitColor, diffuseOutput, specularOutput, envOutput );
            } else {
                finalColor = this.getFinalColor( emitColor, diffuseColor );
            }

            finalColor = this.getPremultAlpha( finalColor, alpha );
            // get srgb color and apply alpha
            var fragColor = new ShaderNode.FragColor();
            new ShaderNode.SetAlpha( this.getSrgbColor( finalColor ), alpha, fragColor );

            return fragColor;
        },

        getFinalColor: function () {
            var finalColor = this.Variable( 'vec3' );

            var opFinalColor = new ShaderNode.AddVector();
            opFinalColor.comment( 'finalColor = ???' );
            opFinalColor.connectOutput( finalColor );

            for ( var i = 0, l = arguments.length; i < l; ++i ) {
                if ( arguments[ i ] ) {
                    opFinalColor.connectInput( arguments[ i ] );
                }
            }

            if ( opFinalColor.getInputs().length === 0 )
                opFinalColor.connectInput( new ShaderNode.InlineConstant( 'vec3( 0.0, 0.0, 0.0 )' ) );

            this.applyAlphaMask( finalColor );

            return finalColor;
        },

        applyAlphaMask: function ( finalColor ) {
            var alpha = this.getTextureChannel( 'AlphaMask', true );
            if ( alpha ) {
                // TODO the discard test id done at the end of the shader which is stupid
                // it would be better to find a way to move it at the top of the shader
                var str = 'if (' + alpha.getVariable() + '< 0.01 ) discard;';
                var operator = new ShaderNode.InlineCode( alpha );
                operator.setCode( str );
                operator.connectOutput( finalColor );
            }
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

        getOrCreateInputTangent: function () {
            return this.Varying( 'vec4', 'FragTangent' );
        },

        getOrCreateFrontTangent: function () {
            var inputTangent = this.getOrCreateInputTangent();
            var frontTangent = this.Variable( 'vec4', 'frontTangent' );
            new ShaderNode.FrontNormal( inputTangent, frontTangent );

            return frontTangent;
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

        getOrCreateGeometryNormal: function () {
            var geoNormal = this._variables[ 'geoNormal' ];
            if ( geoNormal )
                return geoNormal;
            geoNormal = this.Variable( 'vec3', 'geoNormal' );

            var texturesChannels = this._texturesChannels;
            var normal = this.getOrCreateNormalizedNormal();

            if ( texturesChannels.Geometry === undefined ) {
                new ShaderNode.PassValue( normal, geoNormal );
                return geoNormal;
            }

            var geoType = this._textures[ texturesChannels.Geometry.texture ].getRealType();

            if ( geoType === 'Normal' ) {
                normal = this.getNormalMapNormal( texturesChannels.Geometry );
            } else if ( geoType === 'Bump' ) {
                normal = this.getBumpMapNormal( texturesChannels.Geometry );
            }

            new ShaderNode.PassValue( normal, geoNormal );
            return geoNormal;
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

        getSrgbColor: function ( finalColor ) {
            var gamma = this.Variable( 'float' );
            gamma.setValue( ShaderNode.Linear2sRGB.defaultGamma );
            var finalSrgbColor = this.Variable( 'vec3' );
            new ShaderNode.Linear2sRGB( finalColor, finalSrgbColor, gamma );

            return finalSrgbColor;
        },

        getPremultAlpha: function ( finalColor, alpha ) {
            if ( alpha === undefined )
                return finalColor;
            var tmp = this.Variable( 'vec4' );
            new ShaderNode.SetAlpha( finalColor, alpha, tmp );
            var premultAlpha = this.Variable( 'vec3' );
            new ShaderNode.PreMultAlpha( tmp, premultAlpha );
            return premultAlpha;
        },

        getEnvironment: function ( diffColor, normal, specColor ) {
            var envTextures = this._environmentTextures;
            var envTexDiffuse = envTextures.diffuse;
            if ( envTexDiffuse === undefined )
                return undefined;

            var envTexSpecular = envTextures.specular;

            if ( diffColor === undefined && ( envTexSpecular === undefined || specColor === undefined ) )
                return undefined;

            // common uniform name to use in shaders
            var textureEnv = envTexSpecular || envTexDiffuse;
            var envUniformMap = textureEnv.getCommonUniforms();

            var envTransform = this.Uniform( envUniformMap.environmentTransform );
            // factor to boost the intensity of the enfironment
            var envExposure = this.Uniform( envUniformMap.exposure );

            // envOutput = spec + diff
            // or envOutput = diff
            var envOutput = this.Variable( 'vec3' );
            var opEnvironment = new ShaderNode.AddVector();
            opEnvironment.connectOutput( envOutput );

            if ( envTexSpecular && specColor ) {
                var envSpec = this.getEnvironmentSpecular( envTexSpecular, envUniformMap, envTransform, envExposure, normal, specColor );
                opEnvironment.connectInput( envSpec );
            }

            if ( envTexDiffuse && diffColor ) {
                var envDiff = this.getEnvironmentDiffuse( envTexDiffuse, envUniformMap, envTransform, envExposure, diffColor, normal );
                opEnvironment.connectInput( envDiff );
            }

            return envOutput;
        },

        getEnvironmentSpecular: function ( envTexSpecular, envUniformMap, envTransform, envExposure, normal, specColor ) {

            var uniformMap = this._material.getOrCreateUniforms();
            var matRef = this.getVariable( uniformMap.reflection.name );

            var eye = this.getOrCreateNormalizedPosition();

            var spheremapLookup = this.Variable( 'vec3' );
            var spheremapSampler = this.Sampler( 'sampler2D', envUniformMap.textureSpecular.getName() );
            var textureSize = this.Uniform( envTexSpecular.getOrCreateUniforms().size );
            var nodeReflection = new ShaderNode.SpheremapReflection( envTransform, spheremapSampler, textureSize, eye, normal, spheremapLookup );
            nodeReflection.createFragmentShaderGraph( this );

            var operator = new ShaderNode.MultVector( spheremapLookup, specColor, envExposure, matRef );
            var environmentReflection = this.Variable( 'vec3' );
            operator.connectOutput( environmentReflection );

            return environmentReflection;
        },

        getEnvironmentDiffuse: function ( envTexDiffuse, envUniformMap, envTransform, envExposure, diffColor, normal ) {
            // factor of light used as a multiplier
            var environmentLight = this.Uniform( envUniformMap.light );
            var environmentNormal = this.Variable( 'vec3' );
            new ShaderNode.EnvironmentTransform( envTransform, normal, environmentNormal );

            var sampler = this.Sampler( 'sampler2D', envUniformMap.textureDiffuse.getName() );
            var textureSize = this.Uniform( envTexDiffuse.getOrCreateUniforms().size );

            var decodedColor = this.Variable( 'vec3' );
            new ShaderNode.TextureSpheremapHDR( sampler, textureSize, environmentNormal, decodedColor );

            // lighting intensity
            var operator = new ShaderNode.MultVector( decodedColor, environmentLight, envExposure, diffColor );
            var environmentLighting = this.Variable( 'vec3' );
            operator.connectOutput( environmentLighting );

            return environmentLighting;
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

        getNormalMapNormal: function ( channel ) {
            var normal = this.getOrCreateNormalizedNormal();

            var textures = this._textures;
            var texUnit = channel.texture;

            var output = this.Variable( 'vec3' );
            var normalTmp = this.Variable( 'vec3' );
            new ShaderNode.NormalTangentSpace( this.getOrCreateFrontTangent(), normal, channel.variable, normalTmp );

            var textureNormal = textures[ texUnit ];
            var normalUniform = textureNormal.getOrCreateUniforms( texUnit ).Geometry;
            var normalFactor = this.Uniform( normalUniform.getType(), normalUniform.getName() );

            var mult = new ShaderNode.Blend( 'MIX', normal, normalTmp, normalFactor );
            mult.connectOutput( output );
            return output;
        },

        getBumpMapNormal: function ( channel ) {
            var normal = this.getOrCreateNormalizedNormal();

            var textures = this._textures;
            var texUnit = channel.texture;

            var output = this.Variable( 'vec3' );
            var normalTmp = this.Variable( 'vec3', 'normalTmp' );
            new ShaderNode.Bumpmap( this.getOrCreateFrontTangent(), normal, channel.variable, normalTmp );

            var textureBump = textures[ texUnit ];
            var bumpUniform = textureBump.getOrCreateUniforms( texUnit ).Geometry;
            var bumpFactor = this.Uniform( bumpUniform.getType(), bumpUniform.getName() );

            var mult = new ShaderNode.Blend( 'MIX', normal, normalTmp, bumpFactor );
            mult.connectOutput( output );
            return output;
        },

        getDiffuseIntensity: function ( diffuseColor, diffuseIntensity ) {
            if ( diffuseColor === undefined || diffuseIntensity === undefined )
                return diffuseColor;
            var colorTmp = this.Variable( 'vec3' );
            var operator = new ShaderNode.MultVector( diffuseColor, diffuseIntensity );
            operator.comment( 'diffuse_color = diffuse_color * diffuse_intensity' );
            operator.connectOutput( colorTmp );
            return colorTmp;
        },

        getVertexColor: function ( diffuseColor ) {
            if ( diffuseColor === undefined )
                return undefined;
            var vertexColor = this.Varying( 'vec4', 'VertexColor' );
            var vertexColorUniform = this.Uniform( 'float', 'ArrayColorEnabled' );
            var tmp = this.Variable( 'vec3' );

            var str = [ '',
                sprintf( '%s = %s;', [ tmp.getVariable(), diffuseColor.getVariable() ] ),
                sprintf( 'if ( %s == 1.0) {', [ vertexColorUniform.getVariable() ] ),
                sprintf( '  %s *= %s.rgb;', [ tmp.getVariable(), vertexColor.getVariable() ] ),
                '}'
            ].join( '\n' );

            var operator = new ShaderNode.InlineCode( diffuseColor, vertexColorUniform, vertexColor );
            operator.connectOutput( tmp );
            operator.setCode( str );
            operator.comment( 'diffuse color = diffuse color * vertex color' );
            return tmp;
        },

        getTextureChannel: function ( channelName, dontApplyFactor ) {
            var texturesChannels = this._texturesChannels;
            var texChannel = texturesChannels[ channelName ];
            if ( texChannel === undefined )
                return undefined;

            var texColor = texChannel.variable;
            if ( dontApplyFactor === true )
                return texColor;

            var texUnit = texChannel.texture;
            var uniformMap = this._textures[ texUnit ].getOrCreateUniforms( texUnit );
            var texFactorUniform = uniformMap[ channelName ];
            var factorUniform = this.Uniform( texFactorUniform.getType(), texFactorUniform.getName() );

            var output = this.Variable( texColor.getType(), 'channel' + channelName );

            var mult = new ShaderNode.MultVector( texColor, factorUniform );
            mult.connectOutput( output );

            return output;
        },

        declareTextures: function () {
            var texturesChannels = this._texturesChannels;
            var environmentsTextures = this._environmentTextures;

            var textures = this._textures;
            var nbTextures = textures.length;

            for ( var t = 0, tl = nbTextures; t < tl; t++ ) {
                var texture = textures[ t ];
                if ( !texture ) {
                    continue;
                }
                var textureClassName = texture.className();
                if ( textureClassName === 'TextureEnvironment' ) {
                    var channel = texture.getChannel();
                    if ( channel === 'Specular' ) {
                        environmentsTextures.specular = texture;
                    } else if ( channel === 'Diffuse' ) {
                        environmentsTextures.diffuse = texture;
                    }
                } else if ( textureClassName === 'TextureMaterial' ) {

                    var textureChannel = texture.getChannel();

                    var samplerName = texture.getSamplerName();
                    var textureSampler = this.getVariable( samplerName );
                    if ( textureSampler === undefined ) {
                        if ( texture.getTexture().className() === 'Texture' ) {
                            textureSampler = this.Sampler( 'sampler2D', samplerName );
                        } else if ( texture.getTexture().className() === 'TextureCubeMap' ) {
                            textureSampler = this.Sampler( 'samplerCube', 'Texture' + t );
                        }
                    }

                    var texCoordUnit = texture.getTexCoordUnit();
                    if ( texCoordUnit === undefined ) {
                        texCoordUnit = t;
                    }

                    var texCoord = this.getVariable( 'FragTexCoord' + texCoordUnit );
                    if ( texCoord === undefined ) {
                        texCoord = this.Varying( 'vec2', 'FragTexCoord' + texCoordUnit );
                    }

                    var channelName = textureChannel.getName();
                    var output;
                    var textureUnit = t;

                    switch ( channelName ) {
                    case 'DiffuseColor':
                        output = this.createTextureChannelsDiffuseColor( texture, textureSampler, texCoord );
                        break;
                    case 'DiffuseIntensity':
                        output = this.createTextureChannelsDiffuseIntensity( textureSampler, texCoord );
                        break;
                    case 'Opacity':
                    case 'AlphaMask':
                        output = this.createTextureChannelsAlphaOpacity( texture, textureSampler, texCoord );
                        break;
                    case 'SpecularColor':
                        output = this.createTextureChannelsSpecularColor( textureSampler, texCoord );
                        break;
                    case 'SpecularHardness':
                        output = this.createTextureChannelsSpecularHardness( textureSampler, texCoord );
                        break;
                    case 'EmitColor':
                        output = this.createTextureChannelsEmitColor( texture, textureSampler, texCoord );
                        break;
                    case 'Mirror':
                        output = this.createTextureChannelsMirror( textureSampler, texCoord );
                        break;
                    case 'Geometry':
                        output = this.createTextureChannelsGeometry( texture, textureSampler, texCoord, textureUnit );
                        break;
                    }

                    // if the texture channel is valid we register it
                    if ( output !== undefined ) {
                        texturesChannels[ channelName ] = {
                            'variable': output,
                            'texture': textureUnit
                        };
                    }

                }
            }
        },

        createTextureChannelsDiffuseColor: function ( texture, textureSampler, texCoord ) {
            var output, node, texel, srgb2linearTmp;
            if ( texture.getPremultiplyAlpha() ) {
                texel = this.Variable( 'vec4' );
                var premult = this.Variable( 'vec3' );
                node = new ShaderNode.TextureRGBA( textureSampler, texCoord, texel );
                if ( texture.getSRGB() ) {
                    srgb2linearTmp = this.Variable( 'vec4' );
                    node = new ShaderNode.sRGB2Linear( texel, srgb2linearTmp );
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
                    node = new ShaderNode.sRGB2Linear( texel, srgb2linearTmp );
                    output = srgb2linearTmp;
                } else {
                    output = texel;
                }
            }
            return output;
        },

        createTextureChannelsDiffuseIntensity: function ( textureSampler, texCoord ) {
            var node = new ShaderNode.TextureRGB( textureSampler, texCoord );
            var output = this.Variable( 'vec3' );
            node.connectOutput( output );
            return output;
        },

        createTextureChannelsAlphaOpacity: function ( texture, textureSampler, texCoord ) {
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
            if ( texture.getTexture().getInternalFormat() === Texture.LUMINANCE || useTextureIntensity ) {
                node = new ShaderNode.TextureIntensity( textureSampler, texCoord );
            } else {
                node = new ShaderNode.TextureAlpha( textureSampler, texCoord );
            }
            var output = this.Variable( 'float' );
            node.connectOutput( output );
            return output;
        },

        createTextureChannelsSpecularColor: function ( textureSampler, texCoord ) {
            var node = new ShaderNode.TextureRGB( textureSampler, texCoord );
            var output = this.Variable( 'vec3' );
            node.connectOutput( output );
            return output;
        },

        createTextureChannelsSpecularHardness: function ( textureSampler, texCoord ) {
            var node = new ShaderNode.TextureIntensity( textureSampler, texCoord );
            var output = this.Variable( 'float' );
            node.connectOutput( output );
            return output;
        },

        createTextureChannelsEmitColor: function ( texture, textureSampler, texCoord ) {
            var node;
            var output = this.Variable( 'vec3' );
            var texel, srgb2linearTmp;
            if ( texture.getPremultiplyAlpha() ) {
                texel = this.Variable( 'vec4' );
                node = new ShaderNode.TextureRGBA( textureSampler, texCoord, texel );
                var premult = this.Variable( 'vec3' );
                if ( texture.getSRGB() ) {
                    srgb2linearTmp = this.Variable( 'vec4' );
                    node = new ShaderNode.sRGB2Linear( texel, srgb2linearTmp );
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
                    node = new ShaderNode.sRGB2Linear( texel, srgb2linearTmp );
                    output = srgb2linearTmp;
                } else {
                    output = texel;
                }
            }
            return output;
        },

        createTextureChannelsMirror: function ( textureSampler, texCoord ) {
            var node = new ShaderNode.TextureIntensity( textureSampler, texCoord );
            var output = this.Variable( 'float' );
            node.connectOutput( output );
            return output;
        },

        createTextureChannelsGeometry: function ( texture, textureSampler, texCoord, texUnit ) {
            var geoType = texture.getRealType();
            var output, node;

            if ( geoType === 'Normal' ) {
                node = new ShaderNode.TextureNormal( textureSampler, texCoord );
                output = this.Variable( 'vec3' );
                node.connectOutput( output );
            } else if ( geoType === 'Bump' ) {
                var bumpPassSize = new ShaderNode.PassValue();
                var texSize = this.Variable( 'vec2', 'texSize' );
                bumpPassSize.connectOutput( texSize );

                var bumpSizeUniform = texture.getOrCreateUniforms( texUnit ).GeometrySize;
                var bumpSize = this.Uniform( bumpSizeUniform.getType(), bumpSizeUniform.getName() );

                bumpSize.connectOutput( bumpPassSize );

                node = new ShaderNode.TextureGradient( textureSampler, texCoord, texSize );
                output = this.Variable( 'vec2', 'bumpGradient' );
                node.connectOutput( output );
            } else {
                MACROUTILS.error( 'impossible has happened with bump texture ' + texture.getTexture().getImage().getURL() );
            }
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
            var textures = this._textures;

            this._vertexShader.push( [ '',
                'attribute vec3 Vertex;',
                'attribute vec4 Color;',
                'attribute vec3 Normal;',
                'attribute vec4 Tangent;',
                'uniform float ArrayColorEnabled;',
                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',
                'uniform mat4 NormalMatrix;',
                'varying vec4 VertexColor;',
                'varying vec3 FragNormal;',
                'varying vec4 FragTangent;',
                'varying vec3 FragEyeVector;',
                '',
                ''
            ].join( '\n' ) );

            var texCoordMap = {};
            for ( var t = 0, tl = textures.length; t < tl; t++ ) {
                var texture = textures[ t ];
                if ( texture !== undefined ) {

                    // no method to retrieve textureCoordUnit, we maybe dont need any uvs
                    if ( !texture.getTexCoordUnit )
                        continue;

                    var texCoordUnit = texture.getTexCoordUnit();
                    if ( texCoordUnit === undefined ) {
                        texCoordUnit = t;
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
                '  FragTangent = NormalMatrix * Tangent;',
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
                        // no method getTexCoordUnit, maybe we dont need it at all
                        if ( !texture.getTexCoordUnit )
                            continue;

                        var texCoordUnit = texture.getTexCoordUnit();
                        if ( texCoordUnit === undefined ) {
                            texCoordUnit = tt;
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
            this.createVertexShaderGraph();
            var shader = this._vertexShader.join( '\n' );
            //osg.log('Vertex Shader');
            //osg.log(shader);
            shader = this._shaderProcessor.processShader( shader );
            return shader;
        },

        createFragmentShader: function () {
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

            MACROUTILS.debug( shader );
            return shader;
        }
    };

    return Compiler;

} );
