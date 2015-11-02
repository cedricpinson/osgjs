'use strict';
var QUnit = require( 'qunit' );
var BufferArrayProxy = require( 'osg/BufferArrayProxy' );
var BufferArray = require( 'osg/BufferArray' );


module.exports = function () {

    QUnit.module( 'osg' );

    QUnit.test( 'BufferArrayProxy', function () {

        ( function () {
            var bufferArrayA = new BufferArray();
            var bufferArrayB = new BufferArray();

            var bufferArrayProxyA = new BufferArrayProxy( bufferArrayA );
            var bufferArrayProxyB = new BufferArrayProxy( bufferArrayB );

            bufferArrayProxyA.setBufferArray( bufferArrayB );
            bufferArrayProxyB.setBufferArray( bufferArrayA );

            equal( bufferArrayProxyA.getInstanceID(), bufferArrayB.getInstanceID(), 'check proxyA use B' );
            equal( bufferArrayProxyB.getInstanceID(), bufferArrayA.getInstanceID(), 'check proxyB use A' );
            equal( bufferArrayProxyA.getInitialBufferArray().getInstanceID(), bufferArrayA.getInstanceID(), 'check initial buffer' );

            bufferArrayProxyA.setBufferArray( bufferArrayProxyB );
            equal( bufferArrayProxyA.getInstanceID(), bufferArrayProxyB.getBufferArray().getInstanceID(), 'check proxy with proxy' );


        } )();
    } );
};
