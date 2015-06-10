'use strict';

// https://gist.github.com/flowtsohg/11306221

var setRgba8888Dxt5 = function ( dst, i, int565, a ) {
    dst[ i ] = Math.floor( ( ( int565 >> 11 ) & 31 ) / 31 * 255 );
    dst[ i + 1 ] = Math.floor( ( ( int565 >> 5 ) & 63 ) / 63 * 255 );
    dst[ i + 2 ] = Math.floor( ( int565 & 31 ) / 31 * 255 );
    dst[ i + 3 ] = Math.floor( a );
};

window.dxt5ToRgba8888 = function ( dst, src, src8Offset, width, height ) {
    var c = new Uint16Array( 4 );
    var a = new Uint8Array( 8 );
    var alphaBits;
    var m;
    var dstI;
    var i;
    var r0, g0, b0, r1, g1, b1;
    var blockWidth = width / 4;
    var blockHeight = height / 4;

    for ( var blockY = 0; blockY < blockHeight; blockY++ ) {
        for ( var blockX = 0; blockX < blockWidth; blockX++ ) {
            i = src8Offset + 8 * ( blockY * blockWidth + blockX );
            c[ 0 ] = src[ i + 4 ];
            c[ 1 ] = src[ i + 5 ];
            r0 = c[ 0 ] & 0x1f;
            g0 = c[ 0 ] & 0x7e0;
            b0 = c[ 0 ] & 0xf800;
            r1 = c[ 1 ] & 0x1f;
            g1 = c[ 1 ] & 0x7e0;
            b1 = c[ 1 ] & 0xf800;
            c[ 2 ] = ( ( 5 * r0 + 3 * r1 ) >> 3 ) | ( ( ( 5 * g0 + 3 * g1 ) >> 3 ) & 0x7e0 ) | ( ( ( 5 * b0 + 3 * b1 ) >> 3 ) & 0xf800 );
            c[ 3 ] = ( ( 5 * r1 + 3 * r0 ) >> 3 ) | ( ( ( 5 * g1 + 3 * g0 ) >> 3 ) & 0x7e0 ) | ( ( ( 5 * b1 + 3 * b0 ) >> 3 ) & 0xf800 );
            alphaBits = src[ i + 1 ] + 65536 * ( src[ i + 2 ] + 65536 * src[ i + 3 ] );
            a[ 0 ] = src[ i ] & 0xff;
            a[ 1 ] = src[ i ] >> 8;

            if ( a[ 0 ] > a[ 1 ] ) {
                a[ 2 ] = ( 6 * a[ 0 ] + a[ 1 ] ) / 7;
                a[ 3 ] = ( 5 * a[ 0 ] + 2 * a[ 1 ] ) / 7;
                a[ 4 ] = ( 4 * a[ 0 ] + 3 * a[ 1 ] ) / 7;
                a[ 5 ] = ( 3 * a[ 0 ] + 4 * a[ 1 ] ) / 7;
                a[ 6 ] = ( 2 * a[ 0 ] + 5 * a[ 1 ] ) / 7;
                a[ 7 ] = ( a[ 0 ] + 6 * a[ 1 ] ) / 7;
            } else {
                a[ 2 ] = ( 4 * a[ 0 ] + a[ 1 ] ) / 5;
                a[ 3 ] = ( 3 * a[ 0 ] + 2 * a[ 1 ] ) / 5;
                a[ 4 ] = ( 2 * a[ 0 ] + 3 * a[ 1 ] ) / 5;
                a[ 5 ] = ( a[ 0 ] + 4 * a[ 1 ] ) / 5;
                a[ 6 ] = 0;
                a[ 7 ] = 1;
            }

            m = src[ i + 6 ];
            dstI = ( blockY * 16 ) * width + blockX * 16;
            setRgba8888Dxt5( dst, dstI, c[ m & 0x3 ], a[ alphaBits & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 4, c[ ( m >> 2 ) & 0x3 ], a[ ( alphaBits >> 3 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 8, c[ ( m >> 4 ) & 0x3 ], a[ ( alphaBits >> 6 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 12, c[ ( m >> 6 ) & 0x3 ], a[ ( alphaBits >> 9 ) & 0x7 ] );
            dstI += width * 4;
            setRgba8888Dxt5( dst, dstI, c[ ( m >> 8 ) & 0x3 ], a[ ( alphaBits >> 12 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 4, c[ ( m >> 10 ) & 0x3 ], a[ ( alphaBits >> 15 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 8, c[ ( m >> 12 ) & 0x3 ], a[ ( alphaBits >> 18 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 12, c[ m >> 14 ], a[ ( alphaBits >> 21 ) & 0x7 ] );
            m = src[ i + 7 ];
            dstI += width * 4;
            setRgba8888Dxt5( dst, dstI, c[ m & 0x3 ], a[ ( alphaBits >> 24 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 4, c[ ( m >> 2 ) & 0x3 ], a[ ( alphaBits >> 27 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 8, c[ ( m >> 4 ) & 0x3 ], a[ ( alphaBits >> 30 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 12, c[ ( m >> 6 ) & 0x3 ], a[ ( alphaBits >> 33 ) & 0x7 ] );
            dstI += width * 4;
            setRgba8888Dxt5( dst, dstI, c[ ( m >> 8 ) & 0x3 ], a[ ( alphaBits >> 36 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 4, c[ ( m >> 10 ) & 0x3 ], a[ ( alphaBits >> 39 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 8, c[ ( m >> 12 ) & 0x3 ], a[ ( alphaBits >> 42 ) & 0x7 ] );
            setRgba8888Dxt5( dst, dstI + 12, c[ m >> 14 ], a[ ( alphaBits >> 45 ) & 0x7 ] );
        }
    }

    return dst;
};
