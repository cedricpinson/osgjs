define( [
    'osg/Notify',
    'osg/Program',
    'osg/Shader',
    'osg/Map'
], function ( Notify, Program, Shader, Map ) {

    var ShaderGenerator = function () {
        this.cache = [];
    };

    ShaderGenerator.Type = {
        VertexInit: 0,
        VertexFunction: 1,
        VertexMain: 2,
        VertexEnd: 3,
        FragmentInit: 5,
        FragmentFunction: 6,
        FragmentMain: 7,
        FragmentEnd: 8
    };

    ShaderGenerator.prototype = {

        getActiveTypeMember: function ( state ) {
            // we should check attribute is active or not
            var types = [];
            var attributeMapKeys = state.attributeMap.getKeys();
            var attributeMap = state.attributeMap;
            for ( var j = 0, k = attributeMapKeys.length; j < k; j++ ) {
                var keya = attributeMapKeys[ j ];
                var attributeStack = attributeMap[ keya ];
                if ( attributeStack.length === 0 && attributeStack.globalDefault.applyPositionedUniform === undefined ) {
                    continue;
                }
                if ( attributeStack.globalDefault.getOrCreateUniforms !== undefined || attributeStack.globalDefault.writeToShader !== undefined ) {
                    types.push( keya );
                }
            }

            for ( var i = 0, l = state.textureAttributeMapList.length; i < l; i++ ) {
                var attributesForUnit = state.textureAttributeMapList[ i ];
                if ( attributesForUnit === undefined ) {
                    continue;
                }

                var textureAttributeMapKeys = attributesForUnit.getKeys();
                var textureAttributeMap = attributesForUnit;

                for ( var h = 0, m = textureAttributeMapKeys.length; h < m; h++ ) {
                    var key = textureAttributeMapKeys[ h ];
                    var textureAttributeStack = textureAttributeMap[ key ];
                    if ( textureAttributeStack.length === 0 ) {
                        continue;
                    }
                    if ( textureAttributeStack.globalDefault.getOrCreateUniforms !== undefined || textureAttributeStack.globalDefault.writeToShader !== undefined ) {
                        types.push( key + i );
                    }
                }
            }
            return types;
        },

        getActiveAttributeMapKeys: function ( state ) {
            var keys = [];
            var attributeMapKeys = state.attributeMap.getKeys();
            var attributeMap = state.attributeMap;

            for ( var j = 0, k = attributeMapKeys.length; j < k; j++ ) {
                var keya = attributeMapKeys[ j ];
                var attributeStack = attributeMap[ keya ];
                if ( attributeStack.length === 0 && attributeStack.globalDefault.applyPositionedUniform === undefined ) {
                    continue;
                }
                if ( attributeStack.globalDefault.getOrCreateUniforms !== undefined || attributeStack.globalDefault.writeToShader !== undefined ) {
                    keys.push( keya );
                }
            }
            return keys;
        },

        getActiveTextureAttributeMapKeys: function ( state ) {
            var textureAttributeKeys = [];
            for ( var i = 0, l = state.textureAttributeMapList.length; i < l; i++ ) {
                var attributesForUnit = state.textureAttributeMapList[ i ];
                if ( attributesForUnit === undefined ) {
                    continue;
                }

                var textureAttributeMapKeys = attributesForUnit.getKeys();
                var textureAttributeMap = attributesForUnit;

                textureAttributeKeys[ i ] = [];
                for ( var j = 0, m = textureAttributeMapKeys.length; j < m; j++ ) {
                    var key = textureAttributeMapKeys[ j ];
                    var textureAttributeStack = textureAttributeMap[ key ];
                    if ( textureAttributeStack.length === 0 ) {
                        continue;
                    }
                    if ( textureAttributeStack.globalDefault.getOrCreateUniforms !== undefined || textureAttributeStack.globalDefault.writeToShader !== undefined ) {
                        textureAttributeKeys[ i ].push( key );
                    }
                }
            }
            return textureAttributeKeys;
        },

        // getActiveUniforms
        // return the list of uniforms enabled from the State
        // The idea behind this is to generate a shader depending on attributes/uniforms enabled by the user
        getActiveUniforms: function ( state, attributeKeys, textureAttributeKeys ) {

            var uniformMap = new Map();
            var attributeMap = state.attributeMap;

            for ( var i = 0, l = attributeKeys.length; i < l; i++ ) {
                var key = attributeKeys[ i ];

                if ( attributeMap[ key ].globalDefault.getOrCreateUniforms === undefined ) {
                    continue;
                }
                var attributeUniforms = attributeMap[ key ].globalDefault.getOrCreateUniforms();

                var attributeUniformKeys = attributeUniforms.getKeys();
                for ( var j = 0, m = attributeUniformKeys.length; j < m; j++ ) {
                    var name = attributeUniformKeys[ j ];
                    var uniform = attributeUniforms[ name ];
                    uniformMap[ uniform.name ] = uniform;
                }
            }

            for ( var a = 0, n = textureAttributeKeys.length; a < n; a++ ) {
                var unitAttributekeys = textureAttributeKeys[ a ];
                if ( unitAttributekeys === undefined ) {
                    continue;
                }
                for ( var b = 0, o = unitAttributekeys.length; b < o; b++ ) {
                    var attrName = unitAttributekeys[ b ];
                    //if (state.textureAttributeMapList[a][attrName].globalDefault === undefined) {
                    //debugger;
                    //}
                    var textureAttribute = state.textureAttributeMapList[ a ][ attrName ].globalDefault;
                    if ( textureAttribute.getOrCreateUniforms === undefined ) {
                        continue;
                    }
                    var texUniformMap = textureAttribute.getOrCreateUniforms( a );
                    var texUniformMapKeys = texUniformMap.getKeys();
                    for ( var t = 0, tl = texUniformMapKeys.length; t < tl; t++ ) {
                        var tname = texUniformMapKeys[ t ];
                        var tuniform = texUniformMap[ tname ];
                        uniformMap[ tuniform.name ] = tuniform;
                    }
                }
            }

            uniformMap.dirty();
            return uniformMap;
        },

        getOrCreateProgram: function ( state ) {

            // first get trace of active attribute and texture attributes to check
            // if we already have generated a program for this configuration
            var flattenKeys = this.getActiveTypeMember( state );
            for ( var i = 0, l = this.cache.length; i < l; ++i ) {
                if ( this.compareAttributeMap( flattenKeys, this.cache[ i ].flattenKeys ) === 0 ) {
                    return this.cache[ i ];
                }
            }

            // extract valid attributes keys with more details
            var attributeKeys = this.getActiveAttributeMapKeys( state );
            var textureAttributeKeys = this.getActiveTextureAttributeMapKeys( state );


            var vertexshader = this.getOrCreateVertexShader( state, attributeKeys, textureAttributeKeys );
            var fragmentshader = this.getOrCreateFragmentShader( state, attributeKeys, textureAttributeKeys );
            var program = new Program(
                new Shader( 'VERTEX_SHADER', vertexshader ),
                new Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            program.flattenKeys = flattenKeys;
            program.activeAttributeKeys = attributeKeys;
            program.activeTextureAttributeKeys = textureAttributeKeys;
            program.activeUniforms = this.getActiveUniforms( state, attributeKeys, textureAttributeKeys );
            program.generated = true;

            Notify.debug( program.vertex.text );
            Notify.debug( program.fragment.text );

            this.cache.push( program );
            return program;
        },

        compareAttributeMap: function ( attributeKeys0, attributeKeys1 ) {
            var key;
            for ( var i = 0, l = attributeKeys0.length; i < l; i++ ) {
                key = attributeKeys0[ i ];
                if ( attributeKeys1.indexOf( key ) === -1 ) {
                    return 1;
                }
            }
            if ( attributeKeys1.length !== attributeKeys0.length ) {
                return -1;
            }
            return 0;
        },

        fillTextureShader: function ( attributeMapList, validTextureAttributeKeys, mode ) {
            var shader = '';
            var commonTypeShader = {};

            for ( var i = 0, l = validTextureAttributeKeys.length; i < l; i++ ) {
                var attributeKeys = validTextureAttributeKeys[ i ];
                if ( attributeKeys === undefined ) {
                    continue;
                }
                var attributeMap = attributeMapList[ i ];
                for ( var j = 0, m = attributeKeys.length; j < m; j++ ) {
                    var key = attributeKeys[ j ];

                    var element = attributeMap[ key ].globalDefault;

                    if ( element.generateShaderCommon !== undefined && commonTypeShader[ key ] === undefined ) {
                        shader += element.generateShaderCommon( i, mode );
                        commonTypeShader[ key ] = true;
                    }

                    if ( element.generateShader ) {
                        shader += element.generateShader( i, mode );
                    }
                }
            }
            return shader;
        },

        fillShader: function ( attributeMap, validAttributeKeys, mode ) {
            var shader = '';
            var commonTypeShader = {};

            for ( var j = 0, m = validAttributeKeys.length; j < m; j++ ) {
                var key = validAttributeKeys[ j ];
                var element = attributeMap[ key ].globalDefault;
                var type = element.getType();
                if ( element.generateShaderCommon !== undefined && commonTypeShader[ type ] === undefined ) {
                    shader += element.generateShaderCommon( mode );
                    commonTypeShader[ type ] = true;
                }

                if ( element.generateShader ) {
                    shader += element.generateShader( mode );
                }
            }
            return shader;
        },

        getOrCreateVertexShader: function ( state, validAttributeKeys, validTextureAttributeKeys ) {

            var modes = ShaderGenerator.Type;
            var shader = [
                '',
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'attribute vec3 Vertex;',
                'attribute vec4 Color;',
                'attribute vec3 Normal;',
                'uniform float ArrayColorEnabled;',
                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',
                'uniform mat4 NormalMatrix;',
                'varying vec4 VertexColor;',
                ''
            ].join( '\n' );

            shader += this._writeShaderFromMode( state, validAttributeKeys, validTextureAttributeKeys, modes.VertexInit );

            var func = [
                '',
                'vec4 ftransform() {',
                '  return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
                '}'
            ].join( '\n' );

            shader += func;

            shader += this._writeShaderFromMode( state, validAttributeKeys, validTextureAttributeKeys, modes.VertexFunction );

            var body = [
                '',
                'void main(void) {',
                '  gl_Position = ftransform();',
                '  if (ArrayColorEnabled == 1.0)',
                '    VertexColor = Color;',
                '  else',
                '    VertexColor = vec4(1.0,1.0,1.0,1.0);',
                '  gl_PointSize = 1.0;',
                ''
            ].join( '\n' );

            shader += body;

            shader += this._writeShaderFromMode( state, validAttributeKeys, validTextureAttributeKeys, modes.VertexMain );

            shader += [
                '}',
                ''
            ].join( '\n' );

            return shader;
        },

        _writeShaderFromMode: function ( state, validAttributeKeys, validTextureAttributeKeys, mode ) {
            var str = '';
            str += this.fillTextureShader( state.textureAttributeMapList, validTextureAttributeKeys, mode );
            str += this.fillShader( state.attributeMap, validAttributeKeys, mode );
            return str;
        },

        getOrCreateFragmentShader: function ( state, validAttributeKeys, validTextureAttributeKeys ) {

            var shader = [
                '',
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'varying vec4 VertexColor;',
                'uniform float ArrayColorEnabled;',
                'vec4 fragColor;',
                ''
            ].join( '\n' );

            var modes = ShaderGenerator.Type;

            shader += this._writeShaderFromMode( state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentInit );

            shader += this._writeShaderFromMode( state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentFunction );

            shader += [
                'void main(void) {',
                '  fragColor = VertexColor;',
                ''
            ].join( '\n' );

            shader += this._writeShaderFromMode( state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentMain );

            shader += this._writeShaderFromMode( state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentEnd );

            shader += [
                '',
                '  gl_FragColor = fragColor;',
                '}'
            ].join( '\n' );

            return shader;
        }
    };

    return ShaderGenerator;
} );
