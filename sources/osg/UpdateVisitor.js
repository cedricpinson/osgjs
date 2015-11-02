'use strict';
var MACROUTILS = require( 'osg/Utils' );
var NodeVisitor = require( 'osg/NodeVisitor' );


var UpdateVisitor = function () {
    NodeVisitor.call( this );
    this.visitorType = NodeVisitor.UPDATE_VISITOR;
};

UpdateVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {

    apply: function ( node ) {

        // a way to avoid extra call is to implement getNumChildrenRequiringUpdateTraversal
        // and stateset.requiresUpdateTraversal()


        // handle callback in stateset
        var stateSet = node.getStateSet();
        if ( stateSet ) {
            var updateCallbackList = stateSet.getUpdateCallbackList();

            if ( updateCallbackList.length )
                for ( var i = 0, l = updateCallbackList.length; i < l; i++ )
                    updateCallbackList[ i ].update( stateSet, this );
        }

        // handle callback in nodes
        var ncs = node.getUpdateCallbackList();
        if ( ncs.length )
            for ( var j = 0, m = ncs.length; j < m; j++ ) {
                if ( !ncs[ j ].update( node, this ) ) {
                    return;
                }
            }

        this.traverse( node );
    }
} );

module.exports = UpdateVisitor;
