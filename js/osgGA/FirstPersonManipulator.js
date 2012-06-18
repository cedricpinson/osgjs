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
        this.node = node;
        this.computeHomePosition();
    },
    computeHomePosition: function() {
        if (this.node !== undefined) {
            var bs = this.node.getBound();
            this._radius = bs.radius();
            this.eye = [ 0, -bs.radius()*1.5, 0 ];
        }
    },
    init: function()
    {
        this.direction = [0.0, 1.0, 0.0];
        this.angleVertical = 0.0;
        this.angleHorizontal = 0.0;
        this.eye = [0, 25.0, 10.0];
        this.up = [0, 0, 1];
        this.buttonup = true;
        this._radius = 1;
        this._forward = 0;
        this._side = 0;
    },
    reset: function()
    {
        this.init();
    },
    mouseup: function(ev)
    {
        this.dragging = false;
        this.releaseButton(ev);
    },
    mousedown: function(ev)
    {
        this.dragging = true;
        var pos = this.getPositionRelativeToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
    },
    mousemove: function(ev)
    {
        if (this.buttonup === true) { return; }

        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.getPositionRelativeToCanvas(ev);

        curX = pos[0];
        curY = pos[1];
        deltaX = this.clientX - curX;
        deltaY = this.clientY - curY;
        this.clientX = curX;
        this.clientY = curY;

        this.update(deltaX, deltaY);
        this.computeRotation(this.dx*0.5, this.dy*0.5);
    },
    pushButton: function(ev)
    {
        this.dx = this.dy = 0;
        this.buttonup = false;
    },
    computeRotation: function(dx, dy)
    {
        this.angleVertical += dy*0.01;
        this.angleHorizontal -= dx*0.01;

        var first = [];
        var second = [];
        var rotMat = [];
        osg.Matrix.makeRotate(this.angleVertical, 1, 0, 0, first);
        osg.Matrix.makeRotate(this.angleHorizontal, 0, 0, 1, second);
        osg.Matrix.mult(second, first, rotMat);

        this.direction = osg.Matrix.transformVec3(rotMat, [0, 1, 0], []);
        this.up = osg.Matrix.transformVec3(rotMat, [0, 0, 1], [] );
    },
    update: function(dx, dy)
    {
        this.dx = dx;
        this.dy = dy;
    },
    releaseButton: function()
    {
        this.buttonup = true;
    },

    getInverseMatrix: function()
    {
        var vec = new Array(2);
        osg.Vec2.normalize([this._forward, this._side ], vec);
        var factor = this._radius;
        if (this._radius < 1e-3) {
            factor = 1.0;
        }
        this.moveForward(vec[0] * factor/30.0);
        this.strafe(vec[1] * factor/30.0);

        var target = osg.Vec3.add(this.eye, this.direction, []);
        return osg.Matrix.makeLookAt(this.eye, target, this.up, []);
    },

    moveForward: function(distance)
    {
        var d = osg.Vec3.mult(osg.Vec3.normalize(this.direction, []), distance, []);
        this.eye = osg.Vec3.add(this.eye, d, []);
    },

    strafe: function(distance)
    {
        var cx = osg.Vec3.cross(this.direction, this.up, []);
        var d = osg.Vec3.mult(osg.Vec3.normalize(cx,cx), distance, []);
        this.eye = osg.Vec3.add(this.eye, d, []);
    },
    
    keydown: function(event) {
        if (event.keyCode === 32) {
            this.computeHomePosition();
        } else if (event.keyCode == 87){ // W
            this._forward = 1;
            return false;
        }
        else if (event.keyCode == 83){ // S
            this._forward = -1;
            return false;
        }
        else if (event.keyCode == 68){ // D
            this._side = 1;
            return false;
        }
        else if (event.keyCode == 65){ // A
            this._side = -1;
            return false;
        }
    },

    keyup: function(event) {
        if (event.keyCode == 87){ // W
            this._forward = 0;
            return false;
        }
        else if (event.keyCode == 83){ // S
            this._forward = 0;
            return false;
        }
        else if (event.keyCode == 68){ // D
            this._side = 0;
            return false;
        }
        else if (event.keyCode == 65){ // A
            this._side = 0;
            return false;
        }
    }

});
