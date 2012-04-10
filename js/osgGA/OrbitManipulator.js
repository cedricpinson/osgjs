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

/** @lends osgGA.OrbitManipulator.prototype */
osgGA.OrbitManipulator.prototype = osg.objectInehrit(osgGA.Manipulator.prototype, {
    init: function() {
        this._distance = 25;
        this._target = new Array(3); osg.Vec3.init(this._target);

        this._rotation = osg.Matrix.mult(osg.Matrix.makeRotate( Math.PI, 0,0,1, []), osg.Matrix.makeRotate( -Math.PI/10.0, 1,0,0, []), []);
        this._time = 0.0;
        this._dx = 0.0;
        this._dy = 0.0;
        this._buttonup = true;
        this._scale = 10.0;
        this._targetDistance = this._distance;
        this._currentMode = osgGA.OrbitManipulatorMode.Rotate;
        this._maxDistance = 0;
        this._minDistance = 0;
        this._scaleMouseMotion = 1.0/10;
        this._node = undefined;

        this._moveTouch = undefined;
        this._mousePosition = new Array(2);

        this._inverseMatrix = new Array(16);
    },
    reset: function() {
        this.init();
    },
    setNode: function(node) {
        this._node = node;
    },
    setTarget: function(target) {
        osg.Vec3.copy(target, this._target);
    },
    computeHomePosition: function() {
        if (this._node !== undefined) {
            //this.reset();
            var bs = this._node.getBound();
            this.setDistance(bs.radius()*1.5);
            this.setTarget(bs.center());
        }
    },

    keydown: function(ev) {
        if (ev.keyCode === 32) {
            this.computeHomePosition();
        } else if (ev.keyCode === 33) { // pageup
            this.distanceIncrease();
        } else if (ev.keyCode === 34) { //pagedown
            this.distanceDecrease();
        } else if (ev.keyCode === 16) { //shift
            this._currentMode = osgGA.OrbitManipulatorMode.Pan;
        } else if ( ev.keyCode === 91) { // leftwindow
            this._currentMode = osgGA.OrbitManipulatorMode.Zoom;
        }
    },

    keyup: function(ev) {
        if (ev.keyCode === 16) { //shift
            this._currentMode = osgGA.OrbitManipulatorMode.Rotate;
        } else if ( ev.keyCode === 91) { // leftwindow
            this._currentMode = osgGA.OrbitManipulatorMode.Rotate;
        }
    },

    touchstart: function(ev) {
        event.preventDefault();

        var touches = event.changedTouches;
        if (this._moveTouch === undefined) {
            this._moveTouch = new osgGA.OrbitManipulator.TouchEvent();
        }
        if (this._moveTouch.id === undefined) {
            var touch = touches[0];
            var id = touch.identifier;
            // relative to element position
            var rte = this.getPositionRelativeToCanvas(touch);
            this._moveTouch.init(id, rte[0], rte[1]);
            this.pushButton(touch);
        }
    },
    touchend: function(event) {
        event.preventDefault();

        this._moveTouch = undefined;
        this.releaseButton(event);
    },
    touchmove: function(event) {
        event.preventDefault();

        var touches = event.changedTouches;
        for (var i = 0, l = touches.length; i < l; i++) {
            var touch = touches[i];
            var id = touch.identifier;
            if (id === this._moveTouch.id) {
                var rteCurrent = this.getPositionRelativeToCanvas(touch);
                // relative to element position
                var deltax = (rteCurrent[0] - this._moveTouch.x) * this._scaleMouseMotion;
                var deltay = (rteCurrent[1] - this._moveTouch.y) * this._scaleMouseMotion;
                this._moveTouch.init(id, rteCurrent[0], rteCurrent[1]);
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

    gesturestart: function(event) {
        event.preventDefault();
        if (this._moveTouch) { // disable id for gesture
            this._moveTouch.id = undefined;
        }
        this._moveTouch.init(undefined, 0, 0, event.scale, event.rotation);
    },
    gestureend: function(event) {
        event.preventDefault();
        var scale = event.scale - this._moveTouch.scale;
        this._moveTouch.init(undefined, 0, 0, event.scale, event.rotation);
        var z = 1.0+(-scale);
        this.zoom(z);

    },
    gesturechange: function(event) {
        event.preventDefault();
        var scale = event.scale - this._moveTouch.scale;
        this._moveTouch.init(undefined, 0, 0, event.scale, event.rotation);
        var z = 1.0+(-scale);
        this.zoom(z);
    },

    mouseup: function(ev) {
        this.releaseButton(ev);
    },
    mousedown: function(ev) {
        var pos = this.getPositionRelativeToCanvas(ev);
        this._mousePosition[0] = pos[0];
        this._mousePosition[1] = pos[1];
        this.pushButton(ev);
        ev.preventDefault();
    },
    mousemove: function(ev) {
        if (this._buttonup === true) {
            return;
        }
        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.getPositionRelativeToCanvas(ev);
        curX = pos[0];
        curY = pos[1];

        deltaX = (curX - this._mousePosition[0]) * this._scaleMouseMotion;
        deltaY = (curY - this._mousePosition[1]) * this._scaleMouseMotion;

        this._mousePosition[0] = curX;
        this._mousePosition[1] = curY;

        this.update(-deltaX, -deltaY);
        return false;
    },
    setMaxDistance: function(d) {
        this._maxDistance =  d;
    },
    setMinDistance: function(d) {
        this._minDistance =  d;
    },
    setDistance: function(d) {
        this._distance = d;
        this._targetDistance = d;
    },

    panModel: function(dx, dy) {
        dy *= this._distance;
        dx *= this._distance;

        var inv = new Array(16);
        var x = new Array(3);
        var y = new Array(3);
        osg.Matrix.inverse(this._rotation, inv);
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
        osg.Vec3.add(this._target, x, this._target);
        osg.Vec3.add(this._target, y, this._target);
    },

    computeRotation: function(dx, dy) {
        var of = osg.Matrix.makeRotate(dx / 10.0, 0,0,1, []);
        var r = osg.Matrix.mult(this._rotation, of, []);

        of = osg.Matrix.makeRotate(dy / 10.0, 1,0,0, []);
        var r2 = osg.Matrix.mult(of, r, []);

        // test that the eye is not too up and not too down to not kill
        // the rotation matrix
        var inv = [];
        osg.Matrix.inverse(r2, inv);
        var eye = osg.Matrix.transformVec3(inv, [0, this._distance, 0], new Array(3));

        var dir = osg.Vec3.neg(eye, []);
        osg.Vec3.normalize(dir, dir);

        var p = osg.Vec3.dot(dir, [0,0,1]);
        if (Math.abs(p) > 0.95) {
            //discard rotation on y
            this._rotation = r;
            return;
        }
        this._rotation = r2;
    },

    update: function(dx, dy) {
        this._dx = dx;
        this._dy = dy;

        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            this._time = (new Date()).getTime();
        }
    },

    updateWithDelay: function() {
        var f = 1.0;
        var dt;
        var max = 2.0;
        var dx = this._dx;
        var dy = this._dy;
        if (this._buttonup) {
            f = 0.0;
            dt = ((new Date()).getTime() - this._time)/1000.0;
            if (dt < max) {
                f = 1.0 - osgAnimation.EaseOutQuad(dt/max);
            }
            dx *= f;
            dy *= f;
        } else {
            this._dx = 0;
            this._dy = 0;
        }

        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            if (this._currentMode === osgGA.OrbitManipulatorMode.Pan) {
                this.panModel(dx/30.0, dy/30.0);
            } else if ( this._currentMode === osgGA.OrbitManipulatorMode.Rotate) {
                this.computeRotation(dx, dy);
            } else if ( this._currentMode === osgGA.OrbitManipulatorMode.Zoom) {
                this.zoom(1.0 + dy/10.0);
            }
        }
    },
    releaseButton: function() {
        this._buttonup = true;
    },

    mousewheel: function(ev, intDelta, deltaX, deltaY) {
        ev.preventDefault();
        this.zoom(1.0 - intDelta/10.0);
    },

    zoom: function(ratio) {
        var newValue = this._distance*ratio;
        if (this._minDistance > 0) {
            if (newValue < this._minDistance) {
                newValue = this._minDistance;
            }
        }
        if (this._maxDistance > 0) {
            if (newValue > this._maxDistance) {
                newValue = this._maxDistance;
            }
        }
        this._distance = newValue;
    },


    pushButton: function() {
        this._dx = this._dy = 0;
        this._buttonup = false;
    },
    getInverseMatrix: function () {
        this.updateWithDelay();

        var target = this._target;
        var distance = this._distance;

        if (this.timeMotion !== undefined) { // we have a camera motion event
            var dt = ((new Date()).getTime() - this.timeMotion)/1000.0;
            var motionDuration = 1.0;
            if (dt < motionDuration) {
                var r = osgAnimation.EaseOutQuad(dt/motionDuration);
                if (this.targetMotion) {
                    target = osg.Vec3.add(this._target, osg.Vec3.mult(osg.Vec3.sub(this.targetMotion, this._target), r));
                }
                if (this._targetDistance) {
                    distance = this._distance + (this._targetDistance - this._distance) * r;
                }
            } else {
                if (this.targetMotion) {
                    this._target = this.targetMotion;
                    target = this.targetMotion;
                }
                if (this._targetDistance) {
                    this._distance = this._targetDistance;
                    distance = this._targetDistance;
                }
                this.timeMotion = undefined;
            }
        }
        
        var eye = new Array(3);
        osg.Matrix.inverse(this._rotation, this._inverseMatrix);
        osg.Matrix.transformVec3(this._inverseMatrix,
                                 [0, distance, 0],
                                 eye );

        osg.Matrix.makeLookAt(osg.Vec3.add(target, eye, eye),
                              target,
                              [0,0,1], 
                              this._inverseMatrix);
        return this._inverseMatrix;
    }
});

osgGA.OrbitManipulator.TouchEvent = function() {
    this.x = 0;
    this.y = 0;
    this.scale = 1.0;
    this.rotation = 0.0;
};
osgGA.OrbitManipulator.TouchEvent.prototype = {
    init: function(id, x, y, scale, rotation) {
        this.id = id;
        this.x = x;
        this.y = y;
        if (scale !== undefined) {
            this.scale = scale;
        }
        if (rotation !== undefined) {
            this.rotation = rotation;
        }
    }
};

