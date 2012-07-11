/** -*- compile-command: "jslint-cli OrbitManipulator.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

/** 
 *  OrbitManipulator
 *  @class
 */
osgGA.OrbitManipulator = function () {
    osgGA.Manipulator.call(this);
    this.init();
};

osgGA.OrbitManipulator.Rotate = 0;
osgGA.OrbitManipulator.Pan = 1;
osgGA.OrbitManipulator.Zoom = 2;

osgGA.OrbitManipulator.Interpolator = function(size, delay) {
    this._current = new Array(size);
    this._target = new Array(size);
    this._delta = new Array(size);
    this._delay = delay;
    if (this._delay === undefined) {
        this._delay = 0.15;        
    }
    this._reset = false;
    this.reset();
};
osgGA.OrbitManipulator.Interpolator.prototype = {
    reset: function() {
            for (var i = 0, l = this._current.length; i < l; i++) {
                this._current[i] = this._target[i] = 0;
            }
            this._reset = true;
    },
    update: function() {
        for (var i = 0, l = this._current.length; i < l; i++) {
            var d = (this._target[i]-this._current[i])*this._delay;
            this._delta [ i ] = d;
            this._current[i] += d;
        }
        return this._delta;
    },
    set: function() {
        for (var i = 0, l = this._current.length; i < l; i++) {
            this._current[i] = this._target[i] = arguments[i];
        }
        this._reset = false;
    },
    isReset: function() { return this._reset;},
    getCurrent: function() { return this._current; },
    setTarget: function() {
        for (var i = 0, l = this._target.length; i < l; i++) {
            if (this._reset) {
                this._target[i] = this._current[i] = arguments[i];
            } else {
                this._target[i] = arguments[i];
            }
        }
        this._reset = false;
    },
    getTarget: function() { return this._target; },
    getDelta: function() {
        return this._delta;
    }
};

/** @lends osgGA.OrbitManipulator.prototype */
osgGA.OrbitManipulator.prototype = osg.objectInehrit(osgGA.Manipulator.prototype, {
    init: function() {
        this._distance = 25;
        this._target = new Array(3); osg.Vec3.init(this._target);

        this._rotation = osg.Matrix.mult(osg.Matrix.makeRotate( Math.PI, 0,0,1, []), osg.Matrix.makeRotate( -Math.PI/10.0, 1,0,0, []), []);
        this._time = 0.0;

        this._rotate = new osgGA.OrbitManipulator.Interpolator(2);
        this._pan = new osgGA.OrbitManipulator.Interpolator(2);
        this._zoom = new osgGA.OrbitManipulator.Interpolator(1);
        this._zoom.reset = function() {
            osgGA.OrbitManipulator.Interpolator.prototype.reset.call(this);
            this._start = 0.0;
        };

        this._buttonup = true;

        this._scale = 10.0;
        this._currentMode = undefined;
        this._maxDistance = 0;
        this._minDistance = 0;
        this._scaleMouseMotion = 1.0/10;
        this._node = undefined;

        this._moveTouch = undefined;
        this._inverseMatrix = new Array(16);
        this._rotateKey = 65; // a
        this._zoomKey = 83; // s
        this._panKey = 68; // d
    },
    reset: function() {
        this.init();
    },
    setNode: function(node) {
        this._node = node;
    },
    setTarget: function(target) {
        osg.Vec3.copy(target, this._target);
        var eyePos = new Array(3);
        this.getEyePosition(eyePos);
        this._distance = osg.Vec3.distance(eyePos, target);
    },
    setEyePosition: function(eye) {
        var result = this._rotation;
        var center = this._target;
        var up = [ 0, 0, 1];

        var f = osg.Vec3.sub(eye, center, []);
        osg.Vec3.normalize(f, f);

        var s = osg.Vec3.cross(f, up, []);
        osg.Vec3.normalize(s, s);

        var u = osg.Vec3.cross(s, f, []);
        osg.Vec3.normalize(u, u);

        // s[0], f[0], u[0], 0.0,
        // s[1], f[1], u[1], 0.0,
        // s[2], f[2], u[2], 0.0,
        // 0,    0,    0,     1.0
        result[0]=s[0]; result[1]=f[0]; result[2]=u[0]; result[3]=0.0;
        result[4]=s[1]; result[5]=f[1]; result[6]=u[1]; result[7]=0.0;
        result[8]=s[2]; result[9]=f[2]; result[10]=u[2];result[11]=0.0;
        result[12]=  0; result[13]=  0; result[14]=  0;  result[15]=1.0;

        this._distance = osg.Vec3.distance(eye, center);
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

        } else if (ev.keyCode === this._panKey && 
                   this._currentMode !== osgGA.OrbitManipulator.Pan) {
            this._currentMode = osgGA.OrbitManipulator.Pan;
            this._pan.reset();
            this.pushButton();
            ev.preventDefault();
        } else if ( ev.keyCode === this._zoomKey &&
                  this._currentMode !== osgGA.OrbitManipulator.Zoom) {
            this._currentMode = osgGA.OrbitManipulator.Zoom;
            this._zoom.reset();
            this.pushButton();
            ev.preventDefault();
        } else if ( ev.keyCode === this._rotateKey &&
                  this._currentMode !== osgGA.OrbitManipulator.Rotate) {
            this._currentMode = osgGA.OrbitManipulator.Rotate;
            this._rotate.reset();
            this.pushButton();
            ev.preventDefault();
        }
        
    },

    keyup: function(ev) {
        if (ev.keyCode === this._panKey) {
            this.mouseup(ev);
        } else if ( ev.keyCode === this._rotateKey) {
            this.mouseup(ev);
        } else if ( ev.keyCode === this._rotateKey) {
            this.mouseup(ev);
        }
        this._currentMode = undefined;
    },

    touchstart: function(ev) {
        if ( this._currentMode === undefined) {
            this._currentMode = osgGA.OrbitManipulator.Rotate;
        }

        var touches = ev.changedTouches;
        if (this._moveTouch === undefined) {
            this._moveTouch = new osgGA.OrbitManipulator.TouchEvent();
        }
        if (this._moveTouch.id === undefined) {
            var touch = touches[0];
            var id = touch.identifier;
            // relative to element position
            var rte = this.getPositionRelativeToCanvas(touch);
            this._rotate.set(rte[0], rte[1]);
            this._moveTouch.init(id, rte[0], rte[1]);
            this.pushButton(touch);
        }
        ev.preventDefault();
    },
    touchend: function(event) {
        event.preventDefault();
        this._currentMode = undefined;
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
                this._rotate.setTarget(rteCurrent[0], rteCurrent[1]);
                this._moveTouch.init(id, rteCurrent[0], rteCurrent[1]);
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
        this._zoom.reset();
    },
    gestureend: function(event) {
        event.preventDefault();
        this._moveTouch.init(undefined, 0, 0, event.scale, event.rotation);
        this._currentMode = undefined;
    },
    gesturechange: function(event) {
        event.preventDefault();
        var scale = (event.scale - this._moveTouch.scale)*5.0;
        this._moveTouch.init(undefined, 0, 0, event.scale, event.rotation);
        this._zoom.setTarget(this._zoom.getTarget()[0]-scale);
    },

    mouseup: function(ev) {
        this.releaseButton(ev);
        this._currentMode = undefined;
    },

    mousedown: function(ev) {
        if (this._currentMode === undefined) {
            if (ev.button === 0) {
                if (ev.shiftKey) {
                    this._currentMode = osgGA.OrbitManipulator.Pan;
                } else if (ev.ctrlKey) {
                    this._currentMode = osgGA.OrbitManipulator.Zoom;
                } else {
                    this._currentMode = osgGA.OrbitManipulator.Rotate;
                }
            } else {
                this._currentMode = osgGA.OrbitManipulator.Pan;
            }
        }

        this.pushButton(ev);

        var pos = this.getPositionRelativeToCanvas(ev);

        if (this._currentMode === osgGA.OrbitManipulator.Rotate) {
            this._rotate.reset(pos[0], pos[1]);
            this._rotate.set(pos[0], pos[1]);
        } else if (this._currentMode === osgGA.OrbitManipulator.Pan) {
            this._pan.reset(pos[0], pos[1]);
            this._pan.set(pos[0], pos[1]);
        } else if (this._currentMode === osgGA.OrbitManipulator.Zoom) {
            this._zoom._start = pos[1];
            this._zoom.set(0.0);
        }
        ev.preventDefault();
    },
    mousemove: function(ev) {
        if (this._buttonup === true) {
            return;
        }
        var pos = this.getPositionRelativeToCanvas(ev);

        if (isNaN(pos[0]) === false && isNaN(pos[1]) === false) {
            
            if (this._currentMode === osgGA.OrbitManipulator.Rotate) {
                this._rotate.setTarget(pos[0], pos[1]);
            } else if (this._currentMode === osgGA.OrbitManipulator.Pan) {
                this._pan.setTarget(pos[0], pos[1]);
            } else if (this._currentMode === osgGA.OrbitManipulator.Zoom) {
                if (this._zoom.isReset()) {
                    this._zoom._start = pos[1];
                    this._zoom.set(0.0);
                }
                var dy = pos[1]-this._zoom._start;
                this._zoom._start = pos[1];
                var v = this._zoom.getTarget()[0];
                this._zoom.setTarget(v-dy/20.0);
            }
        }

        ev.preventDefault();
        ev.preventDefault();
    },
    setMaxDistance: function(d) {
        this._maxDistance =  d;
    },
    setMinDistance: function(d) {
        this._minDistance =  d;
    },
    setDistance: function(d) {
        this._distance = d;
    },
    getDistance: function() {
        return this._distance;
    },
    computePan: function(dx, dy) {
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

    releaseButton: function() {
        this._buttonup = true;
    },

    mousewheel: function(ev, intDelta, deltaX, deltaY) {
        ev.preventDefault();
        this._zoom.setTarget(this._zoom.getTarget()[0] - intDelta);
    },

    computeZoom: function(dz) {
        this.zoom(dz);
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
        this._buttonup = false;
    },

    getTarget: function(target) {
        osg.Vec3.copy(this._target, target);
    },

    getEyePosition: function(eye) {
        var inv = new Array(16);
        osg.Matrix.inverse(this._rotation, inv);
        osg.Matrix.transformVec3(inv,
                                 [0, this._distance, 0],
                                 eye );
        osg.Vec3.add(this._target, eye, eye);
    },

    update: function(nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        if (this._lastUpdate === undefined) {
            this._lastUpdate = t;
        }
        var dt = t - this._lastUpdate;
        this._lastUpdate = t;

        var delta;
        var mouseFactor = 0.1;
        delta = this._rotate.update();
        this.computeRotation(-delta[0]*mouseFactor, -delta[1]*mouseFactor);


        var panFactor = 0.002;
        delta = this._pan.update();
        this.computePan(-delta[0]*panFactor, -delta[1]*panFactor);

        
        delta = this._zoom.update();
        this.computeZoom(1.0 + delta[0]/10.0);

        var target = this._target;
        var distance = this._distance;

        var eye = new Array(3);
        osg.Matrix.inverse(this._rotation, this._inverseMatrix);
        osg.Matrix.transformVec3(this._inverseMatrix,
                                 [0, distance, 0],
                                 eye );

        osg.Matrix.makeLookAt(osg.Vec3.add(target, eye, eye),
                              target,
                              [0,0,1], 
                              this._inverseMatrix);
    },

    getInverseMatrix: function () {
        return this._inverseMatrix;
    }
});

osgGA.OrbitManipulator.TouchEvent = function() {
    this.x = 0;
    this.y = 0;
    this.scale = 1.0;
    this.rotation = 0.0;
    this.id = undefined;
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
