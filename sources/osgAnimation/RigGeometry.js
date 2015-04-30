define( [
    'osg/Utils',
    'osg/Vec3',
    'osg/Node',
    'osg/BoundingBox',
    'osg/Geometry'
], function ( MACROUTILS, Vec3, Node, BoundingBox, Geometry ) {

    'use strict';

    /**
     * RigGeometry
     * @class RigGeometry
     */
    var RigGeometry = function () {
        Geometry.call( this );
    };

    RigGeometry.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Geometry.prototype, {
        setInfluenceMap: function () {

        },
        getInfluenceMap: function () {

        },
        getSkeleton: function () {

        },
        setSkeleton: function () {

        },
        setNeedToComputeMatrix: function () {

        },
        getNeedToComputeMatrix: function () {

        },
        buildVertexInfluenceSet: function () {

        },
        getVertexInfluenceSet: function () {

        },
        computeMatrixFromRootSkeleton: function () {

        },
        setRigTransformImplementation: function () {

        },
        getRigTransformImplementation: function () {

        },
        drawImplementation: function () {

        },
        update: function () {

        },
        getMatrixFromSkeletonToGeometry: function () {

        },
        getInvMatrixFromSkeletonToGeometry: function () {

        },
        getSourceGeometry: function () {

        },
        setSourceGeometry: function () {

        }
    } ), 'osgAnimation', 'RigGeometry' );

    MACROUTILS.setTypeID( RigGeometry );

    return RigGeometry;
} );
