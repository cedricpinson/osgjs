define( [
    'osg/Notify',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Quat'
], function ( Notify, Vec3, Vec4, Quat ) {

    /** @class Matrix Operations */
    var Matrix = {
        _tmp0: [],
        _tmp1: [],

        valid: function ( matrix ) {
            for ( var i = 0; i < 16; i++ ) {
                if ( isNaN( matrix[ i ] ) ) {
                    return false;
                }
            }
            return true;
        },
        setRow: function ( matrix, row, v0, v1, v2, v3 ) {
            var rowIndex = row * 4;
            matrix[ rowIndex + 0 ] = v0;
            matrix[ rowIndex + 1 ] = v1;
            matrix[ rowIndex + 2 ] = v2;
            matrix[ rowIndex + 3 ] = v3;
        },
        innerProduct: function ( a, b, r, c ) {
            var rIndex = r * 4;
            return ( ( a[ rIndex + 0 ] * b[ 0 + c ] ) + ( a[ rIndex + 1 ] * b[ 4 + c ] ) + ( a[ rIndex + 2 ] * b[ 8 + c ] ) + ( a[ rIndex + 3 ] * b[ 12 + c ] ) );
        },

        set: function ( matrix, row, col, value ) {
            matrix[ row * 4 + col ] = value;
            return value;
        },

        get: function ( matrix, row, col ) {
            return matrix[ row * 4 + col ];
        },

        makeIdentity: function ( matrix ) {
            if ( matrix === undefined ) {
                matrix = [];
                Notify.log( 'Matrix.makeIdentity without matrix destination is deprecated' );
            }
            Matrix.setRow( matrix, 0, 1.0, 0.0, 0.0, 0.0 );
            Matrix.setRow( matrix, 1, 0.0, 1.0, 0.0, 0.0 );
            Matrix.setRow( matrix, 2, 0.0, 0.0, 1.0, 0.0 );
            Matrix.setRow( matrix, 3, 0.0, 0.0, 0.0, 1.0 );
            return matrix;
        },

        /**
         * @param {Number} x position
         * @param {Number} y position
         * @param {Number} z position
         * @param {Array} matrix to write result
         */
        makeTranslate: function ( x, y, z, matrix ) {
            if ( matrix === undefined ) {
                matrix = [];
            }
            Matrix.setRow( matrix, 0, 1.0, 0.0, 0.0, 0.0 );
            Matrix.setRow( matrix, 1, 0.0, 1.0, 0.0, 0.0 );
            Matrix.setRow( matrix, 2, 0.0, 0.0, 1.0, 0.0 );
            Matrix.setRow( matrix, 3, x, y, z, 1.0 );
            return matrix;
        },

        setTrans: function ( matrix, x, y, z ) {
            matrix[ 12 ] = x;
            matrix[ 13 ] = y;
            matrix[ 14 ] = z;
            return matrix;
        },

        getTrans: function ( matrix, result ) {
            result[ 0 ] = matrix[ 12 ];
            result[ 1 ] = matrix[ 13 ];
            result[ 2 ] = matrix[ 14 ];
            return result;
        },

        // do a * b and result in a
        preMult: function ( a, b ) {
            var atmp0, atmp1, atmp2, atmp3;

            atmp0 = ( b[ 0 ] * a[ 0 ] ) + ( b[ 1 ] * a[ 4 ] ) + ( b[ 2 ] * a[ 8 ] ) + ( b[ 3 ] * a[ 12 ] );
            atmp1 = ( b[ 4 ] * a[ 0 ] ) + ( b[ 5 ] * a[ 4 ] ) + ( b[ 6 ] * a[ 8 ] ) + ( b[ 7 ] * a[ 12 ] );
            atmp2 = ( b[ 8 ] * a[ 0 ] ) + ( b[ 9 ] * a[ 4 ] ) + ( b[ 10 ] * a[ 8 ] ) + ( b[ 11 ] * a[ 12 ] );
            atmp3 = ( b[ 12 ] * a[ 0 ] ) + ( b[ 13 ] * a[ 4 ] ) + ( b[ 14 ] * a[ 8 ] ) + ( b[ 15 ] * a[ 12 ] );
            a[ 0 ] = atmp0;
            a[ 4 ] = atmp1;
            a[ 8 ] = atmp2;
            a[ 12 ] = atmp3;

            atmp0 = ( b[ 0 ] * a[ 1 ] ) + ( b[ 1 ] * a[ 5 ] ) + ( b[ 2 ] * a[ 9 ] ) + ( b[ 3 ] * a[ 13 ] );
            atmp1 = ( b[ 4 ] * a[ 1 ] ) + ( b[ 5 ] * a[ 5 ] ) + ( b[ 6 ] * a[ 9 ] ) + ( b[ 7 ] * a[ 13 ] );
            atmp2 = ( b[ 8 ] * a[ 1 ] ) + ( b[ 9 ] * a[ 5 ] ) + ( b[ 10 ] * a[ 9 ] ) + ( b[ 11 ] * a[ 13 ] );
            atmp3 = ( b[ 12 ] * a[ 1 ] ) + ( b[ 13 ] * a[ 5 ] ) + ( b[ 14 ] * a[ 9 ] ) + ( b[ 15 ] * a[ 13 ] );
            a[ 1 ] = atmp0;
            a[ 5 ] = atmp1;
            a[ 9 ] = atmp2;
            a[ 13 ] = atmp3;

            atmp0 = ( b[ 0 ] * a[ 2 ] ) + ( b[ 1 ] * a[ 6 ] ) + ( b[ 2 ] * a[ 10 ] ) + ( b[ 3 ] * a[ 14 ] );
            atmp1 = ( b[ 4 ] * a[ 2 ] ) + ( b[ 5 ] * a[ 6 ] ) + ( b[ 6 ] * a[ 10 ] ) + ( b[ 7 ] * a[ 14 ] );
            atmp2 = ( b[ 8 ] * a[ 2 ] ) + ( b[ 9 ] * a[ 6 ] ) + ( b[ 10 ] * a[ 10 ] ) + ( b[ 11 ] * a[ 14 ] );
            atmp3 = ( b[ 12 ] * a[ 2 ] ) + ( b[ 13 ] * a[ 6 ] ) + ( b[ 14 ] * a[ 10 ] ) + ( b[ 15 ] * a[ 14 ] );
            a[ 2 ] = atmp0;
            a[ 6 ] = atmp1;
            a[ 10 ] = atmp2;
            a[ 14 ] = atmp3;

            atmp0 = ( b[ 0 ] * a[ 3 ] ) + ( b[ 1 ] * a[ 7 ] ) + ( b[ 2 ] * a[ 11 ] ) + ( b[ 3 ] * a[ 15 ] );
            atmp1 = ( b[ 4 ] * a[ 3 ] ) + ( b[ 5 ] * a[ 7 ] ) + ( b[ 6 ] * a[ 11 ] ) + ( b[ 7 ] * a[ 15 ] );
            atmp2 = ( b[ 8 ] * a[ 3 ] ) + ( b[ 9 ] * a[ 7 ] ) + ( b[ 10 ] * a[ 11 ] ) + ( b[ 11 ] * a[ 15 ] );
            atmp3 = ( b[ 12 ] * a[ 3 ] ) + ( b[ 13 ] * a[ 7 ] ) + ( b[ 14 ] * a[ 11 ] ) + ( b[ 15 ] * a[ 15 ] );
            a[ 3 ] = atmp0;
            a[ 7 ] = atmp1;
            a[ 11 ] = atmp2;
            a[ 15 ] = atmp3;

            return a;
        },

        // do a * b and result in b
        postMult: function ( a, b ) {
            var btmp0, btmp1, btmp2, btmp3;
            // post mult
            btmp0 = ( b[ 0 ] * a[ 0 ] ) + ( b[ 1 ] * a[ 4 ] ) + ( b[ 2 ] * a[ 8 ] ) + ( b[ 3 ] * a[ 12 ] );
            btmp1 = ( b[ 0 ] * a[ 1 ] ) + ( b[ 1 ] * a[ 5 ] ) + ( b[ 2 ] * a[ 9 ] ) + ( b[ 3 ] * a[ 13 ] );
            btmp2 = ( b[ 0 ] * a[ 2 ] ) + ( b[ 1 ] * a[ 6 ] ) + ( b[ 2 ] * a[ 10 ] ) + ( b[ 3 ] * a[ 14 ] );
            btmp3 = ( b[ 0 ] * a[ 3 ] ) + ( b[ 1 ] * a[ 7 ] ) + ( b[ 2 ] * a[ 11 ] ) + ( b[ 3 ] * a[ 15 ] );
            b[ 0 ] = btmp0;
            b[ 1 ] = btmp1;
            b[ 2 ] = btmp2;
            b[ 3 ] = btmp3;

            btmp0 = ( b[ 4 ] * a[ 0 ] ) + ( b[ 5 ] * a[ 4 ] ) + ( b[ 6 ] * a[ 8 ] ) + ( b[ 7 ] * a[ 12 ] );
            btmp1 = ( b[ 4 ] * a[ 1 ] ) + ( b[ 5 ] * a[ 5 ] ) + ( b[ 6 ] * a[ 9 ] ) + ( b[ 7 ] * a[ 13 ] );
            btmp2 = ( b[ 4 ] * a[ 2 ] ) + ( b[ 5 ] * a[ 6 ] ) + ( b[ 6 ] * a[ 10 ] ) + ( b[ 7 ] * a[ 14 ] );
            btmp3 = ( b[ 4 ] * a[ 3 ] ) + ( b[ 5 ] * a[ 7 ] ) + ( b[ 6 ] * a[ 11 ] ) + ( b[ 7 ] * a[ 15 ] );
            b[ 4 ] = btmp0;
            b[ 5 ] = btmp1;
            b[ 6 ] = btmp2;
            b[ 7 ] = btmp3;

            btmp0 = ( b[ 8 ] * a[ 0 ] ) + ( b[ 9 ] * a[ 4 ] ) + ( b[ 10 ] * a[ 8 ] ) + ( b[ 11 ] * a[ 12 ] );
            btmp1 = ( b[ 8 ] * a[ 1 ] ) + ( b[ 9 ] * a[ 5 ] ) + ( b[ 10 ] * a[ 9 ] ) + ( b[ 11 ] * a[ 13 ] );
            btmp2 = ( b[ 8 ] * a[ 2 ] ) + ( b[ 9 ] * a[ 6 ] ) + ( b[ 10 ] * a[ 10 ] ) + ( b[ 11 ] * a[ 14 ] );
            btmp3 = ( b[ 8 ] * a[ 3 ] ) + ( b[ 9 ] * a[ 7 ] ) + ( b[ 10 ] * a[ 11 ] ) + ( b[ 11 ] * a[ 15 ] );
            b[ 8 ] = btmp0;
            b[ 9 ] = btmp1;
            b[ 10 ] = btmp2;
            b[ 11 ] = btmp3;

            btmp0 = ( b[ 12 ] * a[ 0 ] ) + ( b[ 13 ] * a[ 4 ] ) + ( b[ 14 ] * a[ 8 ] ) + ( b[ 15 ] * a[ 12 ] );
            btmp1 = ( b[ 12 ] * a[ 1 ] ) + ( b[ 13 ] * a[ 5 ] ) + ( b[ 14 ] * a[ 9 ] ) + ( b[ 15 ] * a[ 13 ] );
            btmp2 = ( b[ 12 ] * a[ 2 ] ) + ( b[ 13 ] * a[ 6 ] ) + ( b[ 14 ] * a[ 10 ] ) + ( b[ 15 ] * a[ 14 ] );
            btmp3 = ( b[ 12 ] * a[ 3 ] ) + ( b[ 13 ] * a[ 7 ] ) + ( b[ 14 ] * a[ 11 ] ) + ( b[ 15 ] * a[ 15 ] );
            b[ 12 ] = btmp0;
            b[ 13 ] = btmp1;
            b[ 14 ] = btmp2;
            b[ 15 ] = btmp3;

            return b;
        },
        multa: function ( a, b, r ) {
            if ( r === a ) {
                return this.preMult( a, b );
            } else if ( r === b ) {
                return this.postMult( a, b );
            } else {
                if ( r === undefined ) {
                    r = [];
                }
                r[ 0 ] = b[ 0 ] * a[ 0 ] + b[ 1 ] * a[ 4 ] + b[ 2 ] * a[ 8 ] + b[ 3 ] * a[ 12 ];
                r[ 1 ] = b[ 0 ] * a[ 1 ] + b[ 1 ] * a[ 5 ] + b[ 2 ] * a[ 9 ] + b[ 3 ] * a[ 13 ];
                r[ 2 ] = b[ 0 ] * a[ 2 ] + b[ 1 ] * a[ 6 ] + b[ 2 ] * a[ 10 ] + b[ 3 ] * a[ 14 ];
                r[ 3 ] = b[ 0 ] * a[ 3 ] + b[ 1 ] * a[ 7 ] + b[ 2 ] * a[ 11 ] + b[ 3 ] * a[ 15 ];

                r[ 4 ] = b[ 4 ] * a[ 0 ] + b[ 5 ] * a[ 4 ] + b[ 6 ] * a[ 8 ] + b[ 7 ] * a[ 12 ];
                r[ 5 ] = b[ 4 ] * a[ 1 ] + b[ 5 ] * a[ 5 ] + b[ 6 ] * a[ 9 ] + b[ 7 ] * a[ 13 ];
                r[ 6 ] = b[ 4 ] * a[ 2 ] + b[ 5 ] * a[ 6 ] + b[ 6 ] * a[ 10 ] + b[ 7 ] * a[ 14 ];
                r[ 7 ] = b[ 4 ] * a[ 3 ] + b[ 5 ] * a[ 7 ] + b[ 6 ] * a[ 11 ] + b[ 7 ] * a[ 15 ];

                r[ 8 ] = b[ 8 ] * a[ 0 ] + b[ 9 ] * a[ 4 ] + b[ 10 ] * a[ 8 ] + b[ 11 ] * a[ 12 ];
                r[ 9 ] = b[ 8 ] * a[ 1 ] + b[ 9 ] * a[ 5 ] + b[ 10 ] * a[ 9 ] + b[ 11 ] * a[ 13 ];
                r[ 10 ] = b[ 8 ] * a[ 2 ] + b[ 9 ] * a[ 6 ] + b[ 10 ] * a[ 10 ] + b[ 11 ] * a[ 14 ];
                r[ 11 ] = b[ 8 ] * a[ 3 ] + b[ 9 ] * a[ 7 ] + b[ 10 ] * a[ 11 ] + b[ 11 ] * a[ 15 ];

                r[ 12 ] = b[ 12 ] * a[ 0 ] + b[ 13 ] * a[ 4 ] + b[ 14 ] * a[ 8 ] + b[ 15 ] * a[ 12 ];
                r[ 13 ] = b[ 12 ] * a[ 1 ] + b[ 13 ] * a[ 5 ] + b[ 14 ] * a[ 9 ] + b[ 15 ] * a[ 13 ];
                r[ 14 ] = b[ 12 ] * a[ 2 ] + b[ 13 ] * a[ 6 ] + b[ 14 ] * a[ 10 ] + b[ 15 ] * a[ 14 ];
                r[ 15 ] = b[ 12 ] * a[ 3 ] + b[ 13 ] * a[ 7 ] + b[ 14 ] * a[ 11 ] + b[ 15 ] * a[ 15 ];

                return r;
            }
        },
        /* r = a * b */
        mult: function ( a, b, r ) {
            var s00 = b[ 0 ];
            var s01 = b[ 1 ];
            var s02 = b[ 2 ];
            var s03 = b[ 3 ];
            var s10 = b[ 4 ];
            var s11 = b[ 5 ];
            var s12 = b[ 6 ];
            var s13 = b[ 7 ];
            var s20 = b[ 8 ];
            var s21 = b[ 9 ];
            var s22 = b[ 10 ];
            var s23 = b[ 11 ];
            var s30 = b[ 12 ];
            var s31 = b[ 13 ];
            var s32 = b[ 14 ];
            var s33 = b[ 15 ];

            var o00 = a[ 0 ];
            var o01 = a[ 1 ];
            var o02 = a[ 2 ];
            var o03 = a[ 3 ];
            var o10 = a[ 4 ];
            var o11 = a[ 5 ];
            var o12 = a[ 6 ];
            var o13 = a[ 7 ];
            var o20 = a[ 8 ];
            var o21 = a[ 9 ];
            var o22 = a[ 10 ];
            var o23 = a[ 11 ];
            var o30 = a[ 12 ];
            var o31 = a[ 13 ];
            var o32 = a[ 14 ];
            var o33 = a[ 15 ];

            r[ 0 ] = s00 * o00 + s01 * o10 + s02 * o20 + s03 * o30;
            r[ 1 ] = s00 * o01 + s01 * o11 + s02 * o21 + s03 * o31;
            r[ 2 ] = s00 * o02 + s01 * o12 + s02 * o22 + s03 * o32;
            r[ 3 ] = s00 * o03 + s01 * o13 + s02 * o23 + s03 * o33;

            r[ 4 ] = s10 * o00 + s11 * o10 + s12 * o20 + s13 * o30;
            r[ 5 ] = s10 * o01 + s11 * o11 + s12 * o21 + s13 * o31;
            r[ 6 ] = s10 * o02 + s11 * o12 + s12 * o22 + s13 * o32;
            r[ 7 ] = s10 * o03 + s11 * o13 + s12 * o23 + s13 * o33;

            r[ 8 ] = s20 * o00 + s21 * o10 + s22 * o20 + s23 * o30;
            r[ 9 ] = s20 * o01 + s21 * o11 + s22 * o21 + s23 * o31;
            r[ 10 ] = s20 * o02 + s21 * o12 + s22 * o22 + s23 * o32;
            r[ 11 ] = s20 * o03 + s21 * o13 + s22 * o23 + s23 * o33;

            r[ 12 ] = s30 * o00 + s31 * o10 + s32 * o20 + s33 * o30;
            r[ 13 ] = s30 * o01 + s31 * o11 + s32 * o21 + s33 * o31;
            r[ 14 ] = s30 * o02 + s31 * o12 + s32 * o22 + s33 * o32;
            r[ 15 ] = s30 * o03 + s31 * o13 + s32 * o23 + s33 * o33;

            return r;
        },
        multOrig: function ( a, b, r ) {
            var t;
            if ( r === a ) {
                // pre mult
                t = [];
                for ( var col = 0; col < 4; col++ ) {
                    t[ 0 ] = Matrix.innerProduct( b, a, 0, col );
                    t[ 1 ] = Matrix.innerProduct( b, a, 1, col );
                    t[ 2 ] = Matrix.innerProduct( b, a, 2, col );
                    t[ 3 ] = Matrix.innerProduct( b, a, 3, col );
                    a[ 0 + col ] = t[ 0 ];
                    a[ 4 + col ] = t[ 1 ];
                    a[ 8 + col ] = t[ 2 ];
                    a[ 12 + col ] = t[ 3 ];
                }
                return a;
                //return this.preMult(r, b);
            } else if ( r === b ) {
                // post mult
                t = [];
                for ( var row = 0; row < 4; row++ ) {
                    t[ 0 ] = Matrix.innerProduct( b, a, row, 0 );
                    t[ 1 ] = Matrix.innerProduct( b, a, row, 1 );
                    t[ 2 ] = Matrix.innerProduct( b, a, row, 2 );
                    t[ 3 ] = Matrix.innerProduct( b, a, row, 3 );
                    this.setRow( b, row, t[ 0 ], t[ 1 ], t[ 2 ], t[ 3 ] );
                }
                return b;
                //return this.postMult(r, a);
            }
            if ( r === undefined ) {
                r = [];
            }

            var s00 = b[ 0 ];
            var s01 = b[ 1 ];
            var s02 = b[ 2 ];
            var s03 = b[ 3 ];
            var s10 = b[ 4 ];
            var s11 = b[ 5 ];
            var s12 = b[ 6 ];
            var s13 = b[ 7 ];
            var s20 = b[ 8 ];
            var s21 = b[ 9 ];
            var s22 = b[ 10 ];
            var s23 = b[ 11 ];
            var s30 = b[ 12 ];
            var s31 = b[ 13 ];
            var s32 = b[ 14 ];
            var s33 = b[ 15 ];

            var o00 = a[ 0 ];
            var o01 = a[ 1 ];
            var o02 = a[ 2 ];
            var o03 = a[ 3 ];
            var o10 = a[ 4 ];
            var o11 = a[ 5 ];
            var o12 = a[ 6 ];
            var o13 = a[ 7 ];
            var o20 = a[ 8 ];
            var o21 = a[ 9 ];
            var o22 = a[ 10 ];
            var o23 = a[ 11 ];
            var o30 = a[ 12 ];
            var o31 = a[ 13 ];
            var o32 = a[ 14 ];
            var o33 = a[ 15 ];

            r[ 0 ] = s00 * o00 + s01 * o10 + s02 * o20 + s03 * o30;
            r[ 1 ] = s00 * o01 + s01 * o11 + s02 * o21 + s03 * o31;
            r[ 2 ] = s00 * o02 + s01 * o12 + s02 * o22 + s03 * o32;
            r[ 3 ] = s00 * o03 + s01 * o13 + s02 * o23 + s03 * o33;

            r[ 4 ] = s10 * o00 + s11 * o10 + s12 * o20 + s13 * o30;
            r[ 5 ] = s10 * o01 + s11 * o11 + s12 * o21 + s13 * o31;
            r[ 6 ] = s10 * o02 + s11 * o12 + s12 * o22 + s13 * o32;
            r[ 7 ] = s10 * o03 + s11 * o13 + s12 * o23 + s13 * o33;

            r[ 8 ] = s20 * o00 + s21 * o10 + s22 * o20 + s23 * o30;
            r[ 9 ] = s20 * o01 + s21 * o11 + s22 * o21 + s23 * o31;
            r[ 10 ] = s20 * o02 + s21 * o12 + s22 * o22 + s23 * o32;
            r[ 11 ] = s20 * o03 + s21 * o13 + s22 * o23 + s23 * o33;

            r[ 12 ] = s30 * o00 + s31 * o10 + s32 * o20 + s33 * o30;
            r[ 13 ] = s30 * o01 + s31 * o11 + s32 * o21 + s33 * o31;
            r[ 14 ] = s30 * o02 + s31 * o12 + s32 * o22 + s33 * o32;
            r[ 15 ] = s30 * o03 + s31 * o13 + s32 * o23 + s33 * o33;

            return r;
        },

        makeLookAt: function ( eye, center, up, result ) {

            if ( result === undefined ) {
                result = [];
            }

            var f = Vec3.sub( center, eye, [] );
            Vec3.normalize( f, f );

            var s = Vec3.cross( f, up, [] );
            Vec3.normalize( s, s );

            var u = Vec3.cross( s, f, [] );
            Vec3.normalize( u, u );

            // s[0], u[0], -f[0], 0.0,
            // s[1], u[1], -f[1], 0.0,
            // s[2], u[2], -f[2], 0.0,
            // 0,    0,    0,     1.0

            result[ 0 ] = s[ 0 ];
            result[ 1 ] = u[ 0 ];
            result[ 2 ] = -f[ 0 ];
            result[ 3 ] = 0.0;
            result[ 4 ] = s[ 1 ];
            result[ 5 ] = u[ 1 ];
            result[ 6 ] = -f[ 1 ];
            result[ 7 ] = 0.0;
            result[ 8 ] = s[ 2 ];
            result[ 9 ] = u[ 2 ];
            result[ 10 ] = -f[ 2 ];
            result[ 11 ] = 0.0;
            result[ 12 ] = 0;
            result[ 13 ] = 0;
            result[ 14 ] = 0;
            result[ 15 ] = 1.0;

            Matrix.multTranslate( result, Vec3.neg( eye, [] ), result );
            return result;
        },
        makeOrtho: function ( left, right,
            bottom, top,
            zNear, zFar, result ) {
            if ( result === undefined ) {
                result = [];
            }
            // note transpose of Matrix_implementation wr.t OpenGL documentation, since the OSG use post multiplication rather than pre.
            // we will change this convention later
            var tx = -( right + left ) / ( right - left );
            var ty = -( top + bottom ) / ( top - bottom );
            var tz = -( zFar + zNear ) / ( zFar - zNear );
            var row = Matrix.setRow;
            row( result, 0, 2.0 / ( right - left ), 0.0, 0.0, 0.0 );
            row( result, 1, 0.0, 2.0 / ( top - bottom ), 0.0, 0.0 );
            row( result, 2, 0.0, 0.0, -2.0 / ( zFar - zNear ), 0.0 );
            row( result, 3, tx, ty, tz, 1.0 );
            return result;
        },

        getLookAt: function ( matrix, eye, center, up, distance ) {
            if ( distance === undefined ) {
                distance = 1.0;
            }
            var inv = [];
            var result = Matrix.inverse( matrix, inv );
            if ( !result ) {
                Matrix.makeIdentity( inv );
            }
            Matrix.transformVec3( inv, [ 0, 0, 0 ], eye );
            Matrix.transform3x3( matrix, [ 0, 1, 0 ], up );
            Matrix.transform3x3( matrix, [ 0, 0, -1 ], center );
            Vec3.normalize( center, center );
            Vec3.add( Vec3.mult( center, distance, [] ), eye, center );
        },

        //getRotate_David_Spillings_Mk1
        getRotate: function ( mat, quatResult ) {
            if ( quatResult === undefined ) {
                quatResult = [];
            }

            var s;
            var tq = [];
            var i, j;

            // Use tq to store the largest trace
            var mat00 = mat[ 4 * 0 + 0 ];
            var mat11 = mat[ 4 * 1 + 1 ];
            var mat22 = mat[ 4 * 2 + 2 ];
            tq[ 0 ] = 1 + mat00 + mat11 + mat22;
            tq[ 1 ] = 1 + mat00 - mat11 - mat22;
            tq[ 2 ] = 1 - mat00 + mat11 - mat22;
            tq[ 3 ] = 1 - mat00 - mat11 + mat22;

            // Find the maximum (could also use stacked if's later)
            j = 0;
            for ( i = 1; i < 4; i++ ) {
                if ( ( tq[ i ] > tq[ j ] ) ) {
                    j = i;
                } else {
                    j = j;
                }
            }

            // check the diagonal
            if ( j === 0 ) {
                /* perform instant calculation */
                quatResult[ 3 ] = tq[ 0 ];
                quatResult[ 0 ] = mat[ 1 * 4 + 2 ] - mat[ 2 * 4 + 1 ];
                quatResult[ 1 ] = mat[ 2 * 4 + 0 ] - mat[ 0 + 2 ];
                quatResult[ 2 ] = mat[ 0 + 1 ] - mat[ 1 * 4 + 0 ];
            } else if ( j === 1 ) {
                quatResult[ 3 ] = mat[ 1 * 4 + 2 ] - mat[ 2 * 4 + 1 ];
                quatResult[ 0 ] = tq[ 1 ];
                quatResult[ 1 ] = mat[ 0 + 1 ] + mat[ 1 * 4 + 0 ];
                quatResult[ 2 ] = mat[ 2 * 4 + 0 ] + mat[ 0 + 2 ];
            } else if ( j === 2 ) {
                quatResult[ 3 ] = mat[ 2 * 4 + 0 ] - mat[ 0 + 2 ];
                quatResult[ 0 ] = mat[ 0 + 1 ] + mat[ 1 * 4 + 0 ];
                quatResult[ 1 ] = tq[ 2 ];
                quatResult[ 2 ] = mat[ 1 * 4 + 2 ] + mat[ 2 * 4 + 1 ];
            } else /* if (j==3) */ {
                quatResult[ 3 ] = mat[ 0 + 1 ] - mat[ 1 * 4 + 0 ];
                quatResult[ 0 ] = mat[ 2 * 4 + 0 ] + mat[ 0 + 2 ];
                quatResult[ 1 ] = mat[ 1 * 4 + 2 ] + mat[ 2 * 4 + 1 ];
                quatResult[ 2 ] = tq[ 3 ];
            }

            s = Math.sqrt( 0.25 / tq[ j ] );
            quatResult[ 3 ] *= s;
            quatResult[ 0 ] *= s;
            quatResult[ 1 ] *= s;
            quatResult[ 2 ] *= s;

            return quatResult;
        },

        // Matrix M = Matrix M * Matrix Translate
        preMultTranslate: function ( mat, translate ) {
            var val;
            if ( translate[ 0 ] !== 0.0 ) {
                val = translate[ 0 ];
                mat[ 12 ] += val * mat[ 0 ];
                mat[ 13 ] += val * mat[ 1 ];
                mat[ 14 ] += val * mat[ 2 ];
                mat[ 15 ] += val * mat[ 3 ];
            }

            if ( translate[ 1 ] !== 0.0 ) {
                val = translate[ 1 ];
                mat[ 12 ] += val * mat[ 4 ];
                mat[ 13 ] += val * mat[ 5 ];
                mat[ 14 ] += val * mat[ 6 ];
                mat[ 15 ] += val * mat[ 7 ];
            }

            if ( translate[ 2 ] !== 0.0 ) {
                val = translate[ 2 ];
                mat[ 12 ] += val * mat[ 8 ];
                mat[ 13 ] += val * mat[ 9 ];
                mat[ 14 ] += val * mat[ 10 ];
                mat[ 15 ] += val * mat[ 11 ];
            }
            return mat;
        },


        // result = Matrix M * Matrix Translate
        multTranslate: function ( mat, translate, result ) {
            if ( result === undefined ) {
                result = [];
            }
            if ( result !== mat ) {
                Matrix.copy( mat, result );
            }

            var val;
            if ( translate[ 0 ] !== 0.0 ) {
                val = translate[ 0 ];
                result[ 12 ] += val * mat[ 0 ];
                result[ 13 ] += val * mat[ 1 ];
                result[ 14 ] += val * mat[ 2 ];
                result[ 15 ] += val * mat[ 3 ];
            }

            if ( translate[ 1 ] !== 0.0 ) {
                val = translate[ 1 ];
                result[ 12 ] += val * mat[ 4 ];
                result[ 13 ] += val * mat[ 5 ];
                result[ 14 ] += val * mat[ 6 ];
                result[ 15 ] += val * mat[ 7 ];
            }

            if ( translate[ 2 ] !== 0.0 ) {
                val = translate[ 2 ];
                result[ 12 ] += val * mat[ 8 ];
                result[ 13 ] += val * mat[ 9 ];
                result[ 14 ] += val * mat[ 10 ];
                result[ 15 ] += val * mat[ 11 ];
            }
            return result;
        },

        makeRotate: function ( angle, x, y, z, result ) {
            if ( result === undefined ) {
                Notify.log( 'makeRotate without given matrix destination is deprecated' );
                result = [];
            }

            var mag = Math.sqrt( x * x + y * y + z * z );
            var sinAngle = Math.sin( angle );
            var cosAngle = Math.cos( angle );

            if ( mag > 0.0 ) {
                var xx, yy, zz, xy, yz, zx, xs, ys, zs;
                var oneMinusCos;

                mag = 1.0 / mag;

                x *= mag;
                y *= mag;
                z *= mag;

                xx = x * x;
                yy = y * y;
                zz = z * z;
                xy = x * y;
                yz = y * z;
                zx = z * x;
                xs = x * sinAngle;
                ys = y * sinAngle;
                zs = z * sinAngle;
                oneMinusCos = 1.0 - cosAngle;

                result[ 0 ] = ( oneMinusCos * xx ) + cosAngle;
                result[ 1 ] = ( oneMinusCos * xy ) - zs;
                result[ 2 ] = ( oneMinusCos * zx ) + ys;
                result[ 3 ] = 0.0;

                result[ 4 ] = ( oneMinusCos * xy ) + zs;
                result[ 5 ] = ( oneMinusCos * yy ) + cosAngle;
                result[ 6 ] = ( oneMinusCos * yz ) - xs;
                result[ 7 ] = 0.0;

                result[ 8 ] = ( oneMinusCos * zx ) - ys;
                result[ 9 ] = ( oneMinusCos * yz ) + xs;
                result[ 10 ] = ( oneMinusCos * zz ) + cosAngle;
                result[ 11 ] = 0.0;

                result[ 12 ] = 0.0;
                result[ 13 ] = 0.0;
                result[ 14 ] = 0.0;
                result[ 15 ] = 1.0;

                return result;
            } else {
                return Matrix.makeIdentity( result );
            }

            return result;
        },

        transform3x3: function ( m, v, result ) {
            if ( result === undefined ) {
                result = [];
            }
            result[ 0 ] = m[ 0 ] * v[ 0 ] + m[ 1 ] * v[ 1 ] + m[ 2 ] * v[ 2 ];
            result[ 1 ] = m[ 4 ] * v[ 0 ] + m[ 5 ] * v[ 1 ] + m[ 6 ] * v[ 2 ];
            result[ 2 ] = m[ 8 ] * v[ 0 ] + m[ 9 ] * v[ 1 ] + m[ 10 ] * v[ 2 ];
            return result;
        },

        transformVec3: function ( matrix, vector, result ) {
            var d = 1.0 / ( matrix[ 3 ] * vector[ 0 ] + matrix[ 7 ] * vector[ 1 ] + matrix[ 11 ] * vector[ 2 ] + matrix[ 15 ] );

            if ( result === undefined ) {
                Notify.warn( 'deprecated, Matrix.transformVec3 needs a third parameter as result' );
                result = [];
            }

            var tmp;
            if ( result === vector ) {
                tmp = [];
            } else {
                tmp = result;
            }
            tmp[ 0 ] = ( matrix[ 0 ] * vector[ 0 ] + matrix[ 4 ] * vector[ 1 ] + matrix[ 8 ] * vector[ 2 ] + matrix[ 12 ] ) * d;
            tmp[ 1 ] = ( matrix[ 1 ] * vector[ 0 ] + matrix[ 5 ] * vector[ 1 ] + matrix[ 9 ] * vector[ 2 ] + matrix[ 13 ] ) * d;
            tmp[ 2 ] = ( matrix[ 2 ] * vector[ 0 ] + matrix[ 6 ] * vector[ 1 ] + matrix[ 10 ] * vector[ 2 ] + matrix[ 14 ] ) * d;

            if ( result === vector ) {
                Vec3.copy( tmp, result );
            }
            return result;
        },

        transformVec4: function ( matrix, vector, result ) {
            if ( result === undefined ) {
                result = [];
            }
            var tmp;
            if ( result === vector ) {
                tmp = [];
            } else {
                tmp = result;
            }
            tmp[ 0 ] = ( matrix[ 0 ] * vector[ 0 ] + matrix[ 1 ] * vector[ 1 ] + matrix[ 2 ] * vector[ 2 ] + matrix[ 3 ] * vector[ 3 ] );
            tmp[ 1 ] = ( matrix[ 4 ] * vector[ 0 ] + matrix[ 5 ] * vector[ 1 ] + matrix[ 6 ] * vector[ 2 ] + matrix[ 7 ] * vector[ 3 ] );
            tmp[ 2 ] = ( matrix[ 8 ] * vector[ 0 ] + matrix[ 9 ] * vector[ 1 ] + matrix[ 10 ] * vector[ 2 ] + matrix[ 11 ] * vector[ 3 ] );
            tmp[ 3 ] = ( matrix[ 12 ] * vector[ 0 ] + matrix[ 13 ] * vector[ 1 ] + matrix[ 14 ] * vector[ 2 ] + matrix[ 15 ] * vector[ 3 ] );

            if ( result === vector ) {
                Vec4.copy( tmp, result );
            }
            return result;
        },

        copy: function ( matrix, result ) {
            if ( result === undefined ) {
                result = [];
            }
            result[ 0 ] = matrix[ 0 ];
            result[ 1 ] = matrix[ 1 ];
            result[ 2 ] = matrix[ 2 ];
            result[ 3 ] = matrix[ 3 ];
            result[ 4 ] = matrix[ 4 ];
            result[ 5 ] = matrix[ 5 ];
            result[ 6 ] = matrix[ 6 ];
            result[ 7 ] = matrix[ 7 ];
            result[ 8 ] = matrix[ 8 ];
            result[ 9 ] = matrix[ 9 ];
            result[ 10 ] = matrix[ 10 ];
            result[ 11 ] = matrix[ 11 ];
            result[ 12 ] = matrix[ 12 ];
            result[ 13 ] = matrix[ 13 ];
            result[ 14 ] = matrix[ 14 ];
            result[ 15 ] = matrix[ 15 ];
            return result;
        },

        inverse: function ( matrix, result ) {
            if ( result === matrix ) {
                Matrix.copy( matrix, Matrix._tmp1 );
                matrix = Matrix._tmp1;
            }

            if ( matrix[ 3 ] === 0.0 && matrix[ 7 ] === 0.0 && matrix[ 11 ] === 0.0 && matrix[ 15 ] === 1.0 ) {
                return this.inverse4x3( matrix, result );
            } else {
                return this.inverse4x4( matrix, result );
            }
        },

        /**
         *  if a result argument is given the return of the function is true or false
         *  depending if the matrix can be inverted, else if no result argument is given
         *  the return is identity if the matrix can not be inverted and the matrix overthise
         */
        inverse4x4: function ( matrix, result ) {
            var tmp0 = matrix[ 10 ] * matrix[ 15 ];
            var tmp1 = matrix[ 14 ] * matrix[ 11 ];
            var tmp2 = matrix[ 6 ] * matrix[ 15 ];
            var tmp3 = matrix[ 14 ] * matrix[ 7 ];
            var tmp4 = matrix[ 6 ] * matrix[ 11 ];
            var tmp5 = matrix[ 10 ] * matrix[ 7 ];
            var tmp6 = matrix[ 2 ] * matrix[ 15 ];
            var tmp7 = matrix[ 14 ] * matrix[ 3 ];
            var tmp8 = matrix[ 2 ] * matrix[ 11 ];
            var tmp9 = matrix[ 10 ] * matrix[ 3 ];
            var tmp10 = matrix[ 2 ] * matrix[ 7 ];
            var tmp11 = matrix[ 6 ] * matrix[ 3 ];
            var tmp12 = matrix[ 8 ] * matrix[ 13 ];
            var tmp13 = matrix[ 12 ] * matrix[ 9 ];
            var tmp14 = matrix[ 4 ] * matrix[ 13 ];
            var tmp15 = matrix[ 12 ] * matrix[ 5 ];
            var tmp16 = matrix[ 4 ] * matrix[ 9 ];
            var tmp17 = matrix[ 8 ] * matrix[ 5 ];
            var tmp18 = matrix[ 0 ] * matrix[ 13 ];
            var tmp19 = matrix[ 12 ] * matrix[ 1 ];
            var tmp20 = matrix[ 0 ] * matrix[ 9 ];
            var tmp21 = matrix[ 8 ] * matrix[ 1 ];
            var tmp22= matrix[ 0 ] * matrix[ 5 ];
            var tmp23= matrix[ 4 ] * matrix[ 1 ];

            var t0 = ( ( tmp0 * matrix[ 5 ] + tmp3 * matrix[ 9 ] + tmp4 * matrix[ 13 ] ) -
                ( tmp1 * matrix[ 5 ] + tmp2 * matrix[ 9 ] + tmp5 * matrix[ 13 ] ) );
            var t1 = ( ( tmp1 * matrix[ 1 ] + tmp6  * matrix[ 9 ] + tmp9 * matrix[ 13 ] ) -
                ( tmp0 * matrix[ 1 ] + tmp7 * matrix[ 9 ] + tmp8 * matrix[ 13 ] ) );
            var t2 = ( ( tmp2 * matrix[ 1 ] + tmp7 * matrix[ 5 ] + tmp10 * matrix[ 13 ] ) -
                ( tmp3 * matrix[ 1 ] + tmp6  * matrix[ 5 ] + tmp11 * matrix[ 13 ] ) );
            var t3 = ( ( tmp5 * matrix[ 1 ] + tmp8 * matrix[ 5 ] + tmp11 * matrix[ 9 ] ) -
                ( tmp4 * matrix[ 1 ] + tmp9 * matrix[ 5 ] + tmp10 * matrix[ 9 ] ) );

            var d1 = ( matrix[ 0 ] * t0 + matrix[ 4 ] * t1 + matrix[ 8 ] * t2 + matrix[ 12 ] * t3 );
            if ( Math.abs( d1 ) < 1e-5 ) {
                Notify.log( 'Warning can\'t inverse matrix ' + matrix );
                return false;
            }
            var d = 1.0 / d1;

            var out00 = d * t0;
            var out01 = d * t1;
            var out02 = d * t2;
            var out03 = d * t3;

            var out10 = d * ( ( tmp1 * matrix[ 4 ] + tmp2 * matrix[ 8 ] + tmp5 * matrix[ 12 ] ) -
                ( tmp0 * matrix[ 4 ] + tmp3 * matrix[ 8 ] + tmp4 * matrix[ 12 ] ) );
            var out11 = d * ( ( tmp0 * matrix[ 0 ] + tmp7 * matrix[ 8 ] + tmp8 * matrix[ 12 ] ) -
                ( tmp1 * matrix[ 0 ] + tmp6  * matrix[ 8 ] + tmp9 * matrix[ 12 ] ) );
            var out12 = d * ( ( tmp3 * matrix[ 0 ] + tmp6  * matrix[ 4 ] + tmp11 * matrix[ 12 ] ) -
                ( tmp2 * matrix[ 0 ] + tmp7 * matrix[ 4 ] + tmp10 * matrix[ 12 ] ) );
            var out13 = d * ( ( tmp4 * matrix[ 0 ] + tmp9 * matrix[ 4 ] + tmp10 * matrix[ 8 ] ) -
                ( tmp5 * matrix[ 0 ] + tmp8 * matrix[ 4 ] + tmp11 * matrix[ 8 ] ) );

            var out20 = d * ( ( tmp12 * matrix[ 7 ] + tmp15 * matrix[ 11 ] + tmp16 * matrix[ 15 ] ) -
                ( tmp13 * matrix[ 7 ] + tmp14* matrix[ 11 ] + tmp17 * matrix[ 15 ] ) );
            var out21 = d * ( ( tmp13 * matrix[ 3 ] + tmp18 * matrix[ 11 ] + tmp21 * matrix[ 15 ] ) -
                ( tmp12 * matrix[ 3 ] + tmp19 * matrix[ 11 ] + tmp20 * matrix[ 15 ] ) );
            var out22 = d * ( ( tmp14* matrix[ 3 ] + tmp19 * matrix[ 7 ] + tmp22* matrix[ 15 ] ) -
                ( tmp15 * matrix[ 3 ] + tmp18 * matrix[ 7 ] + tmp23* matrix[ 15 ] ) );
            var out23 = d * ( ( tmp17 * matrix[ 3 ] + tmp20 * matrix[ 7 ] + tmp23* matrix[ 11 ] ) -
                ( tmp16 * matrix[ 3 ] + tmp21 * matrix[ 7 ] + tmp22* matrix[ 11 ] ) );

            var out30 = d * ( ( tmp14* matrix[ 10 ] + tmp17 * matrix[ 14 ] + tmp13 * matrix[ 6 ] ) -
                ( tmp16 * matrix[ 14 ] + tmp12 * matrix[ 6 ] + tmp15 * matrix[ 10 ] ) );
            var out31 = d * ( ( tmp20 * matrix[ 14 ] + tmp12 * matrix[ 2 ] + tmp19 * matrix[ 10 ] ) -
                ( tmp18 * matrix[ 10 ] + tmp21 * matrix[ 14 ] + tmp13 * matrix[ 2 ] ) );
            var out32 = d * ( ( tmp18 * matrix[ 6 ] + tmp23* matrix[ 14 ] + tmp15 * matrix[ 2 ] ) -
                ( tmp22* matrix[ 14 ] + tmp14 * matrix[ 2 ] + tmp19 * matrix[ 6 ] ) );
            var out33 = d * ( ( tmp22* matrix[ 10 ] + tmp16 * matrix[ 2 ] + tmp21 * matrix[ 6 ] ) -
                ( tmp20 * matrix[ 6 ] + tmp23* matrix[ 10 ] + tmp17 * matrix[ 2 ] ) );

            result[ 0 ] = out00;
            result[ 1 ] = out01;
            result[ 2 ] = out02;
            result[ 3 ] = out03;
            result[ 4 ] = out10;
            result[ 5 ] = out11;
            result[ 6 ] = out12;
            result[ 7 ] = out13;
            result[ 8 ] = out20;
            result[ 9 ] = out21;
            result[ 10 ] = out22;
            result[ 11 ] = out23;
            result[ 12 ] = out30;
            result[ 13 ] = out31;
            result[ 14 ] = out32;
            result[ 15 ] = out33;

            return true;
        },

        // comes from OpenSceneGraph
        /*
      Matrix inversion technique:
      Given a matrix mat, we want to invert it.
      mat = [ r00 r01 r02 a
              r10 r11 r12 b
              r20 r21 r22 c
              tx  ty  tz  d ]
      We note that this matrix can be split into three matrices.
      mat = rot * trans * corr, where rot is rotation part, trans is translation part, and corr is the correction due to perspective (if any).
      rot = [ r00 r01 r02 0
              r10 r11 r12 0
              r20 r21 r22 0
              0   0   0   1 ]
      trans = [ 1  0  0  0
                0  1  0  0
                0  0  1  0
                tx ty tz 1 ]
      corr = [ 1 0 0 px
               0 1 0 py
               0 0 1 pz
               0 0 0 s ]

      where the elements of corr are obtained from linear combinations of the elements of rot, trans, and mat.
      So the inverse is mat' = (trans * corr)' * rot', where rot' must be computed the traditional way, which is easy since it is only a 3x3 matrix.
      This problem is simplified if [px py pz s] = [0 0 0 1], which will happen if mat was composed only of rotations, scales, and translations (which is common).  In this case, we can ignore corr entirely which saves on a lot of computations.
    */

        inverse4x3: function ( matrix, result ) {

            // Copy rotation components
            var r00 = matrix[ 0 ];
            var r01 = matrix[ 1 ];
            var r02 = matrix[ 2 ];

            var r10 = matrix[ 4 ];
            var r11 = matrix[ 5 ];
            var r12 = matrix[ 6 ];

            var r20 = matrix[ 8 ];
            var r21 = matrix[ 9 ];
            var r22 = matrix[ 10 ];

            // Partially compute inverse of rot
            result[ 0 ] = r11 * r22 - r12 * r21;
            result[ 1 ] = r02 * r21 - r01 * r22;
            result[ 2 ] = r01 * r12 - r02 * r11;

            // Compute determinant of rot from 3 elements just computed
            var oneOverDet = 1.0 / ( r00 * result[ 0 ] + r10 * result[ 1 ] + r20 * result[ 2 ] );
            r00 *= oneOverDet;
            r10 *= oneOverDet;
            r20 *= oneOverDet; // Saves on later computations

            // Finish computing inverse of rot
            result[ 0 ] *= oneOverDet;
            result[ 1 ] *= oneOverDet;
            result[ 2 ] *= oneOverDet;
            result[ 3 ] = 0.0;
            result[ 4 ] = r12 * r20 - r10 * r22; // Have already been divided by det
            result[ 5 ] = r00 * r22 - r02 * r20; // same
            result[ 6 ] = r02 * r10 - r00 * r12; // same
            result[ 7 ] = 0.0;
            result[ 8 ] = r10 * r21 - r11 * r20; // Have already been divided by det
            result[ 9 ] = r01 * r20 - r00 * r21; // same
            result[ 10 ] = r00 * r11 - r01 * r10; // same
            result[ 11 ] = 0.0;
            result[ 15 ] = 1.0;

            var tx, ty, tz;

            var d = matrix[ 15 ];
            var dm = d - 1.0;
            if ( dm * dm > 1.0e-6 ) // Involves perspective, so we must
            { // compute the full inverse

                var inv = Matrix._tmp0;
                result[ 12 ] = result[ 13 ] = result[ 14 ] = 0.0;

                var a = matrix[ 3 ];
                var b = matrix[ 7 ];
                var c = matrix[ 11 ];
                var px = result[ 0 ] * a + result[ 1 ] * b + result[ 2 ] * c;
                var py = result[ 4 ] * a + result[ 5 ] * b + result[ 6 ] * c;
                var pz = result[ 8 ] * a + result[ 9 ] * b + result[ 10 ] * c;

                tx = matrix[ 12 ];
                ty = matrix[ 13 ];
                tz = matrix[ 14 ];
                var oneOverS = 1.0 / ( d - ( tx * px + ty * py + tz * pz ) );

                tx *= oneOverS;
                ty *= oneOverS;
                tz *= oneOverS; // Reduces number of calculations later on

                // Compute inverse of trans*corr
                inv[ 0 ] = tx * px + 1.0;
                inv[ 1 ] = ty * px;
                inv[ 2 ] = tz * px;
                inv[ 3 ] = -px * oneOverS;
                inv[ 4 ] = tx * py;
                inv[ 5 ] = ty * py + 1.0;
                inv[ 6 ] = tz * py;
                inv[ 7 ] = -py * oneOverS;
                inv[ 8 ] = tx * pz;
                inv[ 9 ] = ty * pz;
                inv[ 10 ] = tz * pz + 1.0;
                inv[ 11 ] = -pz * oneOverS;
                inv[ 12 ] = -tx;
                inv[ 13 ] = -ty;
                inv[ 14 ] = -tz;
                inv[ 15 ] = oneOverS;

                Matrix.preMult( result, inv ); // Finish computing full inverse of mat
            } else {

                tx = matrix[ 12 ];
                ty = matrix[ 13 ];
                tz = matrix[ 14 ];

                // Compute translation components of mat'
                result[ 12 ] = -( tx * result[ 0 ] + ty * result[ 4 ] + tz * result[ 8 ] );
                result[ 13 ] = -( tx * result[ 1 ] + ty * result[ 5 ] + tz * result[ 9 ] );
                result[ 14 ] = -( tx * result[ 2 ] + ty * result[ 6 ] + tz * result[ 10 ] );
            }
            return true;

        },

        transpose: function ( mat, dest ) {
            // from glMatrix
            // If we are transposing ourselves we can skip a few steps but have to cache some values
            if ( mat === dest ) {
                var a01 = mat[ 1 ],
                    a02 = mat[ 2 ],
                    a03 = mat[ 3 ];
                var a12 = mat[ 6 ],
                    a13 = mat[ 7 ];
                var a23 = mat[ 11 ];

                mat[ 1 ] = mat[ 4 ];
                mat[ 2 ] = mat[ 8 ];
                mat[ 3 ] = mat[ 12 ];
                mat[ 4 ] = a01;
                mat[ 6 ] = mat[ 9 ];
                mat[ 7 ] = mat[ 13 ];
                mat[ 8 ] = a02;
                mat[ 9 ] = a12;
                mat[ 11 ] = mat[ 14 ];
                mat[ 12 ] = a03;
                mat[ 13 ] = a13;
                mat[ 14 ] = a23;
                return mat;
            } else {
                dest[ 0 ] = mat[ 0 ];
                dest[ 1 ] = mat[ 4 ];
                dest[ 2 ] = mat[ 8 ];
                dest[ 3 ] = mat[ 12 ];
                dest[ 4 ] = mat[ 1 ];
                dest[ 5 ] = mat[ 5 ];
                dest[ 6 ] = mat[ 9 ];
                dest[ 7 ] = mat[ 13 ];
                dest[ 8 ] = mat[ 2 ];
                dest[ 9 ] = mat[ 6 ];
                dest[ 10 ] = mat[ 10 ];
                dest[ 11 ] = mat[ 14 ];
                dest[ 12 ] = mat[ 3 ];
                dest[ 13 ] = mat[ 7 ];
                dest[ 14 ] = mat[ 11 ];
                dest[ 15 ] = mat[ 15 ];
                return dest;
            }
        },

        makePerspective: function ( fovy, aspect, znear, zfar, result ) {
            if ( result === undefined ) {
                result = [];
            }
            var ymax = znear * Math.tan( fovy * Math.PI / 360.0 );
            var ymin = -ymax;
            var xmin = ymin * aspect;
            var xmax = ymax * aspect;

            return Matrix.makeFrustum( xmin, xmax, ymin, ymax, znear, zfar, result );
        },

        getFrustum: function ( matrix, result ) {
            var right = 0.0;
            var left = 0.0;
            var top = 0.0;
            var bottom = 0.0;
            var zNear,zFar;

            if ( matrix[ 0 * 4 + 3 ] !== 0.0 || matrix[ 1 * 4 + 3 ] !== 0.0 || matrix[ 2 * 4 + 3 ] !== -1.0 || matrix[ 3 * 4 + 3 ] !== 0.0 ) {
                return false;
            }

            // note: near and far must be used inside this method instead of zNear and zFar
            // because zNear and zFar are references and they may point to the same variable.
            var tempNear = matrix[ 3 * 4 + 2 ] / ( matrix[ 2 * 4 + 2 ] - 1.0 );
            var tempFar = matrix[ 3 * 4 + 2 ] / ( 1.0 + matrix[ 2 * 4 + 2 ] );

            left = tempNear * ( matrix[ 2 * 4 ] - 1.0 ) / matrix[ 0 ];
            right = tempNear * ( 1.0 + matrix[ 2 * 4 ] ) / matrix[ 0 ];

            top = tempNear * ( 1.0 + matrix[ 2 * 4 + 1 ] ) / matrix[ 1 * 4 + 1 ];
            bottom = tempNear * ( matrix[ 2 * 4 + 1 ] - 1.0 ) / matrix[ 1 * 4 + 1 ];

            zNear = tempNear;
            zFar = tempFar;

            result.left = left;
            result.right = right;
            result.top = top;
            result.bottom = bottom;
            result.zNear = zNear;
            result.zFar = zFar;

            return true;
        },

        getPerspective: function ( matrix, result ) {
            var c = {
                'right': 0,
                'left': 0,
                'top': 0,
                'bottom': 0,
                'zNear': 0,
                'zFar': 0
            };
            // get frustum and compute results
            var r = this.getFrustum( matrix, c );
            if ( r ) {
                result.fovy = 180 / Math.PI * ( Math.atan( c.top / c.zNear ) - Math.atan( c.bottom / c.zNear ) );
                result.aspectRatio = ( c.right - c.left ) / ( c.top - c.bottom );
            }
            result.zNear = c.zNear;
            result.zFar = c.zFar;
            return result;
        },

        makeScale: function ( x, y, z, result ) {
            if ( result === undefined ) {
                result = [];
            }
            this.setRow( result, 0, x, 0, 0, 0 );
            this.setRow( result, 1, 0, y, 0, 0 );
            this.setRow( result, 2, 0, 0, z, 0 );
            this.setRow( result, 3, 0, 0, 0, 1 );
            return result;
        },

        // compute the 4 corners vector of the frustrum
        computeFrustrumCornersVectors: function ( projectionMatrix, vectorsArray ) {
            //var znear = projectionMatrix[ 12 + 2 ] / ( projectionMatrix[ 8 + 2 ] - 1.0 );
            //var zfar = projectionMatrix[ 12 + 2 ] / ( projectionMatrix[ 8 + 2 ] + 1.0 );
            var x = 1.0 / projectionMatrix[ 0 ];
            var y = 1.0 / projectionMatrix[ 1 * 4 + 1 ];

            vectorsArray[ 0 ] = [ -x, y, 1.0 ];
            vectorsArray[ 1 ] = [ -x, -y, 1.0 ];
            vectorsArray[ 2 ] = [ x, -y, 1.0 ];
            vectorsArray[ 3 ] = [ x, y, 1.0 ];
            return vectorsArray;
        },

        makeFrustum: function ( left, right,
            bottom, top,
            znear, zfar, result ) {
            if ( result === undefined ) {
                result = [];
            }
            var X = 2 * znear / ( right - left );
            var Y = 2 * znear / ( top - bottom );
            var A = ( right + left ) / ( right - left );
            var B = ( top + bottom ) / ( top - bottom );
            var C = -( zfar + znear ) / ( zfar - znear );
            var D = -2 * zfar * znear / ( zfar - znear );
            this.setRow( result, 0, X, 0, 0, 0 );
            this.setRow( result, 1, 0, Y, 0, 0 );
            this.setRow( result, 2, A, B, C, -1 );
            this.setRow( result, 3, 0, 0, D, 0 );
            return result;
        },

        makeRotateFromQuat: function ( quat, result ) {
            this.makeIdentity( result );
            return this.setRotateFromQuat( result, quat );
        },

        setRotateFromQuat: function ( matrix, quat ) {
            var length2 = Quat.length2( quat );
            if ( Math.abs( length2 ) <= Number.MIN_VALUE ) {
                matrix[ 0 ] = 0.0;
                matrix[ 1 ] = 0.0;
                matrix[ 2 ] = 0.0;

                matrix[ 4 ] = 0.0;
                matrix[ 5 ] = 0.0;
                matrix[ 6 ] = 0.0;

                matrix[ 8 ] = 0.0;
                matrix[ 9 ] = 0.0;
                matrix[ 10 ] = 0.0;
            } else {
                var rlength2;
                // normalize quat if required.
                // We can avoid the expensive sqrt in this case since all 'coefficients' below are products of two q components.
                // That is a square of a square root, so it is possible to avoid that
                if ( length2 !== 1.0 ) {
                    rlength2 = 2.0 / length2;
                } else {
                    rlength2 = 2.0;
                }

                // Source: Gamasutra, Rotating Objects Using Quaternions
                //
                //http://www.gamasutra.com/features/19980703/quaternions_01.htm

                var wx, wy, wz, xx, yy, yz, xy, xz, zz, x2, y2, z2;

                // calculate coefficients
                x2 = rlength2 * quat[ 0 ];
                y2 = rlength2 * quat[ 1 ];
                z2 = rlength2 * quat[ 2 ];

                xx = quat[ 0 ] * x2;
                xy = quat[ 0 ] * y2;
                xz = quat[ 0 ] * z2;

                yy = quat[ 1 ] * y2;
                yz = quat[ 1 ] * z2;
                zz = quat[ 2 ] * z2;

                wx = quat[ 3 ] * x2;
                wy = quat[ 3 ] * y2;
                wz = quat[ 3 ] * z2;

                // Note.  Gamasutra gets the matrix assignments inverted, resulting
                // in left-handed rotations, which is contrary to OpenGL and OSG's
                // methodology.  The matrix assignment has been altered in the next
                // few lines of code to do the right thing.
                // Don Burns - Oct 13, 2001
                matrix[ 0 ] = 1.0 - ( yy + zz );
                matrix[ 4 ] = xy - wz;
                matrix[ 8 ] = xz + wy;


                matrix[ 0 + 1 ] = xy + wz;
                matrix[ 4 + 1 ] = 1.0 - ( xx + zz );
                matrix[ 8 + 1 ] = yz - wx;

                matrix[ 0 + 2 ] = xz - wy;
                matrix[ 4 + 2 ] = yz + wx;
                matrix[ 8 + 2 ] = 1.0 - ( xx + yy );
            }
            return matrix;
        }
    };

    return Matrix;
} );
