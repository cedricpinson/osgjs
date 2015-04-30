define( [
    'osgAnimation/Channel',
    'osgAnimation/Sampler',
    'osgAnimation/Interpolator',
    'osgAnimation/FloatTarget'
], function ( Channel, Sampler, Interpolator, FloatTarget ) {

    var FloatCubicBezierChannel = function ( keys, target ) {
        var sampler = new Sampler();
        if ( !keys ) {
            keys = [];
        }
        if ( !target ) {
            target = new FloatTarget();
        }
        Channel.call( this, sampler, target );
        // /!\ Interpolator
        sampler.setInterpolator( Interpolator.FloatCubicBezierInterpolator );
        this.setKeyframes( keys );
        this._data.value = target.getValue();
    };

    FloatCubicBezierChannel.prototype = Channel.prototype;

    return FloatCubicBezierChannel;
} );
