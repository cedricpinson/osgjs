'use strict';

// This file contains needed polyfills mainly for IE11

// IE11 does not support Set with constructing arguments. May 2017.
var checkSetSupport = function () {
    var setTest = new window.Set( [ 'test' ] );
    var hasConstructorParameterSupport = setTest.has( 'test' );

    if ( !hasConstructorParameterSupport ) {
        var nativeSetConstructor = window.Set;
        window.Set = function ( init ) {
            var set = new nativeSetConstructor();
            if ( init ) {
                for ( var i = 0; i < init.length; ++i ) {
                    set.add( init[ i ] );
                }
            }
            return set;
        };
    }
};

checkSetSupport();

var checkTypedArraySlice = function () {
    if ( !Float32Array.prototype.slice ) {
        var slicePolyfill = function ( start, end ) {
            return new this.constructor( this.subarray( start, end ) );
        };

        Int8Array.prototype.slice = slicePolyfill;
        Uint8Array.prototype.slice = slicePolyfill;
        Uint8ClampedArray.prototype.slice = slicePolyfill;
        Int16Array.prototype.slice = slicePolyfill;
        Uint16Array.prototype.slice = slicePolyfill;
        Int32Array.prototype.slice = slicePolyfill;
        Uint32Array.prototype.slice = slicePolyfill;
        Float32Array.prototype.slice = slicePolyfill;
        Float64Array.prototype.slice = slicePolyfill;
    }
};

checkTypedArraySlice();
