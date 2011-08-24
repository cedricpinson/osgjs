/** -*- compile-command: "jslint-cli osgAnimation.js" -*-
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

osgDB.ObjectWrapper.serializers.osgAnimation = {};
osgDB.ObjectWrapper.serializers.osgAnimation.Animation = function(jsonObj, animation) {
    // check
    // 
    var check = function(o) {
        if (o.Name && o.Channels && o.Channels.length > 0) {
            return true;
        }
        if (!o.Name) {
            osg.log("animation has field Name, error");
            return false;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, animation)) {
        return false;
    }

    // channels
    for (var i = 0, l = jsonObj.Channels.length; i < l; i++) {
        var channel = osgDB.ObjectWrapper.readObject(jsonObj.Channels[i]);
        if (channel) {
            animation.getChannels().push(channel);
        }
    }
    return true;
};

osgDB.ObjectWrapper.serializers.osgAnimation.Vec3LinearChannel = function(jsonObj, channel) {
    // check
    // 
    var check = function(o) {
        if (o.KeyFrames && o.TargetName && o.Name) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    // doit
    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, channel)) {
        return false;
    }

    channel.setTargetName(jsonObj.TargetName);

    // channels
    var keys = channel.getSampler().getKeyframes();
    for (var i = 0, l = jsonObj.KeyFrames.length; i < l; i++) {
        var nodekey = jsonObj.KeyFrames[i];
        var mykey = nodekey.slice(1);
        mykey.t = nodekey[0];
        keys.push(mykey);
    }
    return true;
};


osgDB.ObjectWrapper.serializers.osgAnimation.FloatLinearChannel = function(jsonObj, channel) {
    // check
    // 
    var check = function(o) {
        if (o.KeyFrames && o.TargetName && o.Name) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    // doit
    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, channel)) {
        return false;
    }

    channel.setTargetName(jsonObj.TargetName);

    // channels
    var keys = channel.getSampler().getKeyframes();
    for (var i = 0, l = jsonObj.KeyFrames.length; i < l; i++) {
        var nodekey = jsonObj.KeyFrames[i];
        var mykey = nodekey.slice(1);
        mykey.t = nodekey[0];
        keys.push(mykey);
    }
    return true;
};

osgDB.ObjectWrapper.serializers.osgAnimation.BasicAnimationManager = function(jsonObj, manager) {
    // check
    // 
    var check = function(o) {
        if (o.Animations) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    for (var i = 0, l = jsonObj.Animations.length; i < l; i++) {
        var entry = jsonObj.Animations[i];
        var anim = osgDB.ObjectWrapper.readObject(entry);
        if (anim) {
            manager.registerAnimation(anim);
        }
    }
    return true;
};


osgDB.ObjectWrapper.serializers.osgAnimation.UpdateMatrixTransform = function(jsonObj, umt) {
    // check
    // 
    var check = function(o) {
        if (o.Name && o.StackedTransforms) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, umt)) {
        return false;
    }

    for (var i = 0, l = jsonObj.StackedTransforms.length; i < l; i++) {
        var entry = jsonObj.StackedTransforms[i];
        var ste = osgDB.ObjectWrapper.readObject(entry);
        if (ste) {
            umt.getStackedTransforms().push(ste);
        }
    }
    return true;
};


osgDB.ObjectWrapper.serializers.osgAnimation.StackedTranslate = function(jsonObj, st) {
    // check
    // 
    var check = function(o) {
        if (o.Name) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj,st)) {
        return false;
    }

    if (jsonObj.Translate) {
        st.setTranslate(jsonObj.Translate);
    }
    return true;
};

osgDB.ObjectWrapper.serializers.osgAnimation.StackedRotateAxis = function(jsonObj, st) {
    // check
    // 
    var check = function(o) {
        if (o.Axis) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj,st)) {
        return false;
    }

    if (jsonObj.Angle) {
        st.setAngle(jsonObj.Angle);
    }

    st.setAxis(jsonObj.Axis);

    return true;
};
