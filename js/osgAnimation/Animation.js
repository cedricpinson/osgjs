/** -*- compile-command: "jslint-cli Animation.js" -*-
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
 *  Animation
 *  @class Animation
 */
osgAnimation.Animation = function() {
    osg.Object.call(this);
    this._channels = [];
};

/** @lends osgAnimation.Animation.prototype */
osgAnimation.Animation.prototype = osg.objectInehrit(osg.Object.prototype, {
    getChannels: function() { return this._channels; },
    getDuration: function() {
        var tmin = 1e5;
        var tmax = -1e5;
        for (var i = 0, l = this._channels.length; i < l; i++) {
            var channel = this._channels[i];
            tmin = Math.min(tmin, channel.getStartTime());
            tmax = Math.max(tmax, channel.getEndTime());
        }
        return tmax-tmin;
    }

});
