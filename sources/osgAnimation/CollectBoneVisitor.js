'use strict';
var utils = require('osg/utils');
var NodeVisitor = require('osg/NodeVisitor');
var notify = require('osg/notify');
var Bone = require('osgAnimation/Bone');

var CollectBoneVisitor = function() {
    NodeVisitor.call(this, NodeVisitor.TRAVERSE_ALL_CHILDREN);
    this._boneMap = {};
};

utils.createPrototypeObject(
    CollectBoneVisitor,
    utils.objectInherit(NodeVisitor.prototype, {
        apply: function(node) {
            if (node.typeID === Bone.typeID) {
                var name = node.getName();

                if (!name) {
                    notify.warn('found Bone without name');
                } else {
                    this._boneMap[name] = node;
                }
            }

            this.traverse(node);
        },

        getBoneMap: function() {
            return this._boneMap;
        }
    }),
    'osgAnimation',
    'CollectBoneVisitor'
);

module.exports = CollectBoneVisitor;
