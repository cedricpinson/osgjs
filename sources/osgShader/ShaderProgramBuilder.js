'use strict';

var Notify = require( 'osg/Notify' );
var Shader = require( 'osg/Shader' );
var Program = require( 'osg/Program' );
var optimizer = require( 'osgShader/optimizer' );
var preProcessor = require( 'osgShader/preProcessor' );

// GLSL Shader & Program manager and build
// Those Three lines Code get repeated a lot, factorized once and for all
// faster compilation and require .(one rrequire instead of two)
// good place to add timeing and post compilation optimizers
// ideally as pre/post hooks callback
// Needed for further advanced optimisation
// where we'll need both VS & FS at once

// helper that encapsulate both shader cleaning
var optimizeShader = function ( shaderSourceText, shaderType, shaderName, doTimeCompilation ) {

    var shaderText = shaderSourceText;
    Notify.info( shaderType + 'shader optimization: ' + shaderName );
    Notify.info( shaderType + 'shader before optimization\n' + shaderText );

    var definesInput = [];

    if ( doTimeCompilation ) console.time( shaderType + ' shaderPreprocess: ' + shaderName );

    var preprocessedShader = preProcessor( shaderText, definesInput );
    shaderText = preprocessedShader;

    if ( doTimeCompilation ) console.timeEnd( shaderType + ' shaderPreprocess: ' + shaderName );

    if ( doTimeCompilation ) console.time( shaderType + ' shaderOptimize: ' + shaderName );

    // TOOO: autoadd on debug=1 url option ?
    //#pragma optimize(off)
    //#pragma debug(on)
    var optShader = optimizer( shaderText );
    shaderText = optShader;

    if ( doTimeCompilation ) console.timeEnd( shaderType + ' shaderOptimize: ' + shaderName );
    Notify.info( shaderType + 'shader after optimization\n' + shaderText );

    return shaderText;
};

var createProgram = function ( vertexShader, fragmentShader, vertexName, fragmentName, programName ) {

    var progName = programName;
    var fragName = fragmentName;

    if ( !fragName ) fragName = fragmentName ? fragmentName : vertexName;
    if ( !progName ) progName = fragName;
    if ( !vertexName || vertexName === '' ) vertexName = progName;

    this._osgShader = this._osgShader || require( 'osgShader/osgShader' );
    var doEnableOptimisation = this._osgShader.enableShaderOptimizer;
    var doTimeCompilation = this._osgShader.enableShaderCompilationTiming;

    var vertexText = vertexShader;
    if ( doEnableOptimisation ) vertexText = optimizeShader( vertexShader, 'vertex', vertexName, doTimeCompilation );
    var vertexShaderObject = new Shader( Shader.VERTEX_SHADER, vertexText, vertexName );

    var fragmentText = fragmentShader;
    if ( doEnableOptimisation ) fragmentText = optimizeShader( fragmentText, 'fragment', fragName, doTimeCompilation );
    var fragmentShaderObject = new Shader( Shader.FRAGMENT_SHADER, fragmentText, fragName );

    var program = new Program( vertexShaderObject, fragmentShaderObject, progName, doTimeCompilation );

    return program;

};

module.exports = {
    createProgram: createProgram
};
