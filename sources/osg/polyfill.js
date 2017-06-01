'use strict';

// This file contains needed polyfills mainly for IE11

// IE11 does not support Set with constructing arguments. May 2017.
var checkSetSupport = function () {
    var set = new window.Set( [ 'test' ] );
    var hasConstructorParameterSupport = set.has( 'test' );

    if ( !hasConstructorParameterSupport ) {
        var nativeSet = window.Set;
        window.Set = function ( init ) {
            var set = new nativeSet();
            if ( init ) {
                for ( var i = 0; i < init.length; ++i ) {
                    set.add( init[ i ] );
                }
            }
            return set;
        };
    }
};

module.exports = {
    checkSetSupport: checkSetSupport
};
