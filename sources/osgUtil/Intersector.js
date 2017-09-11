'use strict';

var intersectionEnums = require('osgUtil/intersectionEnums');

var Intersector = function() {
    this._intersections = [];
    this._primitiveMask = intersectionEnums.ALL_PRIMITIVES;
    this._intersectionLimit = intersectionEnums.NO_LIMIT;
};

Intersector.prototype = {
    reset: function() {
        this._intersections.length = 0;
    },

    enter: function(node) {
        if (this.reachedLimit()) return false;
        return !node.isCullingActive() || this.intersectNode(node);
    },

    intersectNode: function(node) {
        return (
            this.intersectBoundingSphere(node.getBoundingSphere()) ||
            this.intersectBoundingBox(node.getBoundingBox())
        );
    },

    intersectBoundingSphere: function(/*bsphere*/) {
        return false;
    },

    intersectBoundingBox: function(/*bsphere*/) {
        return false;
    },

    getIntersections: function() {
        return this._intersections;
    },

    setIntersectionLimit: function(limit) {
        this._intersectionLimit = limit;
    },

    getIntersectionLimit: function() {
        return this._intersectionLimit;
    },

    setPrimitiveMask: function(primitiveMask) {
        this._primitiveMask = primitiveMask;
    },

    getPrimitiveMask: function() {
        return this._primitiveMask;
    },

    reachedLimit: function() {
        return (
            this._intersectionLimit === intersectionEnums.LIMIT_ONE &&
            this._intersections.length > 0
        );
    },

    setCurrentTransformation: function(/*matrix*/) {},

    intersect: function(/*iv, node*/) {}
};

module.exports = Intersector;
