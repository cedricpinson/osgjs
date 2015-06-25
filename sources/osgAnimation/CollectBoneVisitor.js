define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Notify',
    'osgAnimation/Bone'

], function ( MACROUTILS, NodeVisitor, Notify, Bone ) {

    'use strict';

    var CollectBoneVisitor = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
        this._boneMap = {};
    };

    CollectBoneVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {

        apply: function ( node ) {

            if ( node.typeID === Bone.typeID ) {

                var name = node.getName();

                if ( !name ) {
                    Notify.warn( 'found Bone without name' );
                } else {
                    this._boneMap[ name ] = node;
                }
            }

            this.traverse( node );
        },

        getBoneMap: function () {
            return this._boneMap;
        }

    } );

    return CollectBoneVisitor;

} );
