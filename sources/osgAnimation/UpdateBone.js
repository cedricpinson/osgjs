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

        /*void UpdateBone::operator()( osg::Node * node, osg::NodeVisitor * nv ) {
            if ( nv && nv - > getVisitorType() == osg::NodeVisitor::UPDATE_VISITOR ) {
                Bone * b = dynamic_cast < Bone * > ( node );
                if ( !b ) {
                    OSG_WARN << "Warning: UpdateBone set on non-Bone object." << std::endl;
                    return;
                }

                // here we would prefer to have a flag inside transform stack in order to avoid update and a dirty state in matrixTransform if it's not require.
                _transforms.update();
                const osg::Matrix & matrix = _transforms.getMatrix();
                b - > setMatrix( matrix );

                Bone * parent = b - > getBoneParent();
                if ( parent )
                    b - > setMatrixInSkeletonSpace( matrix * parent - > getMatrixInSkeletonSpace() );
                else
                    b - > setMatrixInSkeletonSpace( matrix );
            }
            traverse( node, nv );
        }*/

        update: function ( node, nv ) {
            if ( nv.getVisitorType() === NodeVisitor.UPDATE_VISITOR ) {
                if ( node.className && node.className() !== 'Bone' ) {
                    Notify.warn( 'Warning: UpdateBone set on non-Bone object.' );
                    return;
                }

                var bone = node;
                UpdateMatrixTransform.prototype.update.call( this, node );
                var matrix = bone.getMatrix();
                var parent = bone.getBoneParent();

                if ( parent ) {
                    var res = Matrix.create();
                    Matrix.mult( matrix, parent.getMatrixInSkeletonSpace(), res );
                    bone.setMatrixInSkeletonSpace( res );
                } else {
                    bone.setMatrixInSkeletonSpace( matrix );
                }
            }
            nv.traverse( node );
        }
    } );

    return UpdateBone;
} );
