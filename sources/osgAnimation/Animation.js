define( [
    'osg/Utils',
    'osg/Object',
    'osgAnimation/Channel',

], function ( MACROUTILS, Object, Channel ) {

    'use strict';

    // create Animation data
    // Animation {
    //     channels: [],
    //     duration: 0.0;
    //     name: string
    // },

    var animationCount = 0;

    // assume that iniChannel has been called
    // on each channel
    var createAnimation = function ( channels, name ) {

        var min = Infinity;
        var max = -Infinity;
        for ( var i = 0; i < channels.length; i++ ) {
            min = Math.min( min, channels[ i ].start );
            max = Math.max( max, channels[ i ].end );
        }

        var duration = max - min;
        var animationName = name || ( 'animation' + animationCount.toString() );
        animationCount++;
        return {
            channels: channels,
            duration: duration,
            name: animationName
        };
    };

    // create instance Animation data. An instance animation
    // contains instance channels instead of original channels
    // Animation {
    //     channels: [],
    //     duration: 0.0;
    //     start: 0.0, // used to know when an animation has been started
    //     name: string
    // },
    var createInstanceAnimation = function ( animation ) {

        var channels = [];
        for ( var i = 0; i < animation.channels.length; i++ ) {
            var channel = Channel.createInstanceChannel( animation.channels[ i ] );
            channels.push( channel );
        }

        return {
            channels: channels,
            duration: animation.duration,
            start: 0.0,
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
    var registerChannelTargetID = function ( animations, targetList, targetMap ) {

        var newTargetAdded = [];

        for ( var i = 0; i < animations.length; i++ ) {

            var animation = animations[ i ];
            var instanceChannels = animation.channels;

            for ( var c = 0; c < instanceChannels.length; c++ ) {

                var instanceChannel = instanceChannels[ c ];
                var channel = instanceChannel.channel;

                var targetName = channel.target;
                var name = channel.name; // translate, rotateX, rotateY, rotateZ, ...
                var type = channel.type;

                // compute a unique name for targetID
                var uniqueTargetName = targetName + '.' + name;

                // not yet in the map create an id from the array size
                if ( !targetMap[ uniqueTargetName ] ) {
                    var id = targetList.length;
                    instanceChannel.targetID = id; // set the target ID in the channel
                    var target = {
                        target: uniqueTargetName,
                        targetID: id,
                        type: type
                    };
                    targetMap[ uniqueTargetName ] = target;
                    targetList.push( target );
                    newTargetAdded.push( target );
                } else {
                    //if there is more than one channel for the same target, we set the targetID already created
                    instanceChannel.targetID = targetMap[ uniqueTargetName ].targetID;
                }
            }
        }

        return newTargetAdded;
    };

    var Animation = function () {};

    Animation.createAnimation = createAnimation;
    Animation.createInstanceAnimation = createInstanceAnimation;
    Animation.registerChannelTargetID = registerChannelTargetID;

    return Animation;
} );
