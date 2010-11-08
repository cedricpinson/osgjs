/** -*- compile-command: "jslint-cli osg.js" -*-
 *
 * Copyright (C) 2010 Cedric Pinson
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */
var gl;
var osg = {};

osg.version = '0.0.1';
osg.copyright = 'Cedric Pinson - cedric.pinson@plopbyte.net';
osg.instance = 0;
osg.version = 0;
osg.log = function(str) {

    if (window.console !== undefined) {
        window.console.log(str);
    } else {
        jQuery("#debug").append("<li> + " + str + "</li>");
    }
};

osg.init = function() {
    if (Float32Array.set === undefined) {
        Float32Array.prototype.set = function(array) {
            var l = array.length;
            for (var i = 0; i < l; ++i ) {
                this[i] = array[i];
            }
        };
    }
    if (Int32Array.set === undefined) {
        Int32Array.prototype.set = function(array) {
            var l = array.length;
            for (var i = 0; i < l; ++i ) {
                this[i] = array[i];
            }
        };
    }
};

osg.objectInehrit = function(base, extras) {
        function F(){};
        F.prototype = base;
        var obj = new F();
        if(extras) osg.objectMix(obj, extras, false);
        return obj;
};
osg.objectMix = function(obj, properties, test){
    for (var key in properties){
        if(!(test && obj[key])) obj[key] = properties[key];
    }
    return obj;
};



osg.Matrix = {
    setRow: function(matrix, row, v0, v1, v2, v3) {
        var rowIndex = row*4;
        matrix[rowIndex + 0 ] = v0;
        matrix[rowIndex + 1 ] = v1;
        matrix[rowIndex + 2 ] = v2;
        matrix[rowIndex + 3 ] = v3;
    },
    innerProduct: function(a, b, r, c) {
        var rIndex = r * 4;
        return ((a[rIndex + 0] * b[0 + c]) + (a[rIndex + 1] * b[4 + c]) + (a[rIndex +2] * b[8 + c]) + (a[rIndex + 3] * b[12 + c]));
    },

    get: function(matrix, row, col) {
        var r = row*4+col;
        return matrix[row * 4 + col];
    },

    makeIdentity: function(matrix) {
        if (matrix === undefined) {
            matrix = [];
        }
        osg.Matrix.setRow(matrix, 0,    1, 0, 0, 0 );
        osg.Matrix.setRow(matrix, 1,    0, 1, 0, 0 );
        osg.Matrix.setRow(matrix, 2,    0, 0, 1, 0 );
        osg.Matrix.setRow(matrix, 3,    0, 0, 0, 1 );
        return matrix;
    },

    makeTranslate: function(x, y, z, matrix) {
        if (matrix === undefined) {
            matrix = [];
        }

        osg.Matrix.setRow(matrix, 0,    1, 0, 0, 0 );
        osg.Matrix.setRow(matrix, 1,    0, 1, 0, 0 );
        osg.Matrix.setRow(matrix, 2,    0, 0, 1, 0 );
        osg.Matrix.setRow(matrix, 3,    x, y, z, 1 );
        return matrix;
    },

    setTrans: function(matrix, x, y, z) {
        matrix[12] = x;
        matrix[13] = y;
        matrix[14] = z;
        return matrix;
    },

    getTrans: function(matrix, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = matrix[12];
        result[1] = matrix[13];
        result[2] = matrix[14];
        return result;
    },

    preMult: function(source, other) {
        var t = [];
        for (var col = 0; col < 4; col++) {
            t[0] = osg.Matrix.innerProduct(other, source, 0, col);
            t[1] = osg.Matrix.innerProduct(other, source, 1, col);
            t[2] = osg.Matrix.innerProduct(other, source, 2, col);
            t[3] = osg.Matrix.innerProduct(other, source, 3, col);
            source[0 + col] = t[0];
            source[4 + col] = t[1];
            source[8 + col] = t[2];
            source[12 + col] = t[3];
        }
        return source;
    },

    postMult: function(source, other) {
        var t = [];
        for (var row = 0; row < 4; row++) {
            t[0] = osg.Matrix.innerProduct(source, other, row, 0);
            t[1] = osg.Matrix.innerProduct(source, other, row, 1);
            t[2] = osg.Matrix.innerProduct(source, other, row, 2);
            t[3] = osg.Matrix.innerProduct(source, other, row, 3);
            this.setRow(source, row, t[0], t[1], t[2], t[3]);
        }
        return source;
    },

    mult: function(source, other, r) {
        if (r === source) {
            return this.postMult(r, other);
        }
        if (r === other) {
            return this.preMult(r, source);
        }
        if (r === undefined) {
            r = [];
        }

        var s00 = source[0];
        var s01 = source[1];
        var s02 = source[2];
        var s03 = source[3];
        var s10 = source[4];
        var s11 = source[5];
        var s12 = source[6];
        var s13 = source[7];
        var s20 = source[8];
        var s21 = source[9];
        var s22 = source[10];
        var s23 = source[11];
        var s30 = source[12];
        var s31 = source[13];
        var s32 = source[14];
        var s33 = source[15];

        var o00 = other[0];
        var o01 = other[1];
        var o02 = other[2];
        var o03 = other[3];
        var o10 = other[4];
        var o11 = other[5];
        var o12 = other[6];
        var o13 = other[7];
        var o20 = other[8];
        var o21 = other[9];
        var o22 = other[10];
        var o23 = other[11];
        var o30 = other[12];
        var o31 = other[13];
        var o32 = other[14];
        var o33 = other[15];

        r[0] =  s00 * o00 + s01 * o10 + s02 * o20 + s03 * o30;
        r[1] =  s00 * o01 + s01 * o11 + s02 * o21 + s03 * o31;
        r[2] =  s00 * o02 + s01 * o12 + s02 * o22 + s03 * o32;
        r[3] =  s00 * o03 + s01 * o13 + s02 * o23 + s03 * o33;

        r[4] =  s10 * o00 + s11 * o10 + s12 * o20 + s13 * o30;
        r[5] =  s10 * o01 + s11 * o11 + s12 * o21 + s13 * o31;
        r[6] =  s10 * o02 + s11 * o12 + s12 * o22 + s13 * o32;
        r[7] =  s10 * o03 + s11 * o13 + s12 * o23 + s13 * o33;

        r[8] =  s20 * o00 + s21 * o10 + s22 * o20 + s23 * o30;
        r[9] =  s20 * o01 + s21 * o11 + s22 * o21 + s23 * o31;
        r[10] = s20 * o02 + s21 * o12 + s22 * o22 + s23 * o32;
        r[11] = s20 * o03 + s21 * o13 + s22 * o23 + s23 * o33;

        r[12] = s30 * o00 + s31 * o10 + s32 * o20 + s33 * o30;
        r[13] = s30 * o01 + s31 * o11 + s32 * o21 + s33 * o31;
        r[14] = s30 * o02 + s31 * o12 + s32 * o22 + s33 * o32;
        r[15] = s30 * o03 + s31 * o13 + s32 * o23 + s33 * o33;

        return r;
    },

    preMultVec3: function(s, vec, result) {
        if (result === undefined) {
            result = [];
        }
        var d = 1.0/( s[3]*vec[0] + s[7] * vec[1] + s[11]*vec[2] + s[15] );
        result[0] = (s[0] * vec[0] + s[4]*vec[1] + s[8]*vec[2] + s[12]) * d;
        result[1] = (s[1] * vec[0] + s[5]*vec[1] + s[9]*vec[2] + s[13]) * d;
        result[2] = (s[2] * vec[0] + s[6]*vec[1] + s[10]*vec[2] + s[14]) * d;
        return result;
    },

    postMultVec3: function(s, vec, result) {
        if (result === undefined) {
            result = [];
        }
        var d = 1.0/( s[12]*vec[0] + s[13] * vec[1] + s[14]*vec[2] + s[15] );
        result[0] = (s[0] * vec[0] + s[1]*vec[1] + s[2]*vec[2] + s[3]) * d;
        result[1] = (s[4] * vec[0] + s[5]*vec[1] + s[6]*vec[2] + s[7]) * d;
        result[2] = (s[8] * vec[0] + s[9]*vec[1] + s[10]*vec[2] + s[11]) * d;
        return result;
    },

    makeLookAt: function(eye, center, up, result) {

        if (result === undefined)
            result = [];

        var f = osg.Vec3.sub(center, eye);
        osg.Vec3.normalize(f, f);

        var s = osg.Vec3.cross(f, up);
        osg.Vec3.normalize(s, s);

        var u = osg.Vec3.cross(s, f);
        osg.Vec3.normalize(u, u);

            // s[0], u[0], -f[0], 0.0,
            // s[1], u[1], -f[1], 0.0,
            // s[2], u[2], -f[2], 0.0,
            // 0,    0,    0,     1.0

        result[0]=s[0]; result[1]=u[0]; result[2]=-f[0]; result[3]=0.0;
        result[4]=s[1]; result[5]=u[1]; result[6]=-f[1]; result[7]=0.0;
        result[8]=s[2]; result[9]=u[2]; result[10]=-f[2];result[11]=0.0;
        result[12]=  0; result[13]=  0; result[14]=  0;  result[15]=1.0;

        osg.Matrix.preMultTranslate(result, osg.Vec3.neg(eye), result);
        return result;
    },

    getLookAt: function(matrix, eye, center, up, distance) {
        if (distance === undefined) {
            distance = 1.0;
        }
        var inv = osg.Matrix.inverse(matrix);
        osg.Matrix.preMultVec3(inv, [0,0,0], eye);
        osg.Matrix.transform3x3(matrix, [0,1,0], up);
        osg.Matrix.transform3x3(matrix, [0,0,-1], center);
        osg.Vec3.normalize(center, center);
        osg.Vec3.add(osg.Vec3.mult(center, distance), eye, center);
    },

    //getRotate_David_Spillings_Mk1
    getRotate: function (mat, result) {
        if (result === undefined) {
            result = [];
        }

        var s;
        var tq = [];
        var i, j;

        // Use tq to store the largest trace
        var mat00 = mat[4*0 + 0];
        var mat11 = mat[4*1 + 1];
        var mat22 = mat[4*2 + 2];
        tq[0] = 1 + mat00 + mat11 + mat22;
        tq[1] = 1 + mat00 - mat11 - mat22;
        tq[2] = 1 - mat00 + mat11 - mat22;
        tq[3] = 1 - mat00 - mat11 + mat22;

        // Find the maximum (could also use stacked if's later)
        j = 0;
        for(i=1;i<4;i++) {
            if ((tq[i]>tq[j])) {
                j = i;
            } else {
                j = j;
            }
        }

        // check the diagonal
        if (j==0)
        {
            /* perform instant calculation */
            result[3] = tq[0];
            result[0] = mat[1*4+2]-mat[2*4+1];
            result[1] = mat[2*4+0]-mat[0  +2]; 
            result[2] = mat[0  +1]-mat[1*4+0]; 
        }
        else if (j==1)
        {
            result[3] = mat[1*4+2]-mat[2*4+1]; 
            result[0] = tq[1];
            result[1] = mat[0  +1]+mat[1*4+0]; 
            result[2] = mat[2*4+0]+mat[0  +2];
        }
        else if (j==2)
        {
            result[3] = mat[2*4+0]-mat[0+2]; 
            result[0] = mat[0  +1]+mat[1*4+0]; 
            result[1] = tq[2];
            result[2] = mat[1*4+2]+mat[2*4+1]; 
        }
        else /* if (j==3) */
        {
            result[3] = mat[0  +1]-mat[1*4+0]; 
            result[0] = mat[2*4+0]+mat[0  +2]; 
            result[1] = mat[1*4+2]+mat[2*4+1];
            result[2] = tq[3];
        }

        s = Math.sqrt(0.25/tq[j]);
        result[3] *= s;
        result[0] *= s;
        result[1] *= s;
        result[2] *= s;

        return result;
    },

    preMultTranslate: function(mat, translate, result) {
        if (result === undefined) {
            result = [];
        }
        if (result !== mat) {
            osg.Matrix.copy(mat, result);
        }

        var val;
        if (translate[0] != 0.0) {
            val = translate[0];
            result[12] += val * mat[0];
            result[13] += val * mat[1];
            result[14] += val * mat[2];
            result[15] += val * mat[3];
        }

        if (translate[1] != 0.0) {
            val = translate[1];
            result[12] += val * mat[4];
            result[13] += val * mat[5];
            result[14] += val * mat[6];
            result[15] += val * mat[7];
        }

        if (translate[2] != 0.0) {
            val = translate[2];
            result[12] += val * mat[8];
            result[13] += val * mat[9];
            result[14] += val * mat[10];
            result[15] += val * mat[11];
        }
        return result;
    },

    makeRotate: function (angle, x, y, z, result) {
        if (result === undefined) {
            result = [];
        }

        var mag = Math.sqrt(x*x + y*y + z*z);
        var sinAngle = Math.sin(angle);
        var cosAngle = Math.cos(angle);

        if (mag > 0.0) {
            var xx, yy, zz, xy, yz, zx, xs, ys, zs;
            var oneMinusCos;
            var rotMat;
            mag = 1.0/mag;

            x *= mag;
            y *= mag;
            z *= mag;

            xx = x * x;
            yy = y * y;
            zz = z * z;
            xy = x * y;
            yz = y * z;
            zx = z * x;
            xs = x * sinAngle;
            ys = y * sinAngle;
            zs = z * sinAngle;
            oneMinusCos = 1.0 - cosAngle;

            result[0] = (oneMinusCos * xx) + cosAngle;
            result[1] = (oneMinusCos * xy) - zs;
            result[2] = (oneMinusCos * zx) + ys;
            result[3] = 0.0;

            result[4] = (oneMinusCos * xy) + zs;
            result[5] = (oneMinusCos * yy) + cosAngle;
            result[6] = (oneMinusCos * yz) - xs;
            result[7] = 0.0;

            result[8] = (oneMinusCos * zx) - ys;
            result[9] = (oneMinusCos * yz) + xs;
            result[10] = (oneMinusCos * zz) + cosAngle;
            result[11] = 0.0;

            result[12] = 0.0;
            result[13] = 0.0;
            result[14] = 0.0;
            result[15] = 1.0;

            return result;
        }

        return result;
    },

    transform3x3: function(m, v, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = m[0] * v[0] + m[1]*v[1] + m[2]*v[2];
        result[1] = m[4] * v[0] + m[5]*v[1] + m[6]*v[2];
        result[2] = m[8] * v[0] + m[9]*v[1] + m[10]*v[2];
        return result;
    },

    transformVec3: function(vector, matrix, result) {
        var d = 1.0/(matrix[3] * vector[0] + matrix[7] * vector[1] * matrix[11] * vector[2] + matrix[15]); 
        if (result === undefined) {
            result = [];
        }

        var tmp;
        if (result === vector) {
            tmp = [];
        } else {
            tmp = result;
        }
        tmp[0] = (matrix[0] * vector[0] + matrix[4] * vector[1] + matrix[8] * vector[2] + matrix[12]) * d;
        tmp[1] = (matrix[1] * vector[0] + matrix[5] * vector[1] + matrix[9] * vector[2] + matrix[13]) * d;
        tmp[2] = (matrix[2] * vector[0] + matrix[6] * vector[1] + matrix[10] * vector[2] + matrix[14]) * d;

        if (result === vector) {
            osg.Vec3.copy(tmp, result);
        }
        return result;

        // old version in fact it's a post, I hate this notation, I will update Matrix for regular Math convention after the demo
        var d = 1.0/(matrix[12] * vector[0] + matrix[13] * vector[1] * matrix[14] * vector[2] + matrix[15]);
        if (result === undefined) {
            result = [];
        }
        var tmp;
        if (result === vector) {
            tmp = [];
        } else {
            tmp = result;
        }
        tmp[0] = (matrix[0] * vector[0] + matrix[1] * vector[1] + matrix[2] * vector[2] + matrix[3]) * d;
        tmp[1] = (matrix[4] * vector[0] + matrix[5] * vector[1] + matrix[6] * vector[2] + matrix[7]) * d;
        tmp[2] = (matrix[8] * vector[0] + matrix[9] * vector[1] + matrix[10] * vector[2] + matrix[11]) * d;

        if (result === vector) {
            osg.Vec3.copy(tmp, result);
        }
        return result;
    },

    transformVec4: function(vector, matrix, result) {
        if (result === undefined) {
            result = [];
        }
        var tmp;
        if (result === vector) {
            tmp = [];
        } else {
            tmp = result;
        }
        tmp[0] = (matrix[0] * vector[0] + matrix[1] * vector[1] + matrix[2] * vector[2] + matrix[3]*vector[3]);
        tmp[1] = (matrix[4] * vector[0] + matrix[5] * vector[1] + matrix[6] * vector[2] + matrix[7]*vector[3]);
        tmp[2] = (matrix[8] * vector[0] + matrix[9] * vector[1] + matrix[10] * vector[2] + matrix[11]*vector[3]);
        tmp[3] = (matrix[12] * vector[0] + matrix[13] * vector[1] + matrix[14] * vector[2] + matrix[15]*vector[3]);

        if (result === vector) {
            osg.Vec4.copy(tmp, result);
        }
        return result;
    },

    copy: function(matrix, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        result[9] = matrix[9];
        result[10] = matrix[10];
        result[11] = matrix[11];
        result[12] = matrix[12];
        result[13] = matrix[13];
        result[14] = matrix[14];
        result[15] = matrix[15];
        return result;
    },

    inverse: function(matrix, result) {
        if (result === undefined) {
            result = [];
        }
        var tmp_0 = matrix[10] * matrix[15];
        var tmp_1 = matrix[14] * matrix[11];
        var tmp_2 = matrix[6] * matrix[15];
        var tmp_3 = matrix[14] * matrix[7];
        var tmp_4 = matrix[6] * matrix[11];
        var tmp_5 = matrix[10] * matrix[7];
        var tmp_6 = matrix[2] * matrix[15];
        var tmp_7 = matrix[14] * matrix[3];
        var tmp_8 = matrix[2] * matrix[11];
        var tmp_9 = matrix[10] * matrix[3];
        var tmp_10 = matrix[2] * matrix[7];
        var tmp_11 = matrix[6] * matrix[3];
        var tmp_12 = matrix[8] * matrix[13];
        var tmp_13 = matrix[12] * matrix[9];
        var tmp_14 = matrix[4] * matrix[13];
        var tmp_15 = matrix[12] * matrix[5];
        var tmp_16 = matrix[4] * matrix[9];
        var tmp_17 = matrix[8] * matrix[5];
        var tmp_18 = matrix[0] * matrix[13];
        var tmp_19 = matrix[12] * matrix[1];
        var tmp_20 = matrix[0] * matrix[9];
        var tmp_21 = matrix[8] * matrix[1];
        var tmp_22 = matrix[0] * matrix[5];
        var tmp_23 = matrix[4] * matrix[1];

        var t0 = ((tmp_0 * matrix[5] + tmp_3 * matrix[9] + tmp_4 * matrix[13]) -
                  (tmp_1 * matrix[5] + tmp_2 * matrix[9] + tmp_5 * matrix[13]));
        var t1 = ((tmp_1 * matrix[1] + tmp_6 * matrix[9] + tmp_9 * matrix[13]) -
                  (tmp_0 * matrix[1] + tmp_7 * matrix[9] + tmp_8 * matrix[13]));
        var t2 = ((tmp_2 * matrix[1] + tmp_7 * matrix[5] + tmp_10 * matrix[13]) -
                  (tmp_3 * matrix[1] + tmp_6 * matrix[5] + tmp_11 * matrix[13]));
        var t3 = ((tmp_5 * matrix[1] + tmp_8 * matrix[5] + tmp_11 * matrix[9]) -
                  (tmp_4 * matrix[1] + tmp_9 * matrix[5] + tmp_10 * matrix[9]));

        var d1 = (matrix[0] * t0 + matrix[4] * t1 + matrix[8] * t2 + matrix[12] * t3)
        if (Math.abs(d1) < 1e-5) {
            //osg.log("Warning can't inverse matrix " + matrix);
            return osg.Matrix.makeIdentity(result);
        }
        var d = 1.0 / d1;

        var out_00 = d * t0;
        var out_01 = d * t1;
        var out_02 = d * t2;
        var out_03 = d * t3;

        var out_10 = d * ((tmp_1 * matrix[4] + tmp_2 * matrix[8] + tmp_5 * matrix[12]) -
                          (tmp_0 * matrix[4] + tmp_3 * matrix[8] + tmp_4 * matrix[12]));
        var out_11 = d * ((tmp_0 * matrix[0] + tmp_7 * matrix[8] + tmp_8 * matrix[12]) -
                          (tmp_1 * matrix[0] + tmp_6 * matrix[8] + tmp_9 * matrix[12]));
        var out_12 = d * ((tmp_3 * matrix[0] + tmp_6 * matrix[4] + tmp_11 * matrix[12]) -
                          (tmp_2 * matrix[0] + tmp_7 * matrix[4] + tmp_10 * matrix[12]));
        var out_13 = d * ((tmp_4 * matrix[0] + tmp_9 * matrix[4] + tmp_10 * matrix[8]) -
                          (tmp_5 * matrix[0] + tmp_8 * matrix[4] + tmp_11 * matrix[8]));

        var out_20 = d * ((tmp_12 * matrix[7] + tmp_15 * matrix[11] + tmp_16 * matrix[15]) -
                          (tmp_13 * matrix[7] + tmp_14 * matrix[11] + tmp_17 * matrix[15]));
        var out_21 = d * ((tmp_13 * matrix[3] + tmp_18 * matrix[11] + tmp_21 * matrix[15]) -
                          (tmp_12 * matrix[3] + tmp_19 * matrix[11] + tmp_20 * matrix[15]));
        var out_22 = d * ((tmp_14 * matrix[3] + tmp_19 * matrix[7] + tmp_22 * matrix[15]) -
                          (tmp_15 * matrix[3] + tmp_18 * matrix[7] + tmp_23 * matrix[15]));
        var out_23 = d * ((tmp_17 * matrix[3] + tmp_20 * matrix[7] + tmp_23 * matrix[11]) -
                          (tmp_16 * matrix[3] + tmp_21 * matrix[7] + tmp_22 * matrix[11]));

        var out_30 = d * ((tmp_14 * matrix[10] + tmp_17 * matrix[14] + tmp_13 * matrix[6]) -
                          (tmp_16 * matrix[14] + tmp_12 * matrix[6] + tmp_15 * matrix[10]));
        var out_31 = d * ((tmp_20 * matrix[14] + tmp_12 * matrix[2] + tmp_19 * matrix[10]) -
                          (tmp_18 * matrix[10] + tmp_21 * matrix[14] + tmp_13 * matrix[2]));
        var out_32 = d * ((tmp_18 * matrix[6] + tmp_23 * matrix[14] + tmp_15 * matrix[2]) -
                          (tmp_22 * matrix[14] + tmp_14 * matrix[2] + tmp_19 * matrix[6]));
        var out_33 = d * ((tmp_22 * matrix[10] + tmp_16 * matrix[2] + tmp_21 * matrix[6]) -
                          (tmp_20 * matrix[6] + tmp_23 * matrix[10] + tmp_17 * matrix[2]));

        result[0*4+0] = out_00;
        result[0*4+1] = out_01;
        result[0*4+2] = out_02;
        result[0*4+3] = out_03;
        result[1*4+0] = out_10;
        result[1*4+1] = out_11;
        result[1*4+2] = out_12;
        result[1*4+3] = out_13;
        result[2*4+0] = out_20;
        result[2*4+1] = out_21;
        result[2*4+2] = out_22;
        result[2*4+3] = out_23;
        result[3*4+0] = out_30;
        result[3*4+1] = out_31;
        result[3*4+2] = out_32;
        result[3*4+3] = out_33;
        return result;
    },

    transpose: function(matrix, result) {
        if (result === undefined) {
            result = [];
        }
        var tmp;
        if (result === matrix) {
            tmp = osg.Matrix.copy(matrix, result);
        } else {
            tmp = result;
        }

        if (result !== matrix) {
            tmp[0] = matrix[0];
            tmp[5] = matrix[5];
            tmp[10] = matrix[10];
            tmp[15] = matrix[15];
        }

        tmp[1] = matrix[4];
        tmp[2] = matrix[8];
        tmp[3] = matrix[12];
        tmp[4] = matrix[1];
        tmp[6] = matrix[9];
        tmp[7] = matrix[13];
        tmp[8] = matrix[2];
        tmp[9] = matrix[5];
        tmp[11] = matrix[14];
        tmp[12] = matrix[3];
        tmp[13] = matrix[7];
        tmp[14] = matrix[11];

        // var i,j;
        // for (i = 0; i < 4; i++)
        //     for (j = 0; j < 4; j++)
        //         tmp[j*4 +i] = matrix[i*4 +j];

        if (result === matrix) {
            osg.Matrix.copy(tmp, result);
        }
        return result;
    },

    makePerspective: function(fovy, aspect, znear, zfar, result)
    {
        if (result === undefined) {
            result = [];
        }
        var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
        var ymin = -ymax;
        var xmin = ymin * aspect;
        var xmax = ymax * aspect;

        return osg.Matrix.makeFrustum(xmin, xmax, ymin, ymax, znear, zfar, result);
    },

    makeScale: function(x, y, z, result)
    {
        if (result === undefined) {
            result = [];
        }
        this.setRow(result, 0, x, 0, 0, 0);
        this.setRow(result, 1, 0, y, 0, 0);
        this.setRow(result, 2, 0, 0, z, 0);
        this.setRow(result, 3, 0, 0, 0, 1);
        return result;
    },

    makeFrustum: function(left, right,
                          bottom, top,
                          znear, zfar, result) {
        if (result === undefined) {
            result = [];
        }
        var X = 2*znear/(right-left);
        var Y = 2*znear/(top-bottom);
        var A = (right+left)/(right-left);
        var B = (top+bottom)/(top-bottom);
        var C = -(zfar+znear)/(zfar-znear);
        var D = -2*zfar*znear/(zfar-znear);
        this.setRow(result, 0, X, 0, 0, 0);
        this.setRow(result, 1, 0, Y, 0, 0);
        this.setRow(result, 2, A, B, C, -1);
        this.setRow(result, 3, 0, 0, D, 0);
        return result;
    },

    makeRotateFromQuat: function (quat, result) {
        if (result === undefined) {
            result = [];
        }
        this.makeIdentity(result);
        return this.setRotateFromQuat(result, quat);
    },

    setRotateFromQuat: function (matrix, quat) {
        var length2 = osg.Quat.length2(quat);
        if (Math.abs(length2) <= Number.MIN_VALUE)
        {
            matrix[0] = 0.0;
            matrix[1] = 0.0;
            matrix[2] = 0.0;

            matrix[4] = 0.0;
            matrix[5] = 0.0;
            matrix[6] = 0.0;

            matrix[8] = 0.0;
            matrix[9] = 0.0;
            matrix[10] = 0.0;
        }
        else
        {
            var rlength2;
            // normalize quat if required.
            // We can avoid the expensive sqrt in this case since all 'coefficients' below are products of two q components.
            // That is a square of a square root, so it is possible to avoid that
            if (length2 !== 1.0)
            {
                rlength2 = 2.0/length2;
            }
            else
            {
                rlength2 = 2.0;
            }

            // Source: Gamasutra, Rotating Objects Using Quaternions
            //
            //http://www.gamasutra.com/features/19980703/quaternions_01.htm

            var wx, wy, wz, xx, yy, yz, xy, xz, zz, x2, y2, z2;

            // calculate coefficients
            x2 = rlength2*quat[0];
            y2 = rlength2*quat[1];
            z2 = rlength2*quat[2];

            xx = quat[0] * x2;
            xy = quat[0] * y2;
            xz = quat[0] * z2;

            yy = quat[1] * y2;
            yz = quat[1] * z2;
            zz = quat[2] * z2;

            wx = quat[3] * x2;
            wy = quat[3] * y2;
            wz = quat[3] * z2;

            // Note.  Gamasutra gets the matrix assignments inverted, resulting
            // in left-handed rotations, which is contrary to OpenGL and OSG's
            // methodology.  The matrix assignment has been altered in the next
            // few lines of code to do the right thing.
            // Don Burns - Oct 13, 2001
            matrix[0] = 1.0 - (yy + zz);
            matrix[4] = xy - wz;
            matrix[8] = xz + wy;


            matrix[0+1] = xy + wz;
            matrix[4+1] = 1.0 - (xx + zz);
            matrix[8+1] = yz - wx;

            matrix[0+2] = xz - wy;
            matrix[4+2] = yz + wx;
            matrix[8+2] = 1.0 - (xx + yy);
        }
        return matrix;
    }
};



osg.Vec3 = {
    cross: function(a, b, result) {
        if (result === undefined) {
            result = [];
        }

        result[0] = a[1]*b[2]-a[2]*b[1];
        result[1] = a[2]*b[0]-a[0]*b[2];
        result[2] = a[0]*b[1]-a[1]*b[0];
        return result;
    },

    valid: function(vec) {
        if (isNaN(vec[0]))
            return false;
        if (isNaN(vec[1]))
            return false;
        if (isNaN(vec[2]))
            return false;
        return true;
    },

    mult: function(vec, a, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = vec[0] * a;
        result[1] = vec[1] * a;
        result[2] = vec[2] * a;
        return result;
    },

    length2: function(a) {
        return a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
    },

    length: function(a) {
        return Math.sqrt( a[0]*a[0] + a[1]* a[1] + a[2]*a[2] );
    },

    normalize: function(a, result) {
        if (result === undefined) {
            result = a;
        }

        var norm = this.length2(a);
        if (norm > 0.0) {
            var inv = 1.0/Math.sqrt(norm);
            result[0] = a[0] * inv;
            result[1] = a[1] * inv;
            result[2] = a[2] * inv;
        }
        return result;
    },

    dot: function(a, b) {
        return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    },

    sub: function(a, b, r) {
        if (r === undefined) {
            r = [];
        }
        r[0] = a[0]-b[0];
        r[1] = a[1]-b[1];
        r[2] = a[2]-b[2];
        return r;
    },

    add: function(a, b, r) {
        if (r === undefined) {
            r = [];
        }
        r[0] = a[0]+b[0];
        r[1] = a[1]+b[1];
        r[2] = a[2]+b[2];
        return r;
    },

    neg: function(a, r) {
        if (r === undefined) {
            r = [];
        }
        r[0] = -a[0];
        r[1] = -a[1];
        r[2] = -a[2];
        return r;
    },

    lerp: function(t, a, b, r) {
        if (r === undefined) {
            r = [];
        }
        var tmp = 1.0-t;
        r[0] = a[0]*tmp + t*b[0];
        r[1] = a[1]*tmp + t*b[1];
        r[2] = a[2]*tmp + t*b[2];
        return r;
    }

};



osg.Vec4 = {

    dot: function(a, b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
    },

    copy: function(src, res) {
        if (res === undefined)
            res = [];
        res[0] = src[0];
        res[1] = src[1];
        res[2] = src[2];
        res[3] = src[3];
        return res;
    },

    sub: function(a, b, r) {
        if (r === undefined) {
            r = [];
        }
        r[0] = a[0] - b[0];
        r[1] = a[1] - b[1];
        r[2] = a[2] - b[2];
        r[3] = a[3] - b[3];
        return r;
    },

    mult: function(vec, a, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = vec[0] * a;
        result[1] = vec[1] * a;
        result[2] = vec[2] * a;
        result[3] = vec[3] * a;
        return result;
    },

    add: function(a, b, r) {
        if (r === undefined) {
            r = [];
        }
        r[0] = a[0] + b[0];
        r[1] = a[1] + b[1];
        r[2] = a[2] + b[2];
        r[3] = a[3] + b[3];
        return r;
    },

    neg: function(a, r) {
        if (r === undefined) {
            r = [];
        }
        r[0] = -a[0];
        r[1] = -a[1];
        r[2] = -a[2];
        r[3] = -a[3];
        return r;
    },

    lerp: function(t, a, b, r) {
        if (r === undefined) {
            r = [];
        }
        var tmp = 1.0-t;
        r[0] = a[0]*tmp + t*b[0];
        r[1] = a[1]*tmp + t*b[1];
        r[2] = a[2]*tmp + t*b[2];
        r[3] = a[3]*tmp + t*b[3];
        return r;
    }
};



osg.Quat = {
    makeIdentity: function(element) { return osg.Quat.init(element); },

    init: function(element) {
        if (element === undefined) {
            element = [];
        }
        element[0] = 0;
        element[1] = 0;
        element[2] = 0;
        element[3] = 1;
        return element;
    },

    sub: function(a, b, result) {
        if (result === undefined)
            result = [];
        result[0] = a[0] - b[0];
        result[1] = a[1] - b[1];
        result[2] = a[2] - b[2];
        result[3] = a[3] - b[3];
        return result;
    },

    add: function(a, b, result) {
        if (result === undefined)
            result = [];
        result[0] = a[0] + b[0];
        result[1] = a[1] + b[1];
        result[2] = a[2] + b[2];
        result[3] = a[3] + b[3];
        return result;
    },

    dot: function(a, b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
    },

    length2: function(a) {
        return a[0]*a[0] + a[1]*a[1] + a[2]*a[2] + a[3]*a[3];
    },

    neg: function(a, result) {
        if (result === undefined)
            result = [];
        result[0] = -a[0];
        result[1] = -a[1];
        result[2] = -a[2];
        result[3] = -a[3];
        return result;
    },

    makeRotate: function(angle, x, y, z, result ) {
        var epsilon = 0.0000001;
        var length = Math.sqrt(x*x+ y*y+ z*z);
        if (length < epsilon) {
            return this.init();
        }

        var inversenorm  = 1.0/length;
        var coshalfangle = Math.cos( 0.5*angle );
        var sinhalfangle = Math.sin( 0.5*angle );

        if (result === undefined)
            result = [];
        result[0] = x * sinhalfangle * inversenorm;
        result[1] = y * sinhalfangle * inversenorm;
        result[2] = z * sinhalfangle * inversenorm;
        result[3] = coshalfangle;
        return result;
    },

    lerp: function(t, from, to, result){
        if (result === undefined)
            result = [];

        var t1 = 1.0 - t;
        result[0] = from[0]*t1 + quatTo[0]*t;
        result[1] = from[1]*t1 + quatTo[1]*t;
        result[2] = from[2]*t1 + quatTo[2]*t;
        result[3] = from[3]*t1 + quatTo[3]*t;
        return result;
    },

    slerp: function(t, from, to, result) {
        var epsilon = 0.00001;

        var quatTo = to;
        var cosomega = this.dot(from,quatTo);
        if ( cosomega <0.0 )
        {
            cosomega = -cosomega;
            quatTo = this.neg(to);
        }

        var omega;
        var sinomega;
        var scale_from;
        var scale_to;
        if( (1.0 - cosomega) > epsilon )
        {
            omega= Math.acos(cosomega) ;  // 0 <= omega <= Pi (see man acos)
            sinomega = Math.sin(omega) ;  // this sinomega should always be +ve so
            // could try sinomega=sqrt(1-cosomega*cosomega) to avoid a sin()?
            scale_from = Math.sin((1.0-t)*omega)/sinomega ;
            scale_to = Math.sin(t*omega)/sinomega ;
        }
        else
        {
            /* --------------------------------------------------
             The ends of the vectors are very close
             we can use simple linear interpolation - no need
             to worry about the "spherical" interpolation
             -------------------------------------------------- */
            scale_from = 1.0 - t ;
            scale_to = t ;
        }

        if (result === undefined)
            result = [];

        result[0] = from[0]*scale_from + quatTo[0]*scale_to;
        result[1] = from[1]*scale_from + quatTo[1]*scale_to;
        result[2] = from[2]*scale_from + quatTo[2]*scale_to;
        result[3] = from[3]*scale_from + quatTo[3]*scale_to;
        return result;
    },

    // we suppose to have unit quaternion
    conj: function(a, result) {
        if (result === undefined)
            result = [];
        result[0] = -a[0];
        result[1] = -a[1];
        result[2] = -a[2];
        result[3] = a[3];
        return result;
    },

    // we suppose to have unit quaternion
    inverse: function(a, result) {
        if (result === undefined)
            result = [];
        var div = 1.0/ this.length2(a);
        this.conj(a, result);
        result[0] *= div;
        result[1] *= div;
        result[2] *= div;
        result[3] *= div;
        return result;
    },

    // we suppose to have unit quaternion
    mult: function(a, b, result) {
        if (result === undefined)
            result = [];
        var x = b[3]*a[0] + b[0]*a[3] + b[1]*a[2] - b[2]*a[1];
        var y = b[3]*a[1] - b[0]*a[2] + b[1]*a[3] + b[2]*a[0];
        var z = b[3]*a[2] + b[0]*a[1] - b[1]*a[0] + b[2]*a[3];

        result[3] = b[3]*a[3] - b[0]*a[0] - b[1]*a[1] - b[2]*a[2];
        result[0] = x;
        result[1] = y;
        result[2] = z;
        return result;
    },
    div: function(a, b, result) {
        if (result === undefined)
            result = [];
        var d = 1.0/b;
        result[0] = a[0] * d;
        result[1] = a[1] * d;
        result[2] = a[2] * d;
        result[3] = a[3] * d;
        return result;
    },
    exp: function(a, res) {
	var r  = Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
	var et = Math.exp(a[3]);
        var s = 0;
        if (r > 0.00001) {
            s = et * Math.sin(r)/r;
        }
        if (res === undefined)
            res = [];
        res[0] = s*a[0];
        res[1] = s*a[1];
        res[2] = s*a[2];
        res[3] = et*Math.cos(r);
        return res;
    },

    ln: function(a, res) {
        var n = a[0]*a[0]+a[1]*a[1]+a[2]*a[2];
	var r  = Math.sqrt(n);
	var t  = 0;
        if (r>0.00001) {
            t= Math.atan2(r,a[3])/r;
        }
        if (res === undefined)
            res = [];
        n += a[3]*a[3];
        res[0] = t*a[0];
        res[1] = t*a[1];
        res[2] = t*a[2];
        res[3] = 0.5*Math.log(n);
        return res;
    },


    //http://theory.org/software/qfa/writeup/node12.html
    //http://www.ece.uwaterloo.ca/~dwharder/C++/CQOST/src/
    //http://willperone.net/Code/quaternion.php

    // a is computeTangent(q1-1,q1,q2)
    // b is computeTangent(q2-1,q2,q2+1)
    squad: function(t, q1, a, b, q2, r) {
        var r1 = this.slerp(t, q1, q2);
        var r2 = this.slerp(t, a, b);
        return this.slerp(2.0 * t * (1.0 - t), r1, r2, r);
    },

    // qcur is current
    // q0 is qcur-1
    // q2 is qcur+1
    // compute tangent in of q1
    computeTangent: function(q0, qcur, q2, r) {
        if (r === undefined)
            r = [];

        // first step
        var invq = this.inv(qcur);
        var qa,qb;

        this.mult(invq, q2, qa);
        this.ln(qa, qa);

        this.mult(invq, q0, qb);
        this.ln(qb, qb);

        this.add(qa, qb, qa);
        this.div(qa, -4.0, qa);
        this.exp(qa, qb);
        return this.mult(q1, qb, r);
    },

    createKey: function(q, r) {
        if (r === undefined) {
            r = this.init();
        } else {
            if (q !== r) {
                r[0] = q[0];
                r[1] = q[1];
                r[2] = q[2];
                r[3] = q[3];
            }
        }
        r.time = 0;
        r.tangent = [];
        return r;
    }

};


osg.Uniform = function () { this.transpose = false;}
osg.Uniform.prototype = {
    set: function(array) {
        this.data = array;
        this.dirty = true;
    },
    apply: function(location) {
        if (this.dirty) {
            this.glData.set(this.data);
        }
        this.glCall(location, this.glData);
    },
    applyMatrix: function(location) {
        if (this.dirty) {
            this.glData.set(this.data);
        }
        this.glCall(location, this.transpose, this.glData);
    }
};

osg.Uniform.createFloat1 = function(value, name) {
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1fv(location, glData);
    };
    uniform.glData = new Float32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat2 = function(vec2, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec2;
    uniform.glCall = function (location, glData) {
        gl.uniform2fv(location, glData);
    };
    uniform.glData = new Float32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat3 = function(vec3, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec3;
    uniform.glCall = function (location, glData) {
        gl.uniform3fv(location, glData);
    };
    uniform.glData = new Float32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat4 = function(vec4, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec4;
    uniform.glCall = function (location, glData) {
        gl.uniform4fv(location, glData);
    };
    uniform.glData = new Float32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt1 = function(value, name) {
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1iv(location, glData);
    };
    uniform.glData = new Int32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt2 = function(vec2, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec2;
    uniform.glCall = function (location, glData) {
        gl.uniform2iv(location, glData);
    };
    uniform.glData = new Int32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt3 = function(vec3, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec3;
    uniform.glCall = function (location, glData) {
        gl.uniform3iv(location, glData);
    };
    uniform.glData = new Int32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt4 = function(vec4, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec4;
    uniform.glCall = function (location, glData) {
        gl.uniform4iv(location, glData);
    };
    uniform.glData = new Int32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createMatrix2 = function(mat2, name) {
    var uniform = new osg.Uniform();
    uniform.data = mat2;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix2fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new Float32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createMatrix3 = function(mat3, name) {
    var uniform = new osg.Uniform();
    uniform.data = mat3;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix3fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new Float32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createMatrix4 = function(mat4, name) {
    var uniform = new osg.Uniform();
    uniform.data = mat4;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix4fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new Float32Array(uniform.data);
    uniform.dirty = false;
    uniform.name = name;
    return uniform;
};


osg.Stack = function() {}
osg.Stack.create = function()
{
    var a = [];
    a.globalDefault = undefined;
    a.lastApplied = undefined;
    a.back = function () {
        return this[this.length -1];
    };
    return a;
};


osg.ShaderGeneratorType = {
    VertexInit: 0,
    VertexFunction: 1,
    VertexMain: 2,
    FragmentInit: 3,
    FragmentMain: 5
};

osg.Shader = function() {}
osg.Shader.prototype = {
    compile: function() {
        this.shader = gl.createShader(this.type);
        gl.shaderSource(this.shader, this.text);
        gl.compileShader(this.shader);
        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
            if (console !== undefined) {
                console.log("can't compile shader:\n" + this.text + "\n");
                var tmpText = "\n" + this.text;
                var splittedText = tmpText.split("\n");
                var newText = "\n";
                for (var i = 0; i < splittedText.length; ++i ) {
                    newText += i + " " + splittedText[i] + "\n";
                }
                console.log(newText);
                console.log(gl.getShaderInfoLog(this.shader));
                debugger;
            } else {
                alert(gl.getShaderInfoLog(this.shader));
            }
        }
    }
};
osg.Shader.create = function( type, text )
{
    var shader = new osg.Shader(type);
    shader.type = type;
    shader.text = text;
    return shader;
};


osg.Program = function () {};
osg.Program.prototype = {

    attributeType: "Program",
    cloneType: function() { var p = osg.Program.create(); p.default_program = true; return p; },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setVertexShader: function(vs) { program.vertex = vs; },
    setFragmentShader: function(fs) { program.fragment = fs; },
    apply: function(state) {
        if (!this.program || this.dirty) {

            if (this.default_program === true) {
                return;
            }

            if (!this.vertex.shader) {
                this.vertex.compile();
            }
            if (!this.fragment.shader) {
                this.fragment.compile();
            }
            this.program = gl.createProgram();
            gl.attachShader(this.program, this.vertex.shader);
            gl.attachShader(this.program, this.fragment.shader);
            gl.linkProgram(this.program);
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                    osg.log("can't link program\n" + this.vertex.text + this.fragment.text);
                    osg.log(gl.getProgramInfo(this.program));
                    debugger;
                return null;
            }

            this.uniformsCache = {};
            this.attributesCache = {};
            this.cacheUniformList(this.vertex.text);
            this.cacheUniformList(this.fragment.text);
            //osg.log(this.uniformsCache);

            this.cacheAttributeList(this.vertex.text);
            this.dirty = false;
        }

        gl.useProgram(this.program);
    },

    cacheUniformList: function(str) {
        var r = str.match(/uniform\s+\w+\s+\w+/g);
        if (r !== null) {
            for (i in r) {
                var uniform = r[i].match(/uniform\s+\w+\s+(\w+)/)[1];
                var l = gl.getUniformLocation(this.program, uniform);
                if (l !== -1 && l !== undefined)
                    this.uniformsCache[uniform] = l;
            }
        }
    },

    cacheAttributeList: function(str) {
        var r = str.match(/attribute\s+\w+\s+\w+/g);
        if (r !== null) {
            for (i in r) {
                var attr = r[i].match(/attribute\s+\w+\s+(\w+)/)[1];
                var l = gl.getAttribLocation(this.program, attr);
                if (l !== -1 && l !== undefined)
                    this.attributesCache[attr] = l;
            }
        }
    }


};

osg.Program.create = function(vShader, fShader) {
    var program = new osg.Program();
    program.program = null;
    program.vertex = vShader;
    program.fragment = fShader;
    program.dirty = true;
    return program;
};


osg.ShaderGenerator = function() {};
osg.ShaderGenerator.prototype = {

    createTextureAttributeMapList: function(attributes, attributeKeys) {
        var textureAttributeMapList = [];
        var element;
        if (attributes) {
            jQuery.each(attributes, function(index, attributesForUnit) {
                            if (attributesForUnit === undefined) {
                                return;
                            }
                            if (textureAttributeMapList[index] === undefined) {
                                textureAttributeMapList[index] = {};
                            }

                            jQuery.each(attributesForUnit, function(key, attributeStack) {
                                            if (attributeStack === undefined) {
                                                return;
                                            }
                                            if (attributeStack.length === 0) {
                                                element = attributeStack.globalDefault;
                                            } else {
                                                element = attributeStack.back();
                                            }
                                            // do not take invalid texture
                                            if (!element.textureObject) {
                                                return;
                                            }
                                            textureAttributeMapList[index][key] = element;
                                            attributeKeys[element.getType() + index] = true;
                                        }
                                       );
                        }
                       );
        }
        return textureAttributeMapList;
    },

    createAttributeMap: function(attributes, attributeKeys) {
        var attributeMap = {};
        var element;
        if (attributes) {
            jQuery.each(attributes, function(key, attributeStack) {
                            if (attributeStack === undefined) {
                                return;
                            }
                            if (attributeStack.length === 0) {
                                element = attributeStack.globalDefault;
                            } else {
                                element = attributeStack.back();
                            }
                            attributeMap[key] = element;
                            attributeKeys[key] = true;
                        }
                       );
        }
        return attributeMap;
    },

    createAttributes: function(attributes) {
        var attributeKeys = {};
        return {
            'textureAttributeMapList': this.createTextureAttributeMapList(attributes.textureAttributeMapList, attributeKeys),
            'attributeMap': this.createAttributeMap(attributes.attributeMap, attributeKeys),
            'attributeKeys': attributeKeys
        };
    },

    getOrCreateProgram: function(attributes) {

        var modes = this.createAttributes(attributes);

        for (var i = 0; i < this.cache.length; ++i) {
            if (this.compareAttributeMap(modes.attributeKeys, this.cache[i].attributeKeys) === 0) {
                return this.cache[i];
            }
        }


        var vertexshader = this.getOrCreateVertexShader(modes);
        var fragmentshader = this.getOrCreateFragmentShader(modes);

        var program = osg.Program.create(
            osg.Shader.create(gl.VERTEX_SHADER, vertexshader),
            osg.Shader.create(gl.FRAGMENT_SHADER, fragmentshader));

        var attributeKeys = {};
        jQuery.each(modes.attributeMap, function(key, element) {
                        attributeKeys[key] = true;
                    });
        var textureLenght = modes.textureAttributeMapList.length;
        var operator = function(key, element) {
                            attributeKeys[element.getType() + textureUnit] = true;
        };
        for (var textureUnit = 0; textureUnit < textureLenght; ++textureUnit) {
            jQuery.each(modes.textureAttributeMapList[textureUnit], operator);
        }
        program.attributeKeys = attributeKeys;

        osg.log(program.vertex.text);
        osg.log(program.fragment.text);

        this.cache.push(program);
        return program;
    },

    compareAttributeMap: function(attributeKeys0, attributeKeys1) {
        var key;
        for (key in attributeKeys0) {
            if (attributeKeys1[key] === undefined) {
                return 1;
            }
        }
        for (key in attributeKeys1) {
            if (attributeKeys0[key] === undefined) {
                return false;
            }
        }
        return 0;
    },

    fillTextureShader: function (attributeMapList, mode) {
        var shader = "";
        var instanciedTypeShader = {};
        jQuery.each(attributeMapList, function(unit, unitMap) {
                        // process the array
                        jQuery.each( unitMap, function(key, element) {
                                         if (element.writeShaderInstance && instanciedTypeShader[element.getType()] === undefined) {
                                             element.writeShaderInstance(unit, mode);
                                             instanciedTypeShader[element.getType()] = true;
                                         }

                                         if (element.writeToShader) {
                                             shader += element.writeToShader(unit, mode);
                                         }
                                     }
                                   );
                    }
        );
        return shader;
    },

    fillShader: function (attributeMap, mode) {
        var shader = "";
        var instanciedTypeShader = {};
        // process the array
        jQuery.each( attributeMap, function(key, element) {
                         if (element.writeShaderInstance && !instanciedTypeShader[element.getType()]) {
                             shader += element.writeShaderInstance(mode);
                             instanciedTypeShader[element.getType()] = true;
                         }
                         if (element.writeToShader) {
                             shader += element.writeToShader(mode);
                         }
                     }
                   );
        return shader;
    },

    getOrCreateVertexShader: function (attributes) {
        var i;
        var mode = osg.ShaderGeneratorType.VertexInit;
        var shader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec3 Normal;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "uniform mat4 NormalMatrix;",
            ""
        ].join('\n');


        if (attributes.textureAttributeMapList) {
            shader += this.fillTextureShader(attributes.textureAttributeMapList, mode);
        }

        if (attributes.attributeMap) {
            shader += this.fillShader(attributes.attributeMap, mode);
        }

        mode = osg.ShaderGeneratorType.VertexFunction;
        var func = [
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}"].join('\n');

        shader += func;
        if (attributes.textureAttributeMapList) {
            shader += this.fillTextureShader(attributes.textureAttributeMapList, mode);
        }

        if (attributes.attributeMap) {
            shader += this.fillShader(attributes.attributeMap, mode);
        }

        var body = [
            "",
            "void main(void) {",
            "gl_Position = ftransform();",
            ""
            ].join('\n');

        shader += body;

        mode = osg.ShaderGeneratorType.VertexMain;

        if (attributes.textureAttributeMapList) {
            shader += this.fillTextureShader(attributes.textureAttributeMapList, mode);
        }
        if (attributes.attributeMap) {
            shader += this.fillShader(attributes.attributeMap, mode);
        }

        shader += [
            "}",
            ""
        ].join('\n');

        return shader;
    },

    getOrCreateFragmentShader: function (attributes) {
        var i;
        var shader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "vec4 fragColor;",
            ""
            ].join("\n");
        var mode = osg.ShaderGeneratorType.FragmentInit;

        if (attributes.textureAttributeMapList) {
            shader += this.fillTextureShader(attributes.textureAttributeMapList, mode);
        }
        if (attributes.attributeMap) {
            shader += this.fillShader(attributes.attributeMap, mode);
        }

        shader += [
            "void main(void) {",
            "fragColor = vec4(1.0, 1.0, 1.0, 1.0);",
            ""
            ].join('\n');

        mode = osg.ShaderGeneratorType.FragmentMain;
        if (attributes.textureAttributeMapList) {
            var result = this.fillTextureShader(attributes.textureAttributeMapList, mode);
            shader += result;

            for (i = 0; i < attributes.textureAttributeMapList.length; ++i) {
                var textureUnit = attributes.textureAttributeMapList[i];
                if (textureUnit.Texture !== undefined ) {
                    shader += "fragColor = fragColor * texColor" + i + ";\n";
                }
            }
        }
        if (attributes.attributeMap) {
            shader += this.fillShader(attributes.attributeMap, mode);
        }

        shader += [
            "",
            "gl_FragColor = fragColor;",
            "}"
        ].join('\n');

        return shader;
    }
};

osg.ShaderGenerator.create = function ()
{
    var sg = new osg.ShaderGenerator();
    sg.cache = [];
    return sg;
};


osg.State = function () {
    this.shaderGeneratorAttributes = {};
    this.currentVBO = null;
    this.vertexAttribList = [];
    this.programs = osg.Stack.create();
    this.stateSets = osg.Stack.create();
    this.uniforms = {};

    this.textureAttributeMapList = [];

    this.attributeMap = {};
    this.modeMap = {};

    this.shaderGenerator = osg.ShaderGenerator.create();

    this.modelViewMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "ModelViewMatrix");
    this.projectionMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "ProjectionMatrix");
    this.normalMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "NormalMatrix");

};

osg.State.prototype = {

    applyModelViewAndProjectionMatrix: function(modelview, projection) {
        this.modelViewMatrix.set(modelview);
        this.projectionMatrix.set(projection);

        var normal = osg.Matrix.copy(modelview);
        osg.Matrix.setTrans(normal, 0,0,0);
        osg.Matrix.inverse(normal, normal);
        this.normalMatrix.set(normal);
        this.getLastProgramApplied();
    },

    pushStateSet: function(stateset) {
        this.stateSets.push(stateset);

        if (stateset.attributeMap) {
            this.pushAttributeMap(this.attributeMap, stateset.attributeMap);
        }
        if (stateset.textureAttributeMapList) {
            var list = stateset.textureAttributeMapList;
            for (var textureUnit = 0; textureUnit < list.length; textureUnit++)
            {
                if (list[textureUnit] === undefined) {
                    continue;
                }
                if (!this.textureAttributeMapList[textureUnit]) {
                    this.textureAttributeMapList[textureUnit] = {};
                }
                this.pushAttributeMap(this.textureAttributeMapList[textureUnit], list[textureUnit]);
            }
        }

        if (stateset.uniforms) {
            this.pushUniformsList(this.uniforms, stateset.uniforms);
        }
    },

    applyStateSet: function(stateset) {
        this.pushStateSet(stateset);
        this.apply();
        this.popStateSet();
    },

    popStateSet: function() {
        var stateset = this.stateSets.pop();
        if (stateset.program) {
            this.programs.pop();
        }
        if (stateset.attributeMap) {
            this.popAttributeMap(this.attributeMap, stateset.attributeMap);
        }
        if (stateset.textureAttributeMapList) {
            var list = stateset.textureAttributeMapList;
            for (var textureUnit = 0; textureUnit < list.length; textureUnit++)
            {
                if (list[textureUnit] === undefined) {
                    continue;
                }
                this.popAttributeMap(this.textureAttributeMapList[textureUnit], list[textureUnit]);
            }
        }

        if (stateset.uniforms) {
            this.popUniformsList(this.uniforms, stateset.uniforms);
        }
    },

    getLastProgramApplied: function() {
        return this.programs.lastApplied;
    },

    pushGeneratedProgram: function() {
        var program;
        if (this.attributeMap.Program !== undefined) {
            program = this.attributeMap.Program.back();
            if (program !== undefined) {
                this.programs.push(program);
                return program;
            }
        }

        var attributes = {
            'textureAttributeMapList': this.textureAttributeMapList,
            'attributeMap': this.attributeMap
        };

        program = this.shaderGenerator.getOrCreateProgram(attributes);
        this.programs.push(program);
        return program;
    },

    popGeneratedProgram: function() {
        this.programs.pop();
    },

    apply: function() {
        this.applyAttributeMap(this.attributeMap);
        this.applyTextureAttributeMapList(this.textureAttributeMapList);

        this.pushGeneratedProgram();
        var program = this.programs.back();
        if (this.programs.lastApplied !== program) {
            program.apply(this);
            this.programs.lastApplied = program;
        }

        // note that about TextureAttribute that need uniform on unit we would need to improve
        // the current uniformList ...
        var uniformList = this.collectUniformsAppliedAttributes(this.shaderGeneratorAttributes);
        this.applyUniformList(this.uniforms, uniformList);
    },

    collectUniformsAppliedAttributes: function(shaderAttributeMap) {
        var uniforms = {};
        jQuery.each(shaderAttributeMap, function(key, attribute) {
                        if (attribute.getOrCreateUniforms !== undefined) {
                            jQuery.each(attribute.getOrCreateUniforms(), function(key, uniform) {
                                            uniforms[uniform.name] = uniform;
                                        }
                                       );
                        }
                    }
                   );
        return uniforms;
    },

    applyUniformList: function(uniformMap, uniformList) {

        var program = this.getLastProgramApplied();
        var programObject = program.program;
        var location;
        var uniformStack;
        var uniform;
        var uniformKeys = {};
        var key;

        var programUniforms = program.uniformsCache;
        for (uniformKey in programUniforms) {
            location = programUniforms[uniformKey];
            if (!location)
                continue;
            // get the one in the list
            uniform = uniformList[uniformKey];

            // not found ? check on the stack
            if (uniform === undefined) {
                uniformStack = uniformMap[uniformKey];
                if (uniformStack === undefined)
                    continue;
                if (uniformStack.length === 0) {
                    uniform = uniformStack.globalDefault;
                } else {
                    uniform = uniformStack.back();
                }
            }
            uniform.apply(programUniforms[uniformKey]);
        }
    },


    applyUniformList2: function(uniformMap, uniformList) {

        var program = this.getLastProgramApplied();
        var programObject = program.program;
        var location;
        var uniformStack;
        var uniform;
        var uniformKeys = {};
        var key;

        // should optimize this to apply directly if uniformList is undefined
        // ...

        // get the list of current map uniform
        for (key in uniformMap) {
            uniformStack = uniformMap[key];
            if (uniformStack.length === 0) {
                uniform = uniformStack.globalDefault;
            } else {
                uniform = uniformStack.back();
            }
            uniformKeys[key] = uniform;
        }

        // get the list of current list uniform
        if (uniformList !== undefined) {
            for (key in uniformList) {
                uniformKeys[key] = uniformList[key];
            }
        }

        //osg.log(uniformKeys);
        //if (programObject.uniforms !== undefined) {
//
  //      }

        for (key in uniformKeys) {
            //osg.log("key " + key);
            uniform = uniformKeys[key];
            location = gl.getUniformLocation(programObject, uniform.name);
            if (location === null || location === -1) {
                continue;
            }
            uniform.apply(location);
        }

    },

    applyAttribute: function (attribute) {
        var type = attribute.getTypeMember();
        this.applyAttributeToStack(attribute, this.attributeMap[type]);
    },

    applyAttributeToStack: function (attribute, attributeStack) {
        if (attributeStack === undefined) {
            attributeStack = osg.Stack.create();
            attributeStack.globalDefault = attribute.cloneType();
            this.attributeMap[type] = attributeStack;
        }

        if (attributeStack.lastApplied !== attribute) {
            if (attribute.apply) {
                attribute.apply(this);
                this.shaderGeneratorAttributes[attribute.getTypeMember()] = attribute;
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
        }
    },


    applyAttributeMap: function(attributeMap) {
        var that = this;
        jQuery.each(attributeMap, function(key, attributeStack) {
                        if (attributeStack === undefined) {
                            return;
                        }
                        var attribute;
                        if (attributeStack.length === 0) {
                            attribute = attributeStack.globalDefault;
                        } else {
                            attribute = attributeStack.back();
                        }

                        that.applyAttributeToStack(attribute, attributeStack);
                    }
                   );
    },

    pushUniformsList: function(uniformMap, uniformList) {
        var name;
        jQuery.each(uniformList, function(key, uniform) {
                        name = uniform.name;
                        if (uniformMap[name] === undefined) {
                            uniformMap[name] = osg.Stack.create();
                            uniformMap[name].globalDefault = uniform;
                        }
                        uniformMap[ name ].push(uniform);
                    }
                   );
    },
    popUniformsList: function(uniformMap, uniformList) {
        var uniform;
        var uniformLenght = uniformList.length;
        jQuery.each(uniformList, function(key, uniform) {
                        uniformMap[ key ].pop();
                        }
                   );
    },

    applyTextureAttributeMapList: function(textureAttributesMapList) {
        var textureAttributeMap;
        var operator = function(key, attributeStack) {
            if (attributeStack === undefined) {
                return;
            }
            var attribute;
            if (attributeStack.length === 0) {
                attribute = attributeStack.globalDefault;
            } else {
                attribute = attributeStack.back();
            }
            if (attributeStack.lastApplied !== attribute) {
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                attribute.apply(this.state);
                attributeStack.lastApplied = attribute;
            }
        };

        for (var textureUnit = 0; textureUnit < textureAttributesMapList.length; textureUnit++)
        {
            textureAttributeMap = textureAttributesMapList[textureUnit];
            if (textureAttributeMap === undefined) {
                continue;
            }
            jQuery.each(textureAttributeMap, operator);
        }
    },

    setGlobalDefaultValue: function(attribute) {
        var key = attribute.getTypeMember();
        if (this.attributeMap[key]) {
            this.attributeMap[key].globalDefault = attribute;
        } else {
            this.attributeMap[key] = osg.Stack.create();
            this.attributeMap[key].globalDefault = attribute;
        }
    },

    pushAttributeMap: function(attributeMap,  attributeList) {
        var attributeStack;
        jQuery.each(attributeList, function(type, attribute) {
                        if (attributeMap[type] === undefined) {
                            attributeMap[type] = osg.Stack.create();
                            attributeMap[type].globalDefault = attribute.cloneType();
                        }
                        attributeStack = attributeMap[type];
                        attributeStack.push(attribute);
                        attributeStack.asChanged = true;
                    }
                   );
    },

    popAttributeMap: function(attributeMap,  attributeList) {
        var attributeStack;
        jQuery.each(attributeList, function(type, attribute) {
                        attributeStack = attributeMap[type];
                        attributeStack.pop(attribute);
                        attributeStack.asChanged = true;
                    }
                   );
    },


    disableVertexAttribsExcept: function(indexList) {
        var that = indexList;
        var disableArray = this.vertexAttribList.filter(function (element, index, array) {
            return (that.indexOf(element) < 0 );
        });

        disableArray.forEach(function (element, index, array) {
            gl.disableVertexAttribArray(element);
        });

        this.vertexAttribList = indexList;
    },


    applyTexture10: function(unit, texture) {
        // todo: check if it's used ?
        if (this.currentVBO !== array) {
            if (!array.buffer) {
                array.init();
            }
            gl.bindBuffer(array.type, array.buffer);
            this.currentVBO = array;
        }
        if (array.dirty) {
            array.compile();
        }
        this.vertexAttribList.push(attrib);
        gl.enableVertexAttribArray(attrib);
        gl.vertexAttribPointer(attrib, array.itemSize, gl.FLOAT, normalize, 0, 0);
    },

    setIndexArray: function(array) {
        if (this.currentIndexVBO !== array) {
            if (!array.buffer) {
                array.init();
            }
            gl.bindBuffer(array.type, array.buffer);
            this.currentIndexVBO = array;
        }
        if (array.dirty) {
            array.compile();
        }
    },

    setVertexAttribArray: function(attrib, array, normalize) {
        if (!array.buffer) {
            array.init();
        }
        gl.bindBuffer(array.type, array.buffer);
        // it does not seems interesting to check the current vbo binded
        // if (this.currentVBO !== array) {
        //     if (!array.buffer) {
        //         array.init();
        //     }
        //     gl.bindBuffer(array.type, array.buffer);
        //     this.currentVBO = array;
        // }
        if (array.dirty) {
            array.compile();
        }
        this.vertexAttribList.push(attrib);
        gl.enableVertexAttribArray(attrib);
        gl.vertexAttribPointer(attrib, array.itemSize, gl.FLOAT, normalize, 0, 0);
    },
    getUniformMap: function() { return this.uniforms; }

};

osg.State.create = function() {
    var state = new osg.State();
    //gl.hint(gl.NICEST, gl.GENERATE_MIPMAP_HINT);
    return state;
};


osg.StateSet = function () { this.id = osg.instance++; }
osg.StateSet.prototype = {
    addUniform: function (uniform) {
        if (!this.uniforms) {
            this.uniforms = {};
        }
        this.uniforms[uniform.name] = uniform;
    },
    getUniformMap: function () {
        return this.uniforms;
    },
    setTextureAttribute: function (unit, attribute) {
        if (!this.textureAttributeMapList) {
            this.textureAttributeMapList = [];
        }
        if (this.textureAttributeMapList[unit] === undefined) {
            this.textureAttributeMapList[unit] = {};
        }
        this.textureAttributeMapList[unit][attribute.getTypeMember()] = attribute;
    },
    setTexture: function(unit, attribute) {
        this.setTextureAttribute(unit,attribute);
    },

    setAttributeAndMode: function(a) { this.setAttribute(a); },
    setAttribute: function (attribute) {
        if (!this.attributeMap) {
            this.attributeMap = {};
        }
        this.attributeMap[attribute.getTypeMember()] = attribute;
    },
    getAttributeMap: function() { return this.attributeMap; }
};

osg.StateSet.create = function() {
    var ss = new osg.StateSet();
    return ss;
};

osg.Node = function () {
    this.children = [];
}
osg.Node.prototype = {
    getOrCreateStateSet: function() {
        if (this.stateset === undefined) {
            this.stateset = new osg.StateSet();
        }
        return this.stateset;
    },
    getStateSet: function() { return this.stateset; },
    accept: function(nv) { 
        if (this.nodeMask === undefined) 
            nv.apply(this);
        else if (nv.validNodeMask(this)) {
            nv.apply(this);
        } 
    },
    setNodeMask: function(mask) { this.nodeMask = mask; }, 
    getNodeMask: function(mask) { return this.nodeMask; },
    setStateSet: function(s) { this.stateset = s; },
    setUpdateCallback: function(cb) { this.updateCallback = cb; },
    getUpdateCallback: function() { return this.updateCallback; },
    setName: function(name) { this.name = name; },
    getName: function() { return this.name; },
    addChild: function (child) { return this.children.push(child); },
    getChildren: function() { return this.children; },
    removeChildren: function () { this.children.length = 0; },
    
    removeChild: function (child) {
        var l = this.children.length;
        for (var i = 0; i < l; i++) {
            if (this.children[i] === child) {
                if (i != l-1) {
                    this.children[i] = this.children[l-1];
                    this.children.pop();
                } else {
                    this.children.pop();
                }
            }
        }
    },

    traverseOld: function (visitor) {
        var l = this.children.length;
        for (var i = 0; i < l; i++) {
            var child = this.children[i];
            if (child.nodeMask !== undefined)
                child.accept(visitor);
            else
                visitor.apply(child);
        }
    },
    traverse: function (visitor) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            var child = this.children[i];
            if (child.nodeMask !== undefined)
                child.accept(visitor);
            else
                visitor.apply(child);
        }
    }
};
osg.Node.create = function() {
    var node = new osg.Node();
    return node;
};

osg.MatrixTransform = function() {
    osg.Node.call(this);
    this.matrix = osg.Matrix.makeIdentity();
};
osg.MatrixTransform.prototype = osg.objectInehrit(osg.Node.prototype, {
    getMatrix: function() { return this.matrix; },
    setMatrix: function(m) { this.matrix = m; }
});
osg.MatrixTransform.create = function() {
    var mt = new osg.MatrixTransform();
    return mt;
};


osg.Projection = function () {
    osg.Node.call(this);
    this.projection = osg.Matrix.makeIdentity();
};
osg.Projection.prototype = osg.objectInehrit(osg.Node.prototype, {
    getProjectionMatrix: function() { return this.projection; },
    setProjectionMatrix: function(m) { this.projection = m; }
});
osg.Projection.create = function() {
    var p = new osg.Projection;
    return p;
};



osg.Texture = function() {
    this.mag_filter = gl.LINEAR;
    this.min_filter = gl.LINEAR_MIPMAP_NEAREST;
    this.wrap_s = gl.REPEAT;
    this.wrap_t = gl.REPEAT;
};

osg.Texture.prototype = {
    attributeType: "Texture",
    cloneType: function() { var t = osg.Texture.create(undefined); t.default_type = true; return t;},
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType; },

    init: function() {
        if (!this.textureObject) {
            this.textureObject = gl.createTexture();
            this.dirty = true;
        }
    },
    setWrapS: function(value) {
        this.wrap_s = value;
    },
    setWrapT: function(value) {
        this.wrap_t = value;
    },

    setMinFilter: function(value) {
        this.min_filter = value;
    },
    setMagFilter: function(value) {
        this.mag_filter = value;
    },

    setImage: function(img) {
        this.image = img;
        this.dirty = true;
    },

    setFromCanvas: function(canvas) {
        this.init();
        gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        this.applyFilterParameter();
        this.dirty = false;
    },

    compile: function() {
        var image = this.image;
        if (image && image.complete) {
            if (typeof image.naturalWidth !== "undefined" &&  image.naturalWidth === 0) {
                return;
            }
            //gl.texImage2D(gl.TEXTURE_2D, 0, this.image, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            this.applyFilterParameter();
            this.dirty = false;
        }
    },

    applyFilterParameter: function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.mag_filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.min_filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrap_s);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrap_t);
        if (this.min_filter === gl.NEAREST_MIPMAP_NEAREST ||
            this.min_filter === gl.LINEAR_MIPMAP_NEAREST ||
            this.min_filter === gl.NEAREST_MIPMAP_LINEAR ||
            this.min_filter === gl.LINEAR_MIPMAP_LINEAR) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    },

    apply: function(state) {
        if (!this.textureObject && this.image) {
            this.init();
        }
        if (!this.textureObject) {
            gl.bindTexture(gl.TEXTURE_2D, null);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
            if (this.dirty) {
                this.compile();
            }
        }
    },

    writeToShader: function(unit, type)
    {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str = "attribute vec2 TexCoord"+unit+";\n";
            str += "varying vec2 FragTexCoord"+unit+";\n";
            break;
        case osg.ShaderGeneratorType.VertexMain:
            str = "FragTexCoord"+unit+" = TexCoord" + unit + ";\n";
            break;
        case osg.ShaderGeneratorType.FragmentInit:
            str = "varying vec2 FragTexCoord" + unit +";\n";
            str += "uniform sampler2D TexUnit" + unit +";\n";
            str += "vec4 texColor" + unit + ";\n";
            break;
        case osg.ShaderGeneratorType.FragmentMain:
            str = "texColor" + unit + " = texture2D( TexUnit" + unit + ", FragTexCoord" + unit + ".xy );\n";
            break;
        }
        return str;
    }

};

osg.Texture.create = function(imageSource) {
    var a = new osg.Texture();
    a.dirty = true;
    if (imageSource !== undefined) {
        var img = new Image();
        img.src = imageSource;
        a.setImage(img);
    }
    return a;
};
osg.Texture.createFromImg = function(img) {
    var a = new osg.Texture();
    a.dirty = true;
    a.setImage(img);
    return a;
};
osg.Texture.createFromCanvas = function(ctx) {
    var a = new osg.Texture();
    a.setFromCanvas(ctx);
    return a;
};


osg.BlendFunc = function (source, destination) {
    this.sourceFactor = gl.ONE;
    this.destinationFactor = gl.ZERO;
    if (source !== undefined) {
        this.sourceFactor = source;
    }
    if (destination !== undefined) {
        this.destinationFactor = destination;
    }
};
osg.BlendFunc.prototype = {
    attributeType: "BlendFunc",
    cloneType: function() {return new osg.BlendFunc(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state)
    {
        gl.blendFunc(this.sourceFactor, this.destinationFactor);
    }
};

osg.Material = function () {
    this.ambient = [ 0.2, 0.2, 0.2, 1.0 ];
    this.diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
    this.specular = [ 0.0, 0.0, 0.0, 1.0 ];
    this.emission = [ 0.0, 0.0, 0.0, 1.0 ];
    this.shininess = [0.0];
};
osg.Material.prototype = {
    attributeType: "Material",

    cloneType: function() {return new osg.Material(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    getOrCreateUniforms: function() {
        if (osg.Material.uniforms === undefined) {
            osg.Material.uniforms = { "ambient": osg.Uniform.createFloat4([ 0, 0, 0, 0], 'MaterialAmbient') ,
                                  "diffuse": osg.Uniform.createFloat4([ 0, 0, 0, 0], 'MaterialDiffuse') ,
                                  "specular": osg.Uniform.createFloat4([ 0, 0, 0, 0], 'MaterialSpecular') ,
                                  "emission": osg.Uniform.createFloat4([ 0, 0, 0, 0], 'MaterialEmission') ,
                                  "shininess": osg.Uniform.createFloat1([ 0], 'MaterialShininess')
                                };
        }
        return osg.Material.uniforms;
    },

    apply: function(state)
    {
        var uniforms = this.getOrCreateUniforms();
        uniforms.ambient.set(this.ambient);
        uniforms.diffuse.set(this.diffuse);
        uniforms.specular.set(this.specular);
        uniforms.emission.set(this.emission);
        uniforms.shininess.set(this.shininess);
    },

    writeToShader: function(type)
    {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str =  [ "uniform vec4 MaterialAmbient;",
                     "uniform vec4 MaterialDiffuse;",
                     "uniform vec4 MaterialSpecular;",
                     "uniform vec4 MaterialEmission;",
                     "uniform float MaterialShininess;",
                     "vec4 Ambient;",
                     "vec4 Diffuse;",
                     "vec4 Specular;",
                     ""].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            break;
        }
        return str;
    }
};
osg.Material.create = function() {
    var a = new osg.Material();
    return a;
};


osg.Light = function () {
    this.ambient = [ 0.2, 0.2, 0.2, 1.0 ];
    this.diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
    this.specular = [ 0.0, 0.0, 0.0, 1.0 ];
    this.direction = [ 0.0, 0.0, 1.0 ];
    this.constant_attenuation = 1.0;
    this.linear_attenuation = 1.0;
    this.quadratic_attenuation = 1.0;
    this.light_unit = 0;
    this.enabled = 0;

    this.ambient = [ 1.0, 1.0, 1.0, 1.0 ];
    this.diffuse = [ 1.0, 1.0, 1.0, 1.0 ];
    this.specular = [ 1.0, 1.0, 1.0, 1.0 ];
 };

osg.Light.prototype = {
    attributeType: "Light",
    cloneType: function() {return new osg.Light(); },
    getType: function() { return this.attributeType; },
    getTypeMember: function() { return this.attributeType + this.light_unit;},
    getOrCreateUniforms: function() {
        if (osg.Light.uniforms === undefined) {
            osg.Light.uniforms = {};
        }
        if (osg.Light.uniforms[this.getTypeMember()] === undefined) {
            osg.Light.uniforms[this.getTypeMember()] = { "ambient": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName("ambient")) ,
                                                     "diffuse": osg.Uniform.createFloat4([ 0.8, 0.8, 0.8, 1], this.getParameterName('diffuse')) ,
                                                     "specular": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName('specular')) ,
                                                     "direction": osg.Uniform.createFloat3([ 0, 0, 1], this.getParameterName('direction')),
                                                     "constant_attenuation": osg.Uniform.createFloat1( 0, this.getParameterName('constant_attenuation')),
                                                     "linear_attenuation": osg.Uniform.createFloat1( 0, this.getParameterName('linear_attenuation')),
                                                     "quadratic_attenuation": osg.Uniform.createFloat1( 0, this.getParameterName('quadratic_attenuation')),
                                                     "enable": osg.Uniform.createInt1( 0, this.getParameterName('enable')),
                                                     "matrix": osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), this.getParameterName('matrix'))
                                                   };
        }
        return osg.Light.uniforms[this.getTypeMember()];
    },

    getPrefix: function() {
        return this.getType() + this.light_unit;
    },

    getParameterName: function (name) {
        return this.getPrefix()+ "_" + name;
    },

    applyPositionedUniform: function(matrix, state) {
        var uniform = this.getOrCreateUniforms();
        uniform.matrix.set(matrix);
    },

    apply: function(state)
    {
        var light = this.getOrCreateUniforms();

        light.ambient.set(this.ambient);
        light.diffuse.set(this.diffuse);
        light.specular.set(this.specular);
        light.direction.set(this.direction);
        light.constant_attenuation.set([this.constant_attenuation]);
        light.linear_attenuation.set([this.linear_attenuation]);
        light.quadratic_attenuation.set([this.quadratic_attenuation]);
        light.enable.set([this.enable]);
    },

    writeShaderInstance: function(type) {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str = [ "",
                    "varying vec4 Color;",
                    "vec3 EyeVector;",
                    "vec3 NormalComputed;",
                    "",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexFunction:
            str = [ "",
                    "vec3 computeNormal() {",
                    "   return vec3(NormalMatrix * vec4(Normal, 0.0));",
                    "}",
                    "",
                    "vec3 computeEyeDirection() {",
                    "   return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
                    "}",
                    "",
                    "void directionalLight(in vec3 lightDirection, in vec3 lightHalfVector, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse,in vec4 specular, in vec3 normal)",
                    "{",
                    "   float nDotVP;         // normal . light direction",
                    "   float nDotHV;         // normal . light half vector",
                    "   float pf;             // power factor",
                    "",
                    "   nDotVP = max(0.0, dot(normal, normalize(lightDirection)));",
                    "   nDotHV = max(0.0, dot(normal, lightHalfVector));",
                    "",
                    "   if (nDotHV == 0.0)",
                    "   {",
                    "       pf = 0.0;",
                    "   }",
                    "   else",
                    "   {",
                    "       pf = pow(nDotHV, MaterialShininess);",
                    "   }",
                    "   Ambient  += ambient;",
                    "   Diffuse  += diffuse * nDotVP;",
                    "   Specular += specular * pf;",
                    "}",
                    "",
                    "void flight(in vec3 lightDirection, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse, in vec4 specular, in vec3 normal)",
                    "{",
                    "    vec4 localColor;",
                    "    vec3 lightHalfVector = normalize(EyeVector-lightDirection);",
                    "    // Clear the light intensity accumulators",
                    "    Ambient  = vec4 (0.0);",
                    "    Diffuse  = vec4 (0.0);",
                    "    Specular = vec4 (0.0);",
                    "",
                    "    directionalLight(lightDirection, lightHalfVector, constantAttenuation, linearAttenuation, quadraticAttenuation, ambient, diffuse, specular, normal);",
                    "",
                    "    vec4 sceneColor = vec4(0,0,0,0);",
                    "    localColor = sceneColor +",
                    "      MaterialEmission +",
                    "      Ambient  * MaterialAmbient +",
                    "      Diffuse  * MaterialDiffuse;",
                    "      //Specular * MaterialSpecular;",
                    "    localColor = clamp( localColor, 0.0, 1.0 );",
                    "    Color += localColor;",
                    "",
                    "}" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            str = [ "",
                    "EyeVector = computeEyeDirection();",
                    "NormalComputed = computeNormal();",
                    "Color = vec4(0,0,0,0);",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentInit:
            str = [ "varying vec4 Color;",
                    ""
                  ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentMain:
            str = [ "",
                    "fragColor *= Color;"
                  ].join('\n');
            break;
        }
        return str;
    },

    writeToShader: function(type)
    {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str = [ "",
                    "uniform bool " + this.getParameterName('enabled') + ";",
                    "uniform vec4 " + this.getParameterName('ambient') + ";",
                    "uniform vec4 " + this.getParameterName('diffuse') + ";",
                    "uniform vec4 " + this.getParameterName('specular') + ";",
                    "uniform vec3 " + this.getParameterName('direction') + ";",
                    "uniform float " + this.getParameterName('constantAttenuation') + ";",
                    "uniform float " + this.getParameterName('linearAttenuation') + ";",
                    "uniform float " + this.getParameterName('quadraticAttenuation') + ";",
                    "",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            var lightNameDirection = this.getParameterName('direction');
            var lightNameDirectionTmp = this.getParameterName('directionNormalized');
            var NdotL = this.getParameterName("NdotL");
            str = [ "",
                    "//if (" + this.getParameterName('enabled') + ") {",
                    "if (true) {",
                    "  vec3 " + lightNameDirectionTmp + " = normalize(" + lightNameDirection + ");",
                    "  float " + NdotL + " = max(dot(Normal, " + lightNameDirectionTmp + "), 0.0);",
                    "  flight(" +lightNameDirectionTmp +", "+ this.getParameterName("constantAttenuation") + ", " + this.getParameterName("linearAttenuation") + ", " + this.getParameterName("quadraticAttenuation") + ", " + this.getParameterName("ambient") + ", " + this.getParameterName("diffuse") + ", " + this.getParameterName("specular") + ", NormalComputed );",
                    "}",
                    "" ].join('\n');
            break;
        }
        return str;
    }
};

osg.Light.create = function() {
    var l = new osg.Light();
    return l;
};


osg.BufferArray = function () {};
osg.BufferArray.prototype = {
    init: function() {
        if (!this.buffer && this.elements.length > 0 ) {
            this.buffer = gl.createBuffer();
            this.buffer.itemSize = this.itemSize;
            this.buffer.numItems = this.elements.length / this.itemSize;
        }
    },
    setDirty: function() {
        this.dirty = true;
    },
    compile: function() {
        if (this.dirty) {
            gl.bufferData(this.type, this.elements, gl.STATIC_DRAW);
            this.dirty = false;
        }
    },
    getElements: function() { return this.elements;}
};

osg.BufferArray.create = function(type, elements, itemSize) {
    var a = new osg.BufferArray();
    a.itemSize = itemSize;
    a.type = type;
    if (a.type === gl.ELEMENT_ARRAY_BUFFER) {
        a.elements = new Uint16Array(elements);
    } else {
        a.elements = new Float32Array(elements);
    }
    a.dirty = true;
    return a;
};


osg.DrawArray = function () {}
osg.DrawArray.prototype = {
    draw: function(state) {
        gl.drawArrays(this.mode, this.first, this.count);
    },
    getMode: function() { return this.mode; },
    getCount: function() { return this.count; },
    getFirst: function() { return this.first; }
};
osg.DrawArray.create = function(mode, first, count) {
    var d = new osg.DrawArray();
    d.mode = mode;
    d.first = first;
    d.count = count;
    return d;
};



osg.DrawElements = function (mode, indices) {
    this.mode = gl.POINTS;
    if (mode !== undefined) {
        this.mode = mode;
    }

    this.count = 0;
    this.offset = 0;
    this.indices = indices;
    if (indices !== undefined) {
        this.count = indices.elements.length;
    }
};

osg.DrawElements.prototype = {
    getMode: function() { return this.mode; },
    draw: function(state) {
        if (this.count > this.indices.numItems || this.count < 0) {
            this.count = this.indices.numItems;
        }
        state.setIndexArray(this.indices);
        gl.drawElements(this.mode, this.count, gl.UNSIGNED_SHORT, this.offset );
    },
    getIndices: function() { return this.indices; },
    setFirst: function(val) { this.offset = val; },
    getFirst: function() { return this.offset;},
    setCount: function(val) { this.count = val;},
    getCount: function() { return this.count; }

};

osg.DrawElements.create = function(mode, indices) {
    var d = new osg.DrawElements(mode, indices);
    return d;
};


osg.Geometry = function () {
    osg.Node.call(this);
    this.primitives = [];
    this.attributes = {};
};

osg.Geometry.prototype = osg.objectInehrit(osg.Node.prototype, {
    getPrimitives: function() { return this.primitives; },
    getAttributes: function() { return this.attributes; },

    drawImplementation: function(state) {
        var program = state.getLastProgramApplied();
        var i;
        var attribute;
        var attributeList = [];
        var attributesCache = program.attributesCache;

        for (var key in attributesCache) {
            attribute = attributesCache[key];
            if (attribute !== undefined && attribute !== -1) {
                if (this.attributes[key] === undefined)
                    continue;
                attributeList.push(attribute);
                state.setVertexAttribArray(attribute, this.attributes[key], false);
            }
        }

        var primitives = this.primitives;
        var l;
        state.disableVertexAttribsExcept(attributeList);
        for (i = 0, l = primitives.length; i < l; ++i) {
            primitives[i].draw(state);
        }
    },

    drawImplementationObselete: function(state) {
        var program = state.getLastProgramApplied().program;
        var i;
        var attribute;
        var attributeList = [];

        for (var key in this.attributes) {
            attribute = gl.getAttribLocation(program, key);
            if (attribute !== -1) {
                attributeList.push(attribute);
                state.setVertexAttribArray(attribute, this.attributes[key], false);
            }
        }

        var primitives = this.primitives;
        var l;
        state.disableVertexAttribsExcept(attributeList);
        for (i = 0, l = primitives.length; i < l; ++i) {
            primitives[i].draw(state);
        }
    }
});
osg.Geometry.create = function() {
    var g = new osg.Geometry();
    return g;
};




osg.Viewport = function (x,y, w, h) {
    var xstart = x;
    var ystart = x;
    var width = w;
    var height = h;
    this.x = function() { return xstart; }
    this.y = function() { return ystart; }
    this.width = function() { return width; }
    this.height = function() { return height; }
    this.computeWindowMatrix = function() {
        var translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
        var scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
        var offset = osg.Matrix.makeTranslate(xstart,ystart,0.0);
        return osg.Matrix.mult(osg.Matrix.mult(translate, scale, translate), offset, offset);
    };
};

osg.RenderTargetImplementationType = {
    FRAME_BUFFER_OBJECT: 0,
    FRAME_BUFFER: 1
};

osg.Camera = function () {
    osg.Node.call(this);

    this.setViewport(new osg.Viewport(0, 0, 800, 600));
    this.setClearColor([0, 0, 0, 0]);
    //this.setClearMask(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.setViewMatrix(osg.Matrix.makeIdentity());
    this.setProjectionMatrix(osg.Matrix.makeIdentity());

    //this.getOrCreateStateSet().setAttributeAndMode(this.getViewport());

}

osg.Camera.prototype = osg.objectInehrit(osg.Node.prototype, {
    init: function() {
        this.renderTargetImplementation = RenderTargetImplementationType.FRAME_BUFFER;
    },

    addChild: function (child) {
        return this.children.push(child);
    },

    traverse: function (visitor) {
        var l = this.children.length;
        for (var i = 0; i < l; i++) {
            visitor.apply(this.children[i]);
        }
    },

    setViewport: function(vp) { this.viewport = vp; },
    getViewport: function() { return this.viewport; },

    setClearColor: function(color) {
        this.clearColor = color;
    },

    setClearMask: function(clearBits) {
        this.clearBits = clearBits;
    },

    setViewMatrix: function(matrix) {
        this.modelviewMatrix = matrix;
    },

    setProjectionMatrix: function(matrix) {
        this.projectionMatrix = matrix;
    },
    getViewMatrix: function() { return this.modelviewMatrix; },
    getProjectionMatrix: function() { return this.projectionMatrix; },
    setRenderTargetImplementation: function(implementation) {
        this.renderTargetImplementation = implementation;
    },

    setRenderTarget: function(target) {
        this.renderTarget = target;
    },

    attach: function(type) {

    },

    createFrameBufferObject: function(texture) {
        texture.apply(undefined); // apply to init the texture object
        var rttFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.textureObject, 0);

        rttFramebuffer.width = this.textureWidth;
        rttFramebuffer.height = this.textureHeight;

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return rttFramebuffer;
    }
});


osg.Camera.create = function() {
    var cam = new osg.Camera();
    return cam;
};










osg.NodeVisitor = function () {
    this.traversalMask = ~0x0;
    this.nodeMaskOverride = 0;
}
osg.NodeVisitor.prototype = {
    setTraversalMask: function(m) { this.traversalMask = m; },
    getTraversalMask: function() { return this.traversalMask; },
    validNodeMask: function(node) { 
        var nm = node.getNodeMask();
        return ((this.traversalMask & (this.nodeMaskOverride | nm)) !== 0);
    },
    apply: function ( node ) {
        this.traverse(node);
    },

    traverse: function ( node ) {
        if (node.traverse !== undefined) {
            node.traverse(this);
        }
    }
};
osg.NodeVisitor.create = function () {
    var nv = new osg.NodeVisitor();
    return nv;
};


osg.StateGraph = function () {}
osg.StateGraph.prototype = {
    findOrInsert: function (stateset)
    {
        var sg;
        if (!this.children[stateset.id]) {
            sg = osg.StateGraph.create();
            sg.parent = this;
            sg.depth = this.depth + 1;
            sg.stateset = stateset;
            this.children[stateset.id] = sg;
        } else {
            sg = this.children[stateset.id];
        }
        return sg;
    },
    moveStateGraph: function(state, sg_current, sg_new)
    {
        var stack;
        var i;
        var stackLength;
        if (sg_new === sg_current || sg_new === undefined) {
            return;
        }

        if (sg_current === undefined) {
            stack = [];
            // push stateset from sg_new to root, and apply
            // stateset from root to sg_new
            do {
                if (sg_new.stateset !== undefined) {
                    stack.push(sg_new.stateset);
                }
                sg_new = sg_new.parent;
            } while (sg_new);

            stack.reverse();
            stackLength = stack.length;
            for (i = 0; i < stackLength; ++i) {
                state.pushStateSet(stack[i]);
            }
            return;
        } else if (sg_current.parent === sg_new.parent) {
            // first handle the typical case which is two state groups
            // are neighbours.

            // state has changed so need to pop old state.
            if (sg_current.stateset !== undefined) {
                state.popStateSet();
            }
            // and push new state.
            if (sg_new.stateset !== undefined) {
                state.pushStateSet(sg_new.stateset);
            }
            return;
        }

        // need to pop back up to the same depth as the new state group.
        while (sg_current.depth > sg_new.depth)
        {
            if (sg_current.stateset !== undefined) {
                state.popStateSet();
            }
            sg_current = sg_current.parent;
        }

        // use return path to trace back steps to sg_new.
        stack = [];

        // need to pop back up to the same depth as the curr state group.
        while (sg_new.depth > sg_current.depth)
        {
            if (sg_new.stateset !== undefined) {
                stack.push(sg_new.stateset);
            }
            sg_new = sg_new.parent;
        }

        // now pop back up both parent paths until they agree.

        // DRT - 10/22/02
        // should be this to conform with above case where two StateGraph
        // nodes have the same parent
        while (sg_current !== sg_new)
        {
            if (sg_current.stateset !== undefined) {
                state.popStateSet();
            }
            sg_current = sg_current.parent;

            if (sg_new.stateset !== undefined) {
                stack.push(sg_new.stateset);
            }
            sg_new = sg_new.parent;
        }

        stack.reverse();
        stackLength = stack.length;
        for( i = 0; i < stackLength; ++i) {
            state.pushStateSet(stack[i]);
        }
    }
};
osg.StateGraph.create = function()
{
    var sg = new osg.StateGraph();
    sg.depth = 0;
    sg.children = {};
    sg.leafs = [];
    sg.stateset = undefined;
    sg.parent = undefined;
    return sg;
};


osg.RenderStage = function () {
    this.positionedAttribute = [];
    this.viewport = undefined;
    this.clearColor = [0,0,0,1];
    this.clearMask = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
    this.camera = undefined;
}
osg.RenderStage.prototype = {

    draw: function(state) {
        if (this.viewport === undefined && console !== undefined) {
            console.log("No viewport");
        }
        state.pushAttribute(this.viewport);
    },

    drawImplementation: function(state) {
    }
};
osg.RenderStage.create = function() {
    var r = new osg.RenderStage();
    return r;
};


osg.RenderBin = function (stateGraph) {
    this.leafs = [];
    this.stateGraph = stateGraph;
    this.positionedAttribute = [];
}
osg.RenderBin.prototype = {
    applyPositionedAttribute: function(state, positionedAttibutes) {
        // the idea is to set uniform 'globally' in uniform map.
        jQuery.each(positionedAttibutes, function(index, element) {
                        // add or set uniforms in state
                        var stateAttribute = element[1];
                        var matrix = element[0];
                        state.setGlobalDefaultValue(stateAttribute);
                        stateAttribute.applyPositionedUniform(matrix, state);
                    }
                   );
    },

    drawImplementation: function(state) {
        var stateList = this.stateGraph;
        var stackLength = stateList.length;
        var leafs = this.leafs;
        var leafsLength = this.leafs.length;
        var normalUniform;
        var modelViewUniform;
        var projectionUniform;
        var program;
        var stateset;
        var leaf;
        var previousLeaf;

        if (this.positionedAttribute) {
            this.applyPositionedAttribute(state, this.positionedAttribute);
        }

        for (var i = 0; i < leafsLength; i++) {
//            debugger;
            leaf = leafs[i];
            var push = false;
            if (previousLeaf !== undefined) {

                // apply state if required.
                var prev_rg = previousLeaf.parent;
                var prev_rg_parent = prev_rg.parent;
                var rg = leaf.parent;
                if (prev_rg_parent !== rg.parent)
                {
                    rg.moveStateGraph(state, prev_rg_parent, rg.parent);

                    // send state changes and matrix changes to OpenGL.
                    state.pushStateSet(rg.stateset);
                    push = true;
                }
                else if (rg !== prev_rg)
                {

                    // send state changes and matrix changes to OpenGL.
                    state.pushStateSet(rg.stateset);
                    push = true;
                }

            } else {
                leaf.parent.moveStateGraph(state, undefined, leaf.parent.parent);
                state.pushStateSet(leaf.parent.stateset);
                push = true;
            }

            if (push === true) {
                //state.pushGeneratedProgram();
                state.apply();
            }

            if (false ) {
            program = state.getLastProgramApplied().program;
            modelViewUniform = gl.getUniformLocation(program, state.modelViewMatrix.name);
            projectionUniform = gl.getUniformLocation(program, state.projectionMatrix.name);
            normalUniform = gl.getUniformLocation(program, state.normalMatrix.name);
            }

            program = state.getLastProgramApplied();
            modelViewUniform = program.uniformsCache[state.modelViewMatrix.name];
            projectionUniform = program.uniformsCache[state.projectionMatrix.name];
            normalUniform = program.uniformsCache[state.normalMatrix.name];

            if (modelViewUniform !== undefined && modelViewUniform !== null && modelViewUniform !== -1) {
                state.modelViewMatrix.set(leaf.modelview);
                state.modelViewMatrix.apply(modelViewUniform);
            }
            if (projectionUniform !== undefined && projectionUniform !== null && projectionUniform != -1) {
                state.projectionMatrix.set(leaf.projection);
                state.projectionMatrix.apply(projectionUniform);
            }
            if (normalUniform !== undefined && normalUniform !== null && normalUniform !== -1 ) {
                var normal = osg.Matrix.copy(leaf.modelview);
                osg.Matrix.setTrans(normal, 0, 0, 0);
                osg.Matrix.inverse(normal, normal);
                osg.Matrix.transpose(normal, normal);
                state.normalMatrix.set(normal);
                state.normalMatrix.apply(normalUniform);
            }

            leaf.geometry.drawImplementation(state);

            if (push === true) {
                state.popGeneratedProgram();
                state.popStateSet();
            }

            previousLeaf = leaf;
        }
    }
};

osg.FrameStamp = function() {
    var frame = 0;
    var startSimulation = 0.0;
    var currentSimulation = 0.0;
    
    this.setReferenceTime = function(s) { startSimulation = s; };
    this.setSimulationTime = function(s) { currentSimulation = s; };
    this.getReferenceTime = function() { return startSimulation; };
    this.getSimulationTime = function() { return currentSimulation; };
    this.setFrameNumber = function(n) { frame = n; };
    this.getFrameNumber = function() { return frame; };
};

osg.UpdateVisitor = function () { 
    osg.NodeVisitor.call(this);
    var framestamp = new osg.FrameStamp();
    this.getFrameStamp = function() { return framestamp; };
    this.setFrameStamp = function(s) { framestamp = s; };
};
osg.UpdateVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    apply: function(node) {
        if (node.getUpdateCallback !== undefined) {
            var cb = node.getUpdateCallback();
            if (cb !== undefined) {
                cb.update(node, this);
                return;
            }
        }
        if (node.traverse) {
            this.traverse(node);
        }
    }
});


osg.CullVisitor = function () {
    osg.NodeVisitor.call(this);
    this.modelviewMatrixStack = [osg.Matrix.makeIdentity()];
    this.projectionMatrixStack = [osg.Matrix.makeIdentity()];
    this.stateGraph = osg.StateGraph.create();
    this.stateGraph.stateset = osg.StateSet.create();
    this.currentStateGraph = this.stateGraph;
    this.renderBin = new osg.RenderBin(this.stateGraph);
};
osg.CullVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    // should reuse object
    reset: function () {
        this.modelviewMatrixStack.length = 1;
        this.projectionMatrixStack.length = 1;
        this.stateGraph = osg.StateGraph.create();
        this.stateGraph.stateset = osg.StateSet.create();
        this.currentStateGraph = this.stateGraph;
        this.renderBin = new osg.RenderBin(this.stateGraph);
    },
    addPositionedAttribute: function (attribute) {
        var sg = this.stateGraph;
        while (sg.parent !== undefined) {
            sg = sg.parent;
        }
        var matrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length - 1];
        this.renderBin.positionedAttribute.push([matrix, attribute]);
    },
    pushStateSet: function (stateset) {
        this.currentStateGraph = this.currentStateGraph.findOrInsert(stateset);
    },
    popStateSet: function () {
        this.currentStateGraph = this.currentStateGraph.parent;
    },
    pushModelviewMatrix: function (matrix) {
        var computeMatrix;
        var lastMatrix;
        lastMatrix = osg.Matrix.copy(this.modelviewMatrixStack[this.modelviewMatrixStack.length-1]);
        // need to check order
        computeMatrix = osg.Matrix.mult(matrix, lastMatrix);
        this.modelviewMatrixStack.push(computeMatrix);
    },
    popModelviewMatrix: function () {
        this.modelviewMatrixStack.pop();
    },
    pushProjectionMatrix: function (matrix) {
        var computeMatrix;
        var lastMatrix;
        lastMatrix = osg.Matrix.copy(this.projectionMatrixStack[this.projectionMatrixStack.length-1]);
        // need to check order
        computeMatrix = osg.Matrix.mult(matrix, lastMatrix);
        this.projectionMatrixStack.push(computeMatrix);
    },
    popProjectionMatrix: function () {
        this.projectionMatrixStack.pop();
    },
    apply: function( node ) {
        if (node.getMatrix) {
            this.pushModelviewMatrix(node.getMatrix());
        } else if (node.getViewMatrix) {
            this.pushModelviewMatrix(node.getViewMatrix());
        }

        if (node.getProjectionMatrix) {
            this.pushProjectionMatrix(node.getProjectionMatrix());
        }

        if (node.stateset) {
            this.pushStateSet(node.stateset);
        }
        if (node.light) {
            this.addPositionedAttribute(node.light);
        }
        if (node.drawImplementation) {
            var leafs = this.renderBin.leafs;
            leafs.push(
                {
                    "parent": this.currentStateGraph,
                    "modelview": this.modelviewMatrixStack[this.modelviewMatrixStack.length-1],
                    "projection": this.projectionMatrixStack[this.projectionMatrixStack.length-1],
                    "geometry": node
                }
            );
        }

        if (node.traverse) {
            this.traverse(node);
        }

        if (node.stateset) {
            this.popStateSet();
        }

        if (node.getMatrix || node.getViewMatrix !== undefined) {
            this.popModelviewMatrix();
        }
        if (node.getProjectionMatrix !== undefined) {
            this.popProjectionMatrix();
        }
    }
});

osg.ParseSceneGraph = function (node)
{
    var newnode;
    if (node.primitives) {
        newnode = osg.Geometry.create();
        jQuery.extend(newnode, node);
        node = newnode;

        var i;
        for ( i in node.primitives) {
            if (node.primitives[i].indices) {
                var array = node.primitives[i].indices;
                array = osg.BufferArray.create(gl[array.type], array.elements, array.itemSize );
                var mode;
                if (!node.primitives[i].mode) {
                    mode = gl.TRIANGLES;
                } else {
                    mode = gl[node.primitives[i].mode];
                }
                node.primitives[i] = osg.DrawElements.create(mode, array);
            }
        }
    }


    if (node.attributes) {
        jQuery.each(node.attributes, function( key, element) {
            var attributeArray = node.attributes[key];
            node.attributes[key] = osg.BufferArray.create(gl[attributeArray.type], attributeArray.elements, attributeArray.itemSize );
        }
                   );
    }

    if (node.stateset) {
        var newstateset = new osg.StateSet();
        if (node.stateset.textures) {
            var textures = node.stateset.textures;
            for (var t = 0; t < textures.length; t++) {
                if (textures[t] === undefined) {
                    continue;
                }
                if (!textures[t].file) {
                    if (console !== undefined) {
                        console.log("no 'file' field for texture " + textures[t]);
                    }
                }
                var tex = osg.Texture.create(textures[t].file);
                newstateset.setTexture(t, tex);
                newstateset.addUniform(osg.Uniform.createInt1(t,"TexUnit" + t));
            }
        }
        if (node.stateset.material) {
            var material = node.stateset.material;
            var newmaterial = osg.Material.create();
            jQuery.extend(newmaterial, material);
            newstateset.setAttribute(newmaterial);
        }
        node.stateset = newstateset;
    }

    if (node.matrix) {
        newnode = new osg.MatrixTransform();
        jQuery.extend(newnode, node);
        newnode.setMatrix(osg.Matrix.copy(node.matrix));
        node = newnode;
    }

    if (node.projection) {
        newnode = new osg.Projection();
        jQuery.extend(newnode, node);
        newnode.setProjectionMatrix(osg.Matrix.copy(node.projection));
        node = newnode;
    }

    if (node.children) {
        newnode = new osg.Node();
        jQuery.extend(newnode, node);
        node = newnode;

        var child;
        var childLength = node.children.length;
        for (child = 0; child < childLength; child++) {
            node.children[child] = osg.ParseSceneGraph(node.children[child]);
        }
    }

    return node;
}


osg.View = function() { osg.Camera.call(this); };
osg.View.prototype = osg.objectInehrit(osg.Camera.prototype, {
    computeIntersections: function (x, y, traversalMask) {
        if (traversalMask === undefined) {
            traversalMask = ~0;
        }
        
        var iv = new osgUtil.IntersectVisitor();
        iv.setTraversalMask(traversalMask);
        iv.addLineSegment([x,y,0.0], [x,y,1.0]);
        iv.apply(this);
        return iv.hits;
    }
});


osg.createTexuredQuad = function(cornerx, cornery, cornerz,
                                  wx, wy, wz,
                                  hx, hy, hz,
                                  s,t) {

    var g = new osg.Geometry();

    var vertexes = [];
    vertexes[0] = cornerx + hx;
    vertexes[1] = cornery + hy;
    vertexes[2] = cornerz + hz;

    vertexes[3] = cornerx;
    vertexes[4] = cornery;
    vertexes[5] = cornerz;

    vertexes[6] = cornerx + wx;
    vertexes[7] = cornery + wy;
    vertexes[8] = cornerz + wz;

    vertexes[9] =  cornerx + wx + hx;
    vertexes[10] = cornery + wy + hy;
    vertexes[11] = cornerz + wz + hz;

    if (s === undefined)
        s = 1.0;
    if (t === undefined)
        t = 1.0;

    var uvs = [];
    uvs[0] = 0;
    uvs[1] = t;

    uvs[2] = 0;
    uvs[3] = 0;

    uvs[4] = s;
    uvs[5] = 0;

    uvs[6] = s;
    uvs[7] = t;

    var n = osg.Vec3.cross([wx,wy,wz], [hx, hy, hz]);
    var normal = [];
    normal[0] = n[0];
    normal[1] = n[1];
    normal[2] = n[2];

    normal[3] = n[0];
    normal[4] = n[1];
    normal[5] = n[2];

    normal[6] = n[0];
    normal[7] = n[1];
    normal[8] = n[2];

    normal[9] = n[0];
    normal[10] = n[1];
    normal[11] = n[2];


    var indexes = [];
    indexes[0] = 0;
    indexes[1] = 1;
    indexes[2] = 2;
    indexes[3] = 0;
    indexes[4] = 2;
    indexes[5] = 3;

    g.getAttributes().Vertex = osg.BufferArray.create(gl.ARRAY_BUFFER, vertexes, 3 );
    g.getAttributes().Normal = osg.BufferArray.create(gl.ARRAY_BUFFER, normal, 3 );
    g.getAttributes().TexCoord0 = osg.BufferArray.create(gl.ARRAY_BUFFER, uvs, 2 );
    
    var primitive = new osg.DrawElements(gl.TRIANGLES, osg.BufferArray.create(gl.ELEMENT_ARRAY_BUFFER, indexes, 1 ));
    g.getPrimitives().push(primitive);
    return g;
};