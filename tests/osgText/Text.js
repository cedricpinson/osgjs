'use strict';
var assert = require( 'chai' ).assert;
var osgText = require( 'osgText/Text' );

module.exports = function () {

    test( 'Text._nextPowerOfTwo', function () {
        var text = new osgText();
        var npot = text._nextPowerOfTwo( 25 );
        assert.isOk( npot === 32, 'next power of two must be 32' );
        npot = text._nextPowerOfTwo( 16 );
        assert.isOk( npot === 16, 'next power of two must be 16' );
        npot = text._nextPowerOfTwo( 129 );
        assert.isOk( npot === 256, 'next power of two must be 256' );
        npot = text._nextPowerOfTwo( 2031 );
        assert.isOk( npot === 2048, 'next power of two must be 256' );
    } );

    test( 'Text.setAlignment', function () {
        var text = new osgText( 'test' );
        text.setAlignment( osgText.LEFT_CENTER );
        // we need to call to draw text as the values are updated next frame, so we emulate it just to test.
        text.drawText();
        assert.isOk( text._context.textAlign === 'left', 'context align should be left' );
        assert.isOk( text._textX === 0, '_textX should be 0' );
        assert.isOk( text._context.textBaseline === 'middle', 'context baseline should be middle' );
        text.setAlignment( 'RIGHT_TOP' );
        text.drawText();
        assert.isOk( text._context.textAlign === 'right', 'context align should be right' );
        assert.isOk( text._textY === 0, '_textY should be 0' );
        assert.isOk( text._context.textBaseline === 'top', 'context baseline should be top' );
    } );
};
