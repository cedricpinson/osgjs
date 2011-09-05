/** -*- compile-command: "jslint-cli UpdateMatrixTransform.js" -*-
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
 *  UpdateMatrixTransform
 *  @class UpdateMatrixTransform
 */
osgAnimation.UpdateMatrixTransform = function () {
    osgAnimation.AnimationUpdateCallback.call(this);
    this._stackedTransforms = [];
};

/** @lends osgAnimation.AnimationUpdateCallback.prototype */
osgAnimation.UpdateMatrixTransform.prototype = osg.objectInehrit(osgAnimation.AnimationUpdateCallback.prototype, {
    getStackedTransforms: function() { return this._stackedTransforms; },
    update: function(node, nv) {

        // not optimized, we could avoid operation the animation did not change
        // the content of the transform element
        var matrix = node.getMatrix();
        osg.Matrix.makeIdentity(matrix);
        var transforms = this._stackedTransforms;
        for (var i = 0, l = transforms.length; i < l; i++) {
            var transform = transforms[i];
            transform.update();
            transform.applyToMatrix(matrix);
        }
        return true;
    },
    linkChannel: function(channel) {
        var channelName = channel.getName();
        var transforms = this._stackedTransforms;
        for (var i = 0, l = transforms.length; i < l; i++) {
            var transform = transforms[i];
            var elementName = transform.getName();
            if (channelName.length > 0 && elementName === channelName) {
                var target = transform.getOrCreateTarget();
                if (target) {
                    channel.setTarget(target);
                    return true;
                }
            }
        }
        osg.log("can't link channel " + channelName + ", does not contain a symbolic name that can be linked to TransformElements");
    }

});