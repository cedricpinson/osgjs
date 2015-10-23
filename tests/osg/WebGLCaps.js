define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/Texture',
    'osg/WebGLCaps'
], function ( QUnit, mockup, Texture, WebGLCaps ) {

    'use strict';

    return function () {

        QUnit.module( 'osg' );

        QUnit.test( 'WebGLCaps', function () {

            var webglCaps = WebGLCaps.instance();

            //var canvas = createCanvas();
            //var gl = canvas.getContext();

            webglCaps.getWebGLExtensions()[ 'OES_texture_float' ] = true,
                webglCaps._checkRTT[ Texture.FLOAT + ',' + Texture.NEAREST ] = true;

            ok( webglCaps.hasFloatRTT(), 'float detect' );
        } );
    };
} );
