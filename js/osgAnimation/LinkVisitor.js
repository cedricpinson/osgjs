/** -*- compile-command: "jslint-cli LinkVisitor.js" -*-
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
 *  LinkVisitor search for animationUpdateCallback and link animation data
 *  @class LinkVisitor
 */
osgAnimation.LinkVisitor = function() {
    osg.NodeVisitor.call(this);
    this._animations = undefined;
    this._nbLinkTarget = 0;
};

/** @lends osgAnimation.LinkVisitor.prototype */
osgAnimation.LinkVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    setAnimationMap: function(anims) { 
        this._animations = anims;
        this._animationKeys = Object.keys(anims);
    },

    apply: function(node) {
        var cbs = node.getUpdateCallbackList();
        for (var i = 0, l = cbs.length; i < l; i++) {
            var cb = cbs[i];
            if ( cb instanceof osgAnimation.AnimationUpdateCallback ) {
                this.link(cb);
            }
        }
        this.traverse(node);
    },

    link: function(animCallback) {
        var result = 0;
        var anims = this._animations;
        var animKeys = this._animationKeys;
        for (var i = 0, l = animKeys.length; i < l; i++) {
            var key = animKeys[i];
            var anim = anims[key];
            result += animCallback.linkAnimation(anim);
        }
        this._nbLinkedTarget += result;
        osg.log("linked " + result + " for \"" + animCallback.getName() + '"');
    }

});