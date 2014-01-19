define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Object'
], function ( Notify, MACROUTILS, Object ) {

    /**
     *  AnimationUpdateCallback
     *  @class AnimationUpdateCallback
     */
    var AnimationUpdateCallback = function () {};

    /** @lends AnimationUpdateCallback.prototype */
    AnimationUpdateCallback.prototype = MACROUTILS.objectInehrit( Object.prototype, {

        linkChannel: function () {},
        linkAnimation: function ( anim ) {
            var name = this.getName();
            if ( name.length === 0 ) {
                Notify.log( 'no name on an update callback, discard' );
                return 0;
            }
            var nbLinks = 0;
            var channels = anim.getChannels();
            for ( var i = 0, l = channels.length; i < l; i++ ) {
                var channel = channels[ i ];
                if ( channel.getTargetName() === name ) {
                    this.linkChannel( channel );
                    nbLinks++;
                }
            }
            return nbLinks;
        }
    } );

    return AnimationUpdateCallback;
} );
