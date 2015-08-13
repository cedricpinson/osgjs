define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Uniform',
    'osgShader/nodeFactory'

], function ( Notify, MACROUTILS, Uniform, factory ) {
    'use strict';

    var Compiler = function ( attributes, textureAttributes, shaderProcessor ) {
        this._attributes = attributes;
        this._textureAttributes = textureAttributes;

        this._activeNodeList = {};
        this._compiledNodeList = {};

        this._variables = {};
        this._varyings = {};
        this._vertexShader = [];
        this._fragmentShader = [];

        // global stuffs
        this._shaderProcessor = shaderProcessor;
        this._texturesByName = {};

        // TODO: Have to handle better textures
        // 4 separate loop over texture list: one here, one for declareTexture, 2 for vertexShader (varying decl + varying store)
        // (not counting loops done above in shader generator)

        this._shadowsTextures = [];
        this._lights = [];
        this._shadows = [];
        this._textures = [];
        this._material = null;


        // LOW-LEVEL info
        // shared between VS and FS pass
        //
        // List what we'll use
        // allowing not to try
        // to compute varying for nothing
        // and interpolate varying for nothing
        // default is nearly all disabled until proven otherwise
        // but for texcoord.
        // this._shaderAttributes = {
        //     'Vertex': true,
        //     'VertexColor': true,
        //     'Normal': true
        // };
        this._shaderAttributes = {
            'Vertex': true,
            'VertexColor': false,
            'Normal': false,
            'Tangent': false
        };

        // High-Level Info, maybe specific
        // to Material "light/ilb" Compilation
        // shared between VS and FS pass
        //
        // This hints at current compiler is already too specialized
        // and we should make a more abstract One the Parent class
        // and this one one that inherits and add light, shadow, etc.
        // (material?)
        this._isLighted = false; // either shadeless, or no light (beware ibl)
        this._isShadeless = false;
        this._isShadowCast = false;
        this._isBillboard = false;
        // from Attributes to variables
        // to build shader nodes graph from
        this.initAttributes();
        this.initTextureAttributes();

        // no need to test light
        var hasMaterial = !!this._material;
        this._isLighted = hasMaterial && !this._isShadowCast && this._lights.length > 0;

        // backup shader, FS just output 'fofd'
        this._isVertexColored = hasMaterial && !this._isShadowCast;

        // Important: if not using Compiler for Both VS and FS
        // Check either of those
        // it allow override by custom Processor of some check
        // between the VS & FS pass (varying mostly)
        this._customVertexShader = false;
        this._customFragmentShader = false;
    };

    Compiler.prototype = {

        initAttributes: function () {
            var attributes = this._attributes;
            // separate Material / Light / Texture
            // because this shader generator is specific for this
            var lights = this._lights;
            var shadows = this._shadows;
            for ( var i = 0, l = attributes.length; i < l; i++ ) {

                var type = attributes[ i ].className();

                // Test one light at a time
                if ( type === 'Light' ) { // && lights.length === 0) {

                    lights.push( attributes[ i ] );


                } else if ( type === 'Material' ) {

                    this._material = attributes[ i ];


                } else if ( type === 'ShadowReceiveAttribute' ) {

                    shadows.push( attributes[ i ] );

                } else if ( type === 'ShadowCastAttribute' ) {
                    this._isShadowCast = attributes[ i ].isEnabled();
                    this._shadowCastAttribute = attributes[ i ];
                } else if ( type === 'Billboard' ) {
                    // Shouldn't it be managed by mode ( ON, OFF, OVERRIDE )? 
                    this._isBillboard = attributes[ i ].isEnabled();
                } else if ( type === 'AnimationAttribute' ) {
                    this._animation = attributes[ i ];
                }
            }
        },

        initTextureAttributes: function () {
            // Shadow casting is about casting Depth
            // no need for textures.
            // as we don't support natively
            // shadow of aplha Blending or Masking Materials
            if ( this._isShadowCast )
                return;

            var textureAttributes = this._textureAttributes;
            var texturesNum = textureAttributes.length;
            this._textures.length = this._shadowsTextures.length = texturesNum;

            for ( var j = 0; j < texturesNum; j++ ) {
                var tu = textureAttributes[ j ];
                if ( tu === undefined )
                    continue;
                for ( var t = 0, tl = tu.length; t < tl; t++ ) {
                    this.registerTextureAttributes( tu[ t ], j );
                }
            }
        },

        registerTextureAttributes: function ( tuTarget, tunit ) {
            var tType = tuTarget.className();
            if ( tType === 'Texture' ) return this.registerTexture( tuTarget, tunit );
            if ( tType === 'ShadowTexture' ) return this.registerTextureShadow( tuTarget, tunit );
        },

        registerTexture: function ( tuTarget, texUnit ) {
            var tName = tuTarget.getName();
            if ( !tName ) {
                tName = 'Texture' + texUnit;
                tuTarget.setName( tName );
            }
            this._textures[ texUnit ] = tuTarget;

            this._texturesByName[ tName ] = {
                texture: tuTarget,
                variable: undefined,
                textureUnit: texUnit
            };
        },

        registerTextureShadow: function ( tuTarget, texUnit ) {
            var tName = tuTarget.getName();
            if ( !tName ) {
                tName = 'ShadowTexture' + texUnit;
                tuTarget.setName( tName );
            }
            this._shadowsTextures[ texUnit ] = tuTarget;

            this._texturesByName[ tName ] = {
                texture: tuTarget,
                variable: undefined,
                textureUnit: texUnit,
                shadow: true
            };
        },

        // global accessor because it modifies
        // globally the compiler behavbiour
        isShadowCast: function () {
            return this._isShadowCast;
        },

        // cache all requested node, so that we can list
        // and log unused Node that where called
        // or/cache unique or predefined node
        // thus avoid mutiple getNode of a
        // Node that HAS to be unique
        getNode: function ( /*name, arg1, etc*/) {

            // check unique Node
            // for predefined GL variables
            // gl_FragCoord, gl_Position, etc
            // Extend to Varying
            var n = factory.getNode.apply( factory, arguments );
            var cacheID = n.getID();
            this._activeNodeList[ cacheID ] = n;
            return n;
        },

        // during compilation we pop
        // all node we do encounter
        // so that we can warn about
        // "leftover" once compilation
        // is finished
        // Note: same node may be marked multiple time
        // do not use it as a "once and for all mark thing"
        markNodeAsVisited: function ( n ) {
            var cacheID = n.getID();
            if ( this._activeNodeList[ cacheID ] === n ) {
                this._compiledNodeList[ cacheID ] = n;
            } else {
                Notify.warn( 'Node not requested by using Compiler getNode and/or not registered in nodeFactory ' + n.toString() );
            }
        },

        getVariable: function ( nameID ) {
            return this._variables[ nameID ];
        },

        getAttributeType: function ( type ) {

            for ( var i = 0; i < this._attributes.length; i++ ) {
                if ( this._attributes[ i ].getType() === type )
                    return this._attributes[ i ];
            }
            return undefined;

        },


        // TODO: add Precision qualifier
        // if doesn't exist create a new on
        // if nameID given and var already exist, create a varname +
        createVariable: function ( type, varname, deepness ) {

            var nameID = varname;

            if ( nameID === undefined ) {

                var len = Object.keys( this._variables ).length;
                nameID = 'tmp_' + len;

            } else if ( this._variables[ nameID ] ) {
                // create a new variable
                // if we want to reuse a variable we should NOT
                // call this function in the first place and do the
                // test before...
                // however for uniform, varying and sampler, we return
                // the variable if it already exists, because they are
                // meant to be read only
                nameID = nameID + deepness;
                if ( deepness === undefined ) {
                    return this.createVariable( type, varname, 1 );
                } else if ( this._variables[ nameID ] ) {
                    deepness++;
                    return this.createVariable( type, varname, deepness );
                }

            }

            var v = this.getNode( 'Variable', type, nameID );
            this._variables[ nameID ] = v;
            return v;
        },

        // Map of uniform from a StateAttribute or TextureStateAttribute
        getOrCreateUniformFromUniformMap: function ( uniforms, prefix ) {
            var keys = Object.keys( uniforms );
            var object = {};

            var prefixUniform = prefix ? prefix : '';

            for ( var i = 0; i < keys.length; i++ ) {
                var k = prefixUniform + keys[ i ];
                object[ k ] = this.getOrCreateUniform( uniforms[ keys[ i ] ] );
            }

            return object;
        },

        // specialized for texture, enforcing last parameter usage.
        getOrCreateTextureStateAttributeUniforms: function ( stateAttribute, prefix, unit ) {

            var uniforms = stateAttribute.getOrCreateUniforms( unit );
            return this.getOrCreateUniformFromUniformMap( uniforms, prefix );
        },

        getOrCreateStateAttributeUniforms: function ( stateAttribute, prefix ) {

            var uniforms = stateAttribute.getOrCreateUniforms();
            return this.getOrCreateUniformFromUniformMap( uniforms, prefix );
        },

        getOrCreateUniform: function ( type, varname, size ) {

            var nameID = varname;

            // accept uniform as parameter to simplify code
            if ( type instanceof Uniform ) {

                var uniform = type;
                type = uniform.getType();
                nameID = uniform.getName();

            } else if ( nameID === undefined ) {
                Notify.error( 'Cannot create unamed Uniform' );
            }

            var exist = this._variables[ nameID ];
            if ( exist ) {
                // see comment in Variable function
                if ( exist.getType() !== type ) {
                    Notify.error( 'Same uniform, but different type' );
                }
                return exist;
            }

            var v = this.getNode( 'Uniform', type, nameID, size );
            this._variables[ nameID ] = v;
            return v;
        },

        // make sure we get correct Node
        getOrCreateAttribute: function ( type, nameID ) {

            if ( this._fragmentShaderMode ) {
                Notify.error( 'No Vertex Attribute in Fragment Shader' );
            }

            var exist = this._variables[ nameID ];
            if ( exist ) {
                if ( exist.getType() !== type ) {
                    Notify.error( 'Same attribute, but different type' );
                }
                return exist;
            }

            // adds the reference for Fragment Shader
            // aknowledging data binded
            // and that varying data will be available accordingly
            this._shaderAttributes[ nameID ] = true;

            var v = this.getNode( 'Attribute', type, nameID );
            this._variables[ nameID ] = v;
            return v;
        },

        getOrCreateConstant: function ( type, varname ) {
            var nameID = varname;
            if ( nameID === undefined ) {
                // TODO: temp constant ? or enforcing reuse ?
                // maybe could parse variable to find other constant
                // but would need having scope info
                var len = Object.keys( this._variables ).length;
                nameID = 'tmp_' + len;

            } else {

                var exist = this._variables[ nameID ];
                if ( exist ) {
                    if ( exist.getType() !== type ) {
                        Notify.error( 'Same constant name, but different type' );
                    }
                    // see comment in Variable function
                    return exist;
                }

            }
            var v = this.getNode( 'Constant', type, nameID );
            this._variables[ nameID ] = v;
            return v;
        },

        // make sure we get correct Node
        getOrCreateVarying: function ( type, nameID ) {

            // make sure you don't create varying out of thin air
            if ( nameID === undefined ) {
                Notify.error( 'Error: Mandatory to name varying (as you need to retrieve them)' );
            }

            var exist = this._variables[ nameID ];
            if ( exist ) {
                // something went wrong: you created a variable and try to access it like a varying
                if ( !this._varyings[ nameID ] ) {
                    Notify.error( 'Error: requesting a varying not declared with getOrCreateVarying previously' );
                }
                if ( exist.getType() !== type ) {
                    Notify.error( 'Error: Same varying, but different type' );
                }
                // see comment in Variable function
                return exist;
            } else {
                exist = this._varyings[ nameID ];
                if ( exist ) {

                    // varying was declared in Vertex Shader
                    // just add it to variables cache.
                    // as that cache is not shared between VS and PS
                    this._variables[ nameID ] = exist;

                    // ensure we have it in active node list, could come from VS varying list
                    if ( this._fragmentShaderMode && !this._customVertexShader && ( !this._activeNodeList[ exist.getID() ] || this._activeNodeList[ exist.getID() ] !== exist ) ) {

                        Notify.error( 'Error: Varying in Fragment not declared in Vertex shader: ' + nameID + ' ' + type );
                    }
                    return exist;
                }
            }


            // if it's not in Varying Cache, but requested from fragment shader
            // it means => error
            if ( this._fragmentShaderMode && !this._customVertexShader ) {
                Notify.error( 'Error: requesting a varying not declared in Vertex Shader Graph.( if a Custom Vertex Shader in a custom processor, add this._customVertexShader to your custom processor): ' + nameID + ' ' + type );
            }

            var v = this.getNode( 'Varying', type, nameID );
            this._variables[ nameID ] = v;
            this._varyings[ nameID ] = v;

            return v;
        },

        // make sure we get correct Node
        getOrCreateSampler: function ( type, varname ) {

            var nameID = varname;
            if ( nameID === undefined ) {

                var len = Object.keys( this._variables ).length;
                nameID = 'sampler_' + len;

            } else {

                var exist = this._variables[ nameID ];
                if ( exist ) {
                    // see comment in Variable function
                    return exist;
                }

            }
            var v = this.getNode( 'Sampler', type, nameID );
            this._variables[ nameID ] = v;

            return v;
        },

        getOrCreateInputNormal: function () {
            return this.getOrCreateVarying( 'vec3', 'FragNormal' );
        },


        getOrCreateFrontNormal: function () {
            var inputNormal = this.getOrCreateInputNormal();
            var frontNormal = this.createVariable( 'vec3', 'frontNormal' );

            this.getNode( 'FrontNormal' ).inputs( {
                normal: inputNormal
            } ).outputs( {
                normal: frontNormal
            } );

            return frontNormal;
        },


        // return a Vec4 so that we have the .w
        // Allowing to know homogenous/ndc transfor
        // (help linearizing depth casting for example)
        getOrCreateInputPosition: function () {
            return this.getOrCreateVarying( 'vec4', 'FragEyeVector' );
        },


        getOrCreateNormalizedNormal: function () {
            var normal = this._variables[ 'normal' ];
            if ( normal )
                return normal;
            var out = this.createVariable( 'vec3', 'normal' );
            this.getNode( 'Normalize' ).inputs( {
                vec: this.getOrCreateFrontNormal()
            } ).outputs( {
                vec: out
            } );
            return out;
        },
        getOrCreateNormalizedPosition: function () {
            var eye = this._variables[ 'eyeVector' ];
            if ( eye )
                return eye;
            var nor = this.createVariable( 'vec3' );
            var castEye = this.createVariable( 'vec3' );
            this.getNode( 'SetFromNode' ).inputs( this.getOrCreateInputPosition() ).outputs( castEye );
            this.getNode( 'Normalize' ).inputs( {
                vec: castEye
            } ).outputs( {
                vec: nor
            } );
            var out = this.createVariable( 'vec3', 'eyeVector' );
            this.getNode( 'Mult' ).inputs( nor, this.createVariable( 'float' ).setValue( '-1.0' ) ).outputs( out );
            return out;
        },

        getPremultAlpha: function ( finalColor, alpha ) {

            if ( alpha === undefined )
                return finalColor;

            var premultAlpha = this.createVariable( 'vec4' );

            this.getNode( 'PreMultAlpha' ).inputs( {
                color: finalColor,
                alpha: alpha
            } ).outputs( {
                color: premultAlpha
            } );

            return premultAlpha;
        },


        getColorsRGB: function ( finalColor ) {
            var finalSrgbColor = this.createVariable( 'vec3' );
            this.getNode( 'LinearTosRGB' ).inputs( {
                color: finalColor
            } ).outputs( {
                color: finalSrgbColor
            } );

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
            var tmp = this.createVariable( 'vec4' );

            var str = [ '',
                '%color.rgb = %diffuse.rgb;',
                'if ( %hasVertexColor == 1.0)',
                '  %color *= %vertexColor.rgba;'
            ].join( '\n' );

            this.getNode( 'InlineCode' ).code( str ).inputs( {
                diffuse: diffuseColor,
                hasVertexColor: vertexColorUniform,
                vertexColor: vertexColor
            } ).outputs( {
                color: tmp
            } ).comment( 'diffuse color = diffuse color * vertex color' );

            return tmp;
        },


        getDiffuseColorFromTextures: function () {

            var texturesInput = [];
            var textures = this._texturesByName;

            var keys = Object.keys( textures );
            for ( var i = 0; i < keys.length; i++ ) {
                var texture = textures[ keys[ i ] ];

                if ( !texture )
                    continue;

                if ( texture.shadow )
                    continue;

                texturesInput.push( texture.variable );
            }

            // if multi texture multiply them all with diffuse
            // but if only one, return the first
            if ( texturesInput.length > 1 ) {

                var texAccum = this.createVariable( 'vec3', 'texDiffuseAccum' );

                this.getNode( 'Mult' ).inputs( texturesInput ).outputs( texAccum );
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
        declareTexture: function ( unit, texture ) {

            var samplerName = 'Texture' + unit.toString();
            var textureSampler = this.getVariable( samplerName );

            if ( textureSampler === undefined ) {

                if ( texture.className() === 'Texture' ) {
                    textureSampler = this.getOrCreateSampler( 'sampler2D', samplerName );
                } else if ( texture.className() === 'TextureCubeMap' ) {
                    textureSampler = this.getOrCreateSampler( 'samplerCube', samplerName );
                } else if ( texture.className() === 'ShadowTexture' ) {
                    textureSampler = this.getOrCreateSampler( 'sampler2D', samplerName );
                    // return now to prevent creation of useless FragTexCoord
                    //( shadow creates its own texcoord)
                    return;
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
            var nameID = texture.getName();
            if ( nameID === undefined ) {
                nameID = 'Texture' + texCoordUnit;
            }

            // create/update texture entry (texture, textureUnit)
            var textureMaterial = this._texturesByName[ nameID ];
            if ( textureMaterial === undefined ) {

                this._texturesByName[ nameID ] = {
                    variable: output,
                    textureUnit: unit
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

                if ( texture.getType() === 'Texture' ) {

                    this.declareTexture( this.getTexCoordUnit( t ), texture );
                }

            }
        },
        createShadowingLight: function ( light, inputs, lightedOutput ) {

            var k;
            var shadow;
            var shadowTexture;
            var hasShadows = false;
            var shadowTextures = new Array( this._shadowsTextures.length );
            var lightIndex = -1;

            // seach current light its corresponding shadow and shadowTextures.
            // if none, no shadow, hop we go.
            // TODO: harder Link shadowTexture and shadowAttribute ?
            // TODO: multi shadow textures for 1 light
            var lightNum = light.getLightNumber();
            for ( k = 0; k < this._shadows.length; k++ ) {
                shadow = this._shadows[ k ];
                if ( shadow.getLightNumber() !== lightNum ) continue;

                lightIndex = k;
                for ( var p = 0; p < this._shadowsTextures.length; p++ ) {
                    shadowTexture = this._shadowsTextures[ p ];
                    if ( shadowTexture && shadowTexture.getLightUnit() === lightNum ) {
                        shadowTextures[ p ] = shadowTexture;
                        hasShadows = true;
                    }
                }
            }
            if ( !hasShadows ) return undefined;

            // Varyings
            var vertexWorld = this.getOrCreateVarying( 'vec3', 'WorldPosition' );

            // asserted we have a shadow we do the shadow node allocation
            // and mult with lighted output
            var shadowedOutput = this.createVariable( 'float' );

            // shadow Attribute uniforms
            var shadowUniforms = this.getOrCreateStateAttributeUniforms( this._shadows[ lightIndex ], 'shadow' );
            inputs = MACROUTILS.objectMix( inputs, shadowUniforms );

            // shadowTexture  Attribute uniforms AND varying
            var tex;
            // TODO: better handle multi texture shadow (CSM/PSM/etc.)
            for ( k = 0; k < shadowTextures.length; k++ ) {

                shadowTexture = shadowTextures[ k ];
                if ( shadowTexture ) {
                    tex = this.getOrCreateSampler( 'sampler2D', shadowTexture.getName() );
                    inputs.shadowTexture = tex;

                    // per texture uniforms
                    var shadowTextureUniforms = this.getOrCreateTextureStateAttributeUniforms( shadowTexture, 'shadowTexture', k );
                    inputs = MACROUTILS.objectMix( inputs, shadowTextureUniforms );

                    var shadowVarying = {
                        vertexWorld: vertexWorld,
                        lightEyeDir: inputs.lightEyeDir,
                        lightNDL: inputs.lightNDL
                    };
                    inputs = MACROUTILS.objectMix( inputs, shadowVarying );
                }

            }
            // TODO: shadow Attributes in node, is this the legit way
            this.getNode( 'ShadowReceive' ).inputs( inputs ).outputs( {
                float: shadowedOutput
            } ).setShadowAttribute( shadow );

            var lightAndShadowTempOutput = this.createVariable( 'vec3', 'lightAndShadowTempOutput' );
            this.getNode( 'Mult' ).inputs( lightedOutput, shadowedOutput ).outputs( lightAndShadowTempOutput );
            return lightAndShadowTempOutput;

        },

        // Shared var between lights and shadows
        createCommonLightingVars: function ( materials, enumLights, numLights ) {

            if ( numLights === 0 )
                return {};

            var lighted = this.createVariable( 'bool', 'lighted' );
            var lightPos = this.createVariable( 'vec3', 'lightEyePos' );
            var lightDir = this.createVariable( 'vec3', 'lightEyeDir' );
            var lightNDL = this.createVariable( 'float', 'lightNDL' );

            return {
                lighted: lighted,
                lightEyePos: lightPos,
                lightEyeDir: lightDir,
                lightNDL: lightNDL
            };

        },

        createLighting: function ( materials, overrideNodeName ) {

            var output = this.createVariable( 'vec3' );
            var lightOutputVarList = [];

            var enumToNodeName = overrideNodeName || {
                DIRECTION: 'SunLight',
                SPOT: 'SpotLight',
                POINT: 'PointLight',
                HEMI: 'HemiLight'
            };

            var lightOutShadowIn = this.createCommonLightingVars( materials, enumToNodeName, this._lights.length );

            var materialUniforms = this.getOrCreateStateAttributeUniforms( this._material, 'material' );
            for ( var i = 0; i < this._lights.length; i++ ) {

                var light = this._lights[ i ];

                var lightedOutput = this.createVariable( 'vec3' );
                var nodeName = enumToNodeName[ light.getLightType() ];

                // create uniforms from stateAttribute and mix them with materials
                // to pass the result as input for light node
                var lightUniforms = this.getOrCreateStateAttributeUniforms( this._lights[ i ], 'light' );

                var inputs = MACROUTILS.objectMix( {}, lightUniforms );
                inputs = MACROUTILS.objectMix( inputs, materialUniforms );
                inputs = MACROUTILS.objectMix( inputs, materials );
                inputs = MACROUTILS.objectMix( inputs, lightOutShadowIn );

                if ( !inputs.normal )
                    inputs.normal = this.getOrCreateNormalizedNormal();
                if ( !inputs.eyeVector )
                    inputs.eyeVector = this.getOrCreateNormalizedPosition();

                this.getNode( nodeName ).inputs( inputs ).outputs( {
                    color: lightedOutput
                } );

                var shadowedOutput = this.createShadowingLight( light, inputs, lightedOutput );
                if ( shadowedOutput ) {
                    lightOutputVarList.push( shadowedOutput );
                } else {
                    lightOutputVarList.push( lightedOutput );
                }

                var lightMatAmbientOutput = this.createVariable( 'vec3', 'lightMatAmbientOutput' );

                this.getNode( 'Mult' ).inputs( inputs.materialambient, lightUniforms.lightambient ).outputs( lightMatAmbientOutput );


                lightOutputVarList.push( lightMatAmbientOutput );
            }

            // do not delete on the assumption that light list is always filled
            // in case CreateLighting is called with a empty lightList
            // when Compiler is overriden.
            if ( lightOutputVarList.length === 0 )
                lightOutputVarList.push( this.createVariable( 'vec3' ).setValue( 'vec3(0.0)' ) );

            this.getNode( 'Add' ).inputs( lightOutputVarList ).outputs( output );

            return output;
        },


        // but we could later implement srgb inside and read differents flag
        // as read only in the texture
        createTextureRGBA: function ( texture, textureSampler, texCoord ) {

            var texel = this.createVariable( 'vec4' );
            this.getNode( 'TextureRGBA' ).inputs( {
                sampler: textureSampler,
                uv: texCoord
            } ).outputs( {
                color: texel
            } );

            return texel;
        },


        // TODO: add a visitor to debug the graph
        traverse: function ( functor, node ) {

            var inputs = node.getInputs();
            if ( !Array.isArray( inputs ) ) {
                var keys = Object.keys( inputs );
                var objectToArray = [];
                for ( var j = 0; j < keys.length; j++ )
                    objectToArray.push( inputs[ keys[ j ] ] );
                inputs = objectToArray;
            }

            for ( var i = 0, l = inputs.length; i < l; i++ ) {
                node.checkInputsOutputs();

                var child = inputs[ i ];

                if ( child !== undefined &&
                    child !== node ) {
                    this.traverse( functor, child );
                }
            }
            functor.call( functor, node );

            // keep trace we visited.
            this.markNodeAsVisited( node );
        },

        // Gather a particular output field
        // for now one of
        // ['define', 'extensions']
        //
        // from a nodeGraph
        //
        // In case a node of same Type
        // have different outputs (shadow with different defines)
        // it use ID rather than Type as map index
        // UNIQUE PER TYPE
        // TODO: adds includes so that we can remove it from
        // the eval Global Functions ?
        evaluateAndGatherField: function ( nodes, field ) {

            var func = function ( node ) {

                var idx = node.getType();
                if ( idx === undefined || idx === '' ) {
                    Notify.error( 'Your node ' + node + ' has no type' );
                }
                if ( node[ field ] && this._map[ idx ] === undefined ) {

                    this._map[ idx ] = true;
                    var c = node[ field ]();
                    // push all elements of the array on text array
                    // node[field]()  must return an array
                    Array.prototype.push.apply( this._text, c );

                }

            };

            func._map = {};
            func._text = [];

            for ( var j = 0, jl = nodes.length; j < jl; j++ ) {
                this.traverse( func, nodes[ j ] );
            }

            return func._text;
        },

        // Gather a functions declartions of nodes
        // from a nodeGraph
        // (for now pragma include done here too. could be done with define/etc...)
        // Node of same Type has to share
        // exact same "node.globalFunctionDeclaration" output
        // as it use Type rather than ID as map index
        evaluateGlobalFunctionDeclaration: function ( nodes ) {

            var func = function ( node ) {

                // UNIQUE PER TYPE
                var idx = node.getType();

                if ( idx === undefined || idx === '' ) {
                    Notify.error( 'Your node ' + node + ' has no type' );
                }
                if ( node.globalFunctionDeclaration &&
                    this._map[ idx ] === undefined ) {

                    this._map[ idx ] = true;
                    var c = node.globalFunctionDeclaration();
                    if ( c !== undefined ) {
                        this._text.push( c );
                    }

                }

            };

            func._map = {};
            func._text = [];

            for ( var j = 0, jl = nodes.length; j < jl; j++ ) {
                this.traverse( func, nodes[ j ] );
            }

            return func._text.join( '\n' );
        },

        // Gather a Variables declarations of nodes
        // from a nodeGraph to be outputted
        // outside the VOID MAIN code
        // ( Uniforms, Varying )
        // Node of same Type has different output
        // as it use Type rather than ID as map index
        evaluateGlobalVariableDeclaration: function ( nodes ) {

            var func = function ( node ) {

                // UNIQUE PER NODE
                var idx = node.getID();

                if ( node.globalDeclaration &&
                    this._map[ idx ] === undefined ) {

                    this._map[ idx ] = true;
                    var c = node.globalDeclaration();
                    if ( c !== undefined ) {
                        this._text.push( c );
                    }
                }
            };

            func._map = {};
            func._text = [];
            for ( var j = 0, jl = nodes.length; j < jl; j++ ) {
                this.traverse( func, nodes[ j ] );
            }


            // Attribute 0 Must Be vertex
            // perf warning in console otherwiser in opengl Desktop
            if ( func._text.length ) {
                // sort in alphabetical order
                // attr, unif, sample, varying
                func._text.sort();
                // now sort Attributes
                // making sure Vertex is always coming first
                var toShift = [];
                for ( j = 0; j < func._text.length; j++ ) {
                    // found vertex, break
                    if ( func._text[ 0 ].indexOf( 'Vertex' ) !== -1 ) break;
                    // not yet, keep referenc to push after vertex
                    toShift.push( func._text.shift() ); // remove
                }
                // Add after vertex all the  found attributes
                func._text.splice( 1, 0, toShift.join( '\n' ) );

                // beautify/formatting with empty line between type of var
                var type = func._text[ 0 ][ 0 ];
                var len = func._text.length;
                for ( j = 0; j < len; j++ ) {
                    if ( func._text[ j ][ 0 ] !== type ) {
                        type = func._text[ j ][ 0 ];
                        func._text.splice( j, 0, '' );
                        len++;
                    }
                }
            }
            return func._text.join( '\n' );
        },


        evaluate: function ( nodes ) {

            var func = function ( node ) {

                var id = node.getID();
                if ( this._mapTraverse[ id ] !== undefined ) {
                    return;
                }

                var c = node.computeShader();
                if ( c !== undefined ) {

                    if ( node.getComment !== undefined ) {

                        var comment = node.getComment();
                        if ( comment !== undefined ) {
                            this._text.push( comment );
                        }

                    }

                    this._text.push( c );
                }
                this._mapTraverse[ id ] = true;
            };

            func._text = [];
            func._mapTraverse = [];

            for ( var j = 0, jl = nodes.length; j < jl; j++ ) {
                this.traverse( func, nodes[ j ] );
            }
            return func._text.join( '\n' );
        },

        getTexCoordUnit: function ( id ) {
            var texture = this._textures[ id ];
            if ( texture === undefined )
                return undefined;

            var textureMaterial = this._texturesByName[ texture.getName() ];
            if ( !textureMaterial )
                return undefined;

            var texCoordUnit = textureMaterial.textureUnit;
            if ( texCoordUnit === undefined )
                textureMaterial.textureUnit = texCoordUnit = id;
            return texCoordUnit;
        },

        // reusable BoneMatrix between Vertex, Normal, Tangent
        // Manadatory: scale animations must be uniform scale
        getOrCreateBoneMatrix: function () {
            var boneMatrix = this._variables[ 'boneMatrix' ];
            if ( boneMatrix )
                return boneMatrix;

            boneMatrix = this.createVariable( 'mat4', 'boneMatrix' );

            var inputWeights = this.getOrCreateAttribute( 'vec4', 'Weights' );
            var inputBones = this.getOrCreateAttribute( 'vec4', 'Bones' );
            var matrixPalette = this.getOrCreateUniform( 'vec4', 'uBones', this._animation.getBoneSize() );

            this.getNode( 'Animation' ).inputs( {
                weights: inputWeights,
                bonesIndex: inputBones,
                matrixPalette: matrixPalette
            } ).outputs( {
                mat4: boneMatrix
            } );

            return boneMatrix;
        },
        getOrCreateVertexAttribute: function () {
            var v = this._variables[ 'vertexAttribute' ];
            if ( v )
                return v;

            var inputVertex = this.getOrCreateAttribute( 'vec3', 'Vertex' );
            if ( !this._animation )
                return inputVertex;

            var positionAnimated = this.createVariable( 'vec3', 'vertexAttribute' );

            this.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateBoneMatrix(),
                vec: inputVertex
            } ).outputs( {
                vec: positionAnimated
            } );
            return positionAnimated;
        },
        getOrCreateNormalAttribute: function () {
            var v = this._variables[ 'normalAttribute' ];
            if ( v )
                return v;

            var inputNormal = this.getOrCreateAttribute( 'vec3', 'Normal' );
            if ( !this._animation )
                return inputNormal;

            var normalAnimated = this.createVariable( 'vec3', 'normalAttribute' );

            this.getNode( 'MatrixMultDirection' ).inputs( {
                matrix: this.getOrCreateBoneMatrix(),
                vec: inputNormal
            } ).outputs( {
                vec: normalAnimated
            } );
            return normalAnimated;

        },
        declareVertexTransformShadeless: function ( glPosition ) {
            // No light
            var tempViewSpace = this.createVariable( 'vec4' );

            //viewSpace
            this.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ModelViewMatrix' ),
                vec: this.getOrCreateVertexAttribute()
            } ).outputs( {
                vec: tempViewSpace
            } );

            //glpos
            this.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ProjectionMatrix' ),
                vec: tempViewSpace
            } ).outputs( {
                vec: glPosition
            } );

        },

        declareVertexTransformBillboard: function ( glPosition ) {
            this.getOrCreateInputPosition();
            var billboard = [ '%glPosition = %ProjectionMatrix * ( vec4( %Vertex, 1.0 ) + vec4( %ModelViewMatrix[ 3 ].xyz, 0.0 ) );', ];
            this.getNode( 'InlineCode' ).code( billboard.join( '\n' ) ).inputs( {
                ModelViewMatrix: this.getOrCreateUniform( 'mat4', 'ModelViewMatrix' ),
                Vertex: this.getOrCreateAttribute( 'vec3', 'Vertex' ),
                ProjectionMatrix: this.getOrCreateUniform( 'mat4', 'ProjectionMatrix' )
            } ).outputs( {
                glPosition: glPosition
            } );
        },

        declareVertexTransformLighted: function ( glPosition ) {
            // FragNormal
            this.getNode( 'MatrixMultDirection' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'NormalMatrix' ),
                vec: this.getOrCreateNormalAttribute()
            } ).outputs( {
                vec: this.getOrCreateInputNormal()
            } );

            if ( this._isBillboard )
                this.declareVertexTransformBillboard( glPosition );
            else
                this.declareTransformWithEyeSpace( glPosition );

        },
        // Transform Position into NDC
        // but keep intermediary result
        // FragEye which is in Camera/Eye space
        // (most light computation are in eye space)
        // (better precision, particulary if camera is far from World 0.0.0)
        declareTransformWithEyeSpace: function ( glPosition ) {

            // FragEye
            // need vec4 for linearization of depth
            var tempViewSpace = this.getOrCreateInputPosition();
            this.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ModelViewMatrix' ),
                vec: this.getOrCreateVertexAttribute()
            } ).outputs( {
                vec: tempViewSpace
            } );


            //glpos
            this.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ProjectionMatrix' ),
                vec: tempViewSpace
            } ).outputs( {
                vec: glPosition
            } );
        },

        declareVertexTransformShadowed: function ( /*glPosition*/) {

            // worldpos
            this.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ModelWorldMatrix' ),
                vec: this.getOrCreateVertexAttribute()
            } ).outputs( {
                vec: this.getOrCreateVarying( 'vec3', 'WorldPosition' )
            } );

        },

        isShadowed: function () {
            // if no light, no shadow
            if ( !this._isLighted )
                return false;
            for ( var i = 0, ll = this._shadowsTextures.length; i < ll; i++ ) {

                if ( this._shadowsTextures[ i ] !== undefined )
                    return true;
            }
            return false;
        },
        // - check Precision qualifier on vertex Attributes
        // - check Precision qualifier on vertex Attributes Varying
        declareVertexTransforms: function ( glPosition ) {
            // Fast Path, only Depth
            if ( this._isShadowCast ) {
                this.declareTransformWithEyeSpace( glPosition );
                return;
            }
            // Make only necessary operation and varying
            if ( this._isLighted || this._shaderAttributes[ 'Normal' ] ) {
                if ( this.isShadowed() ) {
                    this.declareVertexTransformShadowed( glPosition );
                }
                this.declareVertexTransformLighted( glPosition );

            } else {
                if ( this._isBillboard )
                    this.declareVertexTransformBillboard( glPosition );
                else
                    this.declareVertexTransformShadeless( glPosition );
            }
        },

        declareVertexTextureCoords: function ( /*glPosition*/) {

            var texCoordMap = {};
            for ( var tt = 0; tt < this._textures.length; tt++ ) {
                var texCoordUnit = this.getTexCoordUnit( tt );
                if ( texCoordUnit === undefined || texCoordMap[ texCoordUnit ] !== undefined )
                    continue;

                this.getNode( 'SetFromNode' ).inputs( this.getOrCreateAttribute( 'vec2', 'TexCoord' + texCoordUnit ) ).outputs(
                    this.getOrCreateVarying( 'vec2', 'FragTexCoord' + texCoordUnit )
                );

                texCoordMap[ texCoordUnit ] = true;
            }
        },

        declareVertexMain: function () {

            // the mandatory output is glPosition
            var glPosition = this.getNode( 'glPosition' );

            // shader graph can have multiple output (glPointsize, varyings)
            // here named roots
            // all outputs must be pushed inside
            var roots = [];


            // roots is
            this.declareVertexTransforms( glPosition, roots );
            this.declareVertexTextureCoords( glPosition, roots );


            if ( this._isVertexColored ) {
                var vertexDynamicColoring = [ '',
                    'if ( %ArrayColorEnabled == 1.0 ) ',
                    '    %VertexColor = %Color;',
                    '  else',
                    '    %VertexColor = vec4(1.0,1.0,1.0,1.0);'
                ];

                this.getNode( 'InlineCode' ).code( vertexDynamicColoring.join( '\n' ) ).inputs( {
                    ArrayColorEnabled: this.getOrCreateUniform( 'float', 'ArrayColorEnabled' ),
                    Color: this.getOrCreateAttribute( 'vec4', 'Color' )
                } ).outputs( {
                    VertexColor: this.getOrCreateVarying( 'vec4', 'VertexColor' )
                } );
            }



            // TODO: add this for POINT RENDERING ONLY
            var str = '%out = %input;';
            var glPointSize = this.getNode( 'glPointSize' );
            this.getNode( 'InlineCode' ).code( str ).inputs( {
                input: this.getOrCreateConstant( 'float', 'unitFloat' ).setValue( '1.0' )
            } ).outputs( {
                out: glPointSize
            } );
            roots.push( glPointSize );

            // Because of a weird bug on iOS
            // glPosition should be computed in the vertex shader before some varyings
            roots.push( glPosition );

            var vars = Object.keys( this._varyings );
            for ( var j = 0, jl = vars.length; j < jl; j++ ) {
                var varying = this._varyings[ vars[ j ] ];
                if ( varying !== undefined ) {
                    // make sure we link all vertex shader output
                    // to the finale Node
                    roots.push( varying );
                }
            }

            return roots;

        },
        // Meanwhile, here it is.
        createVertexShaderGraph: function () {
            return this.declareVertexMain();
        },

        // The Compiler Main Code
        // called on Vertex or Fragment Shader Graph
        createShaderFromGraphs: function ( roots, type ) {
            this._compiledNodeList = {};

            // list all vars
            var vars = Object.keys( this._variables );
            var variables = [];
            for ( var j = 0, jl = vars.length; j < jl; j++ ) {

                var varNode = this._variables[ vars[ j ] ];
                var d = varNode.declare();
                if ( d ) {
                    variables.push( d );
                }
            }

            // defines and extensions are added by process shader
            var extensions = this.evaluateExtensions( roots );
            var defines = this.evaluateDefines( roots );

            var shaderStack = [];
            shaderStack.push( '\n' );
            shaderStack.push( this.evaluateGlobalVariableDeclaration( roots ) );
            shaderStack.push( '\n' );
            shaderStack.push( this.evaluateGlobalFunctionDeclaration( roots ) );


            shaderStack.push( 'void main() {' );

            // declare variables in main
            if ( variables.length !== 0 ) {
                shaderStack.push( '// vars\n' );
                shaderStack.push( variables.join( ' ' ) );
                shaderStack.push( '\n// end vars\n' );
            }
            // make sure we have at least one output
            if ( roots.length === 0 ) {
                Notify.error( 'shader without any final Node output (need at least one)' );
            }
            shaderStack.push( this.evaluate( roots ) );

            shaderStack.push( '}' );

            // Shader Graph has been outputed an array of string
            // we concatenate it to a shader string program
            var shaderStr = shaderStack.join( '\n' );

            // Process defines, add precision, resolve include pragma
            var shader = this._shaderProcessor.processShader( shaderStr, defines, extensions, type );

            // Check
            var compiledNodes = Object.keys( this._compiledNodeList );
            var activeNodes = Object.keys( this._activeNodeList );
            activeNodes.filter( function ( i ) {
                var found = compiledNodes.indexOf( i ) !== -1;
                if ( !found ) {
                    var node = this._activeNodeList[ i ];
                    var name = node.getName();
                    if ( name === 'Variable' ) name += ' ' + node.getVariable() + ' (' + node.getType() + ')';
                    Notify.warn( 'Nodes requested, but not compiled: ' + i + ' ' + name + ' ' + node.toString() );
                }
                return found;
            }, this );


            // return the complete shader string.
            // now is compilable by gl driver
            return shader;
        },
        createVertexShader: function () {


            // start with clean slate
            this._variables = {};
            this._activeNodeList = {};
            this._fragmentShaderMode = false;

            // Call to specialised inhenrited shader Compiler
            var roots = this.createVertexShaderGraph();
            var vname = this.getVertexShaderName();
            if ( vname )
                roots.push( this.getNode( 'Define', 'SHADER_NAME' ).setValue( vname ) );

            // call the graph compiler itself
            var shader = this.createShaderFromGraphs( roots, 'vertex' );

            Notify.debug( shader );

            // reset for next, but not empty, keep varyings
            this._variables = {};
            this._activeNodeList = {};
            this._fragmentShaderMode = true;
            // we want to keep list of varying
            // to be able to validate fragment shader
            // requiring varyings
            var vars = Object.keys( this._varyings );
            for ( var j = 0, jl = vars.length; j < jl; j++ ) {
                var varying = this._varyings[ vars[ j ] ];
                if ( varying !== undefined ) {
                    // make sure we clean input/output
                    // of varying for fragment shader graph
                    varying.reset();
                    // add it back to variables list
                    // so that we can detect
                    // when varing is computed in VS but not in FS
                    this._activeNodeList[ varying.getID() ] = varying;
                    this._variables[ varying.getID() ] = varying;
                }
            }


            return shader;
        },
        evaluateDefines: function ( roots ) {
            return this.evaluateAndGatherField( roots, 'getDefines' );
        },
        evaluateExtensions: function ( roots ) {
            return this.evaluateAndGatherField( roots, 'getExtensions' );
        },
        createFragmentShader: function () {

            // start with clean slate
            if ( this._customVertexShader ) {
                this._variables = {};
                this._activeNodeList = {};
            }
            this._fragmentShaderMode = true;

            this.declareTextures();

            // Call to specialised inhenrited shader Compiler
            var roots = this.createFragmentShaderGraph();
            var fname = this.getFragmentShaderName();
            if ( fname )
                roots.push( this.getNode( 'Define', 'SHADER_NAME' ).setValue( fname ) );

            var shader = this.createShaderFromGraphs( roots, 'fragment' );
            Notify.debug( shader );

            // reset for next
            this._variables = {};
            this._fragmentShaderMode = false;
            this._activeNodeList = {};

            return shader;
        },


        // This function is used when no material
        // is present. If you inherit from this Compiler
        // you could change the default behavior
        createDefaultFragmentShaderGraph: function () {
            var fofd = this.getOrCreateConstant( 'vec4', 'fofd' ).setValue( 'vec4(1.0, 0.0, 1.0, 0.7)' );
            var fragCol = this.getNode( 'glFragColor' );
            this.getNode( 'SetFromNode' ).inputs( fofd ).outputs( fragCol );
            return fragCol;
        },

        // Depth Shadow Map Casted from Light Pov
        // Depth encoded in color buffer
        createShadowCastFragmentShaderGraph: function () {
            var frag = this.getNode( 'glFragColor' );
            this.getNode( 'ShadowCast' ).setShadowCastAttribute( this._shadowCastAttribute ).inputs( {
                exponent0: this.getOrCreateUniform( 'float', 'exponent0' ),
                exponent1: this.getOrCreateUniform( 'float', 'exponent1' ),
                shadowDepthRange: this.getOrCreateUniform( 'vec4', 'Shadow_DepthRange' ),
                fragEye: this.getOrCreateInputPosition()
            } ).outputs( {
                color: frag
            } );
            return frag;
        },

        // this is the main function that will generate the
        // fragment shader. If you need to improve / add your own
        // you could inherit and override this function
        createFragmentShaderGraph: function () {

            // shader graph can have multiple output (glPointsize, varyings)
            // here named roots
            // all outputs must be pushed inside
            var roots = [];

            // depth cast
            if ( this._isShadowCast ) {
                roots.push( this.createShadowCastFragmentShaderGraph() );
                return roots;
            }

            // no material then return a default shader
            if ( !this._material ) {
                roots.push( this.createDefaultFragmentShaderGraph() );
                return roots;
            }

            var materialUniforms = this.getOrCreateStateAttributeUniforms( this._material );


            // diffuse color
            var diffuseColor = this.getDiffuseColorFromTextures();

            if ( diffuseColor === undefined ) {

                diffuseColor = materialUniforms.diffuse;

            } else {

                this.getNode( 'InlineCode' ).code( '%color.rgb *= %diffuse.rgb;' ).inputs( {
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

            // Discard fragments totally transparents when rendering billboards 
            if ( this._isBillboard )
                alphaCompute += 'if ( %alpha == 0.0) discard;';

            this.getNode( 'InlineCode' ).code( alphaCompute ).inputs( {
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
                // no light, no emssion use diffuse color
                finalColor = diffuseColor;
            }

            if ( materialUniforms.emission ) {
                // add emission if any
                var outputDiffEm = this.createVariable( 'vec3' ).setValue( 'vec3(0.0)' );
                this.getNode( 'Add' ).inputs( finalColor, materialUniforms.emission ).outputs( outputDiffEm );
                finalColor = outputDiffEm;
            }

            // premult alpha
            finalColor = this.getPremultAlpha( finalColor, alpha );

            var fragColor = this.getNode( 'glFragColor' );


            // todo add gamma corrected color, but it would also
            // mean to handle correctly srgb texture. So it should be done
            // at the same time. see osg.Tetxure to implement srgb
            this.getNode( 'SetAlpha' ).inputs( {
                color: finalColor,
                alpha: alpha
            } ).outputs( {
                color: fragColor
            } );

            roots.push( fragColor );

            return roots;
        },
        getFragmentShaderName: function () {
            if ( this.isShadowCast() ) return 'ShadowCastClassic';
            return this._material ? 'CompilerOSGJS' : 'NoMaterialCompilerOSGJS';
        },
        getVertexShaderName: function () {
            return this.getFragmentShaderName();
        }
    };

    return Compiler;

} );
