define( [
    'osg/Notify'
], function ( Notify ) {
    'use strict';

    /*develblock:start*/

    var DebugHashAttributes = {};

    DebugHashAttributes.debugDirtyAttributes = function ( attr ) {
        var Hash = require( 'osg/Hash' );
        console.assert( attr.getHash() === Hash.hashComputeCodeFromString( attr.getHashString() ) );
    };



    // check for collision
    // if oneday we get strange shader used incorrectly for
    // more than one material, you'd want to check here first
    var hashIntListCache = new Map();

    DebugHashAttributes.debugHashCollision = function ( intList, current, hash ) {

        // check for hash collision
        var str = '';
        for ( var i = 0; i < current; i++ ) {
            str += intList[ i ].toString();
        }
        var cachedHash = hashIntListCache.get( str );
        if ( cachedHash === undefined ) {
            hashIntListCache.forEach( function ( value, key ) {
                console.assert( key !== str );
                console.assert( value !== hash );
            } );
            hashIntListCache.set( str, hash );
        }


        return hash;

    };



    return DebugHashAttributes;
    /*develblock:end*/
} );
