'use strict';
var QUnit = require( 'qunit' );
var Texture = require( 'osg/Texture' );
var WebGLCaps = require( 'osg/WebGLCaps' );
var mockup = require( 'tests/mockup/mockup' );

module.exports = function () {

    QUnit.module( 'osg' );

    QUnit.test( 'WebGLCaps', function () {


        var canvas = mockup.createCanvas( true );
        var gl = canvas.getContext();
        var webglCaps = WebGLCaps.instance( gl );

        webglCaps.getWebGLExtensions()[ 'OES_texture_float' ] = true;
        console.log( 'Texture' + Texture.FLOAT + ',' + Texture.NEAREST );
        webglCaps._checkRTT[ Texture.FLOAT + ',' + Texture.NEAREST ] = true;

        ok( webglCaps.hasFloatRTT(), 'float detect' );
    } );
};
