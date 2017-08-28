'use strict';

var MACROUTILS = require('osg/Utils');
var vec3 = require('osg/glMatrix').vec3;
var mat4 = require('osg/glMatrix').mat4;
var Intersector = require('osgUtil/Intersector');
var SphereIntersectFunctor = require('osgUtil/SphereIntersectFunctor');

var SphereIntersector = function() {
    Intersector.call(this);

    this._center = vec3.create();
    this._iCenter = vec3.create();
    this._radius = 1.0;
    this._iRadius = 1.0;
};

MACROUTILS.createPrototypeObject(
    SphereIntersector,
    MACROUTILS.objectInherit(Intersector.prototype, {
        set: function(center, radius) {
            // we copy iCenter and iRadius in case setCurrentTransformation is never called
            vec3.copy(this._center, center);
            vec3.copy(this._iCenter, center);
            this._radius = this._iRadius = radius;
            this.reset();
        },

        setCenter: function(center) {
            vec3.copy(this._center, center);
            vec3.copy(this._iCenter, center);
        },

        setRadius: function(radius) {
            this._radius = this._iRadius = radius;
        },

        intersectNode: function(node) {
            // TODO implement intersectBoundingBox?
            return this.intersectBoundingSphere(node.getBoundingSphere());
        },

        intersectBoundingSphere: function(bsphere) {
            if (!bsphere.valid()) return false;
            var r = this._iRadius + bsphere.radius();
            return vec3.sqrDist(bsphere.center(), this._iCenter) <= r * r;
        },

        intersect: (function() {
            var functor = new SphereIntersectFunctor();

            return function(iv, node) {
                functor.setGeometry(node);
                functor.setIntersectionVisitor(iv);
                functor.setIntersector(this);

                functor.set(this._iCenter, this._iRadius);

                var kdtree = node.getShape();
                if (kdtree) {
                    kdtree.intersect(functor, kdtree.getNodes()[0]);
                } else {
                    // handle rig transformed vertices
                    if (node.computeTransformedVertices) {
                        functor.setVertices(node.computeTransformedVertices());
                    }

                    functor.apply(node);
                }

                functor.reset();
            };
        })(),

        setCurrentTransformation: (function() {
            var tmp = vec3.create();

            return function(matrix) {
                mat4.invert(matrix, matrix);
                vec3.transformMat4(this._iCenter, this._center, matrix);
                // Only handling analitically uniform scales.
                // For non uniform we use an approximation to avoid complexity
                mat4.getScale(tmp, matrix);
                var x = tmp[0];
                var y = tmp[1];
                var z = tmp[2];
                var maxScale = x > y ? (x > z ? x : z) : y > z ? y : z;
                this._iRadius = this._radius * maxScale;
            };
        })()
    }),
    'osgUtil',
    'SphereIntersector'
);

module.exports = SphereIntersector;
