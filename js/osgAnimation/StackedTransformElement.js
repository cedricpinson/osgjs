/** -*- compile-command: "jslint-cli StackedTransformElement.js" -*-
 *
 *  Copyright (C) 2010-2011 Cedric Pinson
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
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */


/** 
 *  StackedTranslate
 *  @class StackedTranslate
 */
osgAnimation.StackedTranslate = function (name, translate) {
    osg.Object.call(this);
    if (!translate) {
        translate = [ 0,0,0 ];
    }
    this._translate = translate;
    this._target = undefined;
    this.setName(name);
};

/** @lends osgAnimation.StackedTranslate.prototype */
osgAnimation.StackedTranslate.prototype = osg.objectInehrit(osg.Object.prototype, {
    setTranslate: function(translate) { osg.Vec3.copy(translate, this._translate); },
    setTarget: function(target) { this._target = target; },
    getTarget: function() { return this._target; },
    update: function() {
        if (this._target !== undefined) {
            osg.Vec3.copy(this._target.getValue(), this._translate);
        }
    },
    getOrCreateTarget: function() {
        if (!this._target) {
            this._target = new osgAnimation.Vec3Target(this._translate);
        }
        return this._target;
    },
    applyToMatrix: function(m) {
        osg.Matrix.preMultTranslate(m, this._translate);
    }
});


/** 
 *  StackedRotateAxis
 *  @class StackedRotateAxis
 */
osgAnimation.StackedRotateAxis = function (name, axis, angle) {
    osg.Object.call(this);
    if (!axis) {
        axis = [ 1,0,0 ];
    }
    if (!angle) {
        angle = 0;
    }
    this._axis = axis;
    this._angle = angle;
    this._target = undefined;
    this.setName(name);

    this._matrixTmp = [];
    osg.Matrix.makeIdentity(this._matrixTmp);
    this._quatTmp = [];
    osg.Quat.makeIdentity(this._quatTmp);
};

/** @lends osgAnimation.StackedRotateAxis.prototype */
osgAnimation.StackedRotateAxis.prototype = osg.objectInehrit(osg.Object.prototype, {
    setAxis: function(axis) { osg.Vec3.copy(axis, this._axis); },
    setAngle: function(angle) { this._angle = angle; },
    setTarget: function(target) { this._target = target; },
    getTarget: function() { return this._target; },
    update: function() {
        if (this._target !== undefined) {
            this._angle = this._target.getValue();
        }
    },
    getOrCreateTarget: function() {
        if (!this._target) {
            this._target = new osgAnimation.FloatTarget(this._angle);
        }
        return this._target;
    },
    applyToMatrix: function(m) {
        var axis = this._axis;
        var qtmp = this._quatTmp;
        var mtmp = this._matrixTmp;

        osg.Quat.makeRotate(this._angle, axis[0], axis[1], axis[2], qtmp);
        osg.Matrix.setRotateFromQuat(mtmp, qtmp);
        osg.Matrix.preMult(m, mtmp);
    }

});





/** 
 *  StackedQuaternion
 *  @class StackedQuaternion
 */
osgAnimation.StackedQuaternion = function (name, quat) {
    osg.Object.call(this);
    if (!quat) {
        quat = [ 0,0,0,1 ];
    }
    this._quaternion = quat;
    this._target = undefined;
    this._matrixTmp = [];
    osg.Matrix.makeIdentity(this._matrixTmp);
    this.setName(name);
};

/** @lends osgAnimation.StackedQuaternion.prototype */
osgAnimation.StackedQuaternion.prototype = osg.objectInehrit(osg.Object.prototype, {
    setQuaternion: function(q) { osg.Quat.copy(q, this._quaternion); },
    setTarget: function(target) { this._target = target; },
    getTarget: function() { return this._target; },
    update: function() {
        if (this._target !== undefined) {
            osg.Quat.copy(this._target.getValue(), this._quaternion);
        }
    },
    getOrCreateTarget: function() {
        if (!this._target) {
            this._target = new osgAnimation.QuatTarget(this._quaternion);
        }
        return this._target;
    },
    applyToMatrix: function(m) {
        var mtmp = this._matrixTmp;
        osg.Matrix.setRotateFromQuat(mtmp, this._quaternion);
        osg.Matrix.preMult(m, mtmp);
    }
});
