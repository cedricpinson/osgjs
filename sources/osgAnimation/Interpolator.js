define( [

], function () {

    var Vec3CopyKeyFrame = function( i, keys, result ) {
        var index = i;
        result[ 0 ] = keys[index++];
        result[ 1 ] = keys[index++];
        result[ 2 ] = keys[index++];
    };

    var Vec4CopyKeyFrame = function( i, keys, result ) {
        var index = i;
        result[ 0 ] = keys[index++];
        result[ 1 ] = keys[index++];
        result[ 2 ] = keys[index++];
        result[ 3 ] = keys[index++];
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


    var QuatLerpInterpolator = function ( t, channelInstance ) {

        var channel = channelInstance.channel;
        var value = channelInstance.value;
        var start = channel.start;
        var end = channel.end;
        var keys = channel.keys;
        var times = channel.times;

        if ( t >= end ) {
            channelInstance.key = 0;
            Vec4CopyKeyFrame( keys.length-4, keys, value );
            return;

        } else if ( t <= start ) {
            channelInstance.key = 0;
            Vec4CopyKeyFrame( 0, keys, value );
            return;
        }

        var i1 = channelInstance.key;
        while ( times[ i1 + 1 ] < t ) i1++;


        var t1 = times[ i1 ];
        var t2 = times[ i1 + 1 ];

        var index = i1 * 4;
        var x1 = keys[ index++ ];
        var y1 = keys[ index++ ];
        var z1 = keys[ index++ ];
        var w1 = keys[ index++ ];

        var x2 = keys[ index++ ];
        var y2 = keys[ index++ ];
        var z2 = keys[ index++ ];
        var w2 = keys[ index++ ];

        var r = ( t - t1 ) / ( t2 - t1 );

        value[ 0 ] = x1 + ( x2 - x1 ) * r;
        value[ 1 ] = y1 + ( y2 - y1 ) * r;
        value[ 2 ] = z1 + ( z2 - z1 ) * r;
        value[ 3 ] = w1 + ( w2 - w1 ) * r;
        channelInstance.key = i1;
    };


    var FloatLerpInterpolator = function ( t, channelInstance ) {

        var channel = channelInstance.channel;
        var value = channelInstance.value;
        var start = channel.start;
        var end = channel.end;
        var keys = channel.keys;
        var times = channel.times;

        if ( t >= end ) {
            channelInstance.key = 0;
            channelInstance.value = keys[ keys.length-1 ] ;
            return;

        } else if ( t <= start ) {
            channelInstance.key = 0;
            channelInstance.value = keys[ 0 ] ;
            return;
        }

        var i1 = channelInstance.key;
        while ( times[ i1 + 1 ] < t ) i1++;


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

    return {
        Vec3LerpInterpolator: Vec3LerpInterpolator,
        QuatLerpInterpolator: QuatLerpInterpolator,
        FloatLerpInterpolator: FloatLerpInterpolator
    };
} );
