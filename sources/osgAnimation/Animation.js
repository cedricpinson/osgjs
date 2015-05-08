define( [
    'osg/Utils',
    'osg/Object',
    'osgAnimation/Channel',

], function ( MACROUTILS, Object, Channel ) {

    // create Animation data
    // Animation {
    //     channels: [],
    //     duration: 0.0;
    //     start: 0.0,
    //     end: 1.0
    // },

    // assume that iniChannel has been called
    // on each channel
    var createAnimation = function( channels ) {

        var min = Infinity;
        var max = -Infinity;
        for ( var i = 0 ; i < channels.length; i ++ ) {
            min = Math.min( min, channels[i].start );
            max = Math.max( max, channels[i].end );
        }

        var duration = max - min;

        return {
            channels: channels,
            duration: duration,
            start: min,
            end: max
        };
    };

    // create instance Animation data. An instance animation
    // contains instance channels instead of original channels
    // Animation {
    //     channels: [],
    //     duration: 0.0;
    //     start: 0.0,
    //     end: 1.0
    // },
    var createInstanceAnimation = function( animation ) {

        var channels = [];
        for ( var i = 0; i < animation.channels.length; i++ ) {
            var channel = Channel.createActiveChannel( animation.channels[i] );
            channels.push( channel );
        }

        return {
            channels: channels,
            duration: animation.duration,
            start: animation.start,
            end: animation.end
        };
    };








    var Animation = {};
    Animation.createAnimation = createAnimation;
    Animation.createInstanceAnimation = createInstanceAnimation;

    return Animation;
} );
