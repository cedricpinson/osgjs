/** -*- compile-command: "jslint-cli osgGA.js" -*-
 *
 *  Copyright (C) 2010 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */

osgGA = {};
osgGA.OrbitManipulatorMode = {
    Rotate: 0,
    Pan: 1,
    Zoom: 2,
};

osgGA.OrbitManipulator = function () {
    this.init();
}

osgGA.OrbitManipulator.prototype = {
    init: function() {
        this.distance = 25;
        this.target = [ 0,0, 0];
        this.eye = [ 0, this.distance, 0];
        this.rotation = osg.Matrix.mult(osg.Matrix.makeRotate( Math.PI, 0,0,1), osg.Matrix.makeRotate( -Math.PI/10.0, 1,0,0)); // osg.Quat.makeIdentity();
        this.up = [0, 0, 1];
        this.time = 0.0;
        this.dx = 0.0;
        this.dy = 0.0;
        this.buttonup = true;
        this.scale = 1.0;
        this.targetDistance = this.distance;
        this.currentMode = osgGA.OrbitManipulatorMode.Rotate;
        this.maxDistance = 0;
        this.minDistance = 0;
    },
    reset: function() {
        this.init();
    },
    setNode: function(node) {
        this.node = node;
    },
    computeHomePosition: function() {
        if (this.node !== undefined) {
            var bs = this.node.getBound();
            this.setDistance(bs.radius());
            this.target = bs.center();
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
        }
    },
    mouseup: function(ev) {
        this.dragging = false;
        this.panning = false;
        this.releaseButton(ev);
    },
    mousedown: function(ev) {
        this.panning = true;
        this.dragging = true;
        var pos = this.convertEventToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
    },
    mousemove: function(ev) {
        if (this.buttonup === true) {
            return;
        }
        var scaleFactor;
        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.convertEventToCanvas(ev);
        curX = pos[0];
        curY = pos[1];

        scaleFactor = 10.0;
        deltaX = (this.clientX - curX) / scaleFactor;
        deltaY = (this.clientY - curY) / scaleFactor;
        this.clientX = curX;
        this.clientY = curY;

        this.update(deltaX, deltaY);
        return false;
    },
    dblclick: function(ev) {
    },
    touchDown: function(ev) {
    },
    touchUp: function(ev) {
    },
    touchMove: function(ev) {
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
        var inv = osg.Matrix.inverse(this.rotation);
        var x = [ osg.Matrix.get(inv, 0,0), osg.Matrix.get(inv, 0,1), 0 ];
        osg.Vec3.normalize(x, x);
        var y = [ osg.Matrix.get(inv, 1,0), osg.Matrix.get(inv, 1,1), 0 ];
        osg.Vec3.normalize(y, y);

        osg.Vec3.add(this.target, osg.Vec3.mult(x, -dx), this.target);
        osg.Vec3.add(this.target, osg.Vec3.mult(y, -dy), this.target);
    },

    zoomModel: function(dx, dy) {
        this.distance += dy;
    },

    computeRotation: function(dx, dy) {
        var of = osg.Matrix.makeRotate(dx / 10.0, 0,0,1);
        var r = osg.Matrix.mult(this.rotation, of);

        of = osg.Matrix.makeRotate(dy / 10.0, 1,0,0);
        var r2 = osg.Matrix.mult(of, r);

        // test that the eye is not too up and not too down to not kill
        // the rotation matrix
        var eye = osg.Matrix.transformVec3(osg.Matrix.inverse(r2), [0, this.distance, 0]);

        var dir = osg.Vec3.neg(eye);
        osg.Vec3.normalize(dir, dir);

        var p = osg.Vec3.dot(dir, [0,0,1]);
        if (Math.abs(p) > 0.95) {
            //discard rotation on y
            this.rotation = r;
            return;
        }

        // if (Math.abs(p) > 0.9) {
        //     var plane = [ dir[0] , dir[1], 0 ];
        //     osg.Vec3.normalize(plane, plane);

        //     var diff = Math.abs(p) - 0.9;
        //     r2  = osg.Matrix.mult(r2, osg.Matrix.makeRotate( diff , plane[0], plane[1], 0));
        //     osg.log("adjust rotation" + diff + " axis " + plane);
        // }

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
            } else if ( this.currentMode === osgGA.OrbitManipulatorMode.Zoom) {
                this.zoomModel(dx, dy);
            }
        }
    },
    releaseButton: function() {
        this.buttonup = true;
    },

    changeScale: function(d) {
        var curd = this.distance;
        var scaleChange = this.scale/d;
        this.scale = d;
        this.distance = this.targetDistance;
        this.targetDistance = this.distance * scaleChange;
        this.timeMotion = (new Date()).getTime();
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
                if (this.targetMotion)
                    target = osg.Vec3.add(this.target, osg.Vec3.mult(osg.Vec3.sub(this.targetMotion, this.target), r));
                if (this.targetDistance)
                    distance = this.distance + (this.targetDistance - this.distance) * r;
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
        
        //this.targetMotion
        var inv;
        var eye = osg.Matrix.transformVec3(osg.Matrix.inverse(this.rotation), [0, distance, 0]);
        inv = osg.Matrix.makeLookAt(osg.Vec3.add(target,eye), target, [0,0,1]);
        return inv;
    },

};

