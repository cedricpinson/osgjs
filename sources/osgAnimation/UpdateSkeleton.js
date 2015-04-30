define( [
    'osg/Utils',
    'osg/Notify',
    'osg/NodeVisitor',
    'osgAnimation/Bone',
    'osgAnimation/Skeleton'
], function ( MACROUTILS, Notify, NodeVisitor, Bone, Skeleton ) {

    'use strict';

    /**
     *  ValidateSkeletonVisitor
     *  @class ValidateSkeletonVisitor
     */
    var ValidateSkeletonVisitor = function () {
        NodeVisitor.call( this );
    };

    ValidateSkeletonVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( node.getTypeId() !== Bone.getTypeId() ) {
                return;
            }
            var foundNonBone = false;

            for ( var i = 0, l = node.getChildren().length - 1; i < l; i++ ) {
                if ( node.getchild( i ).getTypeId() === Bone.getTypeId() ) {
                    if ( foundNonBone ) {
                        Notify.warn( 'Warning: a Bone was found after a non-Bone child ' +
                            'within a Skeleton. Children of a Bone must be ordered ' +
                            'with all child Bones first for correct update order.' );
                        //this.traversalMode = NodeVisitor.TRAVERSE_NONE;
                        return;
                    }
                } else {
                    foundNonBone = true;
                }
            }
            this.traverse( node );
        }

    } );

    /**
     *  UpdateSkeleton
     *  @class UpdateSkeleton
     */
    var UpdateSkeleton = function () {
        this._needValidate = true;
    };

    UpdateSkeleton.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

        needToValidate: function () {
            return this._needValidate;
        },
        update: function ( /*node,*/ nv ) {
            if ( nv.getVisitorType() === NodeVisitor.UPDATE_VISITOR ) {
                if ( this.getTypeId() === Skeleton.getTypeId() && this._needValidate ) {

                    var validateSkeletonVisitor = new ValidateSkeletonVisitor();
                    for ( var i = 0, l = this.getChildren().length - 1; i < l; i++ ) {
                        this.getChild( i ).accept( validateSkeletonVisitor );
                    }
                    this._needValidate = false;
                }
            }
            this.traverse( nv );
        }
    } ) );

    return UpdateSkeleton;
} );
