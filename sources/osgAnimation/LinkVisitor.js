define( [
    'osg/Notify',
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Object',
    'osgAnimation/AnimationUpdateCallback'
], function ( Notify, MACROUTILS, NodeVisitor, Object, AnimationUpdateCallback ) {


    /**
     *  LinkVisitor search for animationUpdateCallback and link animation data
     *  @class LinkVisitor
     */
    var LinkVisitor = function () {
        NodeVisitor.call( this );
        this._animations = undefined;
        this._nbLinkTarget = 0;
    };

    /** @lends LinkVisitor.prototype */
    LinkVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        setAnimationMap: function ( anims ) {
            this._animations = anims;
            this._animationKeys = window.Object.keys( anims );
        },

        apply: function ( node ) {
            var cbs = node.getUpdateCallbackList();
            for ( var i = 0, l = cbs.length; i < l; i++ ) {
                var cb = cbs[ i ];
                if ( cb instanceof AnimationUpdateCallback ) {
                    this.link( cb );
                }
            }
            this.traverse( node );
        },

        link: function ( animCallback ) {
            var result = 0;
            var anims = this._animations;
            var animKeys = this._animationKeys;
            for ( var i = 0, l = animKeys.length; i < l; i++ ) {
                var key = animKeys[ i ];
                var anim = anims[ key ];
                result += animCallback.linkAnimation( anim );
            }
            this._nbLinkedTarget += result;
            Notify.info( 'linked ' + result + ' for "' + animCallback.getName() + '"' );
        }

    } );

    return LinkVisitor;
} );
