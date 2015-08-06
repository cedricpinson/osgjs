define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Object',
    'osg/Quat',
    'osg/Vec3',
    'osgAnimation/Channel',
    'osgAnimation/Animation',
    'osgAnimation/Interpolator',
    'osgAnimation/CollectAnimationUpdateCallbackVisitor',

], function ( Notify, MACROUTILS, BaseObject, Quat, Vec3, Channel, Animation, Interpolator, CollectAnimationUpdateCallbackVisitor ) {

    'use strict';

    var createTargetID = function ( id, value ) {
        return {
            id: id,
            channels: [],
            value: value
        };
    };

    var Float = {
        lerp: function ( t, a, b ) {
            return a + ( b - a ) * t;
        },
        init: function () {
            return 0.0;
        },
        create: function () {
            return 0.0;
        }
    };


    var ResultType = [];
    ResultType.length = Channel.ChannelType.Count;
    ResultType[ Channel.ChannelType.Vec3 ] = Vec3;
    ResultType[ Channel.ChannelType.Quat ] = Quat;
    ResultType[ Channel.ChannelType.QuatSlerp ] = Quat;
    ResultType[ Channel.ChannelType.Float ] = Float;
    ResultType[ Channel.ChannelType.FloatCubicBezier ] = Float;
    ResultType[ Channel.ChannelType.Vec3CubicBezier ] = Vec3;

    /**
     *  BasicAnimationManager
     *  @class BasicAnimationManager
     */
    var BasicAnimationManager = function () {
        BaseObject.call( this );

        this._simulationTime = 0.0;
        this._pauseTime = 0.0;
        this._timeFactor = 1.0;
        this._startTime = 0.0;

        // contains a map with instance animations
        this._instanceAnimations = {};

        // animations to start
        this._startAnimations = {};

        // map array index ( targetID ) to targets:
        // {
        //    type: enum
        //    target: name
        // }
        this._targets = [];
        this._targetsMap = {};

        // targetID contains an array of all target id valid for this manager
        // [
        //     { id: 0,
        //       channels: [],
        //       value: 0.0
        //     },
        //     ...
        // ];
        this._targetID = [];

        // target id with active lists
        // [
        //   Vec3: [ targetID0, targetID1 ]
        //   Quat: [ targetID2, targetID3,  ... ]
        //   Float: [ ... ]
        // ]
        this._targetIDByTypes = [];
        this._targetIDByTypes.length = Channel.ChannelType.Count;
        for ( var i = 0; i < this._targetIDByTypes.length; i++ ) {
            this._targetIDByTypes[ i ] = [];
        }

        // current playing animations
        this._activeAnimations = {};
        this._activeAnimationList = [];

        // current actives channels by types
        //   [ chanel0, channel1, ... ] // Vec3 type
        //   [ chanel2, channel3, ... ] // Quat type
        //   [ chanel5, channel6, ... ] // Float type
        this._activeChannelsByTypes = [];
        this._activeChannelsByTypes.length = Channel.ChannelType.Count;
        for ( i = 0; i < this._activeChannelsByTypes.length; i++ ) {
            this._activeChannelsByTypes[ i ] = [];
        }

        // assign all target/channel in animationCallback
        // then they can read it directly
        // animation callback to update
        this._animationsUpdateCallback = {};
        this._animationsUpdateCallbackArray = [];

        //Pause status (true / false)
        this._pause = false;

        this._dirty = false;

        this._seekTime = -1;
    };

    BasicAnimationManager.prototype = MACROUTILS.objectInherit( BaseObject.prototype, {

        init: function ( animations ) {

            // reset all
            this._simulationTime = 0.0;
            this._pauseTime = 0.0;
            this._timeFactor = 1.0;
            this._startTime = 0.0;

            // contains a map with instance animations
            this._instanceAnimations = {};

            // animations to start
            this._startAnimations = {};

            this._targets.length = 0;
            this._targetsMap = {};

            this._targetID.length = 0;

            var i;
            for ( i = 0; i < this._targetIDByTypes.length; i++ )
                this._targetIDByTypes[ i ].length = 0;

            this._activeAnimations = {};
            this._activeAnimationList.length = 0;

            for ( i = 0; i < this._activeChannelsByTypes; i++ )
                this._activeChannelsByTypes[ i ].length = 0;

            this._animationsUpdateCallback = {};
            this._animationsUpdateCallbackArray.length = 0;

            this._pause = false;
            this._seekTime = -1;

            // add animations
            this.addAnimations( animations );
        },

        addAnimations: function ( animations ) {

            // instanceAnimation added
            var instanceAnimationList = this._addAnimation( animations );

            // compute a map and set a targetID for each InstanceChannel from
            // instanceAnimationList
            var newTargetAdded = Animation.registerChannelTargetID( instanceAnimationList, this._targets, this._targetsMap );

            // register targetID per type
            for ( var i = 0; i < newTargetAdded.length; i++ ) {
                var type = newTargetAdded[ i ].type;
                this._targetID.push( createTargetID( i, ResultType[ type ].create() ) );
            }

            this._dirty = true;
        },

        update: function ( node, nv ) {

            if ( this._dirty ) {
                this._findAnimationUpdateCallback( node );
                this._assignTargetToAnimationCallback();
                this._dirty = false;
            }

            var t = nv.getFrameStamp().getSimulationTime();

            if ( this._seekTime !== -1 )
                this._pauseTime = -this._seekTime + this._startTime + t;
            this._seekTime = -1;

            if ( !this._pause ) { // Not in pause
                this._simulationTime = this._startTime + ( t - this._pauseTime );
            } else {
                this._pauseTime = ( t - this._simulationTime + this._startTime );
            }

            this.updateManager( this._simulationTime * this._timeFactor );
            return true;
        },

        updateManager: function ( t ) {


            // adds active animations / channels requested
            //
            this._processStartAnimation( t );

            var i, l = Channel.ChannelType.Count;
            // update all actives channels by type
            //
            for ( i = 0; i < l; i++ ) {
                var activeChannelType = this._activeChannelsByTypes[ i ];
                this._updateChannelsType( t, activeChannelType, Interpolator[ i ] );
            }

            // update targets
            //
            for ( i = 0; i < l; i++ ) {
                var targetType = this._targetIDByTypes[ i ];
                this._updateTargetType( targetType, ResultType[ i ].lerp, ResultType[ i ].init );
            }


            // update all animation callback
            // expect to have UpdateMatrixTransform
            for ( i = 0, l = this._animationsUpdateCallbackArray.length; i < l; i++ ) {
                var animCallback = this._animationsUpdateCallbackArray[ i ];
                animCallback.computeChannels();
            }

            // check animation finished
            this._removeFinishedAnimation( t );
        },

        togglePause: function () { //Pause the manager's time
            this._pause = !this._pause;
            // if we resume an animation we don't want to move forward the animation
            if ( !this._pause )
                this._seekTime = this._simulationTime;
        },

        getSimulationTime: function () {
            return this._simulationTime;
        },

        setSimulationTime: function ( t ) {
            this._simulationTime = t;
        },

        setSeekTime: function ( t ) {
            this._simulationTime = t;
            this._seekTime = t;
        },

        stopAnimation: function ( name ) {
            var activeAnimationList = this._activeAnimationList;
            for ( var i = 0, nbAnim = activeAnimationList.length; i < nbAnim; ++i ) {
                if ( activeAnimationList[ i ].name === name ) {
                    this._removeActiveChannels( this._instanceAnimations[ name ] );
                    this._activeAnimations[ name ] = undefined;
                    activeAnimationList.splice( i, 1 );
                    return;
                }
            }
        },

        stopAllAnimation: function () {
            var activeAnimationList = this._activeAnimationList;
            for ( var i = 0, nbAnim = activeAnimationList.length; i < nbAnim; ++i ) {
                var name = activeAnimationList[ i ].name;
                this._removeActiveChannels( this._instanceAnimations[ name ] );
                this._activeAnimations[ name ] = undefined;
            }
            activeAnimationList.length = 0;
        },

        setTimeFactor: function ( timeFactor ) {
            var tf = timeFactor / this._timeFactor;
            this._startTime += ( this._simulationTime - this._simulationTime * tf ) / tf;

            this._timeFactor = timeFactor;

            if ( this._pause )
                this._simulationTime += ( this._simulationTime - this._simulationTime * tf ) / tf;
        },

        getTimeFactor: function () {
            return this._timeFactor;
        },

        isPlaying: function ( name ) {
            if ( this._activeAnimations[ name ] ) return true;
            return false;
        },

        // play animation using object as config
        // {
        //     name: string,
        //     priority: 0,
        //     weight: 1.0,
        //     loop: true / false
        // }
        playAnimationObject: function ( obj ) {

            var anim = this._instanceAnimations[ obj.name ];
            if ( !anim ) {
                Notify.info( 'no animation ' + obj.name + ' found' );
                return;
            }

            if ( this.isPlaying( obj.name ) ) return;

            anim.priority = ( obj.priority === undefined ) ? 0 : obj.priority;
            anim.weight = ( obj.weight === undefined ) ? 1.0 : obj.weight;
            anim.loop = ( obj.loop === undefined ) ? true : obj.loop;

            this._startAnimations[ anim.name ] = anim;
        },

        // if first argument is an object
        // playAnimationObject is called instead
        playAnimation: function ( name, loop, priority, weight ) {

            var animationObject;
            if ( typeof name === 'object' )
                animationObject = name;
            else {
                animationObject = {
                    name: name,
                    priority: priority,
                    weight: weight,
                    loop: loop
                };
            }

            return this.playAnimationObject( animationObject );
        },

        getAnimations: function () {
            return this._instanceAnimations;
        },


        _findAnimationUpdateCallback: function ( node ) {
            var collector = new CollectAnimationUpdateCallbackVisitor();
            node.accept( collector );
            this._animationsUpdateCallback = collector.getAnimationUpdateCallbackMap();
        },


        // assignTargetToAnimationCallback
        //
        // check all animationUpdateCallback collected and try to
        // assign the channel instance registered in the manager. If a
        // animationUpdateCallback contains channels not known by the
        // manager we skip it.  It means that it should be called
        // after the animations has been registered into the animation
        // manager
        _assignTargetToAnimationCallback: function () {

            this._animationsUpdateCallbackArray.length = 0;
            var animationsUpdateCallback = this._animationsUpdateCallback;

            var keys = Object.keys( animationsUpdateCallback );
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[ i ];
                var animationUpdateCallback = animationsUpdateCallback[ key ];
                var targetName = animationUpdateCallback.getName();
                // loop over
                if ( animationUpdateCallback.getStackedTransforms ) {
                    var channels = animationUpdateCallback.getStackedTransforms();

                    var nbChannelsRegistered = 0;
                    for ( var a = 0; a < channels.length; a++ ) {
                        var channel = channels[ a ];
                        var name = channels[ a ].getName();
                        var uniqueTargetName = targetName + '.' + name;

                        // if not target id in animation manager skip
                        var target = this._targetsMap[ uniqueTargetName ];
                        if ( target === undefined ) {
                            Notify.warn( 'target id ' + uniqueTargetName + ' (' + name + ') not found in manager' );
                            continue;
                        }
                        nbChannelsRegistered++;
                        // assign the channel instance with value into the animation update callback
                        channel.setTarget( this._targetID[ target.targetID ] );
                    }

                    // keep list of updateCallback to update if they contains channel to compute
                    if ( nbChannelsRegistered ) this._animationsUpdateCallbackArray.push( animationUpdateCallback );

                } else {
                    Notify.warn( 'animation callback type not recognized' );
                }
            }
        },

        _addAnimation: function ( animations ) {

            var instanceAnimationList = [];
            for ( var i = 0; i < animations.length; i++ ) {

                var animation = animations[ i ];
                var animationName = animation.name;

                if ( this._instanceAnimations[ animationName ] )
                    continue;

                var instanceAnimation = Animation.createInstanceAnimation( animation );
                this._instanceAnimations[ animationName ] = instanceAnimation;
                instanceAnimationList.push( instanceAnimation );
            }

            return instanceAnimationList;
        },

        // add channels from instance animation to the active channels list
        _addActiveChannels: function ( t, instanceAnimation ) {

            var instanceChannels = instanceAnimation.channels;
            for ( var i = 0, l = instanceChannels.length; i < l; i++ ) {
                var instanceChannel = instanceChannels[ i ];
                var type = instanceChannel.channel.type;
                instanceChannel.t = t; // reset time
                instanceChannel.instanceAnimation = instanceAnimation; // link with parent animation
                var targetID = instanceChannel.targetID;
                this._activeChannelsByTypes[ type ].push( instanceChannel );
                this._targetID[ targetID ].channels.push( instanceChannel );
                this._targetIDByTypes[ type ].push( targetID );
            }

        },

        _removeActiveChannels: function ( instanceAnimation ) {

            var instanceChannels = instanceAnimation.channels;
            for ( var i = 0, l = instanceChannels.length; i < l; i++ ) {
                var instanceChannel = instanceChannels[ i ];
                var type = instanceChannel.channel.type;
                var targetID = instanceChannel.targetID;

                // remove channel instance from targetID channel list
                var targetChannelsList = this._targetID[ targetID ].channels;
                var index = targetChannelsList.indexOf( instanceChannel );
                targetChannelsList.splice( index, 1 );

                // remove targetID from this._targetIDByTypes
                var targetIDListForType = this._targetIDByTypes[ type ];
                index = targetIDListForType.indexOf( targetID );
                targetIDListForType.splice( index, 1 );

                // remove channel from active channels
                var channelTypeList = this._activeChannelsByTypes[ type ];
                var channelIndex = channelTypeList.indexOf( instanceChannel );
                channelTypeList.splice( channelIndex, 1 );
            }

        },

        // blend value from each channels for each target
        _updateTargetType: function ( targetIDList, lerp, init ) {

            for ( var i = 0, l = targetIDList.length; i < l; i++ ) {

                var targetID = targetIDList[ i ];
                var target = this._targetID[ targetID ];

                var affectedChannels = target.channels;
                if ( affectedChannels.length === 0 )
                    continue;

                target.value = init( target.value );
                var accumulatedWeight = 0.0;

                for ( var ac = 0; ac < affectedChannels.length; ac++ ) {

                    var achannel = affectedChannels[ ac ];
                    var weight = achannel.weight;
                    accumulatedWeight += weight;
                    var ratio = weight / accumulatedWeight;
                    target.value = lerp( ratio, target.value, achannel.value, target.value );
                }

            }

        },

        _updateChannelsType: function ( t, channels, interpolator ) {

            for ( var c = 0, l = channels.length; c < l; c++ ) {
                var channel = channels[ c ];
                var instanceAnimation = channel.instanceAnimation;
                var loop = instanceAnimation.loop;

                var tLocal = t - channel.t;

                // handle loop, careful in case animation is one frame
                if ( loop && instanceAnimation.duration > 0.0 ) tLocal = tLocal % instanceAnimation.duration;

                interpolator( tLocal, channel );
            }
        },

        _removeFinishedAnimation: function ( t ) {

            var activeAnimationList = this._activeAnimationList;

            var i = 0;
            while ( i < activeAnimationList.length ) {
                var instanceAnimation = activeAnimationList[ i ];
                var name = instanceAnimation.name;

                if ( t > instanceAnimation.end && instanceAnimation.loop === false ) {
                    this._removeActiveChannels( instanceAnimation );
                    this._activeAnimations[ name ] = undefined;
                    activeAnimationList.splice( i, 1 );
                } else {
                    i++;
                }
            }
        },

        _addActiveAnimation: function ( t, cmd ) {

            this._activeAnimations[ cmd.name ] = cmd; // set animation in the list of active one

            var instanceAnimation = this._instanceAnimations[ cmd.name ];
            instanceAnimation.start = t;
            instanceAnimation.end = t + instanceAnimation.duration;
            this._addActiveChannels( t, instanceAnimation );

            // keep track of instance animation active in a list
            this._activeAnimationList.push( instanceAnimation );
        },

        // execute start animations events
        // during the updateManager
        _processStartAnimation: function ( t ) {

            var animations = this._startAnimations;
            var keys = Object.keys( animations );
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[ i ];
                var cmd = animations[ key ];
                var name = cmd.name;

                if ( this.isPlaying( name ) )
                    continue;

                this._addActiveAnimation( t, cmd );
            }

            if ( keys.length ) this._startAnimations = {};
        }


    } );

    return BasicAnimationManager;
} );
