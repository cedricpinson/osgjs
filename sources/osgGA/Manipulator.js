import notify from 'osg/notify';
import BoundingSphere from 'osg/BoundingSphere';
import { mat4 } from 'osg/glMatrix';

// Base class for Camera / User manipulator
var Manipulator = function(boundStrategy) {
    this._boundStrategy = boundStrategy;
    if (this._boundStrategy === undefined) {
        this._boundStrategy = Manipulator.COMPUTE_HOME_USING_SPHERE;
    }

    this._controllerList = {};
    this._inverseMatrix = mat4.create();
    this._camera = undefined;
    this._node = undefined;
    this._frustum = {};
    this._computeBoundNodeMaskOverride = ~0x0;

    // for getHomeBoundingSphere
    this._tmpSphere = new BoundingSphere();
};

Manipulator.prototype = {
    setCamera: function(c) {
        this._camera = c;
    },
    getCamera: function() {
        return this._camera;
    },
    setNode: function(node) {
        this._node = node;
    },
    setComputeBoundNodeMaskOverride: function(mask) {
        this._computeBoundNodeMaskOverride = mask;
    },
    getComputeBoundNodeMaskOverride: function() {
        return this._computeBoundNodeMaskOverride;
    },

    // overrideStrat should be a bounding volume calculation strategy
    getHomeBoundingSphere: function(overrideStrat) {
        var node = this._node;
        if (!node) return;

        var type = overrideStrat !== undefined ? overrideStrat : this._boundStrategy;

        if (type & Manipulator.COMPUTE_HOME_USING_BBOX) {
            var box;
            if (this._computeBoundNodeMaskOverride === ~0x0) {
                box = node.getBoundingBox();
            } else {
                var ComputeBoundsVisitor = require('osg/ComputeBoundsVisitor').default;
                var cbv = new ComputeBoundsVisitor();
                cbv.setNodeMaskOverride(this._computeBoundNodeMaskOverride);
                cbv.reset();

                cbv.apply(node);
                box = cbv.getBoundingBox();
            }

            if (!box.valid()) return node.getBoundingSphere();

            // minimum between sphere and box
            if (type & Manipulator.COMPUTE_HOME_USING_SPHERE) {
                var bsphere = node.getBoundingSphere();
                if (bsphere.valid() && bsphere.volume() < box.volume()) {
                    return bsphere;
                }
            }

            this._tmpSphere.copyBoundingBox(box);
            return this._tmpSphere;
        }

        return node.getBoundingSphere();
    },

    getHomeBound: function(overrideStrat) {
        notify.warn('Please use getHomeBoundingSphere instead');
        return this.getHomeBoundingSphere(overrideStrat);
    },

    getHomeDistance: function(bound) {
        var frustum = this._frustum;
        var dist = bound.radius();
        if (this._camera && mat4.getFrustum(frustum, this._camera.getProjectionMatrix())) {
            var vertical2 = Math.abs(frustum.right - frustum.left) / frustum.zNear / 2;
            var horizontal2 = Math.abs(frustum.top - frustum.bottom) / frustum.zNear / 2;
            dist /= Math.sin(Math.atan2(horizontal2 < vertical2 ? horizontal2 : vertical2, 1));
        } else {
            dist *= 1.5;
        }
        return dist;
    },
    // eg: var currentTime = nv.getFrameStamp().getSimulationTime();
    update: function(/*nv*/) {},

    getInverseMatrix: function() {
        return this._inverseMatrix;
    },

    getControllerList: function() {
        return this._controllerList;
    }
};

// flags
Manipulator.COMPUTE_HOME_USING_SPHERE = 1 << 0;
Manipulator.COMPUTE_HOME_USING_BBOX = 1 << 1;

export default Manipulator;
