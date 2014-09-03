define( [], function () {

    /** @class Vec3 Operations */
    var Vec3 = {

        create: function () {
            return [ 0.0, 0.0, 0.0 ];
        },

        init: function ( a ) {
            a[ 0 ] = 0.0;
            a[ 1 ] = 0.0;
            a[ 2 ] = 0.0;
            return a;
        },

        copy: function ( a, r ) {
            r[ 0 ] = a[ 0 ];
            r[ 1 ] = a[ 1 ];
            r[ 2 ] = a[ 2 ];
            return r;
        },

        cross: function ( a, b, r ) {
            var x = a[ 1 ] * b[ 2 ] - a[ 2 ] * b[ 1 ];
            var y = a[ 2 ] * b[ 0 ] - a[ 0 ] * b[ 2 ];
            var z = a[ 0 ] * b[ 1 ] - a[ 1 ] * b[ 0 ];
            r[ 0 ] = x;
            r[ 1 ] = y;
            r[ 2 ] = z;
            return r;
        },

        valid: function ( a ) {
            if ( isNaN( a[ 0 ] ) ) {
                return false;
            }
            if ( isNaN( a[ 1 ] ) ) {
                return false;
            }
            if ( isNaN( a[ 2 ] ) ) {
                return false;
            }
            return true;
        },

        mult: function ( a, b, r ) {
            r[ 0 ] = a[ 0 ] * b;
            r[ 1 ] = a[ 1 ] * b;
            r[ 2 ] = a[ 2 ] * b;
            return r;
        },

        length2: function ( a ) {
            return a[ 0 ] * a[ 0 ] + a[ 1 ] * a[ 1 ] + a[ 2 ] * a[ 2 ];
        },

        length: function ( a ) {
            return Math.sqrt( a[ 0 ] * a[ 0 ] + a[ 1 ] * a[ 1 ] + a[ 2 ] * a[ 2 ] );
        },

        distance2: function ( a, b ) {
            var x = a[ 0 ] - b[ 0 ];
            var y = a[ 1 ] - b[ 1 ];
            var z = a[ 2 ] - b[ 2 ];
            return x * x + y * y + z * z;
        },

        distance: function ( a, b ) {
            var x = a[ 0 ] - b[ 0 ];
            var y = a[ 1 ] - b[ 1 ];
            var z = a[ 2 ] - b[ 2 ];
            return Math.sqrt( x * x + y * y + z * z );
        },

        normalize: function ( a, r ) {
            var norm = this.length2( a );
            if ( norm > 0.0 ) {
                var inv = 1.0 / Math.sqrt( norm );
                r[ 0 ] = a[ 0 ] * inv;
                r[ 1 ] = a[ 1 ] * inv;
                r[ 2 ] = a[ 2 ] * inv;
            } else {
                r[ 0 ] = a[ 0 ];
                r[ 1 ] = a[ 1 ];
                r[ 2 ] = a[ 2 ];
            }
            return r;
        },

        dot: function ( a, b ) {
            return a[ 0 ] * b[ 0 ] + a[ 1 ] * b[ 1 ] + a[ 2 ] * b[ 2 ];
        },

        sub: function ( a, b, r ) {
            r[ 0 ] = a[ 0 ] - b[ 0 ];
            r[ 1 ] = a[ 1 ] - b[ 1 ];
            r[ 2 ] = a[ 2 ] - b[ 2 ];
            return r;
        },

        add: function ( a, b, r ) {
            r[ 0 ] = a[ 0 ] + b[ 0 ];
            r[ 1 ] = a[ 1 ] + b[ 1 ];
            r[ 2 ] = a[ 2 ] + b[ 2 ];
            return r;
        },

        neg: function ( a, r ) {
            r[ 0 ] = -a[ 0 ];
            r[ 1 ] = -a[ 1 ];
            r[ 2 ] = -a[ 2 ];
            return r;
        },

        lerp: function ( t, a, b, r ) {
            r[ 0 ] = a[ 0 ] + ( b[ 0 ] - a[ 0 ] ) * t;
            r[ 1 ] = a[ 1 ] + ( b[ 1 ] - a[ 1 ] ) * t;
            r[ 2 ] = a[ 2 ] + ( b[ 2 ] - a[ 2 ] ) * t;
            return r;
        }

    };

    return Vec3;
} );
