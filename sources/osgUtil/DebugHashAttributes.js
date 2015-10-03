'use strict';

/*develblock:start*/
var Notify = require( 'osg/Notify' );


var DebugHashAttributes = {};

DebugHashAttributes.debugDirtyAttributes = function ( attr ) {
    var Hash = require( 'osg/Hash' );
    console.assert( attr.getHash() === Hash.hashComputeCodeFromString( attr.getHashString() ) );
};

// check for collision on attributes
// if oneday we get strange shader used incorrectly for
// more than one material, you'd want to check here first
DebugHashAttributes.debugHashCollisionString = function ( str, hash, hashStringCache ) {

    // check for hash collision
    // do not remove
    hashStringCache.forEach( function ( value, key ) {
        Notify.assert( value !== hash );
        Notify.assert( key !== str );
    } );

};



// check for collision on shader generated from list of attributes
// if oneday we get strange shader used incorrectly for
// more than one material, you'd want to check here first
var hashIntListCache = new window.Map();

DebugHashAttributes.debugHashCollisionIntList = function ( intList, current, hash ) {

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



module.exports = DebugHashAttributes;
/*develblock:end*/
