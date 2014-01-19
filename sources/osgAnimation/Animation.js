define( [
    'osg/Utils',
    'osg/Object'
], function ( MACROUTILS, Object ) {

    /**
     *  Animation
     *  @class Animation
     */
    var Animation = function () {
        Object.call( this );
        this._channels = [];
    };

    /** @lends Animation.prototype */
    Animation.prototype = MACROUTILS.objectInehrit( Object.prototype, {
        getChannels: function () {
            return this._channels;
        },
        getDuration: function () {
            var tmin = 1e5;
            var tmax = -1e5;
            for ( var i = 0, l = this._channels.length; i < l; i++ ) {
                var channel = this._channels[ i ];
                tmin = Math.min( tmin, channel.getStartTime() );
                tmax = Math.max( tmax, channel.getEndTime() );
            }
            return tmax - tmin;
        }

    } );

    return Animation;
} );
