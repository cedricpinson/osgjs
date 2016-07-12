'use strict';
var osgMath = require( 'osg/Math' );
var config = require( 'config' );

var ArrayType = config.ArrayType;

/** 
 * Vec2 Operations
 * @class
 * @memberof osg
 */
var Vec2 = {
    create: function () {
        var out = new ArrayType( 2 );
        out[ 0 ] = 0.0;
        out[ 1 ] = 0.0;
        return out;
    },

    createAndSet: function ( x, y ) {
        var out = new ArrayType( 2 );
        out[ 0 ] = x;
        out[ 1 ] = y;
        return out;
    },

    copy: function ( a, r ) {
        r[ 0 ] = a[ 0 ];
        r[ 1 ] = a[ 1 ];
        return r;
    },

    set: function ( a, b, r ) {
        r[ 0 ] = a;
        r[ 1 ] = b;
        return r;
    },

    valid: function ( a ) {
        if ( osgMath.isNaN( a[ 0 ] ) ) return false;
        if ( osgMath.isNaN( a[ 1 ] ) ) return false;
        return true;
    },

    mult: function ( a, b, r ) {
        r[ 0 ] = a[ 0 ] * b;
        r[ 1 ] = a[ 1 ] * b;
        return r;
    },

    length2: function ( a ) {
        return a[ 0 ] * a[ 0 ] + a[ 1 ] * a[ 1 ];
    },

    length: function ( a ) {
        return Math.sqrt( a[ 0 ] * a[ 0 ] + a[ 1 ] * a[ 1 ] );
    },

    distance2: function ( a, b ) {
        var x = a[ 0 ] - b[ 0 ];
        var y = a[ 1 ] - b[ 1 ];
        return x * x + y * y;
    },

    distance: function ( a, b ) {
        var x = a[ 0 ] - b[ 0 ];
        var y = a[ 1 ] - b[ 1 ];
        return Math.sqrt( x * x + y * y );
    },

    /**
     *  normalize an Array of 2 elements and write it in r
     *  @method
     *  @memberof osg.Vec2
     */
    normalize: function ( a, r ) {
        var norm = this.length2( a );
        if ( norm > 0.0 ) {
            var inv = 1.0 / Math.sqrt( norm );
            r[ 0 ] = a[ 0 ] * inv;
            r[ 1 ] = a[ 1 ] * inv;
        } else {
            r[ 0 ] = a[ 0 ];
            r[ 1 ] = a[ 1 ];
        }
        return r;
    },

    /**
     * Compute the dot product
     *  @method
     *  @memberof osg.Vec2
     */
    dot: function ( a, b ) {
        return a[ 0 ] * b[ 0 ] + a[ 1 ] * b[ 1 ];
    },

    /**
     * Compute a - b and put the result in r
     *  @method
     *  @memberof osg.Vec2
     */
    sub: function ( a, b, r ) {
        r[ 0 ] = a[ 0 ] - b[ 0 ];
        r[ 1 ] = a[ 1 ] - b[ 1 ];
        return r;
    },

    add: function ( a, b, r ) {
        r[ 0 ] = a[ 0 ] + b[ 0 ];
        r[ 1 ] = a[ 1 ] + b[ 1 ];
        return r;
    },

    neg: function ( a, r ) {
        r[ 0 ] = -a[ 0 ];
        r[ 1 ] = -a[ 1 ];
        return r;
    },

    lerp: function ( t, a, b, r ) {
        var tmp = 1.0 - t;
        r[ 0 ] = a[ 0 ] * tmp + t * b[ 0 ];
        r[ 1 ] = a[ 1 ] * tmp + t * b[ 1 ];
        return r;
    }

};

module.exports = Vec2;
