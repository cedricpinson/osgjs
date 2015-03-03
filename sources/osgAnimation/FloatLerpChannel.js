define( [
    'osgAnimation/Channel',
    'osgAnimation/Sampler',
    'osgAnimation/Interpolator',
    'osgAnimation/FloatTarget'
], function ( Channel, Sampler, Interpolator, FloatTarget ) {

    var FloatLerpChannel = function ( keys, target ) {
        var sampler = new Sampler();
        if ( !keys ) {
            keys = [];
        }
        if ( !target ) {
            target = new FloatTarget();
        }
        Channel.call( this, sampler, target );
        sampler.setInterpolator( Interpolator.FloatLerpInterpolator );
        this.setKeyframes( keys );
        this._data.value = target.getValue();
    };

    FloatLerpChannel.prototype = Channel.prototype;

    return FloatLerpChannel;
} );
