import utils from 'osg/utils';
import { vec3 } from 'osg/glMatrix';
import { mat4 } from 'osg/glMatrix';
import IntersectFunctor from 'osgUtil/IntersectFunctor';

var LineSegmentIntersection = function() {
    IntersectFunctor.Intersection.call(this);

    this._localIntersectionNormal = vec3.clone(vec3.ONE);

    // index of vertex
    this._i1 = -1;
    this._i2 = -1;
    this._i3 = -1;

    // barycentric coordinates
    this._r1 = 0.0;
    this._r2 = 0.0;
    this._r3 = 0.0;
};

// Settings are needed.
var LineSegmentIntersectFunctor = function() {
    IntersectFunctor.call(this);

    this._threshold = 0.0; // only used for lines and points
    this._d = vec3.create();
    this._length = 0;
    this._invLength = 0;

    this._start = vec3.create();
    this._end = vec3.create();
    this._dInvX = vec3.create();
    this._dInvY = vec3.create();
    this._dInvZ = vec3.create();
    this._hit = false;
};

utils.createPrototypeObject(
    LineSegmentIntersectFunctor,
    utils.objectInherit(IntersectFunctor.prototype, {
        set: function(start, end, threshold) {
            this._start = start;
            this._end = end;
            vec3.sub(this._d, end, start);

            this._length = vec3.length(this._d);
            this._invLength = this._length !== 0.0 ? 1.0 / this._length : 0.0;

            vec3.scale(this._d, this._d, this._invLength);
            if (this._d[0] !== 0.0) vec3.scale(this._dInvX, this._d, 1.0 / this._d[0]);
            if (this._d[1] !== 0.0) vec3.scale(this._dInvY, this._d, 1.0 / this._d[1]);
            if (this._d[2] !== 0.0) vec3.scale(this._dInvZ, this._d, 1.0 / this._d[2]);

            if (threshold !== undefined) this._threshold = threshold;
        },

        enter: function(bbox, s, e) {
            var min = bbox._min;
            var xmin = min[0];
            var ymin = min[1];
            var zmin = min[2];

            var max = bbox._max;
            var xmax = max[0];
            var ymax = max[1];
            var zmax = max[2];

            var invX = this._dInvX;
            var invY = this._dInvY;
            var invZ = this._dInvZ;

            if (s[0] <= e[0]) {
                // trivial reject of segment wholely outside.
                if (e[0] < xmin) return false;
                if (s[0] > xmax) return false;

                if (s[0] < xmin) {
                    // clip s to xMin.
                    vec3.scaleAndAdd(s, s, invX, xmin - s[0]);
                }

                if (e[0] > xmax) {
                    // clip e to xMax.
                    vec3.scaleAndAdd(e, s, invX, xmax - s[0]);
                }
            } else {
                if (s[0] < xmin) return false;
                if (e[0] > xmax) return false;

                if (e[0] < xmin) {
                    // clip s to xMin.
                    vec3.scaleAndAdd(e, s, invX, xmin - s[0]);
                }

                if (s[0] > xmax) {
                    // clip e to xMax.
                    vec3.scaleAndAdd(s, s, invX, xmax - s[0]);
                }
            }

            // compare s and e against the yMin to yMax range of bb.
            if (s[1] <= e[1]) {
                // trivial reject of segment wholely outside.
                if (e[1] < ymin) return false;
                if (s[1] > ymax) return false;

                if (s[1] < ymin) {
                    // clip s to yMin.
                    vec3.scaleAndAdd(s, s, invY, ymin - s[1]);
                }

                if (e[1] > ymax) {
                    // clip e to yMax.
                    vec3.scaleAndAdd(e, s, invY, ymax - s[1]);
                }
            } else {
                if (s[1] < ymin) return false;
                if (e[1] > ymax) return false;

                if (e[1] < ymin) {
                    // clip s to yMin.
                    vec3.scaleAndAdd(e, s, invY, ymin - s[1]);
                }

                if (s[1] > ymax) {
                    // clip e to yMax.
                    vec3.scaleAndAdd(s, s, invY, ymax - s[1]);
                }
            }

            // compare s and e against the zMin to zMax range of bb.
            if (s[2] <= e[2]) {
                // trivial reject of segment wholely outside.
                if (e[2] < zmin) return false;
                if (s[2] > zmax) return false;

                if (s[2] < zmin) {
                    // clip s to zMin.
                    vec3.scaleAndAdd(s, s, invZ, zmin - s[2]);
                }

                if (e[2] > zmax) {
                    // clip e to zMax.
                    vec3.scaleAndAdd(e, s, invZ, zmax - s[2]);
                }
            } else {
                if (s[2] < zmin) return false;
                if (e[2] > zmax) return false;

                if (e[2] < zmin) {
                    // clip s to zMin.
                    vec3.scaleAndAdd(e, s, invZ, zmin - s[2]);
                }

                if (s[2] > zmax) {
                    // clip e to zMax.
                    vec3.scaleAndAdd(s, s, invZ, zmax - s[2]);
                }
            }

            return true;
        },

        intersectPoint: (function() {
            var tmp = vec3.create();
            var dir = vec3.create();

            return function(v0, p0) {
                // https://www.geometrictools.com/GTEngine/Include/Mathematics/GteDistPointSegment.h
                var st = this._start;

                vec3.sub(tmp, v0, st);
                vec3.sub(dir, this._end, st);
                // compute ratio (projection on line)
                var r = vec3.dot(tmp, dir) * this._invLength * this._invLength;

                // compute distance to segment
                var distToSegmentSqr = 1.0;
                if (r < 0.0) distToSegmentSqr = vec3.sqrLen(tmp);
                else if (r > 1.0) distToSegmentSqr = vec3.sqrDist(v0, this._end);
                else distToSegmentSqr = vec3.sqrLen(vec3.scaleAndAdd(tmp, tmp, dir, -r));

                if (distToSegmentSqr > this._threshold * this._threshold) {
                    return;
                }

                var intersection = this.initIntersection(new LineSegmentIntersection());
                intersection._i1 = p0;
                intersection._r1 = 1.0;

                vec3.scaleAndAdd(intersection._localIntersectionPoint, st, dir, r);
                intersection._ratio = r;
            };
        })(),

        intersectLine: (function() {
            var u = vec3.create();
            var v = vec3.create();
            var w = vec3.create();

            var closest0 = vec3.create();
            var closest1 = vec3.create();

            return function(v0, v1, p0, p1) {
                // https://www.geometrictools.com/GTEngine/Samples/Geometrics/DistanceSegments3/DistanceSegments3.cpp
                var epsilon = 0.00000001;
                vec3.sub(u, v1, v0);
                vec3.sub(v, this._end, this._start);
                vec3.sub(w, v0, this._start);
                var a = vec3.dot(u, u);
                var b = vec3.dot(u, v);
                var c = vec3.dot(v, v);
                var d = vec3.dot(u, w);
                var e = vec3.dot(v, w);
                var D = a * c - b * b;
                var sN;
                var tN;
                var sD = D;
                var tD = D;

                // compute the line parameters of the two closest points
                if (D < epsilon) {
                    // the lines are almost parallel
                    sN = 0.0; // force using point P0 on segment S1
                    sD = 1.0; // to prevent possible division by 0.0 later
                    tN = e;
                    tD = c;
                } else {
                    // get the closest points on the infinite lines
                    sN = b * e - c * d;
                    tN = a * e - b * d;
                    if (sN < 0.0) {
                        // sc < 0 => the s=0 edge is visible
                        sN = 0.0;
                        tN = e;
                        tD = c;
                    } else if (sN > sD) {
                        // sc > 1  => the s=1 edge is visible
                        sN = sD;
                        tN = e + b;
                        tD = c;
                    }
                }

                if (tN < 0.0) {
                    // tc < 0 => the t=0 edge is visible
                    tN = 0.0;
                    // recompute sc for this edge
                    if (-d < 0.0) sN = 0.0;
                    else if (-d > a) sN = sD;
                    else {
                        sN = -d;
                        sD = a;
                    }
                } else if (tN > tD) {
                    // tc > 1  => the t=1 edge is visible
                    tN = tD;
                    // recompute sc for this edge
                    if (-d + b < 0.0) sN = 0;
                    else if (-d + b > a) sN = sD;
                    else {
                        sN = -d + b;
                        sD = a;
                    }
                }
                // finally do the division to get sc and tc
                var sc = Math.abs(sN) < epsilon ? 0.0 : sN / sD;
                var tc = Math.abs(tN) < epsilon ? 0.0 : tN / tD;

                // get the difference of the two closest points
                vec3.scaleAndAdd(closest0, v0, u, sc);
                vec3.scaleAndAdd(closest1, this._start, v, tc);

                var sqrDistance = vec3.sqrDist(closest0, closest1);
                if (sqrDistance > this._threshold * this._threshold) {
                    return;
                }

                var intersection = this.initIntersection(new LineSegmentIntersection());
                intersection._i1 = p0;
                intersection._i2 = p1;
                intersection._r1 = 1.0 - tc;
                intersection._r2 = tc;

                vec3.copy(intersection._localIntersectionPoint, closest1);
                intersection._ratio = tc;
            };
        })(),

        intersectTriangle: (function() {
            var normal = vec3.create();
            var e2 = vec3.create();
            var e1 = vec3.create();
            var tvec = vec3.create();
            var pvec = vec3.create();
            var qvec = vec3.create();
            var epsilon = 1e-20;

            return function(v0, v1, v2, p0, p1, p2) {
                var d = this._d;

                vec3.sub(e2, v2, v0);
                vec3.sub(e1, v1, v0);
                vec3.cross(pvec, d, e2);

                var det = vec3.dot(pvec, e1);
                if (det > -epsilon && det < epsilon) return;
                var invDet = 1.0 / det;

                vec3.sub(tvec, this._start, v0);

                var u = vec3.dot(pvec, tvec) * invDet;
                if (u < 0.0 || u > 1.0) return;

                vec3.cross(qvec, tvec, e1);

                var v = vec3.dot(qvec, d) * invDet;
                if (v < 0.0 || u + v > 1.0) return;

                var t = vec3.dot(qvec, e2) * invDet;

                if (t < epsilon || t > this._length) return;

                var r0 = 1.0 - u - v;
                var r1 = u;
                var r2 = v;
                var r = t * this._invLength;

                var interX = v0[0] * r0 + v1[0] * r1 + v2[0] * r2;
                var interY = v0[1] * r0 + v1[1] * r1 + v2[1] * r2;
                var interZ = v0[2] * r0 + v1[2] * r1 + v2[2] * r2;

                vec3.cross(normal, e1, e2);
                vec3.normalize(normal, normal);

                var intersection = this.initIntersection(new LineSegmentIntersection());
                intersection._i1 = p0;
                intersection._i2 = p1;
                intersection._i3 = p2;
                intersection._r1 = r0;
                intersection._r2 = r1;
                intersection._r3 = r2;

                vec3.set(intersection._localIntersectionPoint, interX, interY, interZ);
                vec3.copy(intersection._localIntersectionNormal, normal);
                intersection._ratio = r;

                // http://gamedev.stackexchange.com/questions/54505/negative-scale-in-matrix-4x4
                // https://en.wikipedia.org/wiki/Determinant#Orientation_of_a_basis
                // you can't exactly extract scale of a matrix but the determinant will tell you
                // if the orientation is preserved
                intersection._backface = mat4.determinant(intersection._matrix) * det < 0;
            };
        })(),

        operatorPoint: function(p0) {
            if (this._threshold <= 0.0) return;
            IntersectFunctor.prototype.operatorPoint.call(this, p0);
        },

        operatorLine: function(p0, p1) {
            if (this._threshold <= 0.0) return;
            IntersectFunctor.prototype.operatorLine.call(this, p0, p1);
        }
    }),
    'osgUtil',
    'LineSegmentIntersectFunctor'
);

export default LineSegmentIntersectFunctor;
