'use strict';
var BoundingBox = require('osg/BoundingBox');
var Geometry = require('osg/Geometry');
var mat4 = require('osg/glMatrix').mat4;
var Transform = require('osg/Transform');
var NodeVisitor = require('osg/NodeVisitor');
var MACROUTILS = require('osg/Utils');
var PooledArray = require('osg/PooledArray');
var PooledResource = require('osg/PooledResource');

var ComputeBoundsVisitor = function(traversalMode) {
    NodeVisitor.call(this, traversalMode);

    // keep a matrix in memory to avoid to create matrix
    this._pooledMatrix = new PooledResource(mat4.create);

    // Matrix stack along path traversal
    this._matrixStack = new PooledArray();
    this._matrixStack.push(mat4.IDENTITY);

    this._bb = new BoundingBox();
};

MACROUTILS.createPrototypeObject(
    ComputeBoundsVisitor,
    MACROUTILS.objectInherit(NodeVisitor.prototype, {
        reset: function() {
            this._pooledMatrix.reset();
            this._matrixStack.reset();
            this._matrixStack.push(mat4.IDENTITY);
            this._bb.init();
        },

        getBoundingBox: function() {
            return this._bb;
        },

        // not implemented
        //void getPolytope(osg::Polytope& polytope, float margin=0.1) const;
        //void getBase(osg::Polytope& polytope, float margin=0.1) const;

        //applyDrawable: function ( drawable ) {},

        applyTransform: function(transform) {
            var matrix = this._pooledMatrix.getOrCreateObject();
            mat4.copy(matrix, this._matrixStack.back());
            transform.computeLocalToWorldMatrix(matrix, this);
            this.pushMatrix(matrix);
            this.traverse(transform);
            this.popMatrix();
        },

        apply: function(node) {
            if (node instanceof Transform) {
                this.applyTransform(node);
                return;
            } else if (node instanceof Geometry) {
                this.applyBoundingBox(node.getBoundingBox());
                return;
            }

            this.traverse(node);
        },

        pushMatrix: function(matrix) {
            this._matrixStack.push(matrix);
        },

        popMatrix: function() {
            this._matrixStack.pop();
        },

        applyBoundingBox: (function() {
            var bbOut = new BoundingBox();

            return function(bbox) {
                if (bbox.valid()) {
                    bbox.transformMat4(bbOut, this._matrixStack.back());
                    this._bb.expandByBoundingBox(bbOut);
                }
            };
        })(),

        getMatrixStack: function() {
            return this._matrixStack;
        }
    }),
    'osg',
    'ComputeBoundsVisitor'
);

module.exports = ComputeBoundsVisitor;
