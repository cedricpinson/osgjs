/*global define */

define( [
    'osg/Utils',
    'osgShader/ShaderGenerator',
    'osgShader/shaderGenerator/ShaderGeneratorShadeless',
    'osgShader/shaderGenerator/ShaderGeneratorOutputLog'
], function ( MACROUTILS, ShaderGenerator, ShaderGeneratorShadeless, ShaderGeneratorOutputLog ) {


    var ShaderGeneratorProxy = function ( createInstance ) {
        if ( !createInstance ) {
            if ( ShaderGeneratorProxy.instance ) {
                return ShaderGeneratorProxy.instance;
            }
            ShaderGeneratorProxy.instance = this;
        }
        // object of shader generators
        this._generators = {};
        this.addShaderGenerator( new ShaderGenerator(), 'default' );
        this.addShaderGenerator( new ShaderGeneratorShadeless(), 'shadeless' );
        this.addShaderGenerator( new ShaderGeneratorOutputLog(), 'outputlog' );
        this._current = this._generators[ 'default' ];
        return this;
    };

    ShaderGeneratorProxy.prototype = {
        getShaderGenerator: function ( name ) {
            return this._generators[ name ];
        },
        addShaderGenerator: function ( sg, name ) {
            this._generators[ name ] = sg;
        },
        setShaderGenerator: function ( name ) {
            var generator = this._generators[ name ];
            this._current = generator ? generator : this._generators[ 'default' ];
        },
        setSceneContext: function ( scene ) {
            this._current.setSceneContext( scene );
        },
        getOrCreateProgram: function ( state ) {
            return this._current.getOrCreateProgram( state );
        }
    };

    return ShaderGeneratorProxy;
} );
