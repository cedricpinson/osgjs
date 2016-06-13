'use strict';
var assert = require( 'chai' ).assert;
var Texture = require( 'osg/Texture' );
var WebGLCaps = require( 'osg/WebGLCaps' );
var mockup = require( 'tests/mockup/mockup' );

module.exports = function () {

    test( 'WebGLCaps', function () {

        var canvas = mockup.createCanvas( true );
        var gl = canvas.getContext();
        var webglCaps = WebGLCaps.instance( gl );

        webglCaps.getWebGLExtensions().OES_texture_float = true;
        webglCaps._checkRTT[ Texture.FLOAT + ',' + Texture.NEAREST ] = true;

        var hFloat = webglCaps.hasFloatRTT( gl );
        assert.isOk( hFloat, 'float detect' );

    } );
};
