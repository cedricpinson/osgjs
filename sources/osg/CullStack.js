'use strict';
var MACROUTILS = require( 'osg/Utils' );
var BoundingSphere = require( 'osg/BoundingSphere' );
var Camera = require( 'osg/Camera' );
var ComputeMatrixFromNodePath = require( 'osg/ComputeMatrixFromNodePath' );
var CullSettings = require( 'osg/CullSettings' );
var CullingSet = require( 'osg/CullingSet' );
var Matrix = require( 'osg/Matrix' );
var MatrixMemoryPool = require( 'osg/MatrixMemoryPool' );
var Transform = require( 'osg/Transform' );
var Notify = require( 'osg/Notify' );
var TransformEnums = require( 'osg/TransformEnums' );
var Vec3 = require( 'osg/Vec3' );

var CullStack = function () {

    this._modelViewMatrixStack = [];
    this._projectionMatrixStack = [];
    this._viewportStack = [];
    this._cullingSetStack = [];
    this._frustumVolume = -1.0;
    this._bbCornerFar = 0;
    this._bbCornerNear = 0;

    // keep a matrix in memory to avoid to create matrix
    this._reservedMatrixStack = new MatrixMemoryPool();

    this._reserveCullingSetStack = [
        new CullingSet()
    ];
    this._reserveCullingSetStack.current = 0;


    // data for caching camera matrix inverse for computation of world/view
    // contains index of the camera node in the nodepath
    this._cameraIndexStack = [];
    // contains index of the camera modelview matrix in the modelViewMatrixStack
    this._cameraModelViewIndexStack = [];

    // contains the id has a key to computed Inverse Matrix
    this._cameraMatrixInverse = [];
    this._cameraMatrixInverseRoot = undefined;

};

CullStack.prototype = MACROUTILS.objectInherit( CullSettings.prototype, {

    _getReservedCullingSet: function () {
        var m = this._reserveCullingSetStack[ this._reserveCullingSetStack.current++ ];
        if ( this._reserveCullingSetStack.current === this._reserveCullingSetStack.length ) {
            this._reserveCullingSetStack.push( new CullingSet() );
        }
        return m;
    },
    reset: function () {
        this._modelViewMatrixStack.length = 0;
        this._projectionMatrixStack.length = 0;
        this._cullingSetStack.length = 0;

        this._reservedMatrixStack.reset();
        this._reserveCullingSetStack.current = 0;

        this._cameraModelViewIndexStack.length = 0;
        this._cameraIndexStack.length = 0;
        this._cameraMatrixInverse.length = 0;
        this._cameraMatrixInverseRoot = undefined;
    },

    getProjectionMatrixStack: function () {
        return this._projectionMatrixStack;
    },
    getCurrentProjectionMatrix: function () {
        return this._projectionMatrixStack[ this._projectionMatrixStack.length - 1 ];
    },

    getCurrentModelViewMatrix: function () {
        return this._modelViewMatrixStack[ this._modelViewMatrixStack.length - 1 ];
    },

    getCurrentModelviewMatrix: function () {
        Notify.warn( 'deprecated switch to getCurrentModelViewMatrix' );
        return this.getCurrentModelViewMatrix();
    },

    getCameraInverseMatrix: function () {

        // Return or compute and cache the MatrixInverse of the last
        // active camera in absolute reference

        // if no index the camera inverse is the root with an fake id
        if ( !this._cameraIndexStack.length )
            return this._cameraMatrixInverseRoot;

        var idx = this._cameraIndexStack[ this._cameraIndexStack.length - 1 ];

        // get the camera node
        var camera = this.getNodePath()[ idx ];
        var id = camera.getInstanceID();

        if ( this._cameraMatrixInverse[ id ] === undefined ) {
            var indexInModelViewMatrixStack = this._cameraModelViewIndexStack[ this._cameraModelViewIndexStack.length - 1 ];
            var mat = this._modelViewMatrixStack[ indexInModelViewMatrixStack ];
            var matInverse = this._reservedMatrixStack.get();
            Matrix.inverse( mat, matInverse );
            this._cameraMatrixInverse[ id ] = matInverse;
        }
        return this._cameraMatrixInverse[ id ];
    },

    getCurrentModelWorldMatrix: function () {
        // Improvment could be to cache more things
        // and / or use this method only if the shader use it
        var invMatrix = this.getCameraInverseMatrix();
        var m = this._reservedMatrixStack.get();
        var world = Matrix.mult( invMatrix, this.getCurrentModelViewMatrix(), m );
        return world;
    },

    getCurrentViewMatrix: function () {
        // Improvment could be to cache more things
        // and / or use this method only if the shader use it
        if ( !this._cameraIndexStack.length )
            return this._modelViewMatrixStack[ 0 ];

        // also we could keep the index of the current to avoid lenght-1 at each access
        // it's implemented in osg like that:
        // https://github.com/openscenegraph/osg/blob/master/include/osg/fast_back_stack
        var idx = this._cameraModelViewIndexStack[ this._cameraModelViewIndexStack.length - 1 ];
        return this._modelViewMatrixStack[ idx ];
    },

    getViewport: function () {
        if ( this._viewportStack.length === 0 ) {
            return undefined;
        }
        return this._viewportStack[ this._viewportStack.length - 1 ];
    },
    getLookVectorLocal: function ( outLookVector ) {
        var lookVectorLocal = this.getCurrentModelViewMatrix();
        return Vec3.set( -lookVectorLocal[ 2 ], -lookVectorLocal[ 6 ], -lookVectorLocal[ 10 ], outLookVector );
    },
    pushViewport: function ( vp ) {
        this._viewportStack.push( vp );
    },
    popViewport: function () {
        this._viewportStack.pop();
    },

    pushCullingSet: function () {
        var cs = this._getReservedCullingSet();
        if ( this._enableFrustumCulling ) {
            Matrix.getFrustumPlanes( this.getCurrentProjectionMatrix(), this.getCurrentModelViewMatrix(), cs.getFrustum().getPlanes(), false );
            // TODO: no far no near.
            // should check if we have them
            // should add at least a near 0 clip if not
            cs.getFrustum().setupMask( 4 );
        }

        this._cullingSetStack.push( cs );
    },
    popCullingSet: function () {
        return this._cullingSetStack.pop();
    },
    getCurrentCullingSet: function () {
        return this._cullingSetStack[ this._cullingSetStack.length - 1 ];
    },


    pushCurrentMask: function () {
        var cs = this.getCurrentCullingSet();
        if ( cs ) cs.pushCurrentMask();
    },
    popCurrentMask: function () {
        var cs = this.getCurrentCullingSet();
        if ( cs ) cs.popCurrentMask();
    },

    isVerticesCulled: function ( vertices ) {
        if ( !this._enableFrustumCulling )
            return false;
        return this.getCurrentCullingSet().isVerticesCulled( vertices );
    },

    isBoundingBoxCulled: function ( bb ) {
        if ( !this._enableFrustumCulling )
            return false;
        return bb.valid() && this.getCurrentCullingSet().isBoundingBoxCulled( bb );
    },

    isBoundingSphereCulled: function ( bs ) {
        if ( !this._enableFrustumCulling )
            return false;
        return bs.valid() && this.getCurrentCullingSet().isBoundingSphereCulled( bs );
    },

    isCulled: ( function () {
        var bsWorld = new BoundingSphere();
        return function ( node, nodePath ) {
            if ( !this._enableFrustumCulling )
                return false;
            if ( node.isCullingActive() ) {
                if ( this.getCurrentCullingSet().getCurrentResultMask() === 0 )
                    return false; // father bounding sphere totally inside

                var matrix = this._reservedMatrixStack.get();
                Matrix.makeIdentity( matrix );

                // TODO: Perf just get World Matrix at each node transform
                // store it in a World Transform Node Path (only world matrix change)
                // so that it's computed once and reused for each further node getCurrentModelWorld
                // otherwise, it's 1 mult for each node, each matrix node, and each geometry
                //matrix = this.getCurrentModelWorldMatrix();
                // tricky: change push be before isculled, and pop in case of culling
                // strange bug for now on frustum culling sample with that

                if ( node instanceof Transform ) {

                    // tricky: MatrixTransform getBound is already transformed to
                    // its local space whereas nodepath also have its matrix ...
                    // so to get world space, you HAVE to remove that matrix from nodePATH
                    // TODO: GC Perf of array slice creating new array
                    matrix = ComputeMatrixFromNodePath.computeLocalToWorld( nodePath.slice( 0, nodePath.length - 1 ), true, matrix );

                } else {

                    matrix = ComputeMatrixFromNodePath.computeLocalToWorld( nodePath, true, matrix );

                }

                Matrix.transformBoundingSphere( matrix, node.getBound(), bsWorld );
                return this.getCurrentCullingSet().isBoundingSphereCulled( bsWorld );
            } else {
                this.getCurrentCullingSet().resetCullingMask();
                return false;
            }
        };
    } )(),



    pushModelViewMatrix: ( function () {
        var lookVector = Vec3.create();
        return function ( matrix ) {

            // When pushing a matrix, it can be a transform or camera. To compute
            // differents matrix type in shader ( ViewMatrix/ModelWorldMatrix/ModelViewMatrix )
            // we track camera node when using pushModelViewMatrix
            // To detect a camera, we check on the nodepath the type of the node and if the
            // camera is relatif or absolute.
            // When we detect an absolute camera we keep it's index to get it when needed to
            // compute the World/View matrix
            // Th    ere is an exception for the root camera, the root camera is not pushed on the
            // CullVisitor but only its matrixes, so to handle this we compute the inverse camera
            // when the nodepath has a lenght of 0
            // To avoid to compute too much inverse matrix, we keep a cache of them during the
            // traverse and store the result under the instanceID key, except for the root
            var np = this.getNodePath();
            var length = np.length;
            if ( !length ) { // root
                var matInverse = this._reservedMatrixStack.get();
                Matrix.inverse( matrix, matInverse );
                this._cameraMatrixInverseRoot = matInverse;
            } else {
                var index = length - 1;
                if ( np[ index ].getTypeID() === Camera.getTypeID() && np[ index ].getReferenceFrame() === TransformEnums.ABSOLUTE_RF ) {
                    this._cameraIndexStack.push( index );
                    this._cameraModelViewIndexStack.push( this._modelViewMatrixStack.length );
                }
            }

            this._modelViewMatrixStack.push( matrix );
            this.getLookVectorLocal( lookVector );

            /*jshint bitwise: false */
            this._bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
            this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
            /*jshint bitwise: true */

        };
    } )(),
    popModelViewMatrix: ( function () {
        var lookVector = Vec3.create();

        return function () {

            // if same index it's a camera and we have to pop it
            var np = this.getNodePath();
            var index = np.length - 1;
            if ( this._cameraIndexStack.length && index === this._cameraIndexStack[ this._cameraIndexStack.length - 1 ] ) {
                this._cameraIndexStack.pop();
                this._cameraModelViewIndexStack.pop();
            }

            this._modelViewMatrixStack.pop();

            if ( this._modelViewMatrixStack.length !== 0 ) {
                this.getLookVectorLocal( lookVector );
            } else {
                Vec3.set( 0.0, 0.0, -1.0, lookVector );
            }

            /*jshint bitwise: false */
            this._bbCornerFar = ( lookVector[ 0 ] >= 0.0 ? 1.0 : 0.0 ) | ( lookVector[ 1 ] >= 0 ? 2.0 : 0.0 ) | ( lookVector[ 2 ] >= 0 ? 4.0 : 0.0 );
            this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
            /*jshint bitwise: true */
        };
    } )(),

    pushProjectionMatrix: function ( matrix ) {
        this._projectionMatrixStack.push( matrix );

        // need to recompute frustum volume.
        this._frustumVolume = -1.0;

        this.pushCullingSet();
    },
    popProjectionMatrix: function () {
        this._projectionMatrixStack.pop();

        // need to recompute frustum volume.
        this._frustumVolume = -1.0;

        this.popCullingSet();
    },


} );

module.exports = CullStack;
