define( [
    'osg/Utils',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osgAnimation/UpdateBone'
], function ( MACROUTILS, Matrix, MatrixTransform, UpdateBone ) {

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
    };

    Bone.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( MatrixTransform.prototype, {

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
