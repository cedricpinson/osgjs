define( [
    'osg/Notify',
    'osgUtil/DebugHashAttributes'
], function ( Notify, DebugHashAttributes ) {

    var HashUtils = {};

    // Cache hash to string,
    // faster (many "Texture" queries),
    // small memory print in the end
    // and very practical debug usage
    var hashStringCache = new Map();

    var hashKeyCore = function ( hash, bit8 ) {

        /*jshint bitwise: false */

        hash = ( ( hash << 5 ) - hash ) + bit8;
        return hash & hash; // Convert to 32bit integer

        /*jshint bitwise: false */

    };

    // Allow use of int instead of complex, long, allocation
    // of strings
    HashUtils.hashComputeCodeFromString = function ( str ) {

        if ( str === undefined || str.length === 0 ) {
            return 0;
        }

        var cachedHash = hashStringCache.get( str );

        if ( cachedHash !== undefined ) {
            return cachedHash;
        }

        var hash = 0;
        for ( var i = 0; i < str.length; i++ ) {

            hash = hashKeyCore( hash, str.charCodeAt( i ) );

        }

        if ( hash < 0 ) {
            hash = -hash;
        }

        /*develblock:start*/
        // check for hash collision
        // do not remove
        hashStringCache.forEach( function ( value, key ) {
            console.assert( key !== str );
            console.assert( value !== hash );
        } );
        hashStringCache.set( str, hash );
        /*develblock:end*/

        return hash;

    };


    var hashBase = function ( intList, current ) {

        var intAt = 0;
        var hash = 0;

        for ( var i = 0; i < current; i++ ) {

            intAt = intList[ i ];

            /*jshint bitwise: false */

            // 8bit per 8bits of 32 bits
            hash = hashKeyCore( hash, intAt & 0x000000FF );
            intAt = intAt >> 8;
            hash = hashKeyCore( hash, intAt & 0x000000FF );
            intAt = intAt >> 8;
            hash = hashKeyCore( hash, intAt & 0x000000FF );
            intAt = intAt >> 8;
            hash = hashKeyCore( hash, intAt & 0x000000FF );

            /*jshint bitwise: true */

        }

        if ( hash < 0 ) {
            hash = -hash;
        }

        return hash;
    };

    // Perhaps a es2015 weakmap would work here as cache
    // for intlist to hash
    // but now perf impact is near negligible here
    HashUtils.hashComputeCodeFromIntList = function ( intList, current ) {

        if ( intList === undefined || intList.length === 0 || current === 0 ) {
            return 0;
        }

        if ( current === 1 ) {
            return intList[ 0 ];
        }

        var hash = hashBase( intList, current );

        /*develblock:start*/
        DebugHashAttributes.debugHashCollision( intList, current, hash );
        /*develblock:end*/

        return hash;

    };

    return HashUtils;
} );
