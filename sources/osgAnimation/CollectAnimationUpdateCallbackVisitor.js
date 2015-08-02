define( [
    'osg/Notify',
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Object',
    'osgAnimation/AnimationUpdateCallback'
], function ( Notify, MACROUTILS, NodeVisitor, Object, AnimationUpdateCallback ) {

    'use strict';

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
            for ( var i = 0, cbsLength = cbs.length; i < cbsLength; i++ ) {
                var cb = cbs[ i ];
                if ( cb instanceof AnimationUpdateCallback ) {
                    this._animationUpdateCallback[ cb.getInstanceID() ] = cb;
                    //node.removeUpdateCallback( cb );
                }
            }
            this.traverse( node );
        }

    } );

    return CollectAnimationUpdateCallbackVisitor;
} );
