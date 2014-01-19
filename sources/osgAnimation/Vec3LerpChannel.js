define( [
    'osgAnimation/Channel',
    'osgAnimation/Sampler',
    'osgAnimation/Interpolator',
    'osgAnimation/Vec3Target',
    'osg/Vec3'
], function ( Channel, Sampler, Interpolator, Vec3Target, Vec3 ) {

    var Vec3LerpChannel = function ( keys, target ) {
        var sampler = new Sampler();
        if ( !keys ) {
            keys = [];
        }
        if ( !target ) {
            target = new Vec3Target();
        }
        Channel.call( this, sampler, target );
        sampler.setInterpolator( Interpolator.Vec3LerpInterpolator );
        this.setKeyframes( keys );
        this._data.value = Vec3.copy( target.getValue(), [] );
    };

    Vec3LerpChannel.prototype = Channel.prototype;

    return Vec3LerpChannel;
} );
