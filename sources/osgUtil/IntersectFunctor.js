import { vec3 } from 'osg/glMatrix';
import { mat4 } from 'osg/glMatrix';
import primitiveIndexFunctor from 'osg/primitiveIndexFunctor';
import intersectionEnums from 'osgUtil/intersectionEnums';

var IntersectFunctor = function() {
    this._hit = false;

    // geom info
    this._primitiveIndex = 0;
    this._vertices = undefined;
    this._geometry = undefined;

    // intersection visitor (nodepath, etc...)
    this._intersectionVisitor = undefined;

    // intersector stuffs
    this._intersector = undefined;
    this._limitOneIntersection = false;
    this._primitiveMask = intersectionEnums.ALL_PRIMITIVES;
};

// minimal "interface" for intersection type
IntersectFunctor.Intersection = function() {
    this._nodePath = undefined;
    this._drawable = undefined;
    this._matrix = undefined;
    this._primitiveIndex = undefined;

    this._ratio = 0.0;
    this._backface = false;
    this._localIntersectionPoint = vec3.create();
};

IntersectFunctor.prototype = {
    reset: function() {
        this._hit = false;
        this._vertices = undefined;
        this._primitiveIndex = 0;
    },

    setPrimitiveIndex: function(primitiveIndex) {
        this._primitiveIndex = primitiveIndex;
    },
    setGeometry: function(geometry) {
        this._geometry = geometry;
        this._primitiveIndex = 0;
        this._vertices = geometry.getAttributes().Vertex.getElements();
    },
    setVertices: function(vertices) {
        this._vertices = vertices;
    },

    setIntersectionVisitor: function(intersectionVisitor) {
        this._intersectionVisitor = intersectionVisitor;
    },
    setIntersector: function(intersector) {
        this._intersector = intersector;
        this._primitiveMask = intersector.getPrimitiveMask();

        var limit = intersector.getIntersectionLimit();
        this._limitOneIntersection =
            limit === intersectionEnums.LIMIT_ONE_PER_DRAWABLE ||
            limit === intersectionEnums.LIMIT_ONE;
    },

    setLimitOneIntersection: function(limitOneIntersection) {
        this._limitOneIntersection = limitOneIntersection;
    },

    leave: function() {},

    enter: function(/*bbox*/) {},

    initIntersection: function(intersection) {
        intersection._matrix = mat4.clone(this._intersectionVisitor.getModelMatrix());
        intersection._nodePath = this._intersectionVisitor.getNodePath().slice();
        intersection._primitiveIndex = this._primitiveIndex;
        intersection._drawable = this._geometry;
        this._intersector.getIntersections().push(intersection);
        this._hit = true;
        return intersection;
    },

    intersectPoint: function(/*v0, p0*/) {},
    intersectLine: function(/*v0, v1, p0, p1*/) {},
    intersectTriangle: function(/*v0, v1, v2, p0, p1, p2*/) {},

    operatorPoint: (function() {
        var v0 = vec3.create();

        return function(p0) {
            if (this._limitOneIntersection && this._hit) return;
            if ((this._primitiveMask & intersectionEnums.POINT_PRIMITIVES) === 0) return;

            var vertices = this._vertices;
            vec3.set(v0, vertices[3 * p0], vertices[3 * p0 + 1], vertices[3 * p0 + 2]);

            this.intersectPoint(v0, p0);
            this._primitiveIndex++;
        };
    })(),

    operatorLine: (function() {
        var v0 = vec3.create();
        var v1 = vec3.create();

        return function(p0, p1) {
            if (this._limitOneIntersection && this._hit) return;
            if ((this._primitiveMask & intersectionEnums.LINE_PRIMITIVES) === 0) return;

            var vertices = this._vertices;
            vec3.set(v0, vertices[3 * p0], vertices[3 * p0 + 1], vertices[3 * p0 + 2]);
            vec3.set(v1, vertices[3 * p1], vertices[3 * p1 + 1], vertices[3 * p1 + 2]);

            this.intersectLine(v0, v1, p0, p1);
            this._primitiveIndex++;
        };
    })(),

    operatorTriangle: (function() {
        var v0 = vec3.create();
        var v1 = vec3.create();
        var v2 = vec3.create();

        return function(p0, p1, p2) {
            if (this._limitOneIntersection && this._hit) return;
            if ((this._primitiveMask & intersectionEnums.TRIANGLE_PRIMITIVES) === 0) return;

            var vertices = this._vertices;
            vec3.set(v0, vertices[3 * p0], vertices[3 * p0 + 1], vertices[3 * p0 + 2]);
            vec3.set(v1, vertices[3 * p1], vertices[3 * p1 + 1], vertices[3 * p1 + 2]);
            vec3.set(v2, vertices[3 * p2], vertices[3 * p2 + 1], vertices[3 * p2 + 2]);

            this.intersectTriangle(v0, v1, v2, p0, p1, p2);
            this._primitiveIndex++;
        };
    })(),

    apply: function(node) {
        if (!node.getAttributes().Vertex) return;
        primitiveIndexFunctor(node, this);
    }
};

export default IntersectFunctor;
