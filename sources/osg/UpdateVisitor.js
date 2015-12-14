'use strict';
var MACROUTILS = require( 'osg/Utils' );
var NodeVisitor = require( 'osg/NodeVisitor' );


var UpdateVisitor = function () {
    NodeVisitor.call( this );
    this.visitorType = NodeVisitor.UPDATE_VISITOR;
    this._numUpdateCallback = 0;
};

UpdateVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {

    resetStats: function () {
        this._numUpdateCallback = 0;
    },

    apply: function ( node ) {

        // a way to avoid extra call is to implement getNumChildrenRequiringUpdateTraversal
        // and stateset.requiresUpdateTraversal()


        // handle callback in stateset
        var stateSet = node.getStateSet();
        if ( stateSet ) {
            var updateCallbackList = stateSet.getUpdateCallbackList();

            var numStateSetUpdateCallback = updateCallbackList.length;
            if ( numStateSetUpdateCallback )
                this._numUpdateCallback += numStateSetUpdateCallback;
            for ( var i = 0, l = numStateSetUpdateCallback; i < l; i++ )
                updateCallbackList[ i ].update( stateSet, this );
        }

        // handle callback in nodes
        var ncs = node.getUpdateCallbackList();
        var numUpdateCallback = ncs.length;
        if ( numUpdateCallback )
            for ( var j = 0, m = numUpdateCallback; j < m; j++ ) {
                this._numUpdateCallback++;
                if ( !ncs[ j ].update( node, this ) ) {
                    return;
                }
            }

        this.traverse( node );
    }
} );

module.exports = UpdateVisitor;
