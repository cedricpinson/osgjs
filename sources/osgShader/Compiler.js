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


        // from Attributes to variables
        // to build shader nodes graph from
        this.initAttributes();
        this.initTextureAttributes();

        // Basic inference, any Compiler inheriting better check those
        this._isShadeless = !this._material;
        this._isLighted = !this._isShadeless && this._lights.length > 0;
        // backup shader, FS just output 'fofd'
        this._isVertexColored = !!this._material;

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


                } else if ( type === 'ShadowAttribute' ) {

                    shadows.push( attributes[ i ] );

                }
            }
        },

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
                            textureUnit: texUnit
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

            var v = factory.getNode( 'Variable', type, nameID );
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


        getOrCreateUniform: function ( type, varname ) {

            var nameID = varname;

            // accept uniform as parameter to simplify code
            if ( type instanceof Uniform ) {

                var uniform = type;
                type = uniform.getType();
                nameID = uniform.getName();

            } else if ( nameID === undefined ) {

                var len = Object.keys( this._variables ).length;
                nameID = 'tmp_' + len;

            }

            var exist = this._variables[ nameID ];
            if ( exist ) {
                // see comment in Variable function
                return exist;
            }

            var v = factory.getNode( 'Uniform', type, nameID );
            this._variables[ nameID ] = v;
            return v;
        },

        getOrCreateAttribute: function ( type, nameID ) {

            if ( this._fragmentShaderMode ) {
                Notify.error( 'No Vertex Attribute in Fragment Shader' );
            }

            var exist = this._variables[ nameID ];
            if ( exist ) {
                return exist;
            }

            // adds the reference for Fragment Shader
            // aknowledging data binded
            // and that varying data will be available accordingly
            this._shaderAttributes[ nameID ] = true;

            var v = factory.getNode( 'Attribute', type, nameID );
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
                    // see comment in Variable function
                    return exist;
                }

            }
            var v = factory.getNode( 'Constant', type, nameID );
            this._variables[ nameID ] = v;
            return v;
        },


        getOrCreateVarying: function ( type, nameID ) {

            // make sure you don't create varying out of thin air
            if ( nameID === undefined ) {
                Notify.error( 'Error: better name varying as you need to retrieve them...' );
            }

            var exist = this._variables[ nameID ];
            if ( exist ) {
                // something went wrong: you created a variable and try to access it like a varying
                if ( !this._varyings[ nameID ] ) {
                    Notify.error( 'Error: requesting a varying not declared with getOrCreateVarying previously' );
                }
                if ( exist.getType() !== type ) {
                    Notify.error( 'Same varying, but different type' );
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
                    return exist;
                }
            }


            // if it's not in Varying Cache, but requested from fragment shader
            // it means => error
            if ( this._fragmentShaderMode && !this._customVertexShader ) {
                Notify.error( 'Error: requesting a varying not declared in Vertex Shader Graph.( if a Custom Vertex Shader in a custom processor, add this._customVertexShader to your custom processor)' );
            }

            var v = factory.getNode( 'Varying', type, nameID );
            this._variables[ nameID ] = v;
            this._varyings[ nameID ] = v;
            return v;
        },


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
            var v = factory.getNode( 'Sampler', type, nameID );
            this._variables[ nameID ] = v;
            return v;
        },

        getOrCreateInputNormal: function () {
            return this.getOrCreateVarying( 'vec3', 'FragNormal' );
        },


        getOrCreateFrontNormal: function () {
            var inputNormal = this.getOrCreateInputNormal();
            var frontNormal = this.createVariable( 'vec3', 'frontNormal' );

            factory.getNode( 'FrontNormal' ).inputs( {
                normal: inputNormal
            } ).outputs( {
                normal: frontNormal
            } );

            return frontNormal;
        },


        getOrCreateInputPosition: function () {
            return this.getOrCreateVarying( 'vec3', 'FragEyeVector' );
        },


        getOrCreateNormalizedNormal: function () {
            var normal = this._variables[ 'normal' ];
            if ( normal )
                return normal;
            var out = this.createVariable( 'vec3', 'normal' );
            factory.getNode( 'Normalize' ).inputs( {
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
            factory.getNode( 'Normalize' ).inputs( {
                vec: this.getOrCreateInputPosition()
            } ).outputs( {
                vec: nor
            } );
            var out = this.createVariable( 'vec3', 'eyeVector' );
            factory.getNode( 'Mult' ).inputs( nor, this.createVariable( 'float' ).setValue( '-1.0' ) ).outputs( out );
            return out;
        },

        getPremultAlpha: function ( finalColor, alpha ) {

            if ( alpha === undefined )
                return finalColor;

            var premultAlpha = this.createVariable( 'vec4' );

            factory.getNode( 'PreMultAlpha' ).inputs( {
                color: finalColor,
                alpha: alpha
            } ).outputs( {
                color: premultAlpha
            } );

            return premultAlpha;
        },


        getColorsRGB: function ( finalColor ) {
            var finalSrgbColor = this.createVariable( 'vec3' );
            factory.getNode( 'LinearTosRGB' ).inputs( {
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

            factory.getNode( 'InlineCode' ).code( str ).inputs( {
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

                factory.getNode( 'Mult' ).inputs( texturesInput ).outputs( texAccum );
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

                if ( texture.getType() === 'Texture' )
                    this.declareTexture( t, texture );

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
            for ( k = 0; k < this._shadows.length; k++ ) {
                shadow = this._shadows[ k ];
                if ( shadow.getLight() !== light ) continue;

                lightIndex = k;
                for ( var p = 0; p < this._shadowsTextures.length; p++ ) {
                    shadowTexture = this._shadowsTextures[ p ];
                    if ( shadowTexture && shadowTexture.getLightUnit() === light.getLightNumber() ) {
                        shadowTextures[ p ] = shadowTexture;
                        hasShadows = true;
                    }
                }
            }
            if ( !hasShadows ) return undefined;

            // Varyings
            var vertexWorld = this.getOrCreateVarying( 'vec4', 'WorldPosition' );

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
            factory.getNode( 'Shadow' ).inputs( inputs ).outputs( {
                float: shadowedOutput
            } ).setShadowAttribute( shadow );

            var lightAndShadowTempOutput = this.createVariable( 'vec3', 'lightAndShadowTempOutput' );
            factory.getNode( 'Mult' ).inputs( lightedOutput, shadowedOutput ).outputs( lightAndShadowTempOutput );
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

                factory.getNode( nodeName ).inputs( inputs ).outputs( {
                    color: lightedOutput
                } );

                var shadowedOutput = this.createShadowingLight( light, inputs, lightedOutput );
                if ( shadowedOutput ) {
                    lightOutputVarList.push( shadowedOutput );
                } else {
                    lightOutputVarList.push( lightedOutput );
                }

                var lightMatAmbientOutput = this.createVariable( 'vec3', 'lightMatAmbientOutput' );

                factory.getNode( 'Mult' ).inputs( inputs.materialambient, lightUniforms.lightambient ).outputs( lightMatAmbientOutput );


                lightOutputVarList.push( lightMatAmbientOutput );
            }

            // do not delete on the assumption that light list is always filled
            // in case CreateLighting is called with a empty lightList
            // when Compiler is overriden.
            if ( lightOutputVarList.length === 0 )
                lightOutputVarList.push( this.createVariable( 'vec3' ).setValue( 'vec3(0.0)' ) );

            factory.getNode( 'Add' ).inputs( lightOutputVarList ).outputs( output );

            return output;
        },


        // but we could later implement srgb inside and read differents flag
        // as read only in the texture
        createTextureRGBA: function ( texture, textureSampler, texCoord ) {

            var texel = this.createVariable( 'vec4' );
            factory.getNode( 'TextureRGBA' ).inputs( {
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
                    Notify.error( 'Your node ' + node + ' has not type' );
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
                    Notify.error( 'Your node ' + node + ' has not type' );
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

        declareVertexTransformShadeless: function ( glPosition ) {
            // No light
            var tempViewSpace = this.createVariable( 'vec4' );

            //viewSpace
            factory.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ModelViewMatrix' ),
                vec: this.getOrCreateAttribute( 'vec3', 'Vertex' )
            } ).outputs( {
                vec: tempViewSpace
            } );

            //glpos
            factory.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ProjectionMatrix' ),
                vec: tempViewSpace
            } ).outputs( {
                vec: glPosition
            } );

        },
        declareVertexTransformLighted: function ( glPosition ) {


            // FragNormal
            factory.getNode( 'MatrixMultDirection' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'NormalMatrix' ),
                vec: this.getOrCreateAttribute( 'vec3', 'Normal' )
            } ).outputs( {
                vec: this.getOrCreateInputNormal()
            } );


            var tempViewSpace = this.createVariable( 'vec4' );
            factory.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ModelViewMatrix' ),
                vec: this.getOrCreateAttribute( 'vec3', 'Vertex' )
            } ).outputs( {
                vec: tempViewSpace
            } );

            // FragEye
            factory.getNode( 'SetFromNode' ).inputs(
                tempViewSpace
            ).outputs(
                this.getOrCreateInputPosition()
            );
            //glpos
            factory.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ProjectionMatrix' ),
                vec: tempViewSpace
            } ).outputs( {
                vec: glPosition
            } );

        },
        declareVertexTransformShadowed: function ( /*glPosition*/) {

            // worldpos
            factory.getNode( 'MatrixMultPosition' ).inputs( {
                matrix: this.getOrCreateUniform( 'mat4', 'ModelWorldMatrix' ),
                vec: this.getOrCreateAttribute( 'vec3', 'Vertex' )
            } ).outputs( {
                vec: this.getOrCreateVarying( 'vec4', 'WorldPosition' )
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
            // Make only necessary operation and varying
            if ( this._isLighted || this._shaderAttributes[ 'Normal' ] ) {

                if ( this.isShadowed() ) {
                    this.declareVertexTransformShadowed( glPosition );
                }
                this.declareVertexTransformLighted( glPosition );

            } else {
                this.declareVertexTransformShadeless( glPosition );
            }
        },

        declareVertexTextureCoords: function ( /*glPosition*/) {

            var texCoordMap = {};
            for ( var tt = 0; tt < this._textures.length; tt++ ) {
                var texCoordUnit = this.getTexCoordUnit( tt );
                if ( texCoordUnit === undefined || texCoordMap[ texCoordUnit ] !== undefined )
                    continue;

                factory.getNode( 'SetFromNode' ).inputs( this.getOrCreateAttribute( 'vec2', 'TexCoord' + texCoordUnit ) ).outputs(
                    this.getOrCreateVarying( 'vec2', 'FragTexCoord' + texCoordUnit )
                );

                texCoordMap[ texCoordUnit ] = true;
            }
        },

        declareVertexMain: function () {

            var glPosition = factory.getNode( 'glPosition' );

            var roots = [];

            this.declareVertexTransforms( glPosition, roots );
            this.declareVertexTextureCoords( glPosition, roots );


            if ( this._isVertexColored ) {
                var vertexDynamicColoring = [ '',
                    'if ( %ArrayColorEnabled == 1.0 ) ',
                    '    %VertexColor = %Color;',
                    '  else',
                    '    %VertexColor = vec4(1.0,1.0,1.0,1.0);'
                ];

                factory.getNode( 'InlineCode' ).code( vertexDynamicColoring.join( '\n' ) ).inputs( {
                    ArrayColorEnabled: this.getOrCreateUniform( 'float', 'ArrayColorEnabled' ),
                    Color: this.getOrCreateAttribute( 'vec4', 'Color' )
                } ).outputs( {
                    VertexColor: this.getOrCreateVarying( 'vec4', 'VertexColor' )
                } );
            }



            // TODO: add this for POINT RENDERING ONLY
            var str = '%out = %input;';
            var glPointSize = factory.getNode( 'glPointSize' );
            factory.getNode( 'InlineCode' ).code( str ).inputs( {
                input: this.getOrCreateConstant( 'float', 'unitFloat' ).setValue( '1.0' )
            } ).outputs( {
                out: glPointSize
            } );
            roots.push( glPointSize );


            var vars = Object.keys( this._varyings );
            for ( var j = 0, jl = vars.length; j < jl; j++ ) {
                var varying = this._varyings[ vars[ j ] ];
                if ( varying !== undefined ) {
                    // make sure we link all vertex shader output
                    // to the finale Node
                    roots.push( varying );
                }
            }

            // last the position
            roots.push( glPosition );
            return roots;

        },
        // Meanwhile, here it is.
        createVertexShaderGraph: function () {
            return this.declareVertexMain();
        },

        createShaderFromGraphs: function ( roots, type ) {


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
            if ( roots.length === 0 ) {
                Notify.error( 'shader without output' );
            }
            shaderStack.push( this.evaluate( roots ) );

            shaderStack.push( '}' );

            var shaderStr = shaderStack.join( '\n' );
            var shader = this._shaderProcessor.processShader( shaderStr, defines, extensions, type );

            return shader;
        },
        createVertexShader: function () {

            // Call to specialised inhenrited shader Compiler
            // start with clean slate
            this._variables = {};
            this._fragmentShaderMode = false;

            var roots = this.createVertexShaderGraph();

            var shader = this.createShaderFromGraphs( roots, 'vertex' );
            Notify.debug( shader );

            // reset for next
            this._variables = {};
            this._fragmentShaderMode = true;

            var vars = Object.keys( this._varyings );
            for ( var j = 0, jl = vars.length; j < jl; j++ ) {
                var varying = this._varyings[ vars[ j ] ];
                if ( varying !== undefined ) {
                    // make sure we clean input/output
                    // of varying for fragment shader graph
                    varying.reset();
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
            this._variables = {};
            this._fragmentShaderMode = true;

            this.declareTextures();

            // Call to specialised inhenrited shader Compiler
            var roots = this.createFragmentShaderGraph();


            var shader = this.createShaderFromGraphs( roots, 'fragment' );
            Notify.debug( shader );

            // reset for next
            this._variables = {};
            this._fragmentShaderMode = false;

            return shader;
        },


        // This function is used when no material
        // is present. If you inherit from this Compiler
        // you could change the default behavior
        createDefaultFragmentShaderGraph: function () {
            var fofd = this.getOrCreateConstant( 'vec4', 'fofd' ).setValue( 'vec4(1.0, 0.0, 1.0, 0.7)' );
            var fragCol = factory.getNode( 'glFragColor' );
            factory.getNode( 'SetFromNode' ).inputs( fofd ).outputs( fragCol );
            return fragCol;
        },


        // this is the main function that will generate the
        // fragment shader. If you need to improve / add your own
        // you could inherit and override this function
        createFragmentShaderGraph: function () {


            var roots = [];

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
                // no light, no emssion use diffuse color
                finalColor = diffuseColor;
            }

            if ( materialUniforms.emission ) {
                // add emission if any
                var outputDiffEm = this.createVariable( 'vec3' ).setValue( 'vec3(0.0)' );
                factory.getNode( 'Add' ).inputs( finalColor, materialUniforms.emission ).outputs( outputDiffEm );
                finalColor = outputDiffEm;
            }

            // premult alpha
            finalColor = this.getPremultAlpha( finalColor, alpha );

            var fragColor = factory.getNode( 'glFragColor' );


            // todo add gamma corrected color, but it would also
            // mean to handle correctly srgb texture. So it should be done
            // at the same time. see osg.Tetxure to implement srgb
            factory.getNode( 'SetAlpha' ).inputs( {
                color: finalColor,
                alpha: alpha
            } ).outputs( {
                color: fragColor
            } );

            roots.push( fragColor );

            return roots;
        }
    };

    return Compiler;

} );
