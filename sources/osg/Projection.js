'use strict';
var utils = require('osg/utils');
var Node = require('osg/Node');
var mat4 = require('osg/glMatrix').mat4;

var Projection = function() {
    Node.call(this);
    this.projection = mat4.create();
};

utils.createPrototypeNode(
    Projection,
    utils.objectInherit(Node.prototype, {
        getProjectionMatrix: function() {
            return this.projection;
        },
        setProjectionMatrix: function(m) {
            this.projection = m;
        }
    }),
    'osg',
    'Projection'
);

module.exports = Projection;
