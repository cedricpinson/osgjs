'use strict';
var Compiler = require( 'tests/osgShader/Compiler' );
var ShaderGenerator = require( 'tests/osgShader/ShaderGenerator' );

module.exports = function () {
    Compiler();
    ShaderGenerator();
};
