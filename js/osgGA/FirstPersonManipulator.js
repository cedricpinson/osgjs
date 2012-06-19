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
    },
    reset: function()
    {
        this.init();
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

        this._direction = osg.Matrix.transformVec3(rotMat, [0, 1, 0], []);
        this._up = osg.Matrix.transformVec3(rotMat, [0, 0, 1], [] );
    },

    getInverseMatrix: function()
    {
        this._forward.update();
        this._side.update();
        var delta = this._lookPosition.update();

        this.computeRotation(-delta[0]*0.5, -delta[1]*0.5);

        var vec = new Array(2);
        vec[0] = this._forward.getCurrent()[0];
        vec[1] = this._side.getCurrent()[0];
        if (osg.Vec2.length(vec) >= 1.0) {
            osg.Vec2.normalize(vec, vec);
        }
        var factor = this._radius;
        if (this._radius < 1e-3) {
            factor = 1.0;
        }
        this.moveForward(vec[0] * factor/30.0);
        this.strafe(vec[1] * factor/30.0);

        var target = osg.Vec3.add(this._eye, this._direction, []);
        return osg.Matrix.makeLookAt(this._eye, target, this._up, []);
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
        } else if (event.keyCode == 87){ // W
            this._forward.setTarget(1);
            return false;
        }
        else if (event.keyCode == 83){ // S
            this._forward.setTarget(-1);
            return false;
        }
        else if (event.keyCode == 68){ // D
            this._side.setTarget(1);
            return false;
        }
        else if (event.keyCode == 65){ // A
            this._side.setTarget(-1);
            return false;
        }
    },

    keyup: function(event) {
        if (event.keyCode == 87){ // W
            this._forward.setTarget(0);
            return false;
        }
        else if (event.keyCode == 83){ // S
            this._forward.setTarget(0);
            return false;
        }
        else if (event.keyCode == 68){ // D
            this._side.setTarget(0);
            return false;
        }
        else if (event.keyCode == 65){ // A
            this._side.setTarget(0);
            return false;
        }
    }

});
