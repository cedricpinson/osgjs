'use strict';
var MACROUTILS = require('osg/Utils');
var BoundingSphere = require('osg/BoundingSphere');
var Camera = require('osg/Camera');
var ComputeMatrixFromNodePath = require('osg/computeMatrixFromNodePath');
var CullSettings = require('osg/CullSettings');
var CullingSet = require('osg/CullingSet');
var mat4 = require('osg/glMatrix').mat4;
var Plane = require('osg/Plane');
var Transform = require('osg/Transform');
var TransformEnums = require('osg/transformEnums');
var vec3 = require('osg/glMatrix').vec3;
var PooledArray = require('osg/PooledArray');
var PooledResource = require('osg/PooledResource');
var PooledMap = require('osg/PooledMap');

var createCullingSet = function() {
    return new CullingSet();
};

var CullStack = function() {
    this._modelViewMatrixStack = new PooledArray();
    this._projectionMatrixStack = new PooledArray();
    this._viewportStack = new PooledArray();
    this._cullingSetStack = new PooledArray();
    this._frustumVolume = -1.0;
    this._bbCornerFar = 0;
    this._bbCornerNear = 0;

    // keep a matrix in memory to avoid to create matrix
    this._pooledMatrix = new PooledResource(mat4.create);

    this._pooledCullingSet = new PooledResource(createCullingSet);

    // data for caching camera matrix inverse for computation of world/view
    // contains index of the camera node in the nodepath
    this._cameraIndexStack = new PooledArray();

    // contains index of the camera modelview matrix in the modelViewMatrixStack
    this._cameraModelViewIndexStack = new PooledArray();

    // contains the id has a key to computed Inverse Matrix
    this._cameraMatrixInverse = new PooledMap();
    this._cameraMatrixInverseRoot = undefined;
};

MACROUTILS.createPrototypeObject(
    CullStack,
    MACROUTILS.objectInherit(CullSettings.prototype, {
        reset: function() {
            this._modelViewMatrixStack.reset();
            this._projectionMatrixStack.reset();
            this._cullingSetStack.reset();

            this._pooledMatrix.reset();
            this._pooledCullingSet.reset();

            this._cameraModelViewIndexStack.reset();
            this._cameraIndexStack.reset();

            this._cameraMatrixInverse.reset();

            this._cameraMatrixInverseRoot = undefined;
        },

        getProjectionMatrixStack: function() {
            return this._projectionMatrixStack;
        },
        getCurrentProjectionMatrix: function() {
            return this._projectionMatrixStack.back();
        },

        getCurrentModelViewMatrix: function() {
            return this._modelViewMatrixStack.back();
        },

        getCameraInverseMatrix: function() {
            // Return or compute and cache the MatrixInverse of the last
            // active camera in absolute reference

            // if no index the camera inverse is the root with an fake id
            if (!this._cameraIndexStack.length) return this._cameraMatrixInverseRoot;

            var idx = this._cameraIndexStack.back();

            // get the camera node
            var camera = this.getNodePath()[idx];
            var id = camera.getInstanceID();

            var mapCameraInverse = this._cameraMatrixInverse.getMap();
            var cameraInverse = mapCameraInverse[id];

            if (cameraInverse === undefined) {
                var indexInModelViewMatrixStack = this._cameraModelViewIndexStack.back();
                var mat = this._modelViewMatrixStack.getArray()[indexInModelViewMatrixStack];
                cameraInverse = this._pooledMatrix.getOrCreateObject();
                mat4.invert(cameraInverse, mat);
                this._cameraMatrixInverse.set(id, cameraInverse);
            }
            return cameraInverse;
        },

        getCurrentModelMatrix: function() {
            // Improvment could be to cache more things
            // and / or use this method only if the shader use it
            var invMatrix = this.getCameraInverseMatrix();
            var m = this._pooledMatrix.getOrCreateObject();
            var world = mat4.mul(m, invMatrix, this.getCurrentModelViewMatrix());
            return world;
        },

        getCurrentViewMatrix: function() {
            // Improvment could be to cache more things
            // and / or use this method only if the shader use it
            var modelViewMatrixStackArray = this._modelViewMatrixStack.getArray();
            if (!this._cameraIndexStack.length) return modelViewMatrixStackArray[0];

            // also we could keep the index of the current to avoid lenght-1 at each access
            // it's implemented in osg like that:
            // https://github.com/openscenegraph/osg/blob/master/include/osg/fast_back_stack
            return modelViewMatrixStackArray[this._cameraModelViewIndexStack.back()];
        },

        getViewport: function() {
            if (this._viewportStack.length === 0) {
                return undefined;
            }
            return this._viewportStack.back();
        },
        getLookVectorLocal: function(outLookVector) {
            var lookVectorLocal = this.getCurrentModelViewMatrix();
            return vec3.set(
                outLookVector,
                -lookVectorLocal[2],
                -lookVectorLocal[6],
                -lookVectorLocal[10]
            );
        },
        pushViewport: function(vp) {
            this._viewportStack.push(vp);
        },
        popViewport: function() {
            this._viewportStack.pop();
        },

        getFrustumPlanes: (function() {
            var mvp = mat4.create();

            return function(out, projection, view, withNearFar) {
                mat4.mul(mvp, projection, view);

                var computeNearFar = !!withNearFar;

                // Right clipping plane.
                var right = out[0];
                right[0] = mvp[3] - mvp[0];
                right[1] = mvp[7] - mvp[4];
                right[2] = mvp[11] - mvp[8];
                right[3] = mvp[15] - mvp[12];

                // Left clipping plane.
                var left = out[1];
                left[0] = mvp[3] + mvp[0];
                left[1] = mvp[7] + mvp[4];
                left[2] = mvp[11] + mvp[8];
                left[3] = mvp[15] + mvp[12];

                // Bottom clipping plane.
                var bottom = out[2];
                bottom[0] = mvp[3] + mvp[1];
                bottom[1] = mvp[7] + mvp[5];
                bottom[2] = mvp[11] + mvp[9];
                bottom[3] = mvp[15] + mvp[13];

                // Top clipping plane.
                var top = out[3];
                top[0] = mvp[3] - mvp[1];
                top[1] = mvp[7] - mvp[5];
                top[2] = mvp[11] - mvp[9];
                top[3] = mvp[15] - mvp[13];

                if (computeNearFar) {
                    // Far clipping plane.
                    var far = out[4];
                    far[0] = mvp[3] - mvp[2];
                    far[1] = mvp[7] - mvp[6];
                    far[2] = mvp[11] - mvp[10];
                    far[3] = mvp[15] - mvp[14];

                    // Near clipping plane.
                    var near = out[5];
                    near[0] = mvp[3] + mvp[2];
                    near[1] = mvp[7] + mvp[6];
                    near[2] = mvp[11] + mvp[10];
                    near[3] = mvp[15] + mvp[14];
                }

                //Normalize the planes
                var j = withNearFar ? 6 : 4;
                for (var i = 0; i < j; i++) {
                    Plane.normalizeEquation(out[i]);
                }
            };
        })(),

        pushCullingSet: function() {
            var cs = this._pooledCullingSet.getOrCreateObject();
            if (this._enableFrustumCulling) {
                mat4.getFrustumPlanes(
                    cs.getFrustum().getPlanes(),
                    this.getCurrentProjectionMatrix(),
                    this.getCurrentModelViewMatrix(),
                    false
                );
                // TODO: no far no near.
                // should check if we have them
                // should add at least a near 0 clip if not
                cs.getFrustum().setupMask(4);
            }

            this._cullingSetStack.push(cs);
        },
        popCullingSet: function() {
            return this._cullingSetStack.pop();
        },
        getCurrentCullingSet: function() {
            return this._cullingSetStack.back();
        },

        pushCurrentMask: function() {
            var cs = this.getCurrentCullingSet();
            if (cs) cs.pushCurrentMask();
        },
        popCurrentMask: function() {
            var cs = this.getCurrentCullingSet();
            if (cs) cs.popCurrentMask();
        },

        isVerticesCulled: function(vertices) {
            if (!this._enableFrustumCulling) return false;
            return this.getCurrentCullingSet().isVerticesCulled(vertices);
        },

        isBoundingBoxCulled: function(bb) {
            if (!this._enableFrustumCulling) return false;
            return bb.valid() && this.getCurrentCullingSet().isBoundingBoxCulled(bb);
        },

        isBoundingSphereCulled: function(bs) {
            if (!this._enableFrustumCulling) return false;
            return bs.valid() && this.getCurrentCullingSet().isBoundingSphereCulled(bs);
        },

        isCulled: (function() {
            var bsWorld = new BoundingSphere();
            return function(node, nodePath) {
                if (!this._enableFrustumCulling) return false;
                if (node.isCullingActive()) {
                    if (this.getCurrentCullingSet().getCurrentResultMask() === 0) return false; // father bounding sphere totally inside

                    var matrix = this._pooledMatrix.getOrCreateObject();
                    mat4.identity(matrix);

                    var maxNodePathLength = nodePath.length;
                    if (node instanceof Transform) {
                        // MatrixTransform getBound is already transformed to
                        // its local space whereas nodepath also have its matrix ...
                        // so to get world space, you HAVE to remove that matrix from nodePATH
                        maxNodePathLength--;
                    }

                    ComputeMatrixFromNodePath.computeLocalToWorld(
                        nodePath,
                        true,
                        matrix,
                        maxNodePathLength
                    );

                    node.getBound().transformMat4(bsWorld, matrix);

                    return this.getCurrentCullingSet().isBoundingSphereCulled(bsWorld);
                } else {
                    this.getCurrentCullingSet().resetCullingMask();
                    return false;
                }
            };
        })(),

        pushModelViewMatrix: (function() {
            var lookVector = vec3.create();
            return function(matrix) {
                // When pushing a matrix, it can be a transform or camera. To compute
                // differents matrix type in shader ( ViewMatrix/ModelMatrix/ModelViewMatrix )
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
                if (!length) {
                    // root
                    var matInverse = this._pooledMatrix.getOrCreateObject();
                    mat4.invert(matInverse, matrix);
                    this._cameraMatrixInverseRoot = matInverse;
                } else {
                    var index = length - 1;
                    if (
                        np[index].getTypeID() === Camera.getTypeID() &&
                        np[index].getReferenceFrame() === TransformEnums.ABSOLUTE_RF
                    ) {
                        this._cameraIndexStack.push(index);
                        this._cameraModelViewIndexStack.push(this._modelViewMatrixStack.length);
                    }
                }

                this._modelViewMatrixStack.push(matrix);
                this.getLookVectorLocal(lookVector);

                /*jshint bitwise: false */
                this._bbCornerFar =
                    (lookVector[0] >= 0 ? 1 : 0) |
                    (lookVector[1] >= 0 ? 2 : 0) |
                    (lookVector[2] >= 0 ? 4 : 0);
                this._bbCornerNear = ~this._bbCornerFar & 7;
                /*jshint bitwise: true */
            };
        })(),
        popModelViewMatrix: (function() {
            var lookVector = vec3.create();

            return function() {
                // if same index it's a camera and we have to pop it
                var np = this.getNodePath();
                var index = np.length - 1;
                if (this._cameraIndexStack.length && index === this._cameraIndexStack.back()) {
                    this._cameraIndexStack.pop();
                    this._cameraModelViewIndexStack.pop();
                }

                this._modelViewMatrixStack.pop();

                if (this._modelViewMatrixStack.length !== 0) {
                    this.getLookVectorLocal(lookVector);
                } else {
                    vec3.set(lookVector, 0.0, 0.0, -1.0);
                }

                /*jshint bitwise: false */
                this._bbCornerFar =
                    (lookVector[0] >= 0.0 ? 1.0 : 0.0) |
                    (lookVector[1] >= 0 ? 2.0 : 0.0) |
                    (lookVector[2] >= 0 ? 4.0 : 0.0);
                this._bbCornerNear = ~this._bbCornerFar & 7;
                /*jshint bitwise: true */
            };
        })(),

        pushProjectionMatrix: function(matrix) {
            this._projectionMatrixStack.push(matrix);

            // need to recompute frustum volume.
            this._frustumVolume = -1.0;

            this.pushCullingSet();
        },
        popProjectionMatrix: function() {
            this._projectionMatrixStack.pop();

            // need to recompute frustum volume.
            this._frustumVolume = -1.0;

            this.popCullingSet();
        }
    }),
    'osg',
    'CullStack'
);

module.exports = CullStack;
