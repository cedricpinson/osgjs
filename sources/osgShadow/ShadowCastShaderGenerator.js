define( [
    'osgShader/ShaderGenerator',
    'osgShadow/ShadowCastCompiler'
], function ( ShaderGenerator, ShadowCompiler ) {
    'use strict';

    var ShaderGeneratorShadowCast = function () {

        ShaderGenerator.apply( this, arguments );
        this.setShaderCompiler( ShadowCompiler );
        // only one attribute makes change to the compilation
        // ignore all others
        this._acceptAttributeTypes = new window.Set( [ 'ShadowCast', 'Skinning', 'Morph' ] );

    };

    ShaderGeneratorShadowCast.prototype = ShaderGenerator.prototype;

    return ShaderGeneratorShadowCast;
} );
