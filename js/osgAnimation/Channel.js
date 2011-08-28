/** -*- compile-command: "jslint-cli Channel.js" -*-
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
 *  Channel is responsible to interpolate keys
 *  @class Channel
 */
osgAnimation.Channel = function(sampler, target) {
    osg.Object.call(this);
    this._sampler = sampler;
    this._target = target;
    this._targetName = undefined;
    this._data = { 'value': undefined, 'key' : 0 };
};

/** @lends osgAnimation.Channel.prototype */
osgAnimation.Channel.prototype = osg.objectInehrit(osg.Object.prototype, {
    getKeyframes: function() { return this._sampler.getKeyframes(); },
    setKeyframes: function(keys) { this._sampler.setKeyframes(keys); },
    getStartTime: function() { return this._sampler.getStartTime(); },
    getEndTime: function() { return this._sampler.getEndTime(); },
    getSampler: function() { return this._sampler; },
    setSampler: function(sampler) { this._sampler = sampler; },
    getTarget: function() { return this._target; },
    setTarget: function(target) { this._target = target; },
    setTargetName: function(name) { this._targetName = name; },
    getTargetName: function() { return this._targetName; },
    update: function(t, weight, priority) {
        weight = weight || 1.0;
        priority = priority || 0.0;

        // skip if weight == 0
        if (weight < 1e-4)
            return;
        var data = this._data;
        this._sampler.getValueAt(t, data);
        this._target.update.call(this._target, weight, data.value, priority);
    },
    reset: function() { this._target.reset(); }
});


osgAnimation.Vec3LerpChannel = function(keys, target)
{
    var sampler = new osgAnimation.Sampler();
    if (!keys) {
        keys = [];
    }
    if (!target) {
        target = new osgAnimation.Vec3Target();
    }
    osgAnimation.Channel.call(this, sampler, target);
    sampler.setInterpolator(osgAnimation.Vec3LerpInterpolator);
    this.setKeyframes(keys);
    this._data.value = osg.Vec3.copy(target.getValue(), []);
};
osgAnimation.Vec3LerpChannel.prototype = osgAnimation.Channel.prototype;



osgAnimation.FloatLerpChannel = function(keys, target)
{
    var sampler = new osgAnimation.Sampler();
    if (!keys) {
        keys = [];
    }
    if (!target) {
        target = new osgAnimation.FloatTarget();
    }
    osgAnimation.Channel.call(this, sampler, target);
    sampler.setInterpolator(osgAnimation.FloatLerpInterpolator);
    this.setKeyframes(keys);
    this._data.value = target.getValue();
};
osgAnimation.FloatLerpChannel.prototype = osgAnimation.Channel.prototype;


osgAnimation.QuatLerpChannel = function(keys, target)
{
    var sampler = new osgAnimation.Sampler();
    if (!keys) {
        keys = [];
    }
    if (!target) {
        target = new osgAnimation.QuatTarget();
    }
    osgAnimation.Channel.call(this, sampler, target);
    sampler.setInterpolator(osgAnimation.QuatLerpInterpolator);
    this.setKeyframes(keys);
    this._data.value = osg.Quat.copy(target.getValue(), []);
};
osgAnimation.QuatLerpChannel.prototype = osgAnimation.Channel.prototype;


osgAnimation.QuatSlerpChannel = function(keys, target)
{
    osgAnimation.QuatLerpChannel.call(this, keys, target);
    this.getSampler().setInterpolator(osgAnimation.QuatSlerpInterpolator);
};
osgAnimation.QuatSlerpChannel.prototype = osgAnimation.Channel.prototype;
