define( [
    'osgShader/ShaderGenerator'

], function ( ShaderGenerator ) {
    'use strict';

    var ShaderGeneratorProxy = function () {

        // object of shader generators
        this._generators = new Map();
        this.addShaderGenerator( 'default', new ShaderGenerator() );

        return this;
    };

    ShaderGeneratorProxy.prototype = {

        getShaderGenerator: function ( name ) {

            if ( !name )
                return this._generators.get( 'default' );

            return this._generators.get( name );
        },

        // user-space facility to provide its own
        addShaderGenerator: function ( name, sg ) {

            this._generators.set( name, sg );

        }

    };

    return ShaderGeneratorProxy;
} );
