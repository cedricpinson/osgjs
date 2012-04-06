/** -*- compile-command: "jslint-cli OrbitManipulator.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */
osgGA.OrbitManipulatorMode = {
    Rotate: 0,
    Pan: 1,
    Zoom: 2
};

/** 
 *  OrbitManipulator
 *  @class
 */
osgGA.OrbitManipulator = function () {
    osgGA.Manipulator.call(this);
    this.init();
};

osgGA.OrbitManipulator.TouchEvent = function() {
    this._x = 0;
    this._y = 0;
    this._scale = 1.0;
    this._rotation = 0.0;
};
osgGA.OrbitManipulator.TouchEvent.prototype = {
    init: function(id, x, y, scale, rotation) {
        this._id = id;
        this._x = x;
        this._y = y;
        if (scale !== undefined) {
            this._scale = scale;
        }
        if (rotation !== undefined) {
            this._rotation = rotation;
        }
    }
};

/** @lends osgGA.OrbitManipulator.prototype */
osgGA.OrbitManipulator.prototype = osg.objectInehrit(osgGA.Manipulator.prototype, {
    init: function() {
        this.distance = 25;
        this.target = new Array(3);
        this.eye = [ 0, this.distance, 0];
        this.rotation = osg.Matrix.mult(osg.Matrix.makeRotate( Math.PI, 0,0,1, []), osg.Matrix.makeRotate( -Math.PI/10.0, 1,0,0, []), []); // osg.Quat.makeIdentity();
        this.up = [0, 0, 1];
        this.time = 0.0;
        this.dx = 0.0;
        this.dy = 0.0;
        this.buttonup = true;
        this.scale = 10.0;
        this.targetDistance = this.distance;
        this.currentMode = osgGA.OrbitManipulatorMode.Rotate;
        this.maxDistance = 0;
        this.minDistance = 0;
        this._scaleMouseMotion = 1.0/10;
    },
    reset: function() {
        this.init();
    },
    setNode: function(node) {
        this.node = node;
    },
    setTarget: function(target) {
        osg.Vec3.copy(target, this.target);
    },
    computeHomePosition: function() {
        if (this.node !== undefined) {
            //this.reset();
            var bs = this.node.getBound();
            this.setDistance(bs.radius()*1.5);
            this.setTarget(bs.center());
        }
    },

    keydown: function(ev) {
        if (ev.keyCode === 32) {
            this.computeHomePosition();
        } else if (ev.keyCode === 33) { // pageup
            this.distanceIncrease();
            return false;
        } else if (ev.keyCode === 34) { //pagedown
            this.distanceDecrease();
            return false;
        } else if (ev.keyCode === 16) { //control
            this.currentMode = osgGA.OrbitManipulatorMode.Pan;
            return false;
        }
    },
    keyup: function(ev) {
        if (ev.keyCode === 16) { //control
            this.currentMode = osgGA.OrbitManipulatorMode.Rotate;
            return false;
        }
    },

    touchstart: function(ev) {
        event.preventDefault();

        var touches = event.changedTouches;
        if (this._moveTouch === undefined) {
            this._moveTouch = new osgGA.OrbitManipulator.TouchEvent();
            var touch = touches[0];
            var id = touch.identifier;
            // relative to element position
            var rte = this.getPositionRelativeToCanvas(touch);
            this._moveTouch.init(id, rte[0], rte[1]);
            
            this.pushButton(touch);
            osg.log("touch " + id + " started at " + rte[0] + " " + rte[1] );

            this.panning = true;
            this.dragging = true;
        }
    },
    touchend: function(event) {
        event.preventDefault();

        this._moveTouch = undefined;
        this.dragging = false;
        this.panning = false;
        this.releaseButton(event);
    },
    touchmove: function(event) {
        event.preventDefault();

        var touches = event.changedTouches;
        for (var i = 0, l = touches.length; i < l; i++) {
            var touch = touches[i];
            var id = touch.identifier;
            if (id === this._moveTouch._id) {
                var rteCurrent = this.getPositionRelativeToCanvas(touch);
                // relative to element position
                var deltax = (rteCurrent[0] - this._moveTouch._x) * this._scaleMouseMotion;
                var deltay = (rteCurrent[1] - this._moveTouch._y) * this._scaleMouseMotion;
                this._moveTouch.init(id, rteCurrent[0], rteCurrent[1]);
                osg.log("touch " + id + " moved " + rteCurrent[0] + " " + rteCurrent[1]);
                osg.log("touch " + id + " moved " + deltax + " " + deltay);
                this.update(-deltax, -deltay);
            }
        }
    },
    touchleave: function(event) {
        return this.touchend(event);
    },
    touchcancel: function(event) {
        this.touchend(event);
    },

    mouseup: function(ev) {
        this.dragging = false;
        this.panning = false;
        this.releaseButton(ev);
    },
    mousedown: function(ev) {
        this.panning = true;
        this.dragging = true;
        var pos = this.getPositionRelativeToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
        ev.preventDefault();
    },
    mousemove: function(ev) {
        if (this.buttonup === true) {
            return;
        }
        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.getPositionRelativeToCanvas(ev);
        curX = pos[0];
        curY = pos[1];

        deltaX = (curX - this.clientX) * this._scaleMouseMotion;
        deltaY = (curY - this.clientY) * this._scaleMouseMotion;

        this.clientX = curX;
        this.clientY = curY;

        this.update(-deltaX, -deltaY);
        return false;
    },
    setMaxDistance: function(d) {
        this.maxDistance =  d;
    },
    setMinDistance: function(d) {
        this.minDistance =  d;
    },
    setDistance: function(d) {
        this.distance = d;
        this.targetDistance = d;
    },

    panModel: function(dx, dy) {
        var inv = new Array(16);
        var x = new Array(3);
        var y = new Array(3);
        osg.Matrix.inverse(this.rotation, inv);
        x[0] = osg.Matrix.get(inv, 0,0);
        x[1] = osg.Matrix.get(inv, 0,1);
        x[2] = osg.Matrix.get(inv, 0,2);
        osg.Vec3.normalize(x, x);

        y[0] = osg.Matrix.get(inv, 2,0);
        y[1] = osg.Matrix.get(inv, 2,1);
        y[2] = osg.Matrix.get(inv, 2,2);
        osg.Vec3.normalize(y, y);

        osg.Vec3.mult(x, -dx, x);
        osg.Vec3.mult(y, dy, y);
        osg.Vec3.add(this.target, x, this.target);
        osg.Vec3.add(this.target, y, this.target);
    },

    computeRotation: function(dx, dy) {
        var of = osg.Matrix.makeRotate(dx / 10.0, 0,0,1, []);
        var r = osg.Matrix.mult(this.rotation, of, []);

        of = osg.Matrix.makeRotate(dy / 10.0, 1,0,0, []);
        var r2 = osg.Matrix.mult(of, r, []);

        // test that the eye is not too up and not too down to not kill
        // the rotation matrix
        var inv = [];
        osg.Matrix.inverse(r2, inv);
        var eye = osg.Matrix.transformVec3(inv, [0, this.distance, 0], new Array(3));

        var dir = osg.Vec3.neg(eye, []);
        osg.Vec3.normalize(dir, dir);

        var p = osg.Vec3.dot(dir, [0,0,1]);
        if (Math.abs(p) > 0.95) {
            //discard rotation on y
            this.rotation = r;
            return;
        }
        this.rotation = r2;
    },

    update: function(dx, dy) {
        this.dx = dx;
        this.dy = dy;

        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            this.time = (new Date()).getTime();
        }
    },

    updateWithDelay: function() {
        var f = 1.0;
        var dt;
        var max = 2.0;
        var dx = this.dx;
        var dy = this.dy;
        if (this.buttonup) {
            f = 0.0;
            dt = ((new Date()).getTime() - this.time)/1000.0;
            if (dt < max) {
                f = 1.0 - osgAnimation.EaseOutQuad(dt/max);
            }
            dx *= f;
            dy *= f;
        } else {
            this.dx = 0;
            this.dy = 0;
        }

        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            if (this.currentMode === osgGA.OrbitManipulatorMode.Pan) {
                this.panModel(dx/this.scale, dy/this.scale);
            } else if ( this.currentMode === osgGA.OrbitManipulatorMode.Rotate) {
                this.computeRotation(dx, dy);
            }
        }
    },
    releaseButton: function() {
        this.buttonup = true;
    },

    mousewheel: function(ev, intDelta, deltaX, deltaY) {
        ev.preventDefault();
	if (intDelta > 0){
            if (this.distanceDecrease) {
                this.distanceDecrease();
            }
	}
	else if (intDelta < 0){
            if (this.distanceIncrease) {
                this.distanceIncrease();
            }
	}
    },
    distanceIncrease: function() {
        var h = this.distance;
        var currentTarget = this.targetDistance;
        var newTarget = currentTarget + h/10.0;
        if (this.maxDistance > 0) {
            if (newTarget > this.maxDistance) {
                newTarget = this.maxDistance;
            }
        }
        this.distance = currentTarget;
        this.targetDistance = newTarget;
        this.timeMotion = (new Date()).getTime();
    },
    distanceDecrease: function() {
        var h = this.distance;
        var currentTarget = this.targetDistance;
        var newTarget = currentTarget - h/10.0;
        if (this.minDistance > 0) {
            if (newTarget < this.minDistance) {
                newTarget = this.minDistance;
            }
        }
        this.distance = currentTarget;
        this.targetDistance = newTarget;
        this.timeMotion = (new Date()).getTime();
    },

    pushButton: function() {
        this.dx = this.dy = 0;
        this.buttonup = false;
    },
    getInverseMatrix: function () {
        this.updateWithDelay();

        var target = this.target;
        var distance = this.distance;

        if (this.timeMotion !== undefined) { // we have a camera motion event
            var dt = ((new Date()).getTime() - this.timeMotion)/1000.0;
            var motionDuration = 1.0;
            if (dt < motionDuration) {
                var r = osgAnimation.EaseOutQuad(dt/motionDuration);
                if (this.targetMotion) {
                    target = osg.Vec3.add(this.target, osg.Vec3.mult(osg.Vec3.sub(this.targetMotion, this.target), r));
                }
                if (this.targetDistance) {
                    distance = this.distance + (this.targetDistance - this.distance) * r;
                }
            } else {
                if (this.targetMotion) {
                    this.target = this.targetMotion;
                    target = this.targetMotion;
                }
                if (this.targetDistance) {
                    this.distance = this.targetDistance;
                    distance = this.targetDistance;
                }
                this.timeMotion = undefined;
            }
        }
        
        var inv = [];
        var eye = [];
        osg.Matrix.inverse(this.rotation, inv);
        osg.Matrix.transformVec3(inv,
                                 [0, distance, 0],
                                 eye );

        osg.Matrix.makeLookAt(osg.Vec3.add(target, eye, eye),
                              target,
                              [0,0,1], 
                              inv);
        return inv;
    }
});

