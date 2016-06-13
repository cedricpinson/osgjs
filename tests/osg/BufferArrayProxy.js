'use strict';
var assert = require( 'chai' ).assert;
var BufferArrayProxy = require( 'osg/BufferArrayProxy' );
var BufferArray = require( 'osg/BufferArray' );


module.exports = function () {

    test( 'BufferArrayProxy', function () {

        ( function () {
            var bufferArrayA = new BufferArray();
            var bufferArrayB = new BufferArray();

            var bufferArrayProxyA = new BufferArrayProxy( bufferArrayA );
            var bufferArrayProxyB = new BufferArrayProxy( bufferArrayB );

            bufferArrayProxyA.setBufferArray( bufferArrayB );
            bufferArrayProxyB.setBufferArray( bufferArrayA );

            assert.equal( bufferArrayProxyA.getInstanceID(), bufferArrayB.getInstanceID(), 'check proxyA use B' );
            assert.equal( bufferArrayProxyB.getInstanceID(), bufferArrayA.getInstanceID(), 'check proxyB use A' );
            assert.equal( bufferArrayProxyA.getInitialBufferArray().getInstanceID(), bufferArrayA.getInstanceID(), 'check initial buffer' );

            bufferArrayProxyA.setBufferArray( bufferArrayProxyB );
            assert.equal( bufferArrayProxyA.getInstanceID(), bufferArrayProxyB.getBufferArray().getInstanceID(), 'check proxy with proxy' );


        } )();
    } );
};
