'use strict';
var utils = require('osg/utils');
var notify = require('osg/notify');
var UpdateMatrixTransform = require('osgAnimation/UpdateMatrixTransform');
var mat4 = require('osg/glMatrix').mat4;
var NodeVisitor = require('osg/NodeVisitor');

/**
 *  UpdateBone
 *  @class UpdateBone
 */
var UpdateBone = function() {
    UpdateMatrixTransform.call(this);
};

/** @lends UpdateBone.prototype */
utils.createPrototypeObject(
    UpdateBone,
    utils.objectInherit(UpdateMatrixTransform.prototype, {
        update: function(node, nv) {
            if (nv.getVisitorType() === NodeVisitor.UPDATE_VISITOR) {
                if (node.className && node.className() !== 'Bone') {
                    notify.warn('Warning: UpdateBone set on non-Bone object.');
                    return false;
                }

                var bone = node;

                UpdateMatrixTransform.prototype.update.call(this, node);
                bone.setMatrix(bone.getMatrix());
                var matrix = bone.getMatrix();
                var parent = bone.getBoneParent();

                if (parent) {
                    mat4.mul(
                        bone.getMatrixInSkeletonSpace(),
                        parent.getMatrixInSkeletonSpace(),
                        matrix
                    );
                } else {
                    bone.setMatrixInSkeletonSpace(matrix);
                }
            }
            return true;
        }
    }),
    'osgAnimation',
    'UpdateBone'
);

module.exports = UpdateBone;
