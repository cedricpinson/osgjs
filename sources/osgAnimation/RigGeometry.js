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
        this._geometry = undefined;
        this._vertexInfluenceMap = undefined;
    };

    RigGeometry.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Geometry.prototype, {
        setInfluenceMap: function ( influenceMap ) {
            this._vertexInfluenceMap = influenceMap;
        },
        getInfluenceMap: function () {
            return this._vertexInfluenceMap;
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
        getOrCreateSourceGeometry: function () {
            if ( this._geometry === undefined ) {
                this._geometry = new Geometry();
            }
            return this._geometry;
        },
        setSourceGeometry: function ( geometry ) {
            this._geometry = geometry;
        }
    } ), 'osgAnimation', 'RigGeometry' );

    MACROUTILS.setTypeID( RigGeometry );

    return RigGeometry;
} );
