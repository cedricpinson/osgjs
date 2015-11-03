'use strict';
var QUnit = require( 'qunit' );
var Texture = require( 'osg/Texture' );
var WebGLCaps = require( 'osg/WebGLCaps' );


module.exports = function () {

    QUnit.module( 'osg' );

    QUnit.test( 'WebGLCaps', function () {

        var webglCaps = WebGLCaps.instance();

        //var canvas = createCanvas();
        //var gl = canvas.getContext();

        webglCaps.getWebGLExtensions()[ 'OES_texture_float' ] = true;
        webglCaps._checkRTT[ Texture.FLOAT + ',' + Texture.NEAREST ] = true;

        ok( webglCaps.hasFloatRTT(), 'float detect' );
    } );
};
