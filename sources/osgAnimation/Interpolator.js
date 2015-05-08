define( [
    'osg/Quat'
], function ( Quat ) {

    var Vec3CopyKeyFrame = function( i, keys, result ) {
        var index = i;
        result[ 0 ] = keys[index++];
        result[ 1 ] = keys[index++];
        result[ 2 ] = keys[index++];
    };

    var Vec3LerpInterpolator = function ( t, channelInstance ) {

        var channel = channelInstance.channel;
        var value = channelInstance.value;
        var start = channel.start;
        var end = channel.end;
        var keys = channel.keys;
        var times = channel.times;

        if ( t >= end ) {
            channelInstance.key = 0;
            Vec3CopyKeyFrame( keys.length-3, keys, value );
            return;

        } else if ( t <= start ) {
            channelInstance.key = 0;
            Vec3CopyKeyFrame( 0, keys, value );
            return;
        }

        var i1 = channelInstance.key;
        while ( times[ i1 + 1 ] < t ) i1++;


        var t1 = times[ i1 ];
        var t2 = times[ i1 + 1 ];

        var index = i1 * 3;
        var x1 = keys[ index++ ];
        var y1 = keys[ index++ ];
        var z1 = keys[ index++ ];

        var x2 = keys[ index++ ];
        var y2 = keys[ index++ ];
        var z2 = keys[ index++ ];

        var r = ( t - t1 ) / ( t2 - t1 );

        value[ 0 ] = x1 + ( x2 - x1 ) * r;
        value[ 1 ] = y1 + ( y2 - y1 ) * r;
        value[ 2 ] = z1 + ( z2 - z1 ) * r;
        channelInstance.key = i1;
    };




    /**
     *  Interpolator provide interpolation function to sampler
     */
    var Vec3LerpInterpolatorOld = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value[ 0 ] = keyEnd[ 0 ];
            result.value[ 1 ] = keyEnd[ 1 ];
            result.value[ 2 ] = keyEnd[ 2 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value[ 0 ] = keyStart[ 0 ];
                result.value[ 1 ] = keyStart[ 1 ];
                result.value[ 2 ] = keyStart[ 2 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        var i2 = i1 + 1;

        var t1 = keys[ i1 ].t;
        var x1 = keys[ i1 ][ 0 ];
        var y1 = keys[ i1 ][ 1 ];
        var z1 = keys[ i1 ][ 2 ];

        var t2 = keys[ i2 ].t;
        var x2 = keys[ i2 ][ 0 ];
        var y2 = keys[ i2 ][ 1 ];
        var z2 = keys[ i2 ][ 2 ];

        var r = ( t - t1 ) / ( t2 - t1 );

        result.value[ 0 ] = x1 + ( x2 - x1 ) * r;
        result.value[ 1 ] = y1 + ( y2 - y1 ) * r;
        result.value[ 2 ] = z1 + ( z2 - z1 ) * r;
        result.key = i1;
    };

    var QuatLerpInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value[ 0 ] = keyEnd[ 0 ];
            result.value[ 1 ] = keyEnd[ 1 ];
            result.value[ 2 ] = keyEnd[ 2 ];
            result.value[ 3 ] = keyEnd[ 3 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value[ 0 ] = keyStart[ 0 ];
                result.value[ 1 ] = keyStart[ 1 ];
                result.value[ 2 ] = keyStart[ 2 ];
                result.value[ 3 ] = keyStart[ 3 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        var i2 = i1 + 1;

        var t1 = keys[ i1 ].t;
        var x1 = keys[ i1 ][ 0 ];
        var y1 = keys[ i1 ][ 1 ];
        var z1 = keys[ i1 ][ 2 ];
        var w1 = keys[ i1 ][ 3 ];

        var t2 = keys[ i2 ].t;
        var x2 = keys[ i2 ][ 0 ];
        var y2 = keys[ i2 ][ 1 ];
        var z2 = keys[ i2 ][ 2 ];
        var w2 = keys[ i2 ][ 3 ];

        var r = ( t - t1 ) / ( t2 - t1 );

        result.value[ 0 ] = x1 + ( x2 - x1 ) * r;
        result.value[ 1 ] = y1 + ( y2 - y1 ) * r;
        result.value[ 2 ] = z1 + ( z2 - z1 ) * r;
        result.value[ 3 ] = w1 + ( w2 - w1 ) * r;
        result.key = i1;
    };

    var QuatSlerpInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value[ 0 ] = keyEnd[ 0 ];
            result.value[ 1 ] = keyEnd[ 1 ];
            result.value[ 2 ] = keyEnd[ 2 ];
            result.value[ 3 ] = keyEnd[ 3 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value[ 0 ] = keyStart[ 0 ];
                result.value[ 1 ] = keyStart[ 1 ];
                result.value[ 2 ] = keyStart[ 2 ];
                result.value[ 3 ] = keyStart[ 3 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        var i2 = i1 + 1;

        var t1 = keys[ i1 ].t;
        var t2 = keys[ i2 ].t;
        var r = ( t - t1 ) / ( t2 - t1 );

        Quat.slerp( r, keys[ i1 ], keys[ i2 ], result.value );
        result.key = i1;
    };

    /**
     *  Interpolator provide interpolation function to sampler
     */
    var FloatLerpInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value = keyEnd[ 0 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value = keyStart[ 0 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        var i2 = i1 + 1;

        var t1 = keys[ i1 ].t;
        var x1 = keys[ i1 ][ 0 ];

        var t2 = keys[ i2 ].t;
        var x2 = keys[ i2 ][ 0 ];

        var r = ( t - t1 ) / ( t2 - t1 );
        result.value = x1 + ( x2 - x1 ) * r;
        result.key = i1;
    };

    /**
     *  Interpolator provide interpolation function to sampler
     */
    var FloatStepInterpolator = function ( keys, t, result ) {
        var keyStart;
        var startTime;
        var keyEnd = keys[ keys.length - 1 ];
        var endTime = keyEnd.t;
        if ( t >= endTime ) {
            result.key = 0;
            result.value = keyEnd[ 0 ];
            return;
        } else {
            keyStart = keys[ 0 ];
            startTime = keyStart.t;

            if ( t <= startTime ) {
                result.key = 0;
                result.value = keyStart[ 0 ];
                return;
            }
        }

        var i1 = result.key;
        while ( keys[ i1 + 1 ].t < t ) {
            i1++;
        }
        //var i2 = i1 + 1;

        //var t1 = keys[ i1 ].t;
        var x1 = keys[ i1 ][ 0 ];
        result.value = x1;
        result.key = i1;
    };

    return {
        Vec3LerpInterpolator: Vec3LerpInterpolator,
        QuatLerpInterpolator: QuatLerpInterpolator,
        QuatSlerpInterpolator: QuatSlerpInterpolator,
        FloatLerpInterpolator: FloatLerpInterpolator,
        FloatStepInterpolator: FloatStepInterpolator
    };
} );
