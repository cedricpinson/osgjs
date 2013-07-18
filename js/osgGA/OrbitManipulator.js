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
    this._tmpInverse = osg.Matrix.makeIdentity([]);
    this._tmpHomePosition = osg.Vec3.init([]);
    this.init();
};

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
    setDelay: function(delay) {
        this._delay = delay;
    },
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
    addTarget: function() {
        for (var i = 0; i < arguments.length; i++) {
            this._target[i] += arguments[i];
        }
    },
    getTarget: function() { return this._target; },
    getDelta: function() {
        return this._delta;
    }
};

osgGA.OrbitManipulator.AvailableControllerList = [ 'StandardMouseKeyboard',
                                                   'LeapMotion',
                                                   'Hammer' ];

osgGA.OrbitManipulator.ControllerList = [ 'StandardMouseKeyboard',
                                          'LeapMotion',
                                          'Hammer'];

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
        this._scaleMouseMotion = 1.0;

        this._moveTouch = undefined;
        this._inverseMatrix = new Array(16);
        this._rotateKey = 65; // a
        this._zoomKey = 83; // s
        this._panKey = 68; // d

        // instance of controller
        var self = this;

        osgGA.OrbitManipulator.ControllerList.forEach(function(value) {
            if (osgGA.OrbitManipulator[value] !== undefined) {
                self._controllerList[value] = new osgGA.OrbitManipulator[value](self);
            }
        });
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

    getHomePosition: function() {
        var eyePos = this._tmpHomePosition;
        if (this._node !== undefined) {

            var bs = this._node.getBound();
            var distance = bs.radius()*1.5;

            var target = bs.center();

            this.computeEyePosition(target, distance, eyePos);
        }
        return eyePos;
    },




    gamepadaxes: function(axes) {

        // Block badly balanced controllers
        var AXIS_THRESHOLD = 0.005;

        var rotateTarget,panTarget;

        // Regular gamepads
        if (axes.length==4) {
            
            if (Math.abs(axes[0])>AXIS_THRESHOLD || Math.abs(axes[1])>AXIS_THRESHOLD) {
                rotateTarget = this._rotate.getTarget();
                this._rotate.setTarget(rotateTarget[0]-axes[0]*5, rotateTarget[1]+axes[1]*5);
            }
            if (Math.abs(axes[3])>AXIS_THRESHOLD) {
                this._zoom.setTarget(this._zoom.getTarget()[0] - axes[3]);
            }

        //SpaceNavigator & 6-axis controllers
        } else if (axes.length>=5) {

            if (Math.abs(axes[0])>AXIS_THRESHOLD || Math.abs(axes[1])>AXIS_THRESHOLD) {
                panTarget = this._pan.getTarget();
                this._pan.setTarget(panTarget[0]-axes[0]*20, panTarget[1]+axes[1]*20);
            }

            if (Math.abs(axes[2])>AXIS_THRESHOLD) {
                this._zoom.setTarget(this._zoom.getTarget()[0] - axes[2]);
            }
            if (Math.abs(axes[3])>AXIS_THRESHOLD || Math.abs(axes[4])>AXIS_THRESHOLD) {
                rotateTarget = this._rotate.getTarget();
                this._rotate.setTarget(rotateTarget[0]+axes[4]*10, rotateTarget[1]+axes[3]*10);
            }
        }

    },

    gamepadbuttondown: function(event, pressed) {

        // Buttons 12 to 15 are the d-pad.
        if (event.button>=12 && event.button<=15) {
            var panTarget = this._pan.getTarget();
            var delta = {
                12: [0 , -1],
                13: [0 ,  1],
                14: [-1,  0],
                15: [1 ,  0]
            }[event.button];
            this._pan.setTarget(panTarget[0]-delta[0]*10, panTarget[1]+delta[1]*10);
        }

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

    getRotateInterpolator: function() {
        return this._rotate;
    },

    getPanInterpolator: function() {
        return this._pan;
    },
    getZoomInterpolator: function() {
        return this._zoom;
    },
    getTarget: function(target) {
        osg.Vec3.copy(this._target, target);
        return target;
    },
    getMode: function() { return this._currentMode; },
    setMode: function(mode) { this._currentMode = mode; return this; },

    getEyePosition: function(eye) {
        this.computeEyePosition(this._target, this._distance, eye);
    },

    computeEyePosition: function(target, distance, eye) {
        var inv = this._tmpInverse;
        osg.Matrix.inverse(this._rotation, this._tmpInverse);
        osg.Matrix.transformVec3(inv,
                                 [0, distance, 0],
                                 eye );
        osg.Vec3.add(target, eye, eye);
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
        this.computeRotation(-delta[0]*mouseFactor*this._scaleMouseMotion, -delta[1]*mouseFactor*this._scaleMouseMotion);


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


(function(module) {
    module.LeapMotion = osgGA.getOrbitLeapMotionControllerClass();
})(osgGA.OrbitManipulator);


(function(module) {
    module.StandardMouseKeyboard = osgGA.getOrbitStandardMouseKeyboardControllerClass();
})(osgGA.OrbitManipulator);


(function(module) {
    module.Hammer = osgGA.getOrbitHammerControllerClass();
})(osgGA.OrbitManipulator);
