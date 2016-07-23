'use strict';

var shake = require( 'glsl-token-function-shaker' );
var stringify = require( 'glsl-token-string' );
var tokenize = require( 'glsl-tokenizer' );

var shaderOptimizer = function ( sourceCode /*, defines, extensions*/ ) {

    var tokens = tokenize( sourceCode );

    // https://www.npmjs.com/package/glsl-token-function-shaker#shaketokens-options
    shake( tokens, {} );

    //unusedPrune( tokens );
    var output = stringify( tokens );

    return output;
};

module.exports = shaderOptimizer;
