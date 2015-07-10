define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osgAnimation/Skeleton'

], function ( MACROUTILS, NodeVisitor, Skeleton ) {

    'use strict';

    /**
     * FindNearestParentSkeleton
     */

    var FindNearestParentSkeleton = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_PARENTS );
        this._root = undefined;
    };

    FindNearestParentSkeleton.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {

        apply: function ( node ) {

            if ( this._root ) return;

            if ( node.typeID === Skeleton.typeID ) this._root = node;

            this.traverse( node );
        }
    } );

    return FindNearestParentSkeleton;

} );
