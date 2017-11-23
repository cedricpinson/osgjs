import notify from 'osg/notify';
import utils from 'osg/utils';
import BoundingBox from 'osg/BoundingBox';
import { vec3, mat4 } from 'osg/glMatrix';

var BoundingSphere = function() {
    this._center = vec3.create();
    this._radius = -1.0;
};

utils.createPrototypeObject(
    BoundingSphere,
    {
        init: function() {
            vec3.init(this._center);
            this._radius = -1.0;
        },

        valid: function() {
            return this._radius >= 0.0;
        },

        set: function(center, radius) {
            this._center = center;
            this._radius = radius;
        },

        center: function() {
            return this._center;
        },

        radius: function() {
            return this._radius;
        },

        radius2: function() {
            return this._radius * this._radius;
        },

        volume: function() {
            var r = this._radius;
            return r * r * r * Math.PI * 4 / 3;
        },

        copy: function(other) {
            this._radius = other._radius;
            vec3.copy(this._center, other._center);
        },

        copyBoundingBox: function(box) {
            box.center(this._center);
            this._radius = box.radius();
        },

        expandByBoundingBox: (function() {
            var v = vec3.create();
            var newbb = new BoundingBox();

            return function(bb) {
                if (!bb.valid()) return;

                if (!this.valid()) {
                    this.copyBoundingBox(bb);
                    return;
                }

                vec3.copy(newbb._min, bb._min);
                vec3.copy(newbb._max, bb._max);

                for (var i = 0; i < 8; i++) {
                    vec3.sub(v, bb.corner(i, v), this._center); // get the direction vector from corner
                    vec3.normalize(v, v); // normalise it.
                    vec3.scaleAndAdd(v, this._center, v, -this._radius); // move the vector in the opposite direction distance radius.
                    newbb.expandByVec3(v); // add it into the new bounding box.
                }

                newbb.center(this._center);
                this._radius = newbb.radius();
            };
        })(),

        expandByvec3: function(v) {
            notify.warn('deprecated, use expandByVec3');
            this.expandByVec3(v);
        },

        expandByVec3: (function() {
            var dv = vec3.create();
            return function(v) {
                if (this.valid()) {
                    vec3.sub(dv, v, this.center(dv));
                    var r = vec3.length(dv);
                    if (r > this.radius()) {
                        var dr = (r - this.radius()) * 0.5;
                        this._center[0] += dv[0] * (dr / r);
                        this._center[1] += dv[1] * (dr / r);
                        this._center[2] += dv[2] * (dr / r);
                        this._radius += dr;
                    }
                } else {
                    this._center[0] = v[0];
                    this._center[1] = v[1];
                    this._center[2] = v[2];
                    this._radius = 0.0;
                }
            };
        })(),

        expandRadiusBySphere: function(sh) {
            if (sh.valid()) {
                if (this.valid()) {
                    var r = vec3.distance(this._center, sh._center) + sh._radius;
                    if (r > this._radius) {
                        this._radius = r;
                    }
                    // else do nothing as vertex is within sphere.
                } else {
                    vec3.copy(this._center, sh._center);
                    this._radius = sh._radius;
                }
            }
        },

        expandByBoundingSphere: function(sh) {
            // ignore operation if incomming BoundingSphere is invalid.
            if (!sh.valid()) {
                return;
            }

            // This sphere is not set so use the inbound sphere
            if (!this.valid()) {
                this._center[0] = sh._center[0];
                this._center[1] = sh._center[1];
                this._center[2] = sh._center[2];
                this._radius = sh.radius();

                return;
            }

            // Calculate d == The distance between the sphere centers
            var d = vec3.distance(sh.center(), this.center());

            // New sphere is already inside this one
            if (d + sh.radius() <= this.radius()) {
                return;
            }

            //  New sphere completely contains this one
            if (d + this.radius() <= sh.radius()) {
                this._center[0] = sh._center[0];
                this._center[1] = sh._center[1];
                this._center[2] = sh._center[2];
                this._radius = sh._radius;
                return;
            }

            // Build a new sphere that completely contains the other two:
            //
            // The center point lies halfway along the line between the furthest
            // points on the edges of the two spheres.
            //
            // Computing those two points is ugly - so we'll use similar triangles
            var newRadius = (this.radius() + d + sh.radius()) * 0.5;
            var ratio = (newRadius - this.radius()) / d;

            this._center[0] += (sh._center[0] - this._center[0]) * ratio;
            this._center[1] += (sh._center[1] - this._center[1]) * ratio;
            this._center[2] += (sh._center[2] - this._center[2]) * ratio;

            this._radius = newRadius;
        },
        contains: function(v) {
            if (!this.valid()) return false;
            return vec3.sqrDist(this.center(), v) <= this.radius2();
        },
        intersects: function(bs) {
            if (!this.valid() || !bs.valid()) return false;
            var r = this.radius() + bs.radius();
            return vec3.sqrDist(bs.center(), this.center()) <= r * r;
        },

        transformMat4: (function() {
            var scaleVec = vec3.create();
            return function(out, matrix) {
                if (!this.valid()) return out;

                if (out._center !== this._center) {
                    vec3.copy(out._center, this._center);
                    out._radius = this._radius;
                }
                var sphCenter = out._center;
                var sphRadius = out._radius;

                mat4.getSqrScale(scaleVec, matrix);
                var scale = Math.sqrt(Math.max(Math.max(scaleVec[0], scaleVec[1]), scaleVec[2]));
                sphRadius = sphRadius * scale;
                out._radius = sphRadius;
                vec3.transformMat4(sphCenter, sphCenter, matrix);

                return out;
            };
        })()
    },
    'osg',
    'BoundingSphere'
);

export default BoundingSphere;
