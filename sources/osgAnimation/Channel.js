define( [
    'osg/Utils',
    'osg/Object',
    'osg/Vec3',
    'osg/Quat'

], function ( MACROUTILS, Object, Vec3, Quat ) {

    var ChannelType = {
        Vec3: 0,
        Quat: 1,
        Float: 2
    };



    var Channel = function ( sampler, target ) {
        Object.call( this );
        this._sampler = sampler;
        this._target = target;
        this._targetName = undefined;

        this._data = {
            keys: undefined,
            value: undefined,
            t: 0.0,
            key: 0
        };

    };

    // channel {
    //     keys: [],
    //     times: [],
    //     type: enum,
    //     target: targetName
    // }
    // init a channel with extra field
    // start, end, duration
    var initChannel = function( channel ) {
        channel.start = channel.times[0];
        channel.end = channel.times[channel.times.length-1];
        channel.duration = channel.end - channel.start;
        return channel;
    };

    var createVec3Channel = function( keys, times ) {
        var channel = {
            type: ChannelType.Vec3,
            keys: keys,
            times: times
        };
        return initChannel( channel );
    };

    var createFloatChannel = function( keys, times ) {
        var channel = {
            type: ChannelType.Float,
            keys: keys,
            times: times
        };
        return initChannel( channel );
    };

    var createQuatChannel = function( keys, times ) {
        var channel = {
            type: ChannelType.Quat,
            keys: keys,
            times: times
        };
        return initChannel( channel );
    };

    // channel contains {
    //     keys: [],
    //     times: [],
    //     start: 0.0,
    //     end: 1.0,
    // }
    // return {
    //     channel: channel,
    //     value: Vec3.create(),
    //     targetID: int,
    //     key: 0,
    //     t: 0,
    // }
    var createInstanceVec3Channel = function( channel ) {
        return {
            channel: channel,
            value: Vec3.create(),
            targetID: 0,
            weight: 1,
            key: 0,
            start: 0.0,
            end: 0.0
        };
    };

    var createInstanceQuatChannel = function( channel ) {
        return {
            channel: channel,
            value: Quat.create(),
            targetID: 0,
            weight: 1,
            key: 0,
            start: 0.0,
            end: 0.0
        };
    };

    var createInstanceFloatChannel = function( channel ) {
        return {
            channel: channel,
            value: 0.0,
            targetID: 0,
            weight: 1,
            key: 0,
            start: 0.0, // global time when the animation has started
            end: 0.0 // global time when the animation will be finished
        };
    };

    // create an instance channel from type
    var createInstanceChannel = function( channel ) {
        return Channel[channel.type](channel);
    };


    /** @lends Channel.prototype */
    Channel.prototype = MACROUTILS.objectInherit( Object.prototype, {
        getKeyframes: function () {
            return this._sampler.getKeyframes();
        },
        setKeyframes: function ( keys ) {
            this._sampler.setKeyframes( keys );
        },
        getStartTime: function () {
            return this._sampler.getStartTime();
        },
        getEndTime: function () {
            return this._sampler.getEndTime();
        },
        getSampler: function () {
            return this._sampler;
        },
        setSampler: function ( sampler ) {
            this._sampler = sampler;
        },
        getTarget: function () {
            return this._target;
        },
        setTarget: function ( target ) {
            this._target = target;
        },
        setTargetName: function ( name ) {
            this._targetName = name;
        },
        getTargetName: function () {
            return this._targetName;
        },
        update: function ( t, weight, priority ) {
            weight = weight || 1.0;
            priority = priority || 0.0;

            // skip if weight == 0
            if ( weight < 1e-4 )
                return;
            var data = this._data;
            this._sampler.getValueAt( t, data );
            this._target.update.call( this._target, weight, data.value, priority );
        },
        reset: function () {
            this._target.reset();
        }
    } );





    // animations instances
    /*

     |-----------------| anim0 (channel0_0, channel0_1 )
               |--------------| anim1 (channel1_0, channel1_1, channel1_2 )

     // si triage a cause de la priorité
     // iterate on priority
     // and for animations of the same priority


     // init d'une animation

     // init du manager
     //   createInstanceAnimation pour chaque animations
     //      createInstanceChannels pour chaque animation

     //   initChannelTargetID pour toute les animations du manager
     //      id -> targetName




     // get target for an animation to push on target list ( to blend )
     var targets = {};
     for ( var i = 0 ; i < channels.length; i++ ) {
        var target = channels[i].target;
        targets[target].push( channels[i] );
     }


     // pour l'instant on ignore les pb d'organisation de priorité
     //
     // target X : [
     //      ChannelAnima0_0
     //      ChannelAnima1_0
     // ]

     // target Y : [
     //      ChannelAnima0_1
     //      ChannelAnima1_1
     // ]


     */


    // for a target compute each channel contribution
    // channel0, value0, w, priority0
    // channel1, value1, w, priority0
    // channel2, value2, w, priority0


    // channel0, value0, w, priority1
    // channel1, value1, w, priority1
    // channel2, value2, w, priority1

    /*

     var value;
     Copy( channels[0].value, value );
     var weight = 0.0;
     var priority = channels[0].priority;
     var priorityWeight = channels[0].weight;

     for ( var i = 1; i < channels.length; i++ ) {

         if ( priority !== channels[i].priority ) {
              weight += priorityWeight * ( 1.0 - weight );
              priorityWeight = 0.0;
              priority = channels[i].priority;
         }

         priorityWeight += weight;
         t = ( 1.0 - weight ) * channels[i].weight / priorityWeight;
         lerp( t, value, channels[i].value );
     }


     // second version

     var value;
     Copy( channels[0].value, value );
     var weight = 0; //channels[0].weight;
     //var priority = channels[0].priority;
     var priorityWeight = 0;

     for ( var i = 0; i < channels.length; i++ ) {

         if ( priority !== channels[i].priority ) {
              weight += priorityWeight * ( 1.0 - weight );
              priorityWeight = 0.0;
              priority = channels[i].priority;
         }

         priorityWeight += weight;
         t = ( 1.0 - weight ) * channels[i].weight / priorityWeight;
         lerp( t, value, channels[i].value );
     }



     */

    Channel.createInstanceChannel = createInstanceChannel;
    Channel.createInstanceVec3Channel = createInstanceVec3Channel;
    Channel.createInstanceQuatChannel = createInstanceQuatChannel;
    Channel.createInstanceFloatChannel = createInstanceFloatChannel;

    Channel.createVec3Channel = createVec3Channel;
    Channel.createQuatChannel = createQuatChannel;
    Channel.createFloatChannel = createFloatChannel;

    Channel[ ChannelType.Vec3 ] = createInstanceVec3Channel;
    Channel[ ChannelType.Quat ] = createInstanceQuatChannel;
    Channel[ ChannelType.Float ] = createInstanceFloatChannel;

    Channel.ChannelType = ChannelType;


    return Channel;
} );
