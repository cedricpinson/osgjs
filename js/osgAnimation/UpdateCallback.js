/** -*- compile-command: "jslint-cli UpdateCallback.js" -*-
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
 *  AnimationUpdateCallback
 *  @class AnimationUpdateCallback
 */
osgAnimation.AnimationUpdateCallback = function () {};

/** @lends osgAnimation.AnimationUpdateCallback.prototype */
osgAnimation.AnimationUpdateCallback.prototype = osg.objectInehrit(osg.Object.prototype, {
    
    linkChannel: function() {},
    linkAnimation: function(anim) {
        var name = this.getName();
        if (name.length === 0) {
            osg.log("no name on an update callback, discard");
            return 0;
        }
        var nbLinks = 0;
        var channels = anim.getChannels();
        for (var i = 0, l = channels.length; i < l; i++) {
            var channel = channels[i];
            if (channel.getTargetName() === name) {
                this.linkChannel(channel);
                nbLinks++;
            }
        }
        return nbLinks;
    }
});