/** -*- compile-command: "jslint-cli osgUtil.js" -*-
 *
 *  Copyright (C) 2010 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */


var osgUtil = {};

osgUtil.TriangleHit = function (index, normal, r1, v1, r2, v2, r3, v3) {
    this.index = index;
    this.normal = normal;
    this.r1 = r1;
    this.v1 = v1;
    this.r2 = r2;
    this.v2 = v2;
    this.r3 = r3;
    this.v3 = v3;
};

osgUtil.TriangleIntersect = function()
{
    this.hits = [];
    this.nodePath = [];
};
osgUtil.TriangleIntersect.prototype = {
    setNodePath: function(np) { this.nodePath = np; },
    set: function(start, end) {
        this.start = start;
        this.end = end;
        this.dir = osg.Vec3.sub(end, start);
        this.length = osg.Vec3.length(this.dir);
        var l = 1.0/this.length;
        osg.Vec3.mult(this.dir, l, this.dir);
    },

    apply: function(node) {
        var primitive;
        var vertexes;
        var lastIndex;
        var idx;
        var v0,v1,v2;
        var i;
        this.index = 0;
        for (i = 0, l = node.primitives.length; i < l; i++) {
            primitive = node.primitives[i];
            if (primitive.getIndices !== undefined) {
                vertexes = node.getAttributes().Vertex.getElements();
                var indexes = primitive.indices.getElements();
                switch(primitive.getMode()) {
                case gl.TRIANGLES:
                    lastIndex = primitive.getCount();
                    for ( idx = primitive.getFirst(); idx < lastIndex; idx+= 3) {
                        v0 = [];
                        v1 = [];
                        v2 = [];
                        v0[0] = vertexes[indexes[idx]*3];
                        v0[1] = vertexes[indexes[idx]*3 +1];
                        v0[2] = vertexes[indexes[idx]*3 +2];
                        v1[0] = vertexes[indexes[idx+1]*3];
                        v1[1] = vertexes[indexes[idx+1]*3 +1];
                        v1[2] = vertexes[indexes[idx+1]*3 +2];
                        v2[0] = vertexes[indexes[idx+2]*3];
                        v2[1] = vertexes[indexes[idx+2]*3 +1];
                        v2[2] = vertexes[indexes[idx+2]*3 +2];
                        this.intersect(v0, v1, v2);
                    }
                    break;
                case gl.TRIANGLE_STRIP:
                    if (console) {
                        console.log("TriangleIntersect does not support TRIANGLE_STRIP");
                    }
                    break;
                case gl.TRIANGLE_FAN:
                    if (console) {
                        console.log("TriangleIntersect does not support TRIANGLE_FAN");
                    }
                    break;
                }
            } else { // draw array
                vertexes = node.getAttributes().Vertex.getElements();
                switch(primitive.getMode()) {
                case gl.TRIANGLES:
                    lastIndex = primitive.getCount();
                    for (idx = primitive.getFirst(); idx < lastIndex; ) {
                        v0 = [];
                        v1 = [];
                        v2 = [];
                        v0[0] = vertexes[idx++];
                        v0[1] = vertexes[idx++];
                        v0[2] = vertexes[idx++];
                        v1[0] = vertexes[idx++];
                        v1[1] = vertexes[idx++];
                        v1[2] = vertexes[idx++];
                        v2[0] = vertexes[idx++];
                        v2[1] = vertexes[idx++];
                        v2[2] = vertexes[idx++];
                        this.intersect(v0, v1, v2);
                    }
                    break;
                case gl.TRIANGLE_STRIP:
                    if (console) {
                        console.log("TriangleIntersect does not support TRIANGLE_STRIP");
                    }
                    break;
                case gl.TRIANGLE_FAN:
                    if (console) {
                        console.log("TriangleIntersect does not support TRIANGLE_FAN");
                    }
                    break;
                }
            }
        }

    },

    intersect: function(v1, v2, v3) {
        this.index++;

        if (v1==v2 || v2==v3 || v1==v3) { return;}

        var v12 = osg.Vec3.sub(v2,v1);
        var n12 = osg.Vec3.cross(v12, this.dir);
        var ds12 = osg.Vec3.dot(osg.Vec3.sub(this.start,v1),n12);
        var d312 = osg.Vec3.dot(osg.Vec3.sub(v3,v1),n12);
        if (d312>=0.0)
        {
            if (ds12<0.0) { return;}
            if (ds12>d312) { return;}
        }
        else                     // d312 < 0
        {
            if (ds12>0.0) { return;}
            if (ds12<d312) { return;}
        }

        var v23 = osg.Vec3.sub(v3,v2);
        var n23 = osg.Vec3.cross(v23,this.dir);
        var ds23 = osg.Vec3.dot(osg.Vec3.sub(this.start,v2),n23);
        var d123 = osg.Vec3.dot(osg.Vec3.sub(v1,v2),n23);
        if (d123>=0.0)
        {
            if (ds23<0.0) {return;}
            if (ds23>d123) { return;}
        }
        else                     // d123 < 0
        {
            if (ds23>0.0) {return;}
            if (ds23<d123) {return; }
        }

        var v31 = osg.Vec3.sub(v1,v3);
        var n31 = osg.Vec3.cross(v31,this.dir);
        var ds31 = osg.Vec3.dot(osg.Vec3.sub(this.start,v3),n31);
        var d231 = osg.Vec3.dot(osg.Vec3.sub(v2,v3),n31);
        if (d231>=0.0)
        {
            if (ds31<0.0) {return;}
            if (ds31>d231) {return;}
        }
        else                     // d231 < 0
        {
            if (ds31>0.0) {return;}
            if (ds31<d231) {return;}
        }
        

        var r3;
        if (ds12 === 0.0) { r3 = 0.0;}
        else if (d312 !== 0.0) { r3 = ds12/d312; }
        else {return;} // the triangle and the line must be parallel intersection.
        
        var r1;
        if (ds23 === 0.0) { r1 = 0.0;}
        else if (d123 !== 0.0) {r1 = ds23/d123;}
        else {return;} // the triangle and the line must be parallel intersection.
        
        var r2;
        if (ds31 === 0.0) {r2=0.0;}
        else if (d231 !== 0.0) {r2 = ds31/d231; }
        else {return;} // the triangle and the line must be parallel intersection.

        var total_r = (r1+r2+r3);
        if (total_r !== 1.0)
        {
            if (total_r === 0.0) {return;} // the triangle and the line must be parallel intersection.
            var inv_total_r = 1.0/total_r;
            r1 *= inv_total_r;
            r2 *= inv_total_r;
            r3 *= inv_total_r;
        }
        
        var inside = [];
        osg.Vec3.add(osg.Vec3.mult(v1,r1),  osg.Vec3.mult(v2,r2), inside);
        osg.Vec3.add(osg.Vec3.mult(v3,r3), inside, inside);
        if (!osg.Vec3.valid(inside)) {
            osg.log("Warning: TriangleIntersect ");
            osg.log("hit:     " + inside );
            osg.log("         " + v1);
            osg.log("         " + v2);
            osg.log("         " + v3);
            return;
        }

        var d = osg.Vec3.dot(osg.Vec3.sub(inside,this.start), this.dir);

        if (d<0.0) {return;}
        if (d>this.length) {return;}

        var normal = osg.Vec3.cross(v12,v23);
        osg.Vec3.normalize(normal, normal);

        var r = d/this.length;

        
        this.hits.push({ 'ratio': r,
                         'nodepath': this.nodePath.slice(0),
                         'triangleHit': new osgUtil.TriangleHit(this.index-1, normal, r1, v1, r2, v2, r3, v3),
                       });
        this.hit = true;
    }
};

osgUtil.IntersectVisitor = function() {
    osg.NodeVisitor.call(this);
    this.matrix = [];
    this.hits = [];
    this.nodePath = [];
};
osgUtil.IntersectVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    addLineSegment: function(start, end) {
        this.start = start;
        this.end = end;
    },
    intersectSegmentWithSphere: function(start, end, bsphere) {
        var sm = osg.Vec3.sub(start, bsphere.center);
        var c = osg.Vec3.length2(sm) - bsphere.radius * bsphere.radius;
        if (c < 0.0) {
            return true;
        }
        
        var se = osg.Vec3.sub(end, start);
        var a = osg.Vec3.length2(se);
        var b = osg.Vec3.dot(sm, se) * 2.0;
        var d = b*b - 4.0 * a * c;
        if (d < 0.0) {
            return false;
        }

        d = Math.sqrt(d);
        var div = 1.0/2.0 * a;
        var r1 = (-b-d)*div;
        var r2 = (-b+d)*div;

        if (r1 <= 0.0 && r2 <= 0.0) {
            return false;
        }

        if (r1 >= 1.0 && r2 >= 1.0) {
            return false;
        }
        return true;
    },
    pushModelMatrix: function(matrix) {
        if (this.matrix.length > 0 ) {
            var m = osg.Matrix.copy(this.matrix[this.matrix.length-1]);
            osg.Matrix.mult(m, matrix, m);
            this.matrix.push(m);
        } else {
            this.matrix.push(matrix);
        }
    },
    getModelMatrix: function() {
        if (this.matrix.length ===0 ) {
            return osg.Matrix.makeIdentity();
        }
        return this.matrix[this.matrix.length-1];
    },
    popModelMatrix: function() { return this.matrix.pop(); },
    getWindowMatrix: function() { return this.windowMatrix;},
    getProjectionMatrix: function() { return this.projectionMatrix;},
    getViewMatrix: function() { return this.viewMatrix;},
    intersectSegmentWithGeometry: function(start, end, geometry) {
        ti = new osgUtil.TriangleIntersect();
        ti.setNodePath(this.nodePath);
        ti.set(start, end);
        ti.apply(geometry);
        var l = ti.hits.length;
        if (l > 0) {
            for (var i = 0; i < l; i++) {
                this.hits.push( ti.hits[i]);
            }
            return true;
        }
        return false;
    },
    applyCamera: function(camera) {
        // we should support hierarchy of camera
        // but right now we want just simple picking on main
        // camera
        this.projectionMatrix = camera.getProjectionMatrix();
        this.viewMatrix = camera.getViewMatrix();

        var vp = camera.getViewport();
        if (vp !== undefined) {
            this.windowMatrix = vp.computeWindowMatrix();
        }

        this.traverse(camera);
    },

    applyNode: function(node) {
        if (node.getMatrix) {
            this.pushModelMatrix(node.getMatrix());
        }

        if (node.primitives) {
            var matrix = [];
            osg.Matrix.copy(this.getWindowMatrix(), matrix);
            osg.Matrix.mult(matrix, this.getProjectionMatrix(), matrix);
            osg.Matrix.mult(matrix, this.getViewMatrix(), matrix);
            osg.Matrix.mult(matrix, this.getModelMatrix(), matrix);
            
            var inv = [];
            var valid = osg.Matrix.inverse(matrix, inv);
            // if matrix is invalid do nothing on this node
            if (!valid) {
                return;
            }

            var ns = osg.Matrix.transformVec3(inv, this.start);
            var ne = osg.Matrix.transformVec3(inv, this.end);
            this.intersectSegmentWithGeometry(ns, ne, node);
        }

        if (node.traverse) {
            this.traverse(node);
        }

        if (node.getMatrix) {
            this.popModelMatrix();
        }
    },

    apply: function(node) {
        if (this.enterNode(node) === false) {
            return;
        }
        this.nodePath.push(node);

        if (node.getViewMatrix) { // Camera/View
            this.applyCamera(node);
        } else {
            this.applyNode(node);
        }

        this.nodePath.pop();
    },

    enterNode: function(node) {
        var bsphere = node.boundingSphere;
        if (bsphere !== undefined ) {
            if (!this.intersectSegmentWithSphere) {
                return false;
            }
        }
        return true;
    },
});



osgUtil.WireframeVisitor = function() {
    osg.NodeVisitor.call(this);
};

osgUtil.WireframeVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    
    apply: function(node) {

        if (node.primitives) {
            for (var i = 0, l = node.primitives.length; i < l; i++) {
                var primitive = node.primitives[i];
                if (primitive.getIndices !== undefined) {
                    //switch (primitive.getMode()) {
                        //case
                    //}
                }
            }
        }

        if (node.traverse) {
            this.traverse(node);
        }

    },

});