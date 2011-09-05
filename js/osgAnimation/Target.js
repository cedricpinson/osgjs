/** -*- compile-command: "jslint-cli Target.js" -*-
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
 *  Target keep internal data of element to animate, and some function to merge them
 *  @class Target
 */
osgAnimation.Target = function() {
    this._weight = 0;
    this._priorityWeight = 0;
    this._count = 0;
    this._lastPriority = 0;
    this._target = undefined;
};

osgAnimation.Target.prototype = {
    reset: function() { this._weight = 0; this._priorityWeight = 0; },
    getValue: function() { return this._target; }
};

osgAnimation.Vec3Target = function() {
    osgAnimation.Target.call(this);
    this._target = [0 ,0, 0];
};
osgAnimation.Vec3Target.prototype = osg.objectInehrit(osgAnimation.Target.prototype, {
    update: function(weight, val, priority) {
        if (this._weight || this._priorityWeight) {

            if (this._lastPriority != priority) {
                // change in priority
                // add to weight with the same previous priority cumulated weight
                this._weight += this._priorityWeight * (1.0 - this._weight);
                this._priorityWeight = 0;
                this._lastPriority = priority;
            }

            this._priorityWeight += weight;
            t = (1.0 - this._weight) * weight / this._priorityWeight;
            osg.Vec3.lerp(t, this._target, val, this._target);
        } else {

            this._priorityWeight = weight;
            this._lastPriority = priority;
            osg.Vec3.copy(val, this._target);
        }
    }
});



osgAnimation.FloatTarget = function(value) {
    osgAnimation.Target.call(this);
    this._target = [value];
};

osgAnimation.FloatTarget.prototype = osg.objectInehrit(osgAnimation.Target.prototype, {
    update: function(weight, val, priority) {
        if (this._weight || this._priorityWeight) {

            if (this._lastPriority != priority) {
                // change in priority
                // add to weight with the same previous priority cumulated weight
                this._weight += this._priorityWeight * (1.0 - this._weight);
                this._priorityWeight = 0;
                this._lastPriority = priority;
            }

            this._priorityWeight += weight;
            t = (1.0 - this._weight) * weight / this._priorityWeight;
            this._target += (val - this._target)*t;
        } else {

            this._priorityWeight = weight;
            this._lastPriority = priority;
            this._target = val;
        }
    }
});




osgAnimation.QuatTarget = function() {
    osgAnimation.Target.call(this);
    this._target = [];
    osg.Quat.makeIdentity(this._target);
};
osgAnimation.QuatTarget.prototype = osg.objectInehrit(osgAnimation.Target.prototype, {
    update: function(weight, val, priority) {
        if (this._weight || this._priorityWeight) {

            if (this._lastPriority != priority) {
                // change in priority
                // add to weight with the same previous priority cumulated weight
                this._weight += this._priorityWeight * (1.0 - this._weight);
                this._priorityWeight = 0;
                this._lastPriority = priority;
            }

            this._priorityWeight += weight;
            t = (1.0 - this._weight) * weight / this._priorityWeight;
            osg.Quat.lerp(t, this._target, val, this._target);
            osg.Quat.normalize(this._target, this._target);

        } else {

            this._priorityWeight = weight;
            this._lastPriority = priority;
            osg.Quat.copy(val, this._target);
        }
    }
});
