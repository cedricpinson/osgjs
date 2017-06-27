'use strict';
var ShaderGenerator = require( 'osgShader/ShaderGenerator' );
var ShadowCompiler = require( 'osgShadow/ShadowCastCompiler' );

var ShaderGeneratorShadowCast = function () {

    ShaderGenerator.apply( this, arguments );
    this.setShaderCompiler( ShadowCompiler );

};

ShaderGeneratorShadowCast.prototype = ShaderGenerator.prototype;

module.exports = ShaderGeneratorShadowCast;
