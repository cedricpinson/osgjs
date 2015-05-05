define( [
    'osgAnimation/Channel',
    'osgAnimation/Sampler',
    'osgAnimation/Interpolator',
    'osgAnimation/Vec3Target'
], function ( Channel, Sampler, Interpolator, Vec3Target ) {

    var Vec3CubicBezierChannel = function ( keys, target ) {
        var sampler = new Sampler();
        if ( !keys ) {
            keys = [];
        }
        if ( !target ) {
            target = new Vec3Target();
        }
        Channel.call( this, sampler, target );
        sampler.setInterpolator( Interpolator.Vec3CubicBezierInterpolator );
        this.setKeyframes( keys );
        this._data.value = target.getValue();
    };

    Vec3CubicBezierChannel.prototype = Channel.prototype;

    return Vec3CubicBezierChannel;
} );
