'use strict';
var BufferArray = require( 'osg/BufferArray' );


var BufferArrayProxy = function ( bufferArray ) {

    this._initialBufferArray = undefined;
    this._bufferArray = undefined;
    if ( bufferArray ) {
        this.setBufferArray( bufferArray );
        this.setInitialBufferArray( bufferArray );
    }

};

var prototype = {
    setInitialBufferArray: function ( bufferArray ) {
        this._initialBufferArray = bufferArray;
    },
    getInitialBufferArray: function () {
        return this._initialBufferArray;
    },
    setBufferArray: function ( bufferArray ) {
        this._bufferArray = bufferArray.getBufferArray ? bufferArray.getBufferArray() : bufferArray;
    },
    getBufferArray: function () {
        return this._bufferArray;
    }
};

// adds original method of BufferArray prototype for the proxy for convenient usage
var makeFunc = function ( func ) {
    return function () {
        return func.apply( this._bufferArray, arguments );
    };
};

for ( var methodName in BufferArray.prototype ) {
    prototype[ methodName ] = makeFunc( BufferArray.prototype[ methodName ] );
}

BufferArrayProxy.prototype = prototype;
module.exports = BufferArrayProxy;
