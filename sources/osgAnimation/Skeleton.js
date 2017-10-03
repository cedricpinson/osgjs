'use strict';
var utils = require('osg/utils');
var MatrixTransform = require('osg/MatrixTransform');
var UpdateSkeleton = require('osgAnimation/UpdateSkeleton');
var NodeVisitor = require('osg/NodeVisitor');
var UpdateMatrixTransform = require('osgAnimation/UpdateMatrixTransform');
var Bone = require('osgAnimation/Bone');

var ResetRestPoseVisitor = function() {
    NodeVisitor.call(this, NodeVisitor.TRAVERSE_ALL_CHILDREN);
};

utils.createPrototypeObject(
    ResetRestPoseVisitor,
    utils.objectInherit(NodeVisitor.prototype, {
        apply: function(node) {
            if (node.getTypeID() === Bone.getTypeID()) {
                var cb = node.getUpdateCallback();
                if (cb instanceof UpdateMatrixTransform) {
                    var stackedTransforms = cb._stackedTransforms;
                    for (var st = 0, l = stackedTransforms.length; st < l; st++) {
                        var stackedTransform = stackedTransforms[st];
                        stackedTransform.resetToDefaultValue();
                    }
                    cb.computeChannels();
                }
            }
            this.traverse(node);
        }
    }),
    'osgAnimation',
    'ResetRestPoseVisitor'
);

var resetter = new ResetRestPoseVisitor();

var Skeleton = function() {
    MatrixTransform.call(this);
};

utils.createPrototypeNode(
    Skeleton,
    utils.objectInherit(MatrixTransform.prototype, {
        setDefaultUpdateCallback: function() {
            this.addUpdateCallback(new UpdateSkeleton());
        },

        setRestPose: function() {
            this.accept(resetter);
        }
    }),
    'osgAnimation',
    'Skeleton'
);

module.exports = Skeleton;
