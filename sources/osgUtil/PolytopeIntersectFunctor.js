import utils from 'osg/utils';
import { vec3 } from 'osg/glMatrix';
import Plane from 'osg/Plane';
import IntersectFunctor from 'osgUtil/IntersectFunctor';

var PolytopeIntersection = function() {
    IntersectFunctor.Intersection.call(this);

    this._intersectionPoints = [];
    this._distance = 0;
    this._maxDistance = 0;
    this._numIntersectionPoints = 0;
};

// Settings are needed.
var PolytopeIntersectFunctor = function() {
    IntersectFunctor.call(this);

    this._src = [];
    this._dest = [];
    this._maxNumIntersectionsPoints = 6;
};

utils.createPrototypeObject(
    PolytopeIntersectFunctor,
    utils.objectInherit(IntersectFunctor.prototype, {
        reset: function() {
            IntersectFunctor.prototype.reset.call(this);
            this._src = [];
            this._dest = [];
        },

        enter: function(bbox) {
            if (this._intersector.getPolytope().containsBoundingBox(bbox)) {
                this._intersector.getPolytope().pushCurrentMask();
                return true;
            }
            return false;
        },

        leave: function() {
            this._intersector.getPolytope().popCurrentMask();
        },

        addIntersection: function() {
            this._src = utils.arrayUniq(this._src);
            var src = this._src;

            var center = vec3.create();
            var maxDistance = -Number.MAX_VALUE;
            var referencePlane = this._intersector._iReferencePlane;
            for (var i = 0; i < src.length; ++i) {
                vec3.add(center, center, src[i]);
                var d = Plane.distanceToPlane(referencePlane, src[i]);
                if (d > maxDistance) maxDistance = d;
            }

            vec3.scale(center, center, 1.0 / src.length);

            var intersection = this.initIntersection(new PolytopeIntersection());
            intersection._distance = Plane.distanceToPlane(referencePlane, center);
            intersection._maxDistance = maxDistance;
            vec3.copy(intersection._localIntersectionPoint, center);

            var maxNum = this._maxNumIntersectionsPoints;
            intersection._numIntersectionPoints = src.length < maxNum ? src.length : maxNum;

            for (i = 0; i < intersection._numIntersectionPoints; ++i) {
                intersection._intersectionPoints.push(vec3.clone(this._src[i]));
            }
        },

        contains: function() {
            var polytope = this._intersector.getPolytope();
            var planeList = polytope.getPlanes();

            var resultMask = polytope.getCurrentMask();
            if (!resultMask) return true;

            var selectorMask = 0x1;

            for (var i = 0; i < planeList.length; ++i) {
                if (resultMask & (selectorMask === 0)) {
                    selectorMask <<= 1;
                    continue;
                }

                this._dest = [];
                var plane = planeList[i];
                var vPrevious = this._src[0];
                var dPrevious = Plane.distanceToPlane(plane, vPrevious);
                for (var j = 1; j < this._src.length; ++j) {
                    var vCurrent = this._src[j];
                    var dCurrent = Plane.distanceToPlane(plane, vCurrent);
                    if (dPrevious >= 0.0) {
                        this._dest.push(vec3.clone(vPrevious));
                    }
                    if (dPrevious * dCurrent < 0.0) {
                        var distance = dPrevious - dCurrent;
                        var rCurrent = dPrevious / distance;
                        //(*v_previous)*(1.0-r_current) + (*v_current)*r_current;
                        var vnew = vec3.add(
                            vec3.create(),
                            vec3.scale(vec3.create(), vPrevious, 1.0 - rCurrent),
                            vec3.scale(vec3.create(), vCurrent, rCurrent)
                        );
                        this._dest.push(vnew);
                    }
                    dPrevious = dCurrent;
                    vPrevious = vCurrent;
                }
                if (dPrevious >= 0.0) {
                    this._dest.push(vec3.clone(vPrevious));
                }
                if (this._dest.length <= 1) {
                    return false;
                }
                // swap values
                var swap = this._src.slice();
                this._src = this._dest.slice();
                this._dest = swap;
            }

            return true;
        },

        containsPoint: function(v0) {
            if (this._intersector.getPolytope().containsVertex(v0)) {
                // initialize the set of vertices to test.
                this._src = [];
                this._src[0] = v0;
                return true;
            }
            return false;
        },

        containsLine: function(v0, v1) {
            // initialize the set of vertices to test.
            this._src = [];
            this._src[0] = v0;
            this._src[1] = v1;
            this._src[2] = v0;
            return this.contains();
        },

        containsTriangle: function(v0, v1, v2) {
            // initialize the set of vertices to test.
            this._src = [];
            this._src[0] = v0;
            this._src[1] = v1;
            this._src[2] = v2;
            this._src[3] = v0;
            return this.contains();
        },

        intersectPoint: function(v0) {
            if (this.containsPoint(v0)) this.addIntersection();
        },

        intersectLine: function(v0, v1) {
            if (this.containsLine(v0, v1)) this.addIntersection();
        },

        intersectTriangle: function(v0, v1, v2) {
            if (this.containsTriangle(v0, v1, v2)) this.addIntersection();
        }
    }),
    'osgUtil',
    'PolytopeIntersectFunctor'
);

export default PolytopeIntersectFunctor;
