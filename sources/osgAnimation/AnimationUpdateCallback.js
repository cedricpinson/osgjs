import utils from 'osg/utils';
import Object from 'osg/Object';
import MatrixTransform from 'osg/MatrixTransform';

/**
 *  AnimationUpdateCallback
 *  @class AnimationUpdateCallback
 */
var AnimationUpdateCallback = function() {
    Object.call(this);
};

// check if the path is animated, it could be elsewhere though
AnimationUpdateCallback.checkPathIsAnimated = function(path) {
    for (var i = 0, nbNodes = path.length; i < nbNodes; ++i) {
        var node = path[i];

        if (node instanceof MatrixTransform) {
            var ups = node.getUpdateCallbackList();
            for (var j = 0, nbUp = ups.length; j < nbUp; ++j) {
                if (ups[j] instanceof AnimationUpdateCallback) return true;
            }
        }
    }

    return false;
};

/** @lends AnimationUpdateCallback.prototype */
utils.createPrototypeObject(
    AnimationUpdateCallback,
    utils.objectInherit(Object.prototype, {
        computeChannels: function() {},
        reset: function() {}
    }),
    'osgAnimation',
    'AnimationUpdateCallback'
);

export default AnimationUpdateCallback;
