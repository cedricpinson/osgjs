define( [
    'osg/Notify',
    'osg/Program',
    'osg/Shader',
    'osg/Map',
    'osgShader/Compiler',
    'osgShader/ShaderProcessor'
], function ( Notify, Program, Shader, Map, Compiler, ShaderProcessor ) {
    'use strict';

    // this is the list of attributes type we support by default to generate shader
    // if you need to adjust for your need provide or modify this list
    // if you still need more fine tuning to the filter, override the filterAttributeTypes
    var DefaultsAcceptAttributeTypes = [
        'ShadowAttribute',
        'ShadowTexture',
        'Texture',
        'Light',
        'Material'
    ];

    var ShaderGenerator = function () {
        this._cache = new window.Map();

        // ShaderProcessor singleton used by ShaderGenerator
        // but user can replace it if needed
        this._shaderProcessor = new ShaderProcessor();
        this._acceptAttributeTypes = new window.Set( DefaultsAcceptAttributeTypes );

        // ShaderCompiler Object to instanciate
        this._ShaderCompiler = Compiler;
    };

    ShaderGenerator.prototype = {

        // setShaderCompiler that will be used to createShader
        setShaderCompiler: function ( compiler ) {
            this._ShaderCompiler = compiler;
        },

        getShaderCompiler: function () {
            return this._ShaderCompiler;
        },


        // return a Set of accepted attribtues to generate shader
        getAcceptAttributeTypes: function () {
            return this._acceptAttributeTypes;
        },


        getShaderProcessor: function () {
            return this._shaderProcessor;
        },

        setShaderProcessor: function ( shaderProcessor ) {
            this._shaderProcessor = shaderProcessor;
        },

        // filter input types and write the result in the outputs array
        filterAttributeTypes: function ( attribute ) {

            if ( attribute.libraryName() !== 'osg' )
                return true;

            var attributeType = attribute.getType();

            // accept only attribute listed in the container
            if ( !this._acceptAttributeTypes.has( attributeType ) )
                return true;

            // if it's a light and it's not enable we filter it
            var Light = require( 'osg/Light' );
            if ( attribute.typeID === Light.typeID && !attribute.isEnable() ) {
                return true;
            }

            return false;
        },

        // get actives attribute that comes from state
        getActiveAttributeList: function ( state, list ) {

            var hash = '';
            var attributeMap = state.attributeMap;
            var attributeMapKeys = attributeMap.getKeys();

            for ( var j = 0, k = attributeMapKeys.length; j < k; j++ ) {

                var keya = attributeMapKeys[ j ];
                var attributeStack = attributeMap[ keya ];
                var attr = attributeStack.lastApplied;

                if ( this.filterAttributeTypes( attr ) )
                    continue;

                if ( attr.getHash ) {
                    hash += attr.getHash();
                } else {
                    hash += attr.getType();
                }
                list.push( attr );
            }
            return hash;
        },

        // get actives texture attribute that comes from state
        getActiveTextureAttributeList: function ( state, list ) {
            var hash = '';
            var attributeMapList = state.textureAttributeMapList;
            var i, l;

            for ( i = 0, l = attributeMapList.length; i < l; i++ ) {
                var attributeMapForUnit = attributeMapList[ i ];
                if ( attributeMapForUnit === undefined ) {
                    continue;
                }
                list[ i ] = [];

                var attributeMapForUnitKeys = attributeMapForUnit.getKeys();

                for ( var j = 0, m = attributeMapForUnitKeys.length; j < m; j++ ) {

                    var key = attributeMapForUnitKeys[ j ];
                    var attributeStack = attributeMapForUnit[ key ];
                    if ( attributeStack.length === 0 ) {
                        continue;
                    }

                    var attr = attributeStack.lastApplied;
                    if ( this.filterAttributeTypes( attr ) )
                        continue;

                    if ( attr.getHash ) {
                        hash += attr.getHash();
                    } else {
                        hash += attr.getType();
                    }
                    list[ i ].push( attr );
                }
            }
            return hash;
        },

        getActiveUniforms: function ( state, attributeList, textureAttributeList ) {

            var uniforms = {};

            for ( var i = 0, l = attributeList.length; i < l; i++ ) {

                var at = attributeList[ i ];
                if ( at.getOrCreateUniforms ) {
                    var attributeUniformMap = at.getOrCreateUniforms();
                    var attributeUniformMapKeys = attributeUniformMap.getKeys();

                    for ( var j = 0, m = attributeUniformMapKeys.length; j < m; j++ ) {
                        var name = attributeUniformMapKeys[ j ];
                        var uniform = attributeUniformMap[ name ];
                        uniforms[ uniform.name ] = uniform;
                    }
                }
            }

            for ( var a = 0, n = textureAttributeList.length; a < n; a++ ) {
                var tat = textureAttributeList[ a ];
                if ( tat !== undefined ) {
                    for ( var b = 0, o = tat.length; b < o; b++ ) {
                        var attr = tat[ b ];

                        var texUniformMap = attr.getOrCreateUniforms( a );
                        var texUniformMapKeys = texUniformMap.getKeys();

                        for ( var t = 0, tl = texUniformMapKeys.length; t < tl; t++ ) {
                            var tname = texUniformMapKeys[ t ];
                            var tuniform = texUniformMap[ tname ];
                            uniforms[ tuniform.name ] = tuniform;
                        }
                    }
                }
            }

            return new Map( uniforms );
        },

        getOrCreateProgram: ( function () {
            // TODO: double check GC impact of this stack
            var textureAttributes = [];
            var attributes = [];

            return function ( state ) {
                // extract valid attributes
                var hash = '';
                attributes.length = 0;
                textureAttributes.length = 0;
                hash += this.getActiveAttributeList( state, attributes );
                hash += this.getActiveTextureAttributeList( state, textureAttributes );

                var cache = this._cache.get( hash );
                if ( cache !== undefined ) {
                    return cache;
                }

                // use ShaderCompiler, it can be overrided by a custom one
                var ShaderCompiler = this._ShaderCompiler;
                var shaderGen = new ShaderCompiler( attributes, textureAttributes, this._shaderProcessor );
                var vertexshader = shaderGen.createVertexShader();
                var fragmentshader = shaderGen.createFragmentShader();

                var program = new Program(
                    new Shader( Shader.VERTEX_SHADER, vertexshader ),
                    new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );

                program.hash = hash;
                program.activeUniforms = this.getActiveUniforms( state, attributes, textureAttributes );
                program.generated = true;

                this._cache.set( hash, program );
                return program;
            };
        } )()
    };

    return ShaderGenerator;
} );
