/** -*- compile-command: "jslint-cli init.js" -*-
 *
 * Copyright (C) 2010 Cedric Pinson
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */

osgGA = {};

osgGA.OrbitManipulator = function () {
    this.distance = 25;
    this.target = [ 0,0, 0];
    this.eye = [ 0, this.distance, 0];
    this.rotation = osg.Matrix.makeRotate(-Math.PI/3.0, 1,0,0); // osg.Quat.makeIdentity();
    this.up = [0, 0, 1];
    this.time = 0.0;
    this.dx = 0.0;
    this.dy = 0.0;
    this.buttonup = true;
    this.scale = 1.0;
    this.targetDistance = this.distance;
    this.currentMode = "rotate";
}

osgGA.OrbitManipulator.prototype = {
    panModel: function(dx, dy) {

        var inv = osg.Matrix.inverse(this.rotation);
        var x = [ osg.Matrix.get(inv, 0,0), osg.Matrix.get(inv, 0,1), 0 ];
        x = osg.Vec3.normalize(x);
        var y = [ osg.Matrix.get(inv, 1,0), osg.Matrix.get(inv, 1,1), 0 ];
        y = osg.Vec3.normalize(y);

        osg.Vec3.add(this.target, osg.Vec3.mult(x, -dx), this.target);
        osg.Vec3.add(this.target, osg.Vec3.mult(y, -dy), this.target);
    },

    computeRotation: function(dx, dy) {
        var of = osg.Matrix.makeRotate(dx / 10.0, 0,0,1);
        var r = osg.Matrix.mult(of, this.rotation);

        of = osg.Matrix.makeRotate(dy / 10.0, 1,0,0);
        var r2 = osg.Matrix.mult(r, of);

        // test that the eye is not too up and not too down to not kill
        // the rotation matrix
        var eye = osg.Matrix.transformVec3([0, 0, this.distance], osg.Matrix.inverse(r2));
        if (eye[2] > 0.9*this.distance || eye[2] < 0.0) {
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
            if (this.currentMode === "drag") {
                this.panModel(dx/this.scale, dy/this.scale);
            } else {
                this.computeRotation(dx, dy);
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
        this.distance = this.targetDistance;
        this.targetDistance += 10/this.scale;
        this.timeMotion = (new Date()).getTime();
    },
    distanceDecrease: function() {
        this.distance = this.targetDistance;
        this.targetDistance -= 10/this.scale;
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
        var eye = osg.Matrix.transformVec3([0, 0, distance], osg.Matrix.inverse(this.rotation));
        inv = osg.Matrix.makeLookAt(osg.Vec3.add(target,eye), target, [0,0,1]);

        return inv;
    },

};

