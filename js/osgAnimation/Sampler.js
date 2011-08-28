/** -*- compile-command: "jslint-cli Sampler.js" -*-
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
 *  Sampler is responsible to interpolate keys
 *  @class Sampler
 */
osgAnimation.Sampler = function(keys, interpolator) {
    if (!keys) {
        keys = [];
    }
    this._keys = keys;
    this._interpolator = interpolator;
};

/** @lends osgAnimation.Sampler.prototype */
osgAnimation.Sampler.prototype = {

    getKeyframes: function() { return this._keys;},
    setKeyframes: function(keys) { this._keys = keys; },
    setInterpolator: function(interpolator) { this._interpolator = interpolator; },
    getInterpolator: function() { return this._interpolator; },
    getStartTime: function() {
        if (this._keys.length === 0) {
            return undefined;
        }
        return this._keys[0].t;
    },
    getEndTime: function() {
        if (this._keys.length === 0) {
            return undefined;
        }
        return this._keys[this._keys.length-1].t;
    },

    // result contains the keyIndex where to start, this key
    // will be updated when calling the Interpolator
    // result.value will contain the interpolation result
    // { 'value': undefined, 'keyIndex': 0 };
    getValueAt: function(t, result) {
        // reset the key if invalid
        if (this._keys[result.key].t > t) {
            result.key = 0;
        }
        this._interpolator(this._keys, t, result);
    }
};
