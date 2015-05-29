define( [
    'osg/Utils',
    'osg/Notify',
    'osgAnimation/UpdateMatrixTransform',
    'osg/Matrix',
    'osg/NodeVisitor'
], function ( MACROUTILS, Notify, UpdateMatrixTransform, Matrix, NodeVisitor ) {

    'use strict';

    /**
     *  UpdateBone
     *  @class UpdateBone
     */
    var UpdateBone = function () {
        UpdateMatrixTransform.call( this );
    };

    /** @lends UpdateBone.prototype */
    UpdateBone.prototype = MACROUTILS.objectInherit( UpdateMatrixTransform.prototype, {
        update: function ( node, nv ) {
            if ( nv.getVisitorType() === NodeVisitor.UPDATE_VISITOR ) {
                if ( node.className && node.className() !== 'Bone' ) {
                    Notify.warn( 'Warning: UpdateBone set on non-Bone object.' );
                    return;
                }

                var bone = node;

                UpdateMatrixTransform.prototype.update.call( this, node );
                bone.setMatrix( bone.getMatrix() ); //Update dirty()
                var matrix = bone.getMatrix();
                var parent = bone.getBoneParent();

                if ( parent ) {
                    Matrix.mult( parent.getMatrixInSkeletonSpace(), matrix, bone.getMatrixInSkeletonSpace() );
                } else {
                    bone.setMatrixInSkeletonSpace( matrix );
                }
            }
            return true;
        }
    } );

    return UpdateBone;
} );
