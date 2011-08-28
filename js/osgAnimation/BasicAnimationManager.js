/** -*- compile-command: "jslint-cli AnimationManager.js" -*-
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
 *  BasicAnimationManager
 *  @class BasicAnimationManager
 */
osgAnimation.BasicAnimationManager = function() {
    osg.Object.call(this);
    this._animations = {};

    this._actives = {};
    this._actives._keys = [];

    this._lastUpdate = undefined;
    this._targets = [];
};

/** @lends osgAnimation.BasicAnimationManager.prototype */
osgAnimation.BasicAnimationManager.prototype = osg.objectInehrit(osg.Object.prototype, {
    _updateAnimation: function(animationParameter, t, priority) {
        var duration = animationParameter.duration;
        var weight = animationParameter.weight;
        var animation = animationParameter.anim;
        var t = (t-animationParameter.start) % duration;

        var channels = animation.getChannels();
        for ( var i = 0, l = channels.length; i < l; i++) {
            var channel = channels[i];
            channel.update(t, weight, priority);
        }
    },
    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        this.updateManager(t);
    },
    updateManager: function(t) {
        
        var targets = this._targets;
        for (var i = 0, l = targets.length; i < l; i++) {
            targets[i].reset();
        }
        if (this._actives._keys.length > 0) {
            var pri = this._actives._keys.length - 1;
            while (pri >= 0) {
                var layer = this._actives[pri];
                var keys = this._actives[pri]._keys;
                for (var ai = 0, al = keys.length; ai < al; ai++) {
                    var key = keys[ai];
                    var anim = layer[key];
                    if (anim.start === undefined) {
                        anim.start = t;
                    }
                    this._updateAnimation(anim, t, pri);
                }
                pri--;
            }
        }
    },

    stopAll: function() {},
    isPlaying: function(name) {
        if (this._actives._keys.length > 0) {
            var pri = this._actives._keys.length - 1;
            while (pri >=0 ) {
                if (this._actives[pri][name]) {
                    return true;
                }
                pri--;
            }
        }
        return false;
    },
    stopAnimation: function(name) {
        if (this._actives._keys.length > 0) {
            var pri = this._actives._keys.length - 1;
            while (pri >=0 ) {
                if (this._actives[pri][name]) {
                    delete this._actives[pri][name];
                    this._actives[pri]._keys = Object.keys(this._actives[pri]).filter(function(element, index, array) { return element !== "_keys";});
                    return;
                }
                pri--;
            }
        }
    },
    playAnimation: function(name, priority, weight) {
        var animName = name;
        if (typeof name === "object") {
            animName = name.getName();
        }
        if (this._animations[animName] === undefined) {
            osg.log("no animation " + nameName + " found");
            return;
        }
        
        if (this.isPlaying(animName)) {
            return;
        }

        if (!priority) {
            priority = 0;
        }
        if (!weight) {
            weight = 1;
        }

        if (this._actives[priority] === undefined) {
            this._actives[priority] = {};
            this._actives[priority]._keys = [];
            this._actives._keys.push(priority); // = Object.keys(this._actives);
        }
        var anim = this._animations[animName];
        this._actives[priority][animName] = { 'start': undefined, 'weight': weight, 'pri': priority, 'timeFactor': 1.0, 'duration' : anim.getDuration(), 'anim': anim };
        this._actives[priority]._keys.push(animName);
    },
    registerAnimation: function(anim) {
        this._animations[anim.getName()] = anim;
        this.buildTargetList();
    },
    getAnimationMap: function() { return this._animations; },
    buildTargetList: function() {
        this._targets.length = 0;
        var keys = Object.keys(this._animations);
        for (var i = 0, l = keys.length; i < l; i++) {
            var a = this._animations[ keys[i] ];
            var channels = a.getChannels();
            for (var c = 0, lc = channels.length; c < lc; c++) {
                var channel = channels[c];
                this._targets.push(channel.getTarget());
            }
        }
    }

});
