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

        this.initAttributes();
        this.initTextureAttributes();
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

        getVariable: function ( name ) {
            return this._variables[ name ];
        },

        getAttributeType: function ( type ) {

            for ( var i = 0; i < this._attributes.length; i++ ) {
                if ( this._attributes[ i ].getType() === type )
                    return this._attributes[ i ];
            }
            return undefined;

        },


        // if doesn't exist create a new on
        // if name given and var already exist, create a varname +
        createVariable: function ( type, varname, deepness ) {

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
                    return this.createVariable( type, varname, 1 );
                } else if ( this._variables[ name ] ) {
                    deepness++;
                    return this.createVariable( type, varname, deepness );
                }

            }

            var v = factory.getNode( 'Variable', type, name );
            this._variables[ name ] = v;
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

            var v = factory.getNode( 'Uniform', type, name );
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
            var v = factory.getNode( 'Varying', type, name );
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
            var v = factory.getNode( 'Sampler', type, name );
            this._variables[ name ] = v;
            return v;
        },

        declareAttributeUniforms: function ( attribute ) {

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
            var t;
            for ( t = 0; t < this._lights.length; t++ ) {
                this.declareAttributeUniforms( this._lights[ t ] );
            }
            for ( t = 0; t < this._shadows.length; t++ ) {
                this.declareAttributeUniforms( this._shadows[ t ] );
            }


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
            var outputNormal = this.createVariable( 'vec3', 'normal' );

            // get or create normalized position
            var outputPosition = this.createVariable( 'vec3', 'eyeVector' );

            //
            factory.getNode( 'NormalizeNormalAndEyeVector' ).inputs( {
                normal: frontNormal,
                position: inputPosition
            } ).outputs( {
                normal: outputNormal,
                eyeVector: outputPosition
            } );

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
            var name = texture.getName();
            if ( name === undefined ) {
                name = 'Texture' + texCoordUnit;
            }

            // create/update texture entry (texture, textureUnit)
            var textureMaterial = this._texturesByName[ name ];
            if ( textureMaterial === undefined ) {

                this._texturesByName[ name ] = {
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
            var vertexWorld = this.getOrCreateVarying( 'vec4','WorldPosition' ) ;

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
        evaluateAndGatherField: function ( node, field ) {

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
            this.traverse( func, node );

            return func._text;
        },

        // Gather a functions declartions of nodes
        // from a nodeGraph
        // (for now pragma include done here too. could be done with define/etc...)
        // Node of same Type has to share
        // exact same "node.globalFunctionDeclaration" output
        // as it use Type rather than ID as map index
        evaluateGlobalFunctionDeclaration: function ( node ) {

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
            this.traverse( func, node );

            return func._text.join( '\n' );
        },

        // Gather a Variables declarations of nodes
        // from a nodeGraph to be outputted
        // outside the VOID MAIN code
        // ( Uniforms, Varying )
        // Node of same Type has different output
        // as it use Type rather than ID as map index
        evaluateGlobalVariableDeclaration: function ( node ) {

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
            this.traverse( func, node );
            return func._text.join( '\n' );
        },


        evaluate: function ( node ) {

            var func = function ( node ) {

                var id = node.getID();
                if ( this._mapTraverse[ id ] !== undefined ) {
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
                this._mapTraverse[ id ] = true;
            };

            func._text = [];
            func._mapTraverse = [];
            this.traverse( func, node );
            this._fragmentShader.push( func._text.join( '\n' ) );
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

        //
        // TODO: change into node based graph shader system.
        // TODO: Check Precision qualifier on vertex Attributes & Varying
        declareVertexVariables: function () {
            var texCoordMap = {};

            // TODO: for performance:
            // - remove non necessary attributes
            // - remove unecessary varying (huge impact)
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

            var i, ll;
            for ( i = 0, ll = this._shadowsTextures.length; i < ll; i++ ) {

                var shadowTexture = this._shadowsTextures[ i ];
                if ( shadowTexture === undefined )
                    continue;

                this._vertexShader.push( 'uniform mat4 ModelWorldMatrix;' );
                this._vertexShader.push( 'varying vec4 WorldPosition;' );

                // found shadow and added code accordingly once and for all
                break;
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
            this._vertexShader.push( [ '',
                '  FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));',
                '  vec4 viewPos = ModelViewMatrix * vec4(Vertex,1.0);',
                '  FragEyeVector = viewPos.xyz;',
                '  gl_Position = ProjectionMatrix * viewPos;',
                '  if (ArrayColorEnabled == 1.0)',
                '    VertexColor = Color;',
                '  else',
                '    VertexColor = vec4(1.0,1.0,1.0,1.0);',
                '  gl_PointSize = 1.0;',
                '',
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

            for ( var i = 0, ll = this._shadowsTextures.length; i < ll; i++ ) {
                var shadowTexture = this._shadowsTextures[ i ];
                if ( !shadowTexture ) continue;

                this._vertexShader.push( 'WorldPosition = ModelWorldMatrix * vec4(Vertex,1.0);' );
                // shadow found and according code done once for all shadow
                break;
            }
        },
        // Meanwhile, here it is.
        createVertexShaderGraph: function () {
            this.declareVertexVariables();
            this._vertexShader.push( 'void main() {' );
            this.declareVertexMain();
            this._vertexShader.push( '}' );
        },

        createVertexShader: function () {
            // Call to specialised inhenrited shader Compiler
            this.createVertexShaderGraph();
            var shader = this._vertexShader.join( '\n' );

            shader = this._shaderProcessor.processShader( shader );
            return shader;
        },
        evaluateDefines: function ( root ) {
            return this.evaluateAndGatherField( root, 'getDefines' );
        },
        evaluateExtensions: function ( root ) {
            return this.evaluateAndGatherField( root, 'getExtensions' );
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

            // defines and extensions are added by process shader
            var extensions = this.evaluateExtensions( root );
            var defines = this.evaluateDefines( root );


            this._fragmentShader.push( '\n' );
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

            shader = this._shaderProcessor.processShader( shader, defines, extensions );

            Notify.debug( shader );
            return shader;
        },


        // This function is used when no material
        // is present. If you inherit from this Compiler
        // you could change the default behavior
        createDefaultFragmentShaderGraph: function () {
            return factory.getNode( 'FragColor' ).inputs( this.createVariable( 'vec4' ).setValue( 'vec4(1.0, 0.0, 1.0, 0.7)' ) );
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

            var fragColor = factory.getNode( 'FragColor' );

            // todo add gamma corrected color, but it would also
            // mean to handle correctly srgb texture. So it should be done
            // at the same time. see osg.Tetxure to implement srgb
            factory.getNode( 'SetAlpha' ).inputs( {
                color: finalColor,
                alpha: alpha
            } ).outputs( {
                color: fragColor
            } );

            return fragColor;
        }
    };

    return Compiler;

} );
