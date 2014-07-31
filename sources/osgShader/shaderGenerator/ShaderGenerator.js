define( [
    'osg/Notify',
    'osg/Program',
    'osg/Shader',
    'osg/Map',
    'osgShader/shaderGenerator/Compiler'
], function ( Notify, Program, Shader, Map, Compiler ) {


    var ShaderGenerator = function () {
        this._cache = {};
    };

    ShaderGenerator.prototype = {

        // scene is needed only for cubemap and environment
        // maybe we could refactore this
        setSceneContext: function ( scene ) {
            this._scene = scene;
        },

        // filter all attribute that comes from osgShader namespace
        getActiveAttributeList: function ( state, list ) {
            var Light =  require(  'osg/Light' );
            var hash = '';
            var attributeMap = state.attributeMap;
            var attributeMapKeys = attributeMap.getKeys();

            for ( var j = 0, k = attributeMapKeys.length; j < k; j++ ) {
                var keya = attributeMapKeys[ j ];
                var attributeStack = attributeMap[ keya ];
                var attr = attributeStack.lastApplied;
                if ( attr.libraryName() !== 'osg' ) {
                    continue;
                }

                // if it's a light and it's not enable we filter it
                if ( attr.typeID === Light.typeID && !attr.isEnable() ) {
                    continue;
                }

                if ( attr.getHash ) {
                    hash += attr.getHash();
                } else {
                    hash += attr.getType();
                }
                list.push( attr );
            }
            return hash;
        },

        // filter all texture attribute that comes from osgShader namespace
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
                    if ( key !== 'Texture' ) {
                        continue;
                    }

                    var attributeStack = attributeMapForUnit[ key ];
                    if ( attributeStack.length === 0 ) {
                        continue;
                    }

                    var attr = attributeStack.lastApplied;
                    if ( attr.libraryName() !== 'osg' ) {
                        continue;
                    }

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
                if ( at.getOrCreateUniforms ){
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

                if ( this._cache[ hash ] !== undefined ) {
                    return this._cache[ hash ];
                }
                var shaderGen = new Compiler( state, attributes, textureAttributes, this._scene );
                var vertexshader = shaderGen.createVertexShader();
                var fragmentshader = shaderGen.createFragmentShader();

                var program = new Program(
                    new Shader( Shader.VERTEX_SHADER, vertexshader ),
                    new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );

                program.hash = hash;
                program.activeUniforms = this.getActiveUniforms( state, attributes, textureAttributes );
                program.generated = true;

                this._cache[ hash ] = program;
                return program;
            };
        } )()
    };

    return ShaderGenerator;
} );
