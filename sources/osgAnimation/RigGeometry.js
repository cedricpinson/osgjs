define( [
    'osg/Utils',
    'osg/BufferArray',
    'osg/Vec3',
    'osg/Node',
    'osg/Geometry',
    'osg/NodeVisitor',
    'osg/Notify',
    'osg/Matrix',
    'osg/StateSet',
    'osgAnimation/Bone',
    'osgAnimation/UpdateRigGeometry',
    'osgAnimation/RigTransformHardware'
], function ( MACROUTILS, BufferArray, Vec3, Node, Geometry, NodeVisitor, Notify, Matrix, StateSet, Bone, UpdateRigGeometry, RigTransformHardware ) {

    'use strict';

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

        // invalid/no bound by default
        this.boundingSphereComputed = true;
        this._boundingBoxComputed = true;

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

        update: function () {
            this._rigTransformImplementation.update( this );
        }

    } ), 'osgAnimation', 'RigGeometry' );

    MACROUTILS.setTypeID( RigGeometry );

    return RigGeometry;
} );
