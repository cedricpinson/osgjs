/** -*- compile-command: "jslint-cli FirstPersonManipulator.js" -*-
 * Authors:
 *  Matt Fontaine <tehqin@gmail.com>
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */


/** 
 *  FirstPersonManipulator
 *  @class
 */
osgGA.FirstPersonManipulator = function () {
    osgGA.Manipulator.call(this);
    this.init();
};

osgGA.FirstPersonManipulator.AvailableControllerList = [ 'StandardMouseKeyboard' ];
osgGA.FirstPersonManipulator.ControllerList = [ 'StandardMouseKeyboard'];

/** @lends osgGA.FirstPersonManipulator.prototype */
osgGA.FirstPersonManipulator.prototype = osg.objectInehrit(osgGA.Manipulator.prototype, {
    setNode: function(node) {
        this._node = node;
        this.computeHomePosition();
    },
    computeHomePosition: function() {
        if (this._node !== undefined) {
            var bs = this._node.getBound();
            this._radius = bs.radius();
            this._eye = [ 0, -bs.radius()*1.5, 0 ];
        }
    },
    init: function()
    {
        this._direction = [0.0, 1.0, 0.0];
        this._eye = [0.0, 25.0, 10.0];
        this._up = [0.0, 0.0, 1.0];
        this._radius = 1.0;
        this._forward = new osgGA.OrbitManipulator.Interpolator(1);
        this._side = new osgGA.OrbitManipulator.Interpolator(1);
        this._lookPosition = new osgGA.OrbitManipulator.Interpolator(2);
        this._stepFactor = 1.0; // meaning radius*stepFactor to move
        this._target = new Array(3); osg.Vec3.init(this._target);
        this._angleVertical = 0.0;
        this._angleHorizontal = 0.0;

        // tmp value use for computation
        this._tmpComputeRotation1 = osg.Matrix.makeIdentity([]);
        this._tmpComputeRotation2 = osg.Matrix.makeIdentity([]);
        this._tmpComputeRotation3 = osg.Matrix.makeIdentity([]);
        this._tmpGetTargetDir = osg.Vec3.init([]);

        var self = this;

        this._controllerList = {};
        osgGA.FirstPersonManipulator.ControllerList.forEach(function(value) {
            if (osgGA.FirstPersonManipulator[value] !== undefined) {
                self._controllerList[value] = new osgGA.FirstPersonManipulator[value](self);
            }
        });

    },

    getEyePosition: function(eye) {
        eye[0] = this._eye[0];
        eye[1] = this._eye[1];
        eye[2] = this._eye[2];
        return eye;
    },

    setEyePosition: function(eye) {
        this._eye[0] = eye[0];
        this._eye[1] = eye[1];
        this._eye[2] = eye[2];
        return this;
    },

    getTarget: function(pos, distance) {
        if (distance === undefined) {
            distance = 25;
        }
        var dir = osg.Vec3.mult(this._direction, distance, this._tmpGetTargetDir);
        osg.Vec3.add(this._eye, dir, pos);
    },

    setTarget: function(pos) {
        this._target[0] = pos[0];
        this._target[1] = pos[1];
        this._target[2] = pos[2];
        var dir = this._tmpGetTargetDir;
        osg.Vec3.sub(pos, this._eye, dir);
        dir[2] = 0;
        osg.Vec3.normalize(dir, dir);
        this._angleHorizontal = Math.acos(dir[1]);
        if (dir[0] < 0) {
            this._angleHorizontal = -this._angleHorizontal;
        }
        osg.Vec3.sub(pos, this._eye, dir);
        osg.Vec3.normalize(dir, dir);

        this._angleVertical = -Math.asin(dir[2]);
        osg.Vec3.copy(dir, this._direction);
    },

    getLookPositionInterpolator: function() { return this._lookPosition; },
    getSideInterpolator: function() { return this._side; },
    getFowardInterpolator: function() { return this._forward; },

    computeRotation: function(dx, dy) {
        this._angleVertical += dy*0.01;
        this._angleHorizontal -= dx*0.01;

        var first = this._tmpComputeRotation1;
        var second = this._tmpComputeRotation2;
        var rotMat = this._tmpComputeRotation3;
        osg.Matrix.makeRotate(this._angleVertical, 1, 0, 0, first);
        osg.Matrix.makeRotate(this._angleHorizontal, 0, 0, 1, second);
        osg.Matrix.mult(second, first, rotMat);

        this._direction = osg.Matrix.transformVec3(rotMat, [0, 1, 0], this._direction);
        osg.Vec3.normalize(this._direction, this._direction);

        this._up = osg.Matrix.transformVec3(rotMat, [0, 0, 1], this._up );
    },

    reset: function()
    {
        this.init();
    },

    setStepFactor: function(t) {
        this._stepFactor = t;
    },

    update: function(nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        if (this._lastUpdate === undefined) {
            this._lastUpdate = t;
        }
        var dt = t - this._lastUpdate;
        this._lastUpdate = t;

        this._forward.update();
        this._side.update();
        var delta = this._lookPosition.update();

        this.computeRotation(-delta[0]*0.5, -delta[1]*0.5);

        var vec = new Array(2);
        vec[0] = this._forward.getCurrent()[0];
        vec[1] = this._side.getCurrent()[0];
        if (osg.Vec2.length(vec) > 1.0) {
            osg.Vec2.normalize(vec, vec);
        }
        var factor = this._radius;
        if (this._radius < 1e-3) {
            factor = 1.0;
        }
        this.moveForward(vec[0] * factor*this._stepFactor*dt);
        this.strafe(vec[1] * factor*this._stepFactor*dt);

        var target = osg.Vec3.add(this._eye, this._direction, []);
        this._target = target;

        osg.Matrix.makeLookAt(this._eye, target, this._up, this._inverseMatrix);
    },

    getInverseMatrix: function()
    {
        return this._inverseMatrix;
    },

    moveForward: function(distance)
    {
        var d = osg.Vec3.mult(osg.Vec3.normalize(this._direction, []), distance, []);
        this._eye = osg.Vec3.add(this._eye, d, []);
    },

    strafe: function(distance)
    {
        var cx = osg.Vec3.cross(this._direction, this._up, []);
        var d = osg.Vec3.mult(osg.Vec3.normalize(cx,cx), distance, []);
        this._eye = osg.Vec3.add(this._eye, d, []);
    }
    
});


(function(module) {
    module.StandardMouseKeyboard = osgGA.getFirstPersonStandardMouseKeyboardControllerClass();
})(osgGA.FirstPersonManipulator);
