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
            if ( this.getParents() === [] )
                return undefined;

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
            var cbName = name;
            if ( name !== undefined ) {
                cbName = this.getName();
            }
            this.setUpdateCallback( new UpdateBone( cbName ) );
        }
    } ), 'osgAnimation', 'Bone' );
    MACROUTILS.setTypeID( Bone );

    return Bone;
} );
