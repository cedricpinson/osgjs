'use strict';

var MACROUTILS = require('osg/Utils');
var vec4 = require('osg/glMatrix').vec4;
var vec3 = require('osg/glMatrix').vec3;
var Polytope = require('osg/Polytope');
var Plane = require('osg/Plane');
var Intersector = require('osgUtil/Intersector');
var PolytopeIntersectFunctor = require('osgUtil/PolytopeIntersectFunctor');

/** Concrete class for implementing polytope intersections with the scene graph.
 * To be used in conjunction with IntersectionVisitor. */
var PolytopeIntersector = function() {
    Intersector.call(this);

    this._index = 0;
    // We use one for reference and other for the intersections
    this._polytope = new Polytope();
    this._iPolytope = new Polytope();
    this._referencePlane = vec4.create();
    this._iReferencePlane = vec4.create();
};

var transformVec4PostMult = function(out, p, m) {
    var x = p[0];
    var y = p[1];
    var z = p[2];
    var w = p[3];

    out[0] = m[0] * x + m[1] * y + m[2] * z + m[3] * w;
    out[1] = m[4] * x + m[5] * y + m[6] * z + m[7] * w;
    out[2] = m[8] * x + m[9] * y + m[10] * z + m[11] * w;
    out[3] = m[12] * x + m[13] * y + m[14] * z + m[15] * w;
};

MACROUTILS.createPrototypeObject(
    PolytopeIntersector,
    MACROUTILS.objectInherit(Intersector.prototype, {
        setPolytope: function(polytope) {
            this._polytope.setPlanes(polytope);
            var iPlanes = [];
            for (var i = 0; i < polytope.length; ++i) {
                var plane = polytope[i];
                iPlanes[i] = vec4.copy(this._iPolytope.getPlanes()[i] || Plane.create(), plane);
            }
            this._iPolytope.setPlanes(iPlanes);
            vec4.copy(this._referencePlane, polytope[polytope.length - 1]);
            vec4.copy(this._iReferencePlane, this._referencePlane);
        },

        getPolytope: function() {
            return this._iPolytope;
        },

        setPolytopeFromWindowCoordinates: function(xMin, yMin, xMax, yMax) {
            // Note: last polytope value depends on the Coordinate frame
            // Now we are only supporting WINDOW coordinate frame, so must change this if we decide to support
            // other types of Coordinate Frame
            this.setPolytope([
                vec4.fromValues(1.0, 0.0, 0.0, -xMin),
                vec4.fromValues(-1.0, 0.0, 0.0, xMax),
                vec4.fromValues(0.0, 1.0, 0.0, -yMin),
                vec4.fromValues(0.0, -1.0, 0.0, yMax),
                vec4.fromValues(0.0, 0.0, 1.0, 0.0)
            ]);
        },

        intersectBoundingSphere: function(bbox) {
            return this._iPolytope.containsBoundingBox(bbox);
        },

        intersectBoundingSphere: function(bsphere) {
            return this._iPolytope.containsBoundingSphere(bsphere);
        },

        intersect: (function() {
            var functor = new PolytopeIntersectFunctor();

            return function(iv, node) {
                functor.setGeometry(node);
                functor.setIntersectionVisitor(iv);
                functor.setIntersector(this);

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

        setCurrentTransformation: function(matrix) {
            // Transform the polytope and the referencePlane to the current Model local coordinate frame
            var planeList = this._polytope.getPlanes();
            var iPlaneList = this._iPolytope.getPlanes();
            for (var i = 0, j = planeList.length; i < j; i++) {
                var iplane = (iPlaneList[i] = iPlaneList[i] || vec4.create());
                // PostMult
                transformVec4PostMult(iplane, planeList[i], matrix);
                // multiply the coefficients of the plane equation with a constant factor so that the equation a^2+b^2+c^2 = 1 holds.
                vec4.scale(iplane, iplane, 1.0 / vec3.len(iplane));
            }

            //Post Mult
            transformVec4PostMult(this._iReferencePlane, this._referencePlane, matrix);

            // multiply the coefficients of the plane equation with a constant factor so that the equation a^2+b^2+c^2 = 1 holds.
            vec4.scale(
                this._iReferencePlane,
                this._iReferencePlane,
                1.0 / vec3.len(this._iReferencePlane)
            );
        }
    }),
    'osgUtil',
    'PolytopeIntersector'
);

module.exports = PolytopeIntersector;
