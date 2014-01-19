define( [
    'osgAnimation/Channel',
    'osgAnimation/Sampler',
    'osgAnimation/Interpolator',
    'osgAnimation/QuatTarget',
    'osg/Quat'
], function ( Channel, Sampler, Interpolator, QuatTarget, Quat ) {

    var QuatLerpChannel = function ( keys, target ) {
        var sampler = new Sampler();
        if ( !keys ) {
            keys = [];
        }
        if ( !target ) {
            target = new QuatTarget();
        }
        Channel.call( this, sampler, target );
        sampler.setInterpolator( Interpolator.QuatLerpInterpolator );
        this.setKeyframes( keys );
        this._data.value = Quat.copy( target.getValue(), [] );
    };

    QuatLerpChannel.prototype = Channel.prototype;

    return QuatLerpChannel;
} );
