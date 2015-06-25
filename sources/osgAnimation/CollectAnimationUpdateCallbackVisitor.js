define( [
    'osg/Notify',
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Object',
    'osgAnimation/AnimationUpdateCallback'
], function ( Notify, MACROUTILS, NodeVisitor, Object, AnimationUpdateCallback ) {



    // search into a subgraph all target
    var CollectAnimationUpdateCallbackVisitor = function () {
        NodeVisitor.call( this );
        this._animationUpdateCallback = {};
    };


    CollectAnimationUpdateCallbackVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        getAnimationUpdateCallbackMap: function () {
            return this._animationUpdateCallback;
        },

        apply: function ( node ) {

            var cbs = node.getUpdateCallbackList();

            // collect and remove animation update callback
            var i = 0;
            while ( i < cbs.length ) {

                var cb = cbs[ i ];
                if ( cb instanceof AnimationUpdateCallback ) {
                    this._animationUpdateCallback[ cb.getInstanceID() ] = cb;
                    //node.removeUpdateCallback( cb );
                }
                i++;
            }

            this.traverse( node );
        }


    } );

    return CollectAnimationUpdateCallbackVisitor;
} );
