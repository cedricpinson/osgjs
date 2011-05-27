/** -*- compile-command: "jslint-cli FirstPersonManipulator.js" -*-
 * Authors:
 *  Matt Fontaine <tehqin@gmail.com>
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

osgGA.FirstPersonManipulator = function () {
    this.init();
};

osgGA.FirstPersonManipulator.prototype = {
    setNode: function(node) {
        this.node = node;
    },
    computeHomePosition: function() {
        if (this.node) {
            var bs = this.node.getBound();
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
        this.time = 0.0;
        this.buttonup = true;
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
        var pos = this.convertEventToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
    },
    mousemove: function(ev)
    {
        if (this.buttonup === true)
        {
            return;
        }

        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.convertEventToCanvas(ev);

        curX = pos[0];
        curY = pos[1];
        deltaX = this.clientX - curX;
        deltaY = this.clientY - curY;
        this.clientX = curX;
        this.clientY = curY;

        this.update(deltaX, deltaY);
        this.computeRotation(this.dx, this.dy);
    },
    dblclick: function(ev)
    {
    },
    touchdown: function(ev)
    {
    },
    touchup: function(ev)
    {
    },
    touchmove: function(ev)
    {
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

        var first = osg.Matrix.makeRotate(this.angleVertical, 1, 0, 0);
        var second = osg.Matrix.makeRotate(this.angleHorizontal, 0, 0, 1);
        var rotMat = osg.Matrix.mult(second, first, []);

        this.direction = osg.Matrix.transformVec3(rotMat, [0, 1, 0], []);
        this.up = osg.Matrix.transformVec3(rotMat, [0, 0, 1], [] );
    },
    update: function(dx, dy)
    {
        this.dx = dx;
        this.dy = dy;
        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            this.time = (new Date()).getTime();
        }
    },
    releaseButton: function()
    {
        this.buttonup = true;
    },
    getInverseMatrix: function()
    {
        var target = osg.Vec3.add(this.eye, this.direction);
        return osg.Matrix.makeLookAt(this.eye, target, this.up);
    },
    moveForward: function(distance)
    {
        var d = osg.Vec3.mult(osg.Vec3.normalize(this.direction), distance);
        this.eye = osg.Vec3.add(this.eye, d);
    },
    strafe: function(distance)
    {
        var cx = osg.Vec3.cross(this.direction, this.up);
        var d = osg.Vec3.mult(osg.Vec3.normalize(cx), distance);
        this.eye = osg.Vec3.add(this.eye, d);
    },
    
    keydown: function(event) {
        if (event.keyCode === 32) {
            this.computeHomePosition();
        } else if (event.keyCode == 87){ // W
            this.moveForward(5.0);
            return false;
        }
        else if (event.keyCode == 83){ // S
            this.moveForward(-5.0);
            return false;
        }
        else if (event.keyCode == 68){ // D
            this.strafe(5.0);
            return false;
        }
        else if (event.keyCode == 65){ // A
            this.strafe(-5.0);
            return false;
        }
    }
};
