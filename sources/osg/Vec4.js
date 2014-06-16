define( [], function () {

    /** @class Vec4 Operations */
    var Vec4 = {

        create: function () {
            return [ 0.0, 0.0, 0.0, 0.0 ];
        },

        init: function ( a ) {
            a[ 0 ] = 0.0;
            a[ 1 ] = 0.0;
            a[ 2 ] = 0.0;
            a[ 3 ] = 0.0;
            return a;
        },

        dot: function ( a, b ) {
            return a[ 0 ] * b[ 0 ] + a[ 1 ] * b[ 1 ] + a[ 2 ] * b[ 2 ] + a[ 3 ] * b[ 3 ];
        },

        copy: function ( a, r ) {
            r[ 0 ] = a[ 0 ];
            r[ 1 ] = a[ 1 ];
            r[ 2 ] = a[ 2 ];
            r[ 3 ] = a[ 3 ];
            return r;
        },

        sub: function ( a, b, r ) {
            r[ 0 ] = a[ 0 ] - b[ 0 ];
            r[ 1 ] = a[ 1 ] - b[ 1 ];
            r[ 2 ] = a[ 2 ] - b[ 2 ];
            r[ 3 ] = a[ 3 ] - b[ 3 ];
            return r;
        },

        mult: function ( a, b, r ) {
            r[ 0 ] = a[ 0 ] * b;
            r[ 1 ] = a[ 1 ] * b;
            r[ 2 ] = a[ 2 ] * b;
            r[ 3 ] = a[ 3 ] * b;
            return r;
        },

        add: function ( a, b, r ) {
            r[ 0 ] = a[ 0 ] + b[ 0 ];
            r[ 1 ] = a[ 1 ] + b[ 1 ];
            r[ 2 ] = a[ 2 ] + b[ 2 ];
            r[ 3 ] = a[ 3 ] + b[ 3 ];
            return r;
        },

        neg: function ( a, r ) {
            r[ 0 ] = -a[ 0 ];
            r[ 1 ] = -a[ 1 ];
            r[ 2 ] = -a[ 2 ];
            r[ 3 ] = -a[ 3 ];
            return r;
        },

        lerp: function ( t, a, b, r ) {
            var tmp = 1.0 - t;
            r[ 0 ] = a[ 0 ] * tmp + t * b[ 0 ];
            r[ 1 ] = a[ 1 ] * tmp + t * b[ 1 ];
            r[ 2 ] = a[ 2 ] * tmp + t * b[ 2 ];
            r[ 3 ] = a[ 3 ] * tmp + t * b[ 3 ];
            return r;
        }
    };

    return Vec4;
} );
