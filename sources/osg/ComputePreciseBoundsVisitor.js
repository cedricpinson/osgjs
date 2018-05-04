import utils from 'osg/utils';
import ComputeBoundsVisitor from 'osg/ComputeBoundsVisitor';
import { mat4 } from 'osg/glMatrix';
import BoundingBox from 'osg/BoundingBox';
import Transform from 'osg/Transform';
import Geometry from 'osg/Geometry';

var ComputePreciseBoundsVisitor = function() {
    ComputeBoundsVisitor.call(this);
    this._minBox = new BoundingBox();
    this._visitedBuffers = {};
};

utils.createPrototypeObject(
    ComputePreciseBoundsVisitor,
    utils.objectInherit(ComputeBoundsVisitor.prototype, {
        reset: function() {
            ComputeBoundsVisitor.prototype.reset.call(this);
            this._minBox.init();
            this._visitedBuffers = {};
        },

        getPreciseBoundingBox: function() {
            return this._minBox;
        },

        apply: function(node) {
            if (node instanceof Transform) {
                this.applyTransform(node);
                return;
            }

            if (node instanceof Geometry) {
                var stackLength = this._matrixStack.getLength();
                var matrix = stackLength > 0 ? this._matrixStack.back() : mat4.IDENTITY;

                var vbuffer = node.getVertexAttributeList().Vertex;
                if (!vbuffer) return;

                var obj = this._visitedBuffers[vbuffer.getInstanceID()];
                if (obj && mat4.exactEquals(obj.matrix, matrix)) {
                    return;
                }

                var verts = node.computeTransformedVertices
                    ? node.computeTransformedVertices()
                    : vbuffer.getElements();

                this._visitedBuffers[vbuffer.getInstanceID()] = {
                    buffer: verts,
                    matrix: mat4.copy(mat4.create(), matrix)
                };

                var m0 = matrix[0];
                var m1 = matrix[1];
                var m2 = matrix[2];
                var m3 = matrix[3];
                var m4 = matrix[4];
                var m5 = matrix[5];
                var m6 = matrix[6];
                var m7 = matrix[7];
                var m8 = matrix[8];
                var m9 = matrix[9];
                var m10 = matrix[10];
                var m11 = matrix[11];
                var m12 = matrix[12];
                var m13 = matrix[13];
                var m14 = matrix[14];
                var m15 = matrix[15];

                var xmin = Infinity;
                var ymin = Infinity;
                var zmin = Infinity;
                var xmax = -Infinity;
                var ymax = -Infinity;
                var zmax = -Infinity;

                for (var idv = 0, len = verts.length; idv < len; idv += 3) {
                    var x = verts[idv];
                    var y = verts[idv + 1];
                    var z = verts[idv + 2];

                    var w = m3 * x + m7 * y + m11 * z + m15 || 1.0;

                    var xt = (m0 * x + m4 * y + m8 * z + m12) / w;
                    var yt = (m1 * x + m5 * y + m9 * z + m13) / w;
                    var zt = (m2 * x + m6 * y + m10 * z + m14) / w;

                    if (xt < xmin) xmin = xt;
                    if (yt < ymin) ymin = yt;
                    if (zt < zmin) zmin = zt;

                    if (xt > xmax) xmax = xt;
                    if (yt > ymax) ymax = yt;
                    if (zt > zmax) zmax = zt;
                }

                var bmin = this._minBox.getMin();
                var bmax = this._minBox.getMax();

                if (xmin < bmin[0]) bmin[0] = xmin;
                if (ymin < bmin[1]) bmin[1] = ymin;
                if (zmin < bmin[2]) bmin[2] = zmin;

                if (xmax > bmax[0]) bmax[0] = xmax;
                if (ymax > bmax[1]) bmax[1] = ymax;
                if (zmax > bmax[2]) bmax[2] = zmax;

                return;
            }

            this.traverse(node);
        }
    })
);

export default ComputePreciseBoundsVisitor;
