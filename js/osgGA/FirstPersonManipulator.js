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

            this._angleVertical = 0.0;
            this._angleHorizontal = 0.0;
        }
    },
    init: function()
    {
        this._direction = [0.0, 1.0, 0.0];
        this._angleVertical = 0.0;
        this._angleHorizontal = 0.0;
        this._eye = [0, 25.0, 10.0];
        this._up = [0, 0, 1];
        this._buttonup = true;
        this._radius = 1;
        this._forward = new osgGA.OrbitManipulator.Interpolator(1);
        this._side = new osgGA.OrbitManipulator.Interpolator(1);
        this._lookPosition = new osgGA.OrbitManipulator.Interpolator(2);
        this._stepFactor = 1.0; // meaning radius*stepFactor to move
        this._target = new Array(3); osg.Vec3.init(this._target);
    },
    reset: function()
    {
        this.init();
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
    },

    getTarget: function(pos, distance) {
        if (distance === undefined) {
            distance = 25;
        }
        var dir = osg.Vec3.mult(this._direction, distance, new Array(3));
        osg.Vec3.add(this._eye, dir, pos);
    },

    setTarget: function(pos) {
        this._target[0] = pos[0];
        this._target[1] = pos[1];
        this._target[2] = pos[2];
        var dir = new Array(3);
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

    mousedown: function(ev)
    {
        var pos = this.getPositionRelativeToCanvas(ev);
        this._lookPosition.set(pos[0], pos[1]);
        this._buttonup = false;
    },
    mouseup: function(ev) {
        this._buttonup = true;
    },
    mousemove: function(ev)
    {
        if (this._buttonup === true) { return; }

        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.getPositionRelativeToCanvas(ev);

        this._lookPosition.setTarget(pos[0], pos[1]);
    },

    computeRotation: function(dx, dy)
    {
        this._angleVertical += dy*0.01;
        this._angleHorizontal -= dx*0.01;

        var first = [];
        var second = [];
        var rotMat = [];
        osg.Matrix.makeRotate(this._angleVertical, 1, 0, 0, first);
        osg.Matrix.makeRotate(this._angleHorizontal, 0, 0, 1, second);
        osg.Matrix.mult(second, first, rotMat);
        //rotMat = second;

        this._direction = osg.Matrix.transformVec3(rotMat, [0, 1, 0], []);
        osg.Vec3.normalize(this._direction, this._direction);

        this._up = osg.Matrix.transformVec3(rotMat, [0, 0, 1], [] );
    },

    mousewheel: function(ev, intDelta, deltaX, deltaY) {
        ev.preventDefault();
        this._stepFactor = Math.min(Math.max(0.001,this._stepFactor+intDelta*0.01), 4.0);
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
    },
    
    keydown: function(event) {
        if (event.keyCode === 32) {
            this.computeHomePosition();
        } else if (event.keyCode === 87 || event.keyCode === 90 || event.keyCode === 38){ // w/z/up
            this._forward.setTarget(1);
            return false;
        }
        else if (event.keyCode === 83 || event.keyCode === 40){ // S/down
            this._forward.setTarget(-1);
            return false;
        }
        else if (event.keyCode === 68 || event.keyCode === 39){ // D/right
            this._side.setTarget(1);
            return false;
        }
        else if (event.keyCode === 65 || event.keyCode === 81 || event.keyCode === 37){ // a/q/left
            this._side.setTarget(-1);
            return false;
        }
    },

    keyup: function(event) {
        if (event.keyCode === 87 || event.keyCode === 90 || event.keyCode === 38) { // w/z/up
            this._forward.setTarget(0);
            return false;
        }
        else if (event.keyCode == 83 || event.keyCode === 40){ // S/down
            this._forward.setTarget(0);
            return false;
        }
        else if (event.keyCode == 68 || event.keyCode === 39){ // D/right
            this._side.setTarget(0);
            return false;
        }
        else if (event.keyCode === 65 || event.keyCode === 81 || event.keyCode === 37){ // a/q/left
            this._side.setTarget(0);
            return false;
        }
    }
});
