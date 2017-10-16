import utils from 'osg/utils';
import { vec3 } from 'osg/glMatrix';
import { mat4 } from 'osg/glMatrix';
import Intersector from 'osgUtil/Intersector';
import LineSegmentIntersectFunctor from 'osgUtil/LineSegmentIntersectFunctor';

var LineSegmentIntersector = function() {
    Intersector.call(this);

    this._start = vec3.create();
    this._iStart = vec3.create();

    this._end = vec3.create();
    this._iEnd = vec3.create();

    // only used for lines and points
    this._threshold = 0.0;
    this._iThreshold = 0.0;
};

utils.createPrototypeObject(
    LineSegmentIntersector,
    utils.objectInherit(Intersector.prototype, {
        set: function(start, end, threshold) {
            vec3.copy(this._start, start);
            vec3.copy(this._iStart, start);
            vec3.copy(this._end, end);
            vec3.copy(this._iEnd, end);

            if (threshold !== undefined) {
                this._threshold = this._iThreshold = threshold;
            }
        },

        setStart: function(start) {
            vec3.copy(this._start, start);
            vec3.copy(this._iStart, start);
        },

        setEnd: function(end) {
            vec3.copy(this._end, end);
            vec3.copy(this._iEnd, end);
        },

        intersectNode: function(node) {
            // TODO implement intersectBoundingBox?
            return this.intersectBoundingSphere(node.getBoundingSphere());
        },

        // Intersection Segment/Sphere
        intersectBoundingSphere: (function() {
            var sm = vec3.create();
            var se = vec3.create();
            return function(bsphere) {
                // test for _start inside the bounding sphere
                if (!bsphere.valid()) return false;
                vec3.sub(sm, this._iStart, bsphere.center());
                var c = vec3.sqrLen(sm) - bsphere.radius2();
                if (c <= 0.0) {
                    return true;
                }
                // solve quadratic equation
                vec3.sub(se, this._iEnd, this._iStart);
                var a = vec3.sqrLen(se);
                var b = vec3.dot(sm, se) * 2.0;
                var d = b * b - 4.0 * a * c;
                // no intersections if d<0
                if (d < 0.0) {
                    return false;
                }
                // compute two solutions of quadratic equation
                d = Math.sqrt(d);
                var div = 0.5 / a;
                var r1 = (-b - d) * div;
                var r2 = (-b + d) * div;

                // return false if both intersections are before the ray start
                if (r1 <= 0.0 && r2 <= 0.0) {
                    return false;
                }

                if (r1 > 1.0 && r2 > 1.0) {
                    return false;
                }
                return true;
            };
        })(),

        intersect: (function() {
            var functor = new LineSegmentIntersectFunctor();

            return function(iv, node) {
                functor.setGeometry(node);
                functor.setIntersectionVisitor(iv);
                functor.setIntersector(this);

                functor.set(this._iStart, this._iEnd, this._iThreshold);

                var kdtree = node.getShape();
                if (kdtree) {
                    kdtree.intersectLineSegment(
                        functor,
                        kdtree.getNodes()[0],
                        this._iStart,
                        this._iEnd,
                        this._iThreshold
                    );
                    return;
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
            mat4.invert(matrix, matrix);

            if (this._threshold > 0.0) {
                var tmp = this._iStart;
                mat4.getScale(tmp, matrix);
                var x = tmp[0];
                var y = tmp[1];
                var z = tmp[2];
                this._iThreshold = this._threshold * (x > y ? (x > z ? x : z) : y > z ? y : z);
            }
            vec3.transformMat4(this._iStart, this._start, matrix);
            vec3.transformMat4(this._iEnd, this._end, matrix);
        }
    }),
    'osgUtil',
    'LineSegmentIntersector'
);

export default LineSegmentIntersector;
