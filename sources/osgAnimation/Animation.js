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
    //     end: 1.0,
    //     name: string
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
    //     end: 1.0,
    //     name: string
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
            end: animation.end,
            name: animation.name
        };
    };




    // create an targetID for all target used by animations
    // use an array of instance animation in inputs
    // [ {
    //     channels: [],
    //     duration: 0.0;
    //     start: 0.0,
    //     end: 1.0
    // }, ... ]
    //
    // return an array that contains targetName
    // id is the index of the array
    //
    // [ "bone0",
    //   "bone1",
    //   ... ]
    //
    var initChannelTargetID = function ( animations ) {

        var targetMap = {};
        var array = [];

        for ( var i = 0; i < animations.length; i++ ) {

            var animation = animations[ i ];
            var instanceChannels = animation.channels;

            for ( var c = 0; c < instanceChannels.length; c++ ) {

                var target = instanceChannels[ c ].channel.target;

                // not yet in the map create an id from the array size
                if ( targetMap[ target ] === undefined ) {
                    var id = array.length;
                    array.push( target );
                    instanceChannels[ c ].targetID = id;
                    targetMap[ target ] = target;
                }
            }
        }

        return array;
    };



    var Animation = {};
    Animation.createAnimation = createAnimation;
    Animation.createInstanceAnimation = createInstanceAnimation;
    Animation.initChannelTargetID = initChannelTargetID;

    return Animation;
} );
