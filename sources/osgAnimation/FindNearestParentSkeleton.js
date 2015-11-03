'use strict';
var MACROUTILS = require( 'osg/Utils' );
var NodeVisitor = require( 'osg/NodeVisitor' );
var Skeleton = require( 'osgAnimation/Skeleton' );


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

module.exports = FindNearestParentSkeleton;
