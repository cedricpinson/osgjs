define( [
    'osg/Utils',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osgAnimation/UpdateSkeleton',
], function ( MACROUTILS, Matrix, MatrixTransform, UpdateSkeleton ) {

    'use strict';

    var Skeleton = function () {
        MatrixTransform.call( this );
    };

    Skeleton.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( MatrixTransform.prototype, {

        setDefaultUpdateCallback: function () {
            this.setUpdateCallback( new UpdateSkeleton() );
        }
    } ), 'osgAnimation', 'Skeleton' );
    MACROUTILS.setTypeID( Skeleton );

    return Skeleton;
} );
