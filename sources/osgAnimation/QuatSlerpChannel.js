define( [
    'osgAnimation/Channel',
    'osgAnimation/QuatLerpChannel',
    'osgAnimation/Interpolator'
], function ( Channel, QuatLerpChannel, Interpolator ) {


    var QuatSlerpChannel = function ( keys, target ) {
        QuatLerpChannel.call( this, keys, target );
        this.getSampler().setInterpolator( Interpolator.QuatSlerpInterpolator );
    };

    QuatSlerpChannel.prototype = Channel.prototype;

    return QuatSlerpChannel;
} );
