define( [
    'osgShader/ShaderGenerator'

], function ( ShaderGenerator ) {
    'use strict';

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
        this._current = this._generators[ 'default' ];

        return this;
    };

    ShaderGeneratorProxy.prototype = {
        getShaderGenerator: function ( name ) {
            if ( !name ) name = 'default';
            return this._generators[ name ];
        },
        // user-space facility to provide its own
        addShaderGenerator: function ( sg, name ) {
            this._generators[ name ] = sg;
        },
        setDefaultShaderGenerator: function ( name ) {
            if ( !name ) return;
            this._generators[ 'default' ] = this._generators[ name ];
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
        },
        dispose: function () {
            this._generators = null;
            this._current.dispose();
            this._current = null;
            ShaderGeneratorProxy.instance = null;
        }
    };

    return ShaderGeneratorProxy;
} );
