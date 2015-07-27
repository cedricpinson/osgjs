define( [
    'osg/Utils',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osgAnimation/UpdateSkeleton',
    'osg/NodeVisitor',
    'osgAnimation/UpdateMatrixTransform',
    'osgAnimation/Bone'
], function ( MACROUTILS, Matrix, MatrixTransform, UpdateSkeleton, NodeVisitor, UpdateMatrixTransform, Bone ) {

    'use strict';

    var ResetRestPoseVisitor = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
    };
    ResetRestPoseVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( node.getTypeID() === Bone.getTypeID() ) {
                var cb = node.getUpdateCallback();
                if ( cb instanceof UpdateMatrixTransform ) {
                    var stackedTransforms = cb._stackedTransforms;
                    for ( var st = 0, l = stackedTransforms.length; st < l; st++ ) {
                        var stackedTransform = stackedTransforms[ st ];
                        stackedTransform.resetToDefaultValue();
                    }
                    cb.computeChannels();
                }
            }
            this.traverse( node );
        }
    } );

    var resetter = new ResetRestPoseVisitor();

    var Skeleton = function () {
        MatrixTransform.call( this );
    };

    Skeleton.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( MatrixTransform.prototype, {

        setDefaultUpdateCallback: function () {
            this.setUpdateCallback( new UpdateSkeleton() );
        },

        setRestPose: function () {
            this.accept( resetter );
        }

    } ), 'osgAnimation', 'Skeleton' );
    MACROUTILS.setTypeID( Skeleton );

    return Skeleton;
} );
