'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Geometry = require( 'osg/Geometry' );
var Notify = require( 'osg/Notify' );
var Matrix = require( 'osg/Matrix' );
var StateSet = require( 'osg/StateSet' );
var MorphGeometry = require( 'osgAnimation/MorphGeometry' );
var UpdateRigGeometry = require( 'osgAnimation/UpdateRigGeometry' );
var RigTransformHardware = require( 'osgAnimation/RigTransformHardware' );


// RigGeometry is a Geometry deformed by bones
// To connect bones to RigGeometry it requires:
//     - a map of bones with index / weight eg also called VertexInfluenceMap
// {
//     bone0: { index: [],  // vertex index
//              weight: []  // weight for this index
//            },
//     bone2: { index: [],
//              weight: []
//            }
// }


var RigGeometry = function () {

    Geometry.call( this );

    this.setUpdateCallback( new UpdateRigGeometry() );

    //this._geometry = undefined;
    this._root = undefined;
    this._boneNameID = {};

    this._matrixFromSkeletonToGeometry = Matrix.create();
    this._invMatrixFromSkeletonToGeometry = Matrix.create();

    this._rigTransformImplementation = new RigTransformHardware();

    // RigGeometry have a special stateset that will be pushed at the very end of the culling
    // this stateSet only represents animation (and shouldn't contain any rendering attributes)
    // It's a way to make every RigGeometry unique (in term of stateSet stack)
    this._stateSetAnimation = new StateSet();

    this._needToComputeMatrix = true;

};

RigGeometry.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Geometry.prototype, {

    getStateSetAnimation: function () {
        return this._stateSetAnimation;
    },

    getSkeleton: function () {
        return this._root;
    },

    setSkeleton: function ( root ) {
        this._root = root;
    },

    setNeedToComputeMatrix: function ( needToComputeMatrix ) {
        this._needToComputeMatrix = needToComputeMatrix;
    },

    getNeedToComputeMatrix: function () {
        return this._needToComputeMatrix;
    },

    computeBoundingBox: function ( boundingBox ) {

        var vertexArray = this.getVertexAttributeList().Vertex;
        var weightsArray = this.getVertexAttributeList().Weights;
        // mainly copy paste of geometry computeBoundingBox code, except we only 
        // take into account the non-influenced vertices

        // we do that only for the non-influenced vertices because the rigged ones
        // can't be statically computed (full moving bbox of rigs should be computed externally
        // through bones or cpu rigged colision mesh, etc)
        // bbox is important for culling (near/far)

        if ( vertexArray && weightsArray && vertexArray.getElements() && vertexArray.getItemSize() > 2 ) {

            var weights = weightsArray.getElements();
            var vertexes = vertexArray.getElements();
            var itemSize = vertexArray.getItemSize();

            var min = boundingBox.getMin();
            var max = boundingBox.getMax();

            var minx = min[ 0 ];
            var miny = min[ 1 ];
            var minz = min[ 2 ];
            var maxx = max[ 0 ];
            var maxy = max[ 1 ];
            var maxz = max[ 2 ];

            for ( var idx = 0, idb = 0, l = vertexes.length; idx < l; idx += itemSize, idb += 4 ) {

                if ( weights[ idx ] !== 0.0 || weights[ idx + 1 ] !== 0.0 || weights[ idx + 2 ] !== 0.0 || weights[ idx + 3 ] !== 0.0 )
                    continue;

                var v1 = vertexes[ idx ];
                var v2 = vertexes[ idx + 1 ];
                var v3 = vertexes[ idx + 2 ];
                if ( v1 < minx ) minx = v1;
                if ( v1 > maxx ) maxx = v1;
                if ( v2 < miny ) miny = v2;
                if ( v2 > maxy ) maxy = v2;
                if ( v3 < minz ) minz = v3;
                if ( v3 > maxz ) maxz = v3;
            }

            min[ 0 ] = minx;
            min[ 1 ] = miny;
            min[ 2 ] = minz;
            max[ 0 ] = maxx;
            max[ 1 ] = maxy;
            max[ 2 ] = maxz;
        }

        return boundingBox;
    },

    computeMatrixFromRootSkeleton: function () {

        if ( !this._root ) {
            Notify.warn( 'Warning ' + this.className() + '.computeMatrixFromRootSkeleton if you have this message it means you miss to call buildTransformer( root ), or your RigGeometry (' + this.getName() + ') is not attached to a Skeleton subgraph' );
            return;
        }

        var mtxList = this.getParents()[ 0 ].getWorldMatrices( this._root );
        var invNotRoot = Matrix.create();

        Matrix.inverse( this._root.getMatrix(), invNotRoot );
        Matrix.mult( invNotRoot, mtxList[ 0 ], this._matrixFromSkeletonToGeometry );
        Matrix.inverse( this._matrixFromSkeletonToGeometry, this._invMatrixFromSkeletonToGeometry );

        this._needToComputeMatrix = false;
    },

    getMatrixFromSkeletonToGeometry: function () {
        return this._matrixFromSkeletonToGeometry;
    },

    getInvMatrixFromSkeletonToGeometry: function () {
        return this._invMatrixFromSkeletonToGeometry;
    },

    getSourceGeometry: function () {
        return this._geometry;
    },

    setSourceGeometry: function ( geometry ) {
        this._geometry = geometry;
    },

    mergeChildrenVertexAttributeList: function () {

        if ( this._geometry instanceof MorphGeometry )
            this._geometry.mergeChildrenVertexAttributeList();

        var sourceGeometryVertexAttributeList = this._geometry.getVertexAttributeList();

        Geometry.appendVertexAttributeToList( sourceGeometryVertexAttributeList, this.getVertexAttributeList() );

    },

    mergeChildrenData: function () {

        // move to the rig the vertex attributes, the primitives and the stateset

        this.mergeChildrenVertexAttributeList();
        var primitiveSetList = this._geometry.getPrimitiveSetList();

        this.getPrimitiveSetList().length = 0;
        for ( var i = 0, il = primitiveSetList.length; i < il; i++ )
            this.getPrimitiveSetList()[ i ] = primitiveSetList[ i ];

        if ( this.getStateSet() )
            console.error( 'A stateset in the rig is already present : ' + this.getStateSet() );
        this.setStateSet( this._geometry.getStateSet() );
    },

    update: function () {
        this._rigTransformImplementation.update( this );
    }

} ), 'osgAnimation', 'RigGeometry' );

MACROUTILS.setTypeID( RigGeometry );

module.exports = RigGeometry;
