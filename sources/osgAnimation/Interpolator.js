define( [
    'osg/Vec3',
    'osg/Quat',
    'osgAnimation/Channel'

], function ( Vec3, Quat, Channel ) {

    'use strict';

    var Vec3CopyKeyFrame = function ( i, keys, result ) {
        result[ 0 ] = keys[ i++ ];
        result[ 1 ] = keys[ i++ ];
        result[ 2 ] = keys[ i++ ];
    };

    var Vec4CopyKeyFrame = function ( i, keys, result ) {
        result[ 0 ] = keys[ i++ ];
        result[ 1 ] = keys[ i++ ];
        result[ 2 ] = keys[ i++ ];
        result[ 3 ] = keys[ i++ ];
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
            Vec3CopyKeyFrame( keys.length - 3, keys, value );
            return;

        } else if ( t <= start ) {
            channelInstance.key = 0;
            Vec3CopyKeyFrame( 0, keys, value );
            return;
        }

        var i1 = channelInstance.key;
        if ( t > times[ i1 ] )
            while ( times[ i1 + 1 ] < t ) i1++;
        else if ( t < times[ i1 ] )
            while ( times[ i1 ] > t ) i1--;

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


    var QuatLerpInterpolator = ( function () {

        var q0 = [ 0.0, 0.0, 0.0, 0.0 ];
        var q1 = [ 0.0, 0.0, 0.0, 0.0 ];

        return function ( t, channelInstance ) {

            var channel = channelInstance.channel;
            var value = channelInstance.value;
            var start = channel.start;
            var end = channel.end;
            var keys = channel.keys;
            var times = channel.times;

            if ( t >= end ) {
                channelInstance.key = 0;
                Vec4CopyKeyFrame( keys.length - 4, keys, value );
                return;

            } else if ( t <= start ) {
                channelInstance.key = 0;
                Vec4CopyKeyFrame( 0, keys, value );
                return;
            }

            var i1 = channelInstance.key;
            if ( t > times[ i1 ] )
                while ( times[ i1 + 1 ] < t ) i1++;
            else if ( t < times[ i1 ] )
                while ( times[ i1 ] > t ) i1--;

            var t1 = times[ i1 ];
            var t2 = times[ i1 + 1 ];

            var index = i1 * 4;
            q0[ 0 ] = keys[ index++ ];
            q0[ 1 ] = keys[ index++ ];
            q0[ 2 ] = keys[ index++ ];
            q0[ 3 ] = keys[ index++ ];

            q1[ 0 ] = keys[ index++ ];
            q1[ 1 ] = keys[ index++ ];
            q1[ 2 ] = keys[ index++ ];
            q1[ 3 ] = keys[ index++ ];

            var r = ( t - t1 ) / ( t2 - t1 );

            Quat.nlerp( r, q0, q1, value );
            channelInstance.key = i1;
        };

    } )();

    var QuatSlerpInterpolator = ( function () {

        var q0 = [ 0.0, 0.0, 0.0, 0.0 ];
        var q1 = [ 0.0, 0.0, 0.0, 0.0 ];

        return function ( t, channelInstance ) {

            var channel = channelInstance.channel;
            var value = channelInstance.value;
            var start = channel.start;
            var end = channel.end;
            var keys = channel.keys;
            var times = channel.times;

            if ( t >= end ) {
                channelInstance.key = 0;
                Vec4CopyKeyFrame( keys.length - 4, keys, value );
                return;

            } else if ( t <= start ) {
                channelInstance.key = 0;
                Vec4CopyKeyFrame( 0, keys, value );
                return;
            }

            var i1 = channelInstance.key;
            if ( t > times[ i1 ] )
                while ( times[ i1 + 1 ] < t ) i1++;
            else if ( t < times[ i1 ] )
                while ( times[ i1 ] > t ) i1--;

            var t1 = times[ i1 ];
            var t2 = times[ i1 + 1 ];

            var index = i1 * 4;
            q0[ 0 ] = keys[ index++ ];
            q0[ 1 ] = keys[ index++ ];
            q0[ 2 ] = keys[ index++ ];
            q0[ 3 ] = keys[ index++ ];

            q1[ 0 ] = keys[ index++ ];
            q1[ 1 ] = keys[ index++ ];
            q1[ 2 ] = keys[ index++ ];
            q1[ 3 ] = keys[ index++ ];

            var r = ( t - t1 ) / ( t2 - t1 );

            Quat.slerp( r, q0, q1, value );

            channelInstance.key = i1;
        };
    } )();


    var FloatLerpInterpolator = function ( t, channelInstance ) {

        var channel = channelInstance.channel;
        var value = channelInstance.value;
        var start = channel.start;
        var end = channel.end;
        var keys = channel.keys;
        var times = channel.times;

        if ( t >= end ) {
            channelInstance.key = 0;
            channelInstance.value = keys[ keys.length - 1 ];
            return;

        } else if ( t <= start ) {
            channelInstance.key = 0;
            channelInstance.value = keys[ 0 ];
            return;
        }

        var i1 = channelInstance.key;
        if ( t > times[ i1 ] )
            while ( times[ i1 + 1 ] < t ) i1++;
        else if ( t < times[ i1 ] )
            while ( times[ i1 ] > t ) i1--;


        var t1 = times[ i1 ];
        var t2 = times[ i1 + 1 ];

        var index = i1;
        var x1 = keys[ index++ ];
        var x2 = keys[ index++ ];

        var r = ( t - t1 ) / ( t2 - t1 );

        value = x1 + ( x2 - x1 ) * r;
        channelInstance.key = i1;
        channelInstance.value = value;
    };

    var FloatCubicBezierInterpolator = function ( t, channelInstance ) {
        var channel = channelInstance.channel;
        var value = channelInstance.value;
        var start = channel.start;
        var end = channel.end;
        var keys = channel.keys;
        var times = channel.times;

        if ( t >= end ) {
            channelInstance.key = 0;
            channelInstance.value = keys[ keys.length - 3 ];
            return;

        } else if ( t <= start ) {
            channelInstance.key = 0;
            channelInstance.value = keys[ 0 ];
            return;
        }

        var i = channelInstance.key;
        if ( t > times[ i ] )
            while ( times[ i + 1 ] < t ) i++;
        else if ( t < times[ i ] )
            while ( times[ i ] > t ) i--;

        var tt = ( t - times[ i ] ) / ( times[ i + 1 ] - times[ i ] );
        var oneMinusT = 1.0 - tt;
        var oneMinusT2 = oneMinusT * oneMinusT;
        var oneMinusT3 = oneMinusT2 * oneMinusT;
        var t2 = tt * tt;

        var id = i * 3;
        var v0 = keys[ id ] * oneMinusT3;
        var v1 = keys[ id + 1 ] * ( 3.0 * tt * oneMinusT2 );
        var v2 = keys[ id + 2 ] * ( 3.0 * t2 * oneMinusT );
        var v3 = keys[ id + 3 ] * ( t2 * tt );

        value = v0 + v1 + v2 + v3;
        channelInstance.key = i;
        channelInstance.value = value;
    };

    var Vec3CubicBezierInterpolator = ( function () {
        var v0 = Vec3.create();
        var v1 = Vec3.create();
        var v2 = Vec3.create();
        var v3 = Vec3.create();

        return function ( t, channelInstance ) {
            var channel = channelInstance.channel;
            var value = channelInstance.value;
            var start = channel.start;
            var end = channel.end;
            var keys = channel.keys;
            var times = channel.times;

            if ( t >= end ) {
                channelInstance.key = 0;
                Vec3CopyKeyFrame( keys.length - 9, keys, value );
                return;

            } else if ( t <= start ) {
                channelInstance.key = 0;
                Vec3CopyKeyFrame( 0, keys, value );
                return;
            }

            var i = channelInstance.key;
            if ( t > times[ i ] )
                while ( times[ i + 1 ] < t ) i++;
            else if ( t < times[ i ] )
                while ( times[ i ] > t ) i--;

            var tt = ( t - times[ i ] ) / ( times[ i + 1 ] - times[ i ] );
            var oneMinusT = 1.0 - tt;
            var oneMinusT2 = oneMinusT * oneMinusT;
            var oneMinusT3 = oneMinusT2 * oneMinusT;
            var t2 = tt * tt;

            var id = i * 9;
            Vec3.mult( Vec3.set( keys[ id++ ], keys[ id++ ], keys[ id++ ], v0 ), oneMinusT3, v0 );
            Vec3.mult( Vec3.set( keys[ id++ ], keys[ id++ ], keys[ id++ ], v1 ), ( 3.0 * tt * oneMinusT2 ), v1 );
            Vec3.mult( Vec3.set( keys[ id++ ], keys[ id++ ], keys[ id++ ], v2 ), ( 3.0 * t2 * oneMinusT ), v2 );
            Vec3.mult( Vec3.set( keys[ id++ ], keys[ id++ ], keys[ id++ ], v3 ), ( t2 * tt ), v3 );

            value[ 0 ] = v0[ 0 ] + v1[ 0 ] + v2[ 0 ] + v3[ 0 ];
            value[ 1 ] = v0[ 1 ] + v1[ 1 ] + v2[ 1 ] + v3[ 1 ];
            value[ 2 ] = v0[ 2 ] + v1[ 2 ] + v2[ 2 ] + v3[ 2 ];
            channelInstance.key = i;
        };

    } )();

    // must be sync wiht Interpolator Type
    var ChannelType = Channel.ChannelType;

    var module = {};

    // refrence interpolator by channe enum id
    module[ ChannelType.Vec3 ] = Vec3LerpInterpolator;
    module[ ChannelType.Quat ] = QuatLerpInterpolator;
    module[ ChannelType.QuatSlerp ] = QuatSlerpInterpolator;
    module[ ChannelType.Float ] = FloatLerpInterpolator;
    module[ ChannelType.FloatCubicBezier ] = FloatCubicBezierInterpolator;
    module[ ChannelType.Vec3CubicBezier ] = Vec3CubicBezierInterpolator;

    module.Vec3LerpInterpolator = Vec3LerpInterpolator;
    module.QuatLerpInterpolator = QuatLerpInterpolator;
    module.QuatSlerpInterpolator = QuatSlerpInterpolator;
    module.FloatLerpInterpolator = FloatLerpInterpolator;
    module.FloatCubicBezierInterpolator = FloatCubicBezierInterpolator;
    module.Vec3CubicBezierInterpolator = Vec3CubicBezierInterpolator;

    return module;

} );
