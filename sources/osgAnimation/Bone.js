define( [
    'osg/Utils',
    'osg/BoundingBox',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osgAnimation/UpdateBone'
], function ( MACROUTILS, BoundingBox, Matrix, MatrixTransform, UpdateBone ) {

    'use strict';

    /**
     *  Bone
     *  @class Bone
     */
    var Bone = function ( name ) {
        if ( name !== undefined )
            this.setName( name );

        MatrixTransform.call( this );
        this._invBindInSkeletonSpace = Matrix.create();
        this._boneInSkeletonSpace = Matrix.create();
        this._boneBoundingBox = new BoundingBox();
    };

    Bone.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( MatrixTransform.prototype, {

        getBoneBoundingBox: function () {
            return this._boneBoundingBox;
        },

        setBoneBoundingBox: function ( bb ) {
            this._boneBoundingBox = bb;
        },

        getMatrixInSkeletonSpace: function () {
            return this._boneInSkeletonSpace;
        },

        getInvBindMatrixInSkeletonSpace: function () {
            return this._invBindInSkeletonSpace;
        },

        setMatrixInSkeletonSpace: function ( m ) {
            Matrix.copy( m, this._boneInSkeletonSpace );
        },

        setInvBindMatrixInSkeletonSpace: function ( m ) {
            Matrix.copy( m, this._invBindInSkeletonSpace );
        },

        getBoneParent: function () {
            var parents = this.getParents();
            for ( var i = 0, l = parents.length; i < l; i++ ) {
                var typeID = parents[ i ].getTypeID();
                if ( typeID === Bone.getTypeID() ) {
                    return parents[ i ];
                }
            }
            return undefined;
        },

        setDefaultUpdateCallback: function ( name ) {
            this.setUpdateCallback( new UpdateBone( ( name !== undefined ) ? name : this.getName() ) );
        }
    } ), 'osgAnimation', 'Bone' );
    MACROUTILS.setTypeID( Bone );

    return Bone;
} );
