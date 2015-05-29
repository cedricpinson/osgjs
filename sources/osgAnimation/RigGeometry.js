define( [
    'osg/Utils',
    'osg/BufferArray',
    'osg/Vec3',
    'osg/Node',
    'osg/Geometry',
    'osg/NodeVisitor',
    'osg/Notify',
    'osg/Matrix',
    'osgAnimation/Bone',
    'osgAnimation/UpdateRigGeometry',
    'osgAnimation/VertexInfluenceSet',
    'osgAnimation/RigTransformHardware',


], function ( MACROUTILS, BufferArray, Vec3, Node, Geometry, NodeVisitor, Notify, Matrix, Bone, UpdateRigGeometry, VertexInfluenceSet, RigTransformHardware ) {

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


    // to compute VertexInfluenceSet we need the list of bone / vtx index / weight



    // GUILLAUME:
    // Dont use an object to compute vertex influence set, compute directly the
    // vertex / bones / weigth
    var computeBonesPerVertex = function( vertexInfluenceMap, bonesList, nbVertexes ) {

        // support 4 bones max per vertex
        var bonesUsed = Object.keys( vertexInfluenceMap );
        var bonesMapIndex = {};


        // boneID0 weight0 boneID1 weight1
        // we could pack to not waste an attributes
        var indexBone = new Uint32Array( nbVertexes * 4 );
        var weight = new Float32Array( nbVertexes * 4 );


    };



    var RigGeometry = function () {

        Geometry.call( this );

        this.setUpdateCallback( new UpdateRigGeometry() );

        this._geometry = undefined;
        this._vertexInfluenceMap = undefined;
        this._vertexInfluenceSet = new VertexInfluenceSet();
        this._root = undefined;

        this._matrixFromSkeletonToGeometry = Matrix.create();
        this._invMatrixFromSkeletonToGeometry = Matrix.create();

        this._rigTransformImplementation = new RigTransformHardware();

        this._needToComputeMatrix = true;

    };

    RigGeometry.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Geometry.prototype, {

        setInfluenceMap: function ( influenceMap ) {
            this._vertexInfluenceMap = influenceMap;
        },

        getInfluenceMap: function () {
            return this._vertexInfluenceMap;
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

        getVertexInfluenceSet: function () {
            return this._vertexInfluenceSet;
        },

        buildVertexInfluenceSet: function () {

            if ( !this._vertexInfluenceMap ) {
                Notify.warn( 'buildVertexInfluenceSet can t be called without VertexInfluence already set to the RigGeometry (' + this.getName() + ' ) ' );
            }

            this._vertexInfluenceSet.clear();

            var keys = Object.keys( this._vertexInfluenceMap );

            for ( var i = 0, l = keys.length; i < l; i++ ) {

                var key = keys[ i ];
                var value = this._vertexInfluenceMap[ key ];

                var input = {};
                input._map = value;
                input._name = key;

                this._vertexInfluenceSet.addVertexInfluence( input );
            }

            this._vertexInfluenceSet.buildVertex2BoneList();
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


        getOrCreateSourceGeometry: function () {

            if ( !this._geometry ) this._geometry = new Geometry();
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
