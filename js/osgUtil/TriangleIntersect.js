/** -*- compile-command: "jslint-cli TriangleIntersect.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

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
        this.dir = osg.Vec3.sub(end, start, []);
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

        var v12 = osg.Vec3.sub(v2,v1, []);
        var n12 = osg.Vec3.cross(v12, this.dir, []);
        var ds12 = osg.Vec3.dot(osg.Vec3.sub(this.start,v1,[]),n12);
        var d312 = osg.Vec3.dot(osg.Vec3.sub(v3,v1,[]),n12);
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

        var v23 = osg.Vec3.sub(v3,v2, []);
        var n23 = osg.Vec3.cross(v23,this.dir, []);
        var ds23 = osg.Vec3.dot(osg.Vec3.sub(this.start,v2, []),n23);
        var d123 = osg.Vec3.dot(osg.Vec3.sub(v1,v2, []),n23);
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

        var v31 = osg.Vec3.sub(v1,v3, []);
        var n31 = osg.Vec3.cross(v31,this.dir, []);
        var ds31 = osg.Vec3.dot(osg.Vec3.sub(this.start,v3, []),n31);
        var d231 = osg.Vec3.dot(osg.Vec3.sub(v2,v3, []),n31);
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
        osg.Vec3.add(osg.Vec3.mult(v1,r1, []),  
                     osg.Vec3.mult(v2,r2, []), 
                     inside);
        osg.Vec3.add(osg.Vec3.mult(v3,r3, []), 
                     inside, 
                     inside);
        if (!osg.Vec3.valid(inside)) {
            osg.log("Warning: TriangleIntersect ");
            osg.log("hit:     " + inside );
            osg.log("         " + v1);
            osg.log("         " + v2);
            osg.log("         " + v3);
            return;
        }

        var d = osg.Vec3.dot(osg.Vec3.sub(inside,
                                          this.start, 
                                          []), this.dir);

        if (d<0.0) {return;}
        if (d>this.length) {return;}

        var normal = osg.Vec3.cross(v12,v23, []);
        osg.Vec3.normalize(normal, normal);

        var r = d/this.length;

        
        this.hits.push({ 'ratio': r,
                         'nodepath': this.nodePath.slice(0),
                         'triangleHit': new osgUtil.TriangleHit(this.index-1, normal, r1, v1, r2, v2, r3, v3)
                       });
        this.hit = true;
    }
};
