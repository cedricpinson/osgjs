define( [
    'qunit',
    'osgText/Text'
], function ( QUnit, Text ) {

    'use strict';

    return function () {
        QUnit.module( 'osgText' );

        QUnit.test( 'Text._nextPowerOfTwo', function () {
            var text = new Text();
            var npot = text._nextPowerOfTwo( 25 );
            ok( npot === 32, 'next power of two must be 32' );
            npot = text._nextPowerOfTwo( 16 );
            ok( npot === 16, 'next power of two must be 16' );
            npot = text._nextPowerOfTwo( 129 );
            ok( npot === 256, 'next power of two must be 256' );
            var npot = text._nextPowerOfTwo( 2031 );
            ok( npot === 2048, 'next power of two must be 256' );
        } );

        QUnit.test( 'Text.setAlignment', function () {
            var text = new Text( 'test' );
            text.setAlignment( Text.LEFT_CENTER );
            // we need to call to draw text as the values are updated next frame, so we emulate it just to test.
            text.drawText();
            ok( text._context.textAlign === 'left', 'context align should be left' );
            ok( text._textX === 0, '_textX should be 0' );
            ok( text._context.textBaseline === 'middle', 'context baseline should be middle' );
            text.setAlignment( 'RIGHT_TOP' );
            text.drawText();
            ok( text._context.textAlign === 'right', 'context align should be right' );
            ok( text._textY === 0, '_textY should be 0' );
            ok( text._context.textBaseline === 'top', 'context baseline should be top' );
        } );
    };
} );
    