define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Object',
    'osg/Quat',
    'osg/Vec3',
    'osgAnimation/Channel',
    'osgAnimation/Animation',
    'osgAnimation/Interpolator',

], function ( Notify, MACROUTILS, BaseObject, Quat, Vec3, Channel, Animation, Interpolator ) {


    var createTargetID = function( id, value) {
        return { id: id,
                 channels: [],
                 value: value
               };
    };

    /**
     *  BasicAnimationManager
     *  @class BasicAnimationManager
     */
    var BasicAnimationManager = function () {
        BaseObject.call( this );

        this._lastUpdate = undefined;

        // original animation list to initialize the manager
        this._animationsList = [];


        // contains a map with instance animation
        this._instanceAnimations = {};


        // map array index ( targetID ) to targetName;
        this._targetName = [];


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
        this._quatTargetID = [];
        this._vec3TargetID = [];
        this._floatTargetID = [];
        this._targetIDByTypes = [];
        this._targetIDByTypes.length = Object.keys(Channel.ChannelType).length;
        this._targetIDByTypes[ Channel.ChannelType.Vec3 ]  = this._vec3TargetID;
        this._targetIDByTypes[ Channel.ChannelType.Quat ]  = this._quatTargetID;
        this._targetIDByTypes[ Channel.ChannelType.Float ] = this._floatTargetID;

        // current playing animations
        this._activeAnimations = {};

        // current actives channels by types
        //   [ chanel0, channel1, ... ] // Vec3 type
        //   [ chanel2, channel3, ... ] // Quat type
        //   [ chanel5, channel6, ... ] // Float type
        this._quatActiveChannels = [];
        this._vec3ActiveChannels = [];
        this._floatActiveChannels = [];

        this._activeChannelsByTypes = [];
        this._activeChannelsByTypes.length = Object.keys(Channel.ChannelType).length;
        this._activeChannelsByTypes[ Channel.ChannelType.Vec3 ]  = this._vec3ActiveChannels;
        this._activeChannelsByTypes[ Channel.ChannelType.Quat ]  = this._quatActiveChannels;
        this._activeChannelsByTypes[ Channel.ChannelType.Float ] = this._floatActiveChannels;


    };

    /** @lends BasicAnimationManager.prototype */
    BasicAnimationManager.prototype = MACROUTILS.objectInherit( Object.prototype, {

        init: function( animations ) {

            this._animationsList = animations;
            this._instanceAnimations  = {};

            var instanceAnimationList = [];
            for ( var i = 0; i < animations.length; i++ ) {
                var animation = Animation.createInstanceAnimation( animations[ i ] );
                var name = animation.name;
                this._instanceAnimations[ name ] = animation;
                instanceAnimationList.push( animation );
            }

            // compute a map and set a targetID for each InstanceChannel
            this._targetName = Animation.initChannelTargetID( instanceAnimationList );
            this._targetID.length = 0;
            for ( i = 0; i < this._targetName.length; i++ ) {
                var type = this._targetName[i].type;

                // probably it's not a good idea here
                if ( type === Channel.ChannelType.Vec3 )
                    this._targetID.push( createTargetID( i,  Vec3.create() ) );
                else if ( type === Channel.ChannelType.Quat )
                    this._targetID.push( createTargetID( i,  Quat.create() ) );
                else if ( type === Channel.ChannelType.Float )
                    this._targetID.push( createTargetID( i,  0.0 ) );
                else
                    Notify.warn( 'osgAnimation.BasicAnimationManager unknown target type' );
            }

        },

        // add channels from instance animation to the active channels list
        addActiveChannels: function ( t, instanceAnimation ) {

            var channels = instanceAnimation.channels;
            for ( var i = 0, l = channels.length; i < l; i++ ) {
                var channel = channel[ i ];
                var type = channel.type;
                channel.t = t; // reset time
                var targetID = channel.targetID;
                this._activeChannelsByTypes[ type ].push( channel );
                this._targetID[ targetID ].channels.push( channel );
            }

        },

        removeActiveChannels: function ( instanceAnimation ) {

            // not implemented
            var channels = instanceAnimation.channels;
            for ( var i = 0, l = channels.length; i < l; i++ ) {
                var channel = channel[ i ];
                var type = channel.type;
                var targetID = channel.targetID;

                // remove channel from targetID list
                var target = this._targetID[targetID];
                var index = target.channels.indexOf ( channel );
                target.channels.splice( index, 1 );

                // remove channel from active channels
                var channelTypeList = this._activeChannelsByTypes[ type ];
                var channelIndex = channelTypeList.indexOf( channel );
                channelTypeList.splice( channelIndex, 1 );
            }

        },

        update: function ( node, nv ) {

            var t = nv.getFrameStamp().getSimulationTime();
            this.updateManager( t );
            return true;

        },

        // blend value from each channels for each target
        updateTargetType: function( targetIDList, lerp, init ) {

            for ( var i = 0, l = targetIDList.length; i < l; i++ ) {
                var affectedChannels = targetIDList[i].channels;

                if ( affectedChannels.length === 0 )
                    continue;

                var targetID = targetIDList[i].targetID;

                init( targetID.value );
                var accumulatedWeight = 0.0;

                for ( var ac = 0 ; ac < affectedChannels.length; ac++ ) {

                    var achannel = affectedChannels[i];
                    var weight = achannel.weight;
                    accumulatedWeight += weight;
                    var ratio = weight / accumulatedWeight;
                    targetID.value = lerp( ratio, targetID.value, achannel.value, targetID.value );
                }

            }

        },

        updateChannelsType: function( t, channels, interpolator ) {

            for ( var c = 0, l = channels.length; c < l; c++ ) {
                var channel = channels[ c ];
                var tlocal = t - channel.start;
                interpolator( tlocal, channel );
            }

        },

        addActiveAnimation: function ( t, cmd ) {

            this._activeAnimations[ cmd.name ] = cmd;
            var instanceAnimation = this._instanceAnimations[ cmd.name ];
            cmd.start = t;
            cmd.end = t + instanceAnimation.duration;
            this.addActiveChannels( t, instanceAnimation );

        },

        // execute start animations events
        // during the updateManager
        processStartAnimation: function( t ) {

            var animations = this._startAnimations;
            var keys = Object.keys( animations );
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[i];
                var cmd = animations[key];

                if ( this.isPlaying( cmd.name ) )
                    continue;

                this.addActiveAnimation( t, cmd );
            }

            if ( keys.length ) this._startAnimations = {};
        },


        updateManager: function ( t ) {


            // adds active animations / channels requested
            //
            this.processStartAnimation(t);

            // update all actives channels by type
            //
            this.updateChannelsType( t, this._vec3ActiveChannels, Interpolator.Vec3LerpInterpolator );
            this.updateChannelsType( t, this._quatActiveChannels, Interpolator.QuatLerpInterpolator );
            this.updateChannelsType( t, this._floatActiveChannels, Interpolator.FloatLerpInterpolator );


            // update targets
            //
            this.updateTargetType( this._quatTargetID, Quat.lerp, Quat.init );
            this.updateTargetType( this._vec3TargetID, Vec3.lerp, Vec3.init );
            this.updateTargetType( this._floatTargetID,
                function ( t, a, b ) {
                    return a + ( b - a ) * t;
                },
                function () {
                    return 0.0;
                } );


            // check animation finished
            this.removeFinishedAnimation( t );
        },

        removeFinishedAnimation: function( t ) {
            var keys = Object.keys( this._activeAnimations );

            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[i];
                var cmd = this._activeAnimations[ key ];

                if ( t > cmd.end ) {
                    var instanceAnimation = this._instanceAnimations[ key ];
                    this.removeActiveChannels( instanceAnimation );
                    this._instanceAnimations[key] = undefined;
                }
            }
        },

        isPlaying: function ( name ) {
            if ( this._activeAnimations[name] ) return true;
            return false;
        },


        // play animation using object as config
        // {
        //     name: string,
        //     priority: 0,
        //     weight: 1.0,
        //     timeFactor: 1.0,
        //     loop: 0 // 0 means infinite, 1 means play once
        // }
        playAnimationObject: function ( obj ) {

            var anim = this._instanceAnimations[ obj.name ];
            if ( !anim ) {
                Notify.info( 'no animation ' + obj.name + ' found' );
                return;
            }

            if ( this.isPlaying( obj.name ) ) return;

            if ( obj.priority === undefined ) obj.priority = 0;
            if ( obj.weight === undefined ) obj.weight = 1.0;
            if ( obj.timeFactor === undefined ) obj.timeFactor = 1.0;
            if ( obj.loop === undefined ) obj.loop = 0;

            this._startAnimations[obj.name] = obj;
        },


        // if first argument is an object
        // playAnimationObject is called instead
        playAnimation: function ( name, priority, weight ) {

            var animationObject;
            if ( typeof name === 'object' )
                animationObject = name;
            else {
                animationObject = {
                    'name': name,
                    'priority': priority,
                    'weight': weight
                };
            }

            return this.playAnimationObject( animationObject );
        },


        getAnimations: function () {
            return this._instanceAnimations;
        }


    } );

    return BasicAnimationManager;
} );
