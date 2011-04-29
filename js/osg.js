/** -*- compile-command: "jslint-cli osg.js" -*-
 *
 *  Copyright (C) 1998-2006 Robert Osfield - OpenSceneGraph
 *  Copyright (C) 2010-2011 Cedric Pinson
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
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */
var gl;
var osg = {};

osg.version = '0.0.3';
osg.copyright = 'Cedric Pinson - cedric.pinson@plopbyte.com';
osg.instance = 0;
osg.version = 0;
osg.log = function(str) {
    if (window.console !== undefined) {
        window.console.log(str);
    } else {
        jQuery("#debug").append(str + "<br>");
    }
};
osg.reportErrorGL = false;

osg.init = function() {
    if (Float32Array.set === undefined) {
        Float32Array.prototype.set = function(array) {
            for (var i = 0, l = array.length; i < l; ++i ) { // FF not traced maybe short
                this[i] = array[i];
            }
        };
    }
    if (Int32Array.set === undefined) {
        Int32Array.prototype.set = function(array) {
            for (var i = 0, l = array.length; i < l; ++i ) {
                this[i] = array[i];
            }
        };
    }
};

osg.checkError = function(error) {
    if (error === 0) {
        return;
    }
    if (error === 0x0500) {
        osg.log("detected error INVALID_ENUM");
    } else if (error === 0x0501) {
        osg.log("detected error INVALID_VALUE");
    } else if (error === 0x0502) {
        osg.log("detected error INVALID_OPERATION");
    } else if (error === 0x0505) {
        osg.log("detected error OUT_OF_MEMORY");
    } else if (error === 0x0506) {
        osg.log("detected error INVALID_FRAMEBUFFER_OPERATION");
    } else {
        osg.log("detected error UNKNOWN");
    }
};


osg.objectInehrit = function(base, extras) {
    function F(){}
    F.prototype = base;
    var obj = new F();
    if(extras)  {osg.objectMix(obj, extras, false); }
    return obj;
};
osg.objectMix = function(obj, properties, test){
    for (var key in properties) {
        if(!(test && obj[key])) { obj[key] = properties[key]; }
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

    set: function(matrix, row, col, value) {
        matrix[row * 4 + col] = value;
	return value;
    },

    get: function(matrix, row, col) {
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

    /* mult a,b means in math result = MatrixA * MatrixB */
    /* mult a,b is equivalent to preMult(a,b) */
    /* mult b,a is equivalent to postMult(a,b) */
    mult: function(a, b, r) {
        var t;
        if (r === a) {
            // pre mult
            t = [];
            for (var col = 0; col < 4; col++) {
                t[0] = osg.Matrix.innerProduct(b, a, 0, col);
                t[1] = osg.Matrix.innerProduct(b, a, 1, col);
                t[2] = osg.Matrix.innerProduct(b, a, 2, col);
                t[3] = osg.Matrix.innerProduct(b, a, 3, col);
                a[0 + col] = t[0];
                a[4 + col] = t[1];
                a[8 + col] = t[2];
                a[12 + col] = t[3];
            }
            return a;
            //return this.preMult(r, b);
        }
        if (r === b) {
            // post mult
            t = [];
            for (var row = 0; row < 4; row++) {
                t[0] = osg.Matrix.innerProduct(b, a, row, 0);
                t[1] = osg.Matrix.innerProduct(b, a, row, 1);
                t[2] = osg.Matrix.innerProduct(b, a, row, 2);
                t[3] = osg.Matrix.innerProduct(b, a, row, 3);
                this.setRow(b, row, t[0], t[1], t[2], t[3]);
            }
            return b;
            //return this.postMult(r, a);
        }
        if (r === undefined) {
            r = [];
        }

        var s00 = b[0];
        var s01 = b[1];
        var s02 = b[2];
        var s03 = b[3];
        var s10 = b[4];
        var s11 = b[5];
        var s12 = b[6];
        var s13 = b[7];
        var s20 = b[8];
        var s21 = b[9];
        var s22 = b[10];
        var s23 = b[11];
        var s30 = b[12];
        var s31 = b[13];
        var s32 = b[14];
        var s33 = b[15];

        var o00 = a[0];
        var o01 = a[1];
        var o02 = a[2];
        var o03 = a[3];
        var o10 = a[4];
        var o11 = a[5];
        var o12 = a[6];
        var o13 = a[7];
        var o20 = a[8];
        var o21 = a[9];
        var o22 = a[10];
        var o23 = a[11];
        var o30 = a[12];
        var o31 = a[13];
        var o32 = a[14];
        var o33 = a[15];

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

    makeLookAt: function(eye, center, up, result) {

        if (result === undefined) {
            result = [];
        }

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

        osg.Matrix.multTranslate(result, osg.Vec3.neg(eye), result);
        return result;
    },
    makeOrtho: function(left, right,
                        bottom, top,
                        zNear, zFar, result)
    {
        if (result === undefined) {
            result = [];
        }
        // note transpose of Matrix_implementation wr.t OpenGL documentation, since the OSG use post multiplication rather than pre.
        // we will change this convention later
        var tx = -(right+left)/(right-left);
        var ty = -(top+bottom)/(top-bottom);
        var tz = -(zFar+zNear)/(zFar-zNear);
        var row = osg.Matrix.setRow;
        row(result, 0, 2.0/(right-left),              0.0,               0.0, 0.0);
        row(result, 1,              0.0, 2.0/(top-bottom),               0.0, 0.0);
        row(result, 2,              0.0,              0.0, -2.0/(zFar-zNear), 0.0);
        row(result, 3,               tx,               ty,                tz, 1.0);
        return result;
    },

    getLookAt: function(matrix, eye, center, up, distance) {
        if (distance === undefined) {
            distance = 1.0;
        }
        var inv = osg.Matrix.inverse(matrix);
        osg.Matrix.transformVec3(inv, [0,0,0], eye);
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
        if (j===0)
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

    // result = Matrix M * Matrix Translate
    multTranslate: function(mat, translate, result) {
        if (result === undefined) {
            result = [];
        }
        if (result !== mat) {
            osg.Matrix.copy(mat, result);
        }

        var val;
        if (translate[0] !== 0.0) {
            val = translate[0];
            result[12] += val * mat[0];
            result[13] += val * mat[1];
            result[14] += val * mat[2];
            result[15] += val * mat[3];
        }

        if (translate[1] !== 0.0) {
            val = translate[1];
            result[12] += val * mat[4];
            result[13] += val * mat[5];
            result[14] += val * mat[6];
            result[15] += val * mat[7];
        }

        if (translate[2] !== 0.0) {
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

    transformVec3: function(matrix, vector, result) {
        var d = 1.0/(matrix[3] * vector[0] + matrix[7] * vector[1] + matrix[11] * vector[2] + matrix[15]); 
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
    },

    transformVec4: function(matrix, vector, result) {
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

    inverse: function(matrix, resultArg) {
        return this.inverse4x4(matrix,resultArg);
        // it's not working yet, need to debug inverse 4x3
/*
        if (matrix[3] === 0.0 && matrix[7] === 0.0 && matrix[11] === 0.0 && matrix[15] === 1.0) {
            return this.inverse4x3(matrix,resultArg);
        } else {
            return this.inverse4x4(matrix,resultArg);
        }
*/
    },

    /**
     *  if a result argument is given the return of the function is true or false
     *  depending if the matrix can be inverted, else if no result argument is given
     *  the return is identity if the matrix can not be inverted and the matrix overthise
     */
    inverse4x4: function(matrix, resultArg) {
        if (resultArg === undefined) {
            result = [];
        } else {
            result = resultArg;
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

        var d1 = (matrix[0] * t0 + matrix[4] * t1 + matrix[8] * t2 + matrix[12] * t3);
        if (Math.abs(d1) < 1e-5) {
            osg.log("Warning can't inverse matrix " + matrix);
            if (resultArg !== undefined) {
                return false;
            } else {
                osg.Matrix.makeIdentity(result);
            }
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

        result[0] = out_00;
        result[1] = out_01;
        result[2] = out_02;
        result[3] = out_03;
        result[4] = out_10;
        result[5] = out_11;
        result[6] = out_12;
        result[7] = out_13;
        result[8] = out_20;
        result[9] = out_21;
        result[10] = out_22;
        result[11] = out_23;
        result[12] = out_30;
        result[13] = out_31;
        result[14] = out_32;
        result[15] = out_33;

        if (resultArg !== undefined) {
            return true;
        }
        return result;
    },

    inverse4x3: function(matrix, resultArg) {
        if (resultArg === undefined) {
            result = [];
        } else {
            result = resultArg;
        }

        // _mat[0][0] = r11*r22 - r12*r21;
        result[0] = matrix[5] * matrix[10] - matrix[6] * matrix[9];

        // _mat[0][1] = r02*r21 - r01*r22;
        result[1] = matrix[2] * matrix[9] - matrix[1] * matrix[10];

        // _mat[0][2] = r01*r12 - r02*r11;
        result[2] = matrix[1] * matrix[6] - matrix[2] * matrix[5];

        var r00 = matrix[0];
        var r10 = matrix[4];
        var r20 = matrix[8];
        
        var one_over_det = 1.0/(r00*result[0] + r10*result[1] + r20*result[2]);
        r00 *= one_over_det; r10 *= one_over_det; r20 *= one_over_det;  // Saves on later computations

        result[0] *= one_over_det;
        result[1] *= one_over_det;
        result[2] *= one_over_det;
        result[3] = 0.0;

        result[4] = matrix[6]*r20 - r10*matrix[10]; // Have already been divided by det
        result[5] = r00*matrix[10] - matrix[2]*r20; // same
        result[6] = matrix[2]*r10 - r00*matrix[6]; // same
        result[7] = 0.0;

        result[8] = r10*matrix[9] - matrix[5]*r20; // Have already been divided by det
        result[9] = matrix[1]*r20 - r00*matrix[9]; // same
        result[10]= r00*matrix[5] - matrix[1]*r10; // same
        result[11]= 0.0;
        result[15]= 1.0;

        var d  = matrix[15];
        var d2 = d-1.0;
        var tx, ty, tz;
        if( d2*d2 > 1.0e-6 ) { // Involves perspective, so we must
            // compute the full inverse
            var TPinv = [];
            result[12] = result[13] = result[15] = 0.0;

            var a = matrix[3];
            var b = matrix[7];
            var c = matrix[11];
            var px = result[0] * a + result[1] * b + result[2]*c;
            var py = result[4] * a + result[5] * b + result[6]*c;
            var pz = result[8] * a + result[9] * b + result[10]*c;

            tx = matrix[12];
            ty = matrix[13];
            tz = matrix[14];
            var one_over_s  = 1.0/(d - (tx*px + ty*py + tz*pz));

            tx *= one_over_s; ty *= one_over_s; tz *= one_over_s;  // Reduces number of calculations later on
            // Compute inverse of trans*corr
            TPinv[0] = tx*px + 1.0;
            TPinv[1] = ty*px;
            TPinv[2] = tz*px;
            TPinv[3] = -px * one_over_s;
            TPinv[4] = tx*py;
            TPinv[5] = ty*py + 1.0;
            TPinv[6] = tz*py;
            TPinv[7] = -py * one_over_s;
            TPinv[8] = tx*pz;
            TPinv[9] = ty*pz;
            TPinv[10]= tz*pz + 1.0;
            TPinv[11]= -pz * one_over_s;
            TPinv[12]= -tx;
            TPinv[13]= -ty;
            TPinv[14]= -tz;
            TPinv[15]= one_over_s;
            
            this.mult(result, TPinv, result); // Finish computing full inverse of mat
        } else {

            tx = matrix[12]; ty = matrix[13]; tz = matrix[14];
            // Compute translation components of mat'
            result[12] = -(tx*result[0] + ty*result[4] + tz*result[8]);
            result[13] = -(tx*result[1] + ty*result[5] + tz*result[9]);
            result[14] = -(tx*result[2] + ty*result[6] + tz*result[10]);
        }

        if (resultArg !== undefined) {
            return true;
        }
        return result;
    },

    transpose: function(matrix, result) {
        if (result === undefined) {
            result = [];
        }
        var dst;
        var src;
        if (result === matrix) {
            dst = matrix;
            src = osg.Matrix.copy(matrix);
        } else {
            dst = result;
            src = matrix;

            dst[0] = src[0];
            dst[5] = src[5];
            dst[10] = src[10];
            dst[15] = src[15];
        }

        dst[1] = src[4];
        dst[2] = src[8];
        dst[3] = src[12];
        dst[4] = src[1];
        dst[6] = src[9];
        dst[7] = src[13];
        dst[8] = src[2];
        dst[9] = src[6];
        dst[11] = src[14];
        dst[12] = src[3];
        dst[13] = src[7];
        dst[14] = src[11];

        return dst;
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


osg.Vec2 = {
    copy: function(src, res) {
        if (res === undefined) {
            res = [];
        }
        res[0] = src[0];
        res[1] = src[1];
        return res;
    },

    valid: function(vec) {
        if (isNaN(vec[0])) {
            return false;
        }
        if (isNaN(vec[1])) {
            return false;
        }
        return true;
    },

    mult: function(vec, a, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = vec[0] * a;
        result[1] = vec[1] * a;
        return result;
    },

    length2: function(a) {
        return a[0]*a[0] + a[1]*a[1];
    },

    length: function(a) {
        return Math.sqrt( a[0]*a[0] + a[1]* a[1]);
    },

    normalize: function(a, result) {
        if (result === undefined) {
            result = [];
        }

        var norm = this.length2(a);
        if (norm > 0.0) {
            var inv = 1.0/Math.sqrt(norm);
            result[0] = a[0] * inv;
            result[1] = a[1] * inv;
        }
        return result;
    },

    dot: function(a, b) {
        return a[0]*b[0]+a[1]*b[1];
    },

    sub: function(a, b, r) {
        if (r === undefined) {
            r = [];
        }
        r[0] = a[0]-b[0];
        r[1] = a[1]-b[1];
        return r;
    },

    add: function(a, b, r) {
        if (r === undefined) {
            r = [];
        }
        r[0] = a[0]+b[0];
        r[1] = a[1]+b[1];
        return r;
    },

    neg: function(a, r) {
        if (r === undefined) {
            r = [];
        }
        r[0] = -a[0];
        r[1] = -a[1];
        return r;
    },

    lerp: function(t, a, b, r) {
        if (r === undefined) {
            r = [];
        }
        var tmp = 1.0-t;
        r[0] = a[0]*tmp + t*b[0];
        r[1] = a[1]*tmp + t*b[1];
        return r;
    }

};

osg.Vec3 = {
    copy: function(src, res) {
        if (res === undefined) {
            res = [];
        }
        res[0] = src[0];
        res[1] = src[1];
        res[2] = src[2];
        return res;
    },

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
        if (isNaN(vec[0])) {
            return false;
        }
        if (isNaN(vec[1])) {
            return false;
        }
        if (isNaN(vec[2])) {
            return false;
        }
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
            result = [];
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
        if (res === undefined) {
            res = [];
        }
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
        if (result === undefined) {
            result = [];
        }
        result[0] = a[0] - b[0];
        result[1] = a[1] - b[1];
        result[2] = a[2] - b[2];
        result[3] = a[3] - b[3];
        return result;
    },

    add: function(a, b, result) {
        if (result === undefined) {
            result = [];
        }
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
        if (result === undefined) {
            result = [];
        }
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

        if (result === undefined) {
            result = [];
        }
        result[0] = x * sinhalfangle * inversenorm;
        result[1] = y * sinhalfangle * inversenorm;
        result[2] = z * sinhalfangle * inversenorm;
        result[3] = coshalfangle;
        return result;
    },

    lerp: function(t, from, to, result){
        if (result === undefined) {
            result = [];
        }

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

        if (result === undefined) {
            result = [];
        }

        result[0] = from[0]*scale_from + quatTo[0]*scale_to;
        result[1] = from[1]*scale_from + quatTo[1]*scale_to;
        result[2] = from[2]*scale_from + quatTo[2]*scale_to;
        result[3] = from[3]*scale_from + quatTo[3]*scale_to;
        return result;
    },

    // we suppose to have unit quaternion
    conj: function(a, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = -a[0];
        result[1] = -a[1];
        result[2] = -a[2];
        result[3] = a[3];
        return result;
    },

    inverse: function(a, result) {
        if (result === undefined) {
            result = [];
        }
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
        if (result === undefined) {
            result = [];
        }

        result[0] =  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0];
        result[1] = -a[0] * b[2] + a[1] * b[3] + a[2] * b[0] + a[3] * b[1];
        result[2] =  a[0] * b[1] - a[1] * b[0] + a[2] * b[3] + a[3] * b[2];
        result[3] = -a[0] * b[0] - a[1] * b[1] - a[2] * b[2] + a[3] * b[3];
        return result;
    },
    div: function(a, b, result) {
        if (result === undefined) {
            result = [];
        }
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
        if (res === undefined) {
            res = [];
        }
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
        if (res === undefined) {
            res = [];
        }
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
        if (r === undefined) {
            r = [];
        }
        // first step
        var invq = this.inv(qcur);
        var qa,qb;

        this.mult(q2, invq, qa);
        this.ln(qa, qa);

        this.mult(q0, invq , qb);
        this.ln(qb, qb);

        this.add(qa, qb, qa);
        this.div(qa, -4.0, qa);
        this.exp(qa, qb);
        return this.mult(qb, q1, r);
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


osg.Uniform = function () { this.transpose = false;};
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


osg.Stack = function() {};
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

osg.Shader = function() {};
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
                for (var i = 0, l = splittedText.length; i < l; ++i ) {
                    newText += i + " " + splittedText[i] + "\n";
                }
                console.log(newText);
                console.log(gl.getShaderInfoLog(this.shader));
                //debugger;
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
                //debugger;
                return null;
            }

            this.uniformsCache = {};
            this.uniformsCache.uniformKeys = [];
            this.attributesCache = {};
            this.attributesCache.attributeKeys = [];

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
            for (var i in r) {
                var uniform = r[i].match(/uniform\s+\w+\s+(\w+)/)[1];
                var l = gl.getUniformLocation(this.program, uniform);
                if (l !== undefined && l !== null) {
                    if (this.uniformsCache[uniform] === undefined) {
                        this.uniformsCache[uniform] = l;
                        this.uniformsCache.uniformKeys.push(uniform);
                    }
                }
            }
        }
    },

    cacheAttributeList: function(str) {
        var r = str.match(/attribute\s+\w+\s+\w+/g);
        if (r !== null) {
            for (var i in r) {
                var attr = r[i].match(/attribute\s+\w+\s+(\w+)/)[1];
                var l = gl.getAttribLocation(this.program, attr);
                if (l !== -1 && l !== undefined) {
                    if (this.attributesCache[attr] === undefined) {
                        this.attributesCache[attr] = l;
                        this.attributesCache.attributeKeys.push(attr);
                    }
                }
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


osg.ShaderGenerator = function() {
    this.cache = [];
};
osg.ShaderGenerator.prototype = {

    getActiveTypeMember: function(state) {
        // we should check attribute is active or not
        var types = [];
        for (var j = 0, k = state.attributeMap.attributeKeys.length; j < k; j++) {
            var keya = state.attributeMap.attributeKeys[j];
            var attributeStack = state.attributeMap[keya];
            if (attributeStack.length === 0 && attributeStack.globalDefault.applyPositionedUniform === undefined) {
                continue;
            }
            if (attributeStack.globalDefault.getOrCreateUniforms !== undefined || attributeStack.globalDefault.writeToShader !== undefined) {
                types.push(keya);
            }
        }

        for (var i = 0, l = state.textureAttributeMapList.length; i < l; i++) {
            var attributesForUnit = state.textureAttributeMapList[i];
            if (attributesForUnit === undefined) {
                continue;
            }
            for (var h = 0, m = attributesForUnit.attributeKeys.length; h < m; h++) {
                var key = attributesForUnit.attributeKeys[h];
                var textureAttributeStack = attributesForUnit[key];
                if (textureAttributeStack.length === 0) {
                    continue;
                }
                if (textureAttributeStack.globalDefault.getOrCreateUniforms !== undefined || textureAttributeStack.globalDefault.writeToShader !== undefined) {
                    types.push(key+i);
                }
            }
        }
        return types;
    },

    getActiveAttributeMapKeys: function(state) {
        var keys = [];
        for (var j = 0, k = state.attributeMap.attributeKeys.length; j < k; j++) {
            var keya = state.attributeMap.attributeKeys[j];
            var attributeStack = state.attributeMap[keya];
            if (attributeStack.length === 0 && attributeStack.globalDefault.applyPositionedUniform === undefined) {
                continue;
            }
            if (attributeStack.globalDefault.getOrCreateUniforms !== undefined || attributeStack.globalDefault.writeToShader !== undefined) {
                keys.push(keya);
            }
        }
        return keys;
    },

    getActiveTextureAttributeMapKeys: function(state) {
        var textureAttributeKeys = [];
        for (var i = 0, l = state.textureAttributeMapList.length; i < l; i++) {
            var attributesForUnit = state.textureAttributeMapList[i];
            if (attributesForUnit === undefined) {
                continue;
            }
            textureAttributeKeys[i] = [];
            for (var j = 0, m = attributesForUnit.attributeKeys.length; j < m; j++) {
                var key = attributesForUnit.attributeKeys[j];
                var textureAttributeStack = attributesForUnit[key];
                if (textureAttributeStack.length === 0) {
                    continue;
                }
                if (textureAttributeStack.globalDefault.getOrCreateUniforms !== undefined || textureAttributeStack.globalDefault.writeToShader !== undefined) {
                    textureAttributeKeys[i].push(key);
                }
            }
        }
        return textureAttributeKeys;
    },

    getActiveUniforms: function(state, attributeKeys, textureAttributeKeys) {
        var uniforms = {};

        for (var i = 0, l = attributeKeys.length; i < l; i++) {
            var key = attributeKeys[i];

            if (state.attributeMap[key].globalDefault.getOrCreateUniforms === undefined) {
                continue;
            }
            var attributeUniforms = state.attributeMap[key].globalDefault.getOrCreateUniforms();
            for (var j = 0, m = attributeUniforms.uniformKeys.length; j < m; j++) {
                var name = attributeUniforms.uniformKeys[j];
                var uniform = attributeUniforms[name];
                uniforms[uniform.name] = uniform;
            }
        }

        for (var a = 0, n = textureAttributeKeys.length; a < n; a++) {
            var unitAttributekeys = textureAttributeKeys[a];
            if (unitAttributekeys === undefined) {
                continue;
            }
            for (var b = 0, o = unitAttributekeys.length; b < o; b++) {
                var attrName = unitAttributekeys[b];
                if (state.textureAttributeMapList[a][attrName].globalDefault === undefined) {
                    //debugger;
                }
                var textureAttribute = state.textureAttributeMapList[a][attrName].globalDefault;
                if (textureAttribute.getOrCreateUniforms === undefined) {
                    continue;
                }
                var texUniforms = textureAttribute.getOrCreateUniforms(a);
                for (var t = 0, tl = texUniforms.uniformKeys.length; t < tl; t++) {
                    var tname = texUniforms.uniformKeys[t];
                    var tuniform = texUniforms[tname];
                    uniforms[tuniform.name] = tuniform;
                }
            }
        }

        var keys = [];
        for (var ukey in uniforms) {
            keys.push(ukey);
        }
        uniforms.uniformKeys = keys;
        return uniforms;
    },

    getOrCreateProgram: function(state) {

        // first get trace of active attribute and texture attributes to check
        // if we already have generated a program for this configuration
        var flattenKeys = this.getActiveTypeMember(state);
        for (var i = 0, l = this.cache.length; i < l; ++i) {
            if (this.compareAttributeMap(flattenKeys, this.cache[i].flattenKeys) === 0) {
                return this.cache[i];
            }
        }

        // extract valid attributes keys with more details
        var attributeKeys = this.getActiveAttributeMapKeys(state);
        var textureAttributeKeys = this.getActiveTextureAttributeMapKeys(state);


        var vertexshader = this.getOrCreateVertexShader(state, attributeKeys, textureAttributeKeys);
        var fragmentshader = this.getOrCreateFragmentShader(state, attributeKeys, textureAttributeKeys);
        var program = osg.Program.create(
            osg.Shader.create(gl.VERTEX_SHADER, vertexshader),
            osg.Shader.create(gl.FRAGMENT_SHADER, fragmentshader));

        program.flattenKeys = flattenKeys;
        program.activeAttributeKeys = attributeKeys;
        program.activeTextureAttributeKeys = textureAttributeKeys;
        program.activeUniforms = this.getActiveUniforms(state, attributeKeys, textureAttributeKeys);
        program.generated = true;

        osg.log(program.vertex.text);
        osg.log(program.fragment.text);

        this.cache.push(program);
        return program;
    },

    compareAttributeMap: function(attributeKeys0, attributeKeys1) {
        var key;
        for (var i = 0, l = attributeKeys0.length; i < l; i++) {
            key = attributeKeys0[i];
            if (attributeKeys1.indexOf(key) === -1 ) {
                return 1;
            }
        }
        if (attributeKeys1.length !== attributeKeys0.length) {
            return -1;
        }
        return 0;
    },

    fillTextureShader: function (attributeMapList, validTextureAttributeKeys, mode) {
        var shader = "";
        var instanciedTypeShader = {};

        for (var i = 0, l = validTextureAttributeKeys.length; i < l; i++) {
            var attributeKeys = validTextureAttributeKeys[i];
            if (attributeKeys === undefined) {
                continue;
            }
            var attributes = attributeMapList[i];
            for (var j = 0, m = attributeKeys.length; j < m; j++) {
                var key = attributeKeys[j];

                var element = attributes[key].globalDefault;

                if (element.writeShaderInstance !== undefined && instanciedTypeShader[key] === undefined) {
                    shader += element.writeShaderInstance(i, mode);
                    instanciedTypeShader[key] = true;
                }

                if (element.writeToShader) {
                    shader += element.writeToShader(i, mode);
                }
            }
        }
        return shader;
    },

    fillShader: function (attributeMap, validAttributeKeys, mode) {
        var shader = "";
        var instanciedTypeShader = {};

        for (var j = 0, m = validAttributeKeys.length; j < m; j++) {
            var key = validAttributeKeys[j];
            var element = attributeMap[key].globalDefault;

            if (element.writeShaderInstance !== undefined && instanciedTypeShader[key] === undefined) {
                shader += element.writeShaderInstance(mode);
                instanciedTypeShader[key] = true;
            }

            if (element.writeToShader) {
                shader += element.writeToShader(mode);
            }
        }
        return shader;
    },

    getOrCreateVertexShader: function (state, validAttributeKeys, validTextureAttributeKeys) {
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


        shader += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);
        mode = osg.ShaderGeneratorType.VertexFunction;
        var func = [
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}"].join('\n');

        shader += func;
        shader += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);

        var body = [
            "",
            "void main(void) {",
            "gl_Position = ftransform();",
            ""
        ].join('\n');

        shader += body;

        mode = osg.ShaderGeneratorType.VertexMain;

        shader += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);

        shader += [
            "}",
            ""
        ].join('\n');

        return shader;
    },

    getOrCreateFragmentShader: function (state, validAttributeKeys, validTextureAttributeKeys) {
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

        shader += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);

        shader += [
            "void main(void) {",
            "fragColor = vec4(1.0, 1.0, 1.0, 1.0);",
            ""
        ].join('\n');

        mode = osg.ShaderGeneratorType.FragmentMain;
        if (validTextureAttributeKeys.length > 0) {
            var result = this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
            shader += result;

            for (i = 0, l = validTextureAttributeKeys.length; i < l; ++i) {
                if (validTextureAttributeKeys[i] === undefined) {
                    continue;
                }
                if (validTextureAttributeKeys[i].length === 0) {
                    continue;
                }
                var textureUnit = state.textureAttributeMapList[i];
                if (textureUnit.Texture !== undefined ) {
                    shader += "fragColor = fragColor * texColor" + i + ";\n";
                }
            }
        }
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);

        shader += [
            "",
            "gl_FragColor = fragColor;",
            "}"
        ].join('\n');

        return shader;
    }
};

osg.State = function () {
    this.currentVBO = null;
    this.vertexAttribList = [];
    this.programs = osg.Stack.create();
    this.stateSets = osg.Stack.create();
    this.uniforms = {};
    this.uniforms.uniformKeys = [];
    
    this.textureAttributeMapList = [];

    this.attributeMap = {};
    this.attributeMap.attributeKeys = [];

    this.modeMap = {};

    this.shaderGenerator = new osg.ShaderGenerator();

    this.modelViewMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "ModelViewMatrix");
    this.projectionMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "ProjectionMatrix");
    this.normalMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "NormalMatrix");


};

osg.State.prototype = {

    pushStateSet: function(stateset) {
        this.stateSets.push(stateset);

        if (stateset.attributeMap) {
            this.pushAttributeMap(this.attributeMap, stateset.attributeMap);
        }
        if (stateset.textureAttributeMapList) {
            var list = stateset.textureAttributeMapList;
            for (var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++)
            {
                if (list[textureUnit] === undefined) {
                    continue;
                }
                if (!this.textureAttributeMapList[textureUnit]) {
                    this.textureAttributeMapList[textureUnit] = {};
                    this.textureAttributeMapList[textureUnit].attributeKeys = [];
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
            for (var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++)
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

    applyAttribute: function(attribute) {
        var key = attribute.getTypeMember();
        var attributeStack = this.attributeMap[key];
        if (attributeStack === undefined) {
            attributeStack = osg.Stack.create();
            this.attributeMap[key] = attributeStack;
            this.attributeMap[key].globalDefault = attribute.cloneType();
            this.attributeMap.attributeKeys.push(key);
        }

        if (attributeStack.lastApplied !== attribute) {
            if (attribute.apply) {
                attribute.apply(this);
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
        }
    },
    applyTextureAttribute: function(unit, attribute) {
        var key = attribute.getTypeMember();

        if (!this.textureAttributeMapList[unit]) {
            this.textureAttributeMapList[unit] = {};
            this.textureAttributeMapList[unit].attributeKeys = [];
        }

        var attributeStack = this.textureAttributeMapList[unit][key];
        if (attributeStack === undefined) {
            attributeStack = osg.Stack.create();
            this.textureAttributeMapList[unit][key] = attributeStack;
            attributeStack.globalDefault = attribute.cloneType();
            this.textureAttributeMapList[unit].attributeKeys.push(key);
        }

        if (attributeStack.lastApplied !== attribute) {
            if (attribute.apply) {
                attribute.apply(this);
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
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

    applyWithoutProgram: function() {
        this.applyAttributeMap(this.attributeMap);
        this.applyTextureAttributeMapList(this.textureAttributeMapList);
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

	var programUniforms;
	var activeUniforms;
        var i;
        var key;
        if (program.generated !== undefined && program.generated === true) {
            // note that about TextureAttribute that need uniform on unit we would need to improve
            // the current uniformList ...

            programUniforms = program.uniformsCache;
            activeUniforms = program.activeUniforms;
            var regenrateKeys = false;
            for (i = 0 , l = activeUniforms.uniformKeys.length; i < l; i++) {
                var name = activeUniforms.uniformKeys[i];
                var location = programUniforms[name];
                if (location !== undefined) {
                    activeUniforms[name].apply(location);
                } else {
                    regenrateKeys = true;
                    delete activeUniforms[name];
                }
            }
            if (regenrateKeys) {
                var keys = [];
                for (key in activeUniforms) {
                    if (key !== "uniformKeys") {
                        keys.push(key);
                    }
                }
                activeUniforms.uniformKeys = keys;
            }
        } else {
            
            //this.applyUniformList(this.uniforms, {});

            // custom program so we will iterate on uniform from the program and apply them
            // but in order to be able to use Attribute in the state graph we will check if
            // our program want them. It must be defined by the user
            var programObject = program.program;
            var location1;
            var uniformStack;
            var uniform;

            programUniforms = program.uniformsCache;
            var uniformMap = this.uniforms;

            // first time we see attributes key, so we will keep a list of uniforms from attributes
            activeUniforms = [];
            var trackAttributes = program.trackAttributes;
            var trackUniforms = program.trackUniforms;
            var attribute;
            var uniforms;
            var a;
            // loop on wanted attributes and texture attribute to track state graph uniforms from those attributes
            if (trackAttributes !== undefined && trackUniforms === undefined) {
                var attributeKeys = program.trackAttributes.attributeKeys;
                for ( i = 0, l = attributeKeys.length; i < l; i++) {
                    key = attributeKeys[i];
                    attributeStack = this.attributeMap[key];
                    if (attributeStack === undefined) {
                        continue;
                    }
                    // we just need the uniform list and not the attribute itself
                    attribute = attributeStack.globalDefault;
                    if (attribute.getOrCreateUniforms === undefined) {
                        continue;
                    }
                    uniforms = attribute.getOrCreateUniforms();
                    for (a = 0, b = uniforms.uniformKeys.length; a < b; a++) {
                        activeUniforms.push(uniforms[uniforms.uniformKeys[a] ]);
                    }
                }

                var textureAttributeKeysList = program.trackAttributes.textureAttributeKeys;
                for (i = 0, l = textureAttributeKeysList.length; i < l; i++) {
                    var tak = textureAttributeKeysList[i];
                    if (tak === undefined) {
                        continue;
                    }
                    for (var j = 0, m = tak.length; j < m; j++) {
                        key = tak[j];
                        var attributeList = this.textureAttributeMapList[i];
                        if (attributeList === undefined) {
                            continue;
                        }
                        attributeStack = attributeList[key];
                        if (attributeStack === undefined) {
                            continue;
                        }
                        attribute = attributeStack.globalDefault;
                        if (attribute.getOrCreateUniforms === undefined) {
                            continue;
                        }
                        uniforms = attribute.getOrCreateUniforms(i);
                        for (a = 0, b = uniforms.uniformKeys.length; a < b; a++) {
                            activeUniforms.push(uniforms[uniforms.uniformKeys[a] ]);
                        }
                    }
                }

                // now we have a list on uniforms we want to track but we will filter them to use only what is needed by our program
                // not that if you create a uniforms whith the same name of a tracked attribute, and it will override it
                var uniformsFinal = {};
                for (i = 0, l = activeUniforms.length; i < l; i++) {
                    var u = activeUniforms[i];
                    var loc = gl.getUniformLocation(programObject, u.name);
                    if (loc !== undefined && loc !== null) {
                        uniformsFinal[u.name] = activeUniforms[i];
                    }
                }
                program.trackUniforms = uniformsFinal;
            }

            for (i = 0, l = programUniforms.uniformKeys.length; i < l; i++) {
                var uniformKey = programUniforms.uniformKeys[i];
                location1 = programUniforms[uniformKey];

                uniformStack = uniformMap[uniformKey];
                if (uniformStack === undefined) {
                    if (program.trackUniforms !== undefined) {
                        uniform = program.trackUniforms[uniformKey];
                        if (uniform !== undefined) {
                            uniform.apply(location1);
                        }
                    }
                } else {
                    if (uniformStack.length === 0) {
                        uniform = uniformStack.globalDefault;
                    } else {
                        uniform = uniformStack.back();
                    }
                    uniform.apply(location1);
                }
            }
        }
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

        for (var i = 0, l = programUniforms.uniformKeys.length; i < l; i++) {
            var uniformKey = programUniforms.uniformKeys[i];
            location = programUniforms[uniformKey];

            // get the one in the list
            uniform = uniformList[uniformKey];

            // not found ? check on the stack
            if (uniform === undefined) {
                uniformStack = uniformMap[uniformKey];
                if (uniformStack === undefined) {
                    continue;
                }
                if (uniformStack.length === 0) {
                    uniform = uniformStack.globalDefault;
                } else {
                    uniform = uniformStack.back();
                }
            }
            uniform.apply(location);
        }
    },

    applyAttributeMap: function(attributeMap) {
        var attributeStack;
        
        for (var i = 0, l = attributeMap.attributeKeys.length; i < l; i++) {
            var key = attributeMap.attributeKeys[i];

            attributeStack = attributeMap[key];
            if (attributeStack === undefined) {
                continue;
            }
            var attribute;
            if (attributeStack.length === 0) {
                attribute = attributeStack.globalDefault;
            } else {
                attribute = attributeStack.back();
            }

            if (attributeStack.lastApplied !== attribute) {
                if (attribute.apply) {
                    attribute.apply(this);
                }
                attributeStack.lastApplied = attribute;
                attributeStack.asChanged = true;
            }
        }
    },

    pushUniformsList: function(uniformMap, uniformList) {
        var name;
        var uniform;
        for ( var i = 0, l = uniformList.uniformKeys.length; i < l; i++) {
            var key = uniformList.uniformKeys[i];
            uniform = uniformList[key];
            name = uniform.name;
            if (uniformMap[name] === undefined) {
                uniformMap[name] = osg.Stack.create();
                uniformMap[name].globalDefault = uniform;
                uniformMap.uniformKeys.push(name);
            }
            uniformMap[ name ].push(uniform);
        }
    },
    popUniformsList: function(uniformMap, uniformList) {
        var uniform;
        for (var i = 0, l = uniformList.uniformKeys.length; i < l; i++) {
            var key = uniformList.uniformKeys[i];
            uniformMap[key].pop();
        }
    },

    applyTextureAttributeMapList: function(textureAttributesMapList) {
        var textureAttributeMap;

        for (var textureUnit = 0, l = textureAttributesMapList.length; textureUnit < l; textureUnit++) {
            textureAttributeMap = textureAttributesMapList[textureUnit];
            if (textureAttributeMap === undefined) {
                continue;
            }

            for (var i = 0, lt = textureAttributeMap.attributeKeys.length; i < lt; i++) {
                var key = textureAttributeMap.attributeKeys[i];

                var attributeStack = textureAttributeMap[key];
                if (attributeStack === undefined) {
                    continue;
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
            }
        }
    },
    setGlobalDefaultValue: function(attribute) {
        var key = attribute.getTypeMember();
        if (this.attributeMap[key]) {
            this.attributeMap[key].globalDefault = attribute;
        } else {
            this.attributeMap[key] = osg.Stack.create();
            this.attributeMap[key].globalDefault = attribute;

            this.attributeMap.attributeKeys.push(key);
        }
    },

    pushAttributeMap: function(attributeMap,  attributeList) {
        var attributeStack;
        for (var i = 0, l = attributeList.attributeKeys.length; i < l; i++ ) {
            var type = attributeList.attributeKeys[i];
            var attribute = attributeList[type];
            if (attributeMap[type] === undefined) {
                attributeMap[type] = osg.Stack.create();
                attributeMap[type].globalDefault = attribute.cloneType();

                attributeMap.attributeKeys.push(type);
            }

            attributeStack = attributeMap[type];
            attributeStack.push(attribute);
            attributeStack.asChanged = true;
        }
    },
    popAttributeMap: function(attributeMap,  attributeList) {
        var attributeStack;
        for (var i = 0, l = attributeList.attributeKeys.length; i < l; i++) {
            type = attributeList.attributeKeys[i];
            attributeStack = attributeMap[type];
            attributeStack.pop();
            attributeStack.asChanged = true;
        }
    },

    disableVertexAttribsExcept: function(indexList) {
        var that = indexList;
        var disableArray = this.vertexAttribList.filter(function (element, index, array) {
            return (that.indexOf(element) < 0 );
        });

        for (var i = 0, l = disableArray.length; i < l; i++) {
            gl.disableVertexAttribArray(disableArray[i]);
        }

        this.vertexAttribList = indexList;
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
    }

};

osg.State.create = function() {
    var state = new osg.State();
    gl.hint(gl.NICEST, gl.GENERATE_MIPMAP_HINT);
    return state;
};


osg.StateSet = function () { this.id = osg.instance++; };
osg.StateSet.prototype = {
    addUniform: function (uniform) {
        if (!this.uniforms) {
            this.uniforms = {};
            this.uniforms.uniformKeys = [];
        }
        var name = uniform.name;
        this.uniforms[name] = uniform;
        if (this.uniforms.uniformKeys.indexOf(name) === -1) {
            this.uniforms.uniformKeys.push(name);
        }
    },
    getUniformMap: function () {
        return this.uniforms;
    },
    setTextureAttributeAndMode: function (unit, attribute, mode) {
        this.setTextureAttribute(unit, attribute);
    },
    setTextureAttribute: function (unit, attribute) {
        if (!this.textureAttributeMapList) {
            this.textureAttributeMapList = [];
        }
        if (this.textureAttributeMapList[unit] === undefined) {
            this.textureAttributeMapList[unit] = {};
            this.textureAttributeMapList[unit].attributeKeys = [];
        }
        var name = attribute.getTypeMember();
        this.textureAttributeMapList[unit][name] = attribute;
        if (this.textureAttributeMapList[unit].attributeKeys.indexOf(name) === -1) {
            this.textureAttributeMapList[unit].attributeKeys.push(name);
        }
    },
    setTexture: function(unit, attribute) {
        this.setTextureAttribute(unit,attribute);
    },
    getTextureAttributeMap: function(unit) {
        return this.textureAttributeMapList[unit];
    },
    setAttributeAndMode: function(a) { this.setAttribute(a); },
    setAttribute: function (attribute) {
        if (!this.attributeMap) {
            this.attributeMap = {};
            this.attributeMap.attributeKeys = [];
        }
        var name = attribute.getTypeMember();
        this.attributeMap[name] = attribute;
        if (this.attributeMap.attributeKeys.indexOf(name) === -1) {
            this.attributeMap.attributeKeys.push(name);
        }
    },
    getAttributeMap: function() { return this.attributeMap; }
};

osg.StateSet.create = function() {
    var ss = new osg.StateSet();
    return ss;
};


osg.BoundingBox = function() {
    this._min = [1,1,1];
    this._max = [0,0,0];
};
osg.BoundingBox.prototype = {
    init: function() {
	this._min = [1,1,1];
	this._max = [0,0,0];
    },

    valid: function() {
        return (this._max[0] >= this._min[0] &&  this._max[1] >= this._min[1] &&  this._max[2] >= this._min[2]);
    },

    expandBySphere: function(sh) {
        if (!sh.valid()) {
            return;
        }
        if(sh._center[0]-sh._radius<this._min[0]) { this._min[0] = sh._center[0]-sh._radius; }
        if(sh._center[0]+sh._radius>this._max[0]) { this._max[0] = sh._center[0]+sh._radius; }

        if(sh._center[1]-sh._radius<this._min[1]) { this._min[1] = sh._center[1]-sh._radius; }
        if(sh._center[1]+sh._radius>this._max[1]) { this._max[1] = sh._center[1]+sh._radius; }

        if(sh._center[2]-sh._radius<this._min[2]) { this._min[2] = sh._center[2]-sh._radius; }
        if(sh._center[2]+sh._radius>this._max[2]) { this._max[2] = sh._center[2]+sh._radius; }
    },
    expandByVec3: function(v){

	if ( this.valid() ) {
	    if ( this._min[0] > v[0] ) { this._min[0] = v[0]; }
	    if ( this._min[1] > v[1] ) { this._min[1] = v[1]; }
	    if ( this._min[2] > v[2] ) { this._min[2] = v[2]; }
	    if ( this._max[0] < v[0] ) { this._max[0] = v[0]; }
	    if ( this._max[1] < v[1] ) { this._max[1] = v[1]; }
	    if ( this._max[2] < v[2] ) { this._max[2] = v[2]; }
	} else {
	    this._min[0] = v[0];
	    this._min[1] = v[1];
	    this._min[2] = v[2];
	    this._max[0] = v[0];
	    this._max[1] = v[1];
	    this._max[2] = v[2];
	}
    },

    center: function() {
	return osg.Vec3.mult(osg.Vec3.add(this._min,this._max),0.5);
    },
    radius: function() {
	return Math.sqrt(this.radius2());
    },

    radius2: function() {
	return 0.25*(osg.Vec3.length2(osg.Vec3.sub(this._max,this._min)));
    },
    corner: function(pos) {
        ret = [0.0,0.0,0.0];
        if ( pos & 1 ) {
	    ret[0]=this._max[0];
	} else {
	    ret[0]=this._min[0];
	}
        if ( pos & 2 ) {
	    ret[1]=this._max[1];
	} else {
	    ret[1]=this._min[1];
	}
        if ( pos & 4 ) {
	    ret[2]=this._max[2];
	} else {
	    ret[2]=this._min[2];
	}
        return ret;
    }

};


osg.BoundingSphere = function() {
    this._center = [0.0,0.0,0.0];
    this._radius = -1;
};
osg.BoundingSphere.prototype = {
    init: function() {
	this._center = [0.0,0.0,0.0];
	this._radius = -1;
    },
    valid: function() {
	return this._radius>=0.0;
    },
    set: function (center,radius)
    {
	this._center = center;
	this._radius = radius;
    },
    center: function() {return this._center;},
    radius: function() {return this._radius;},
    radius2: function() {return this._radius*this._radius;},

    expandByBox: function(bb) {
	if ( bb.valid() )
	{
            var c;
	    if (this.valid())
	    {
		var newbb = new osg.BoundingBox();
		newbb._min[0]=bb._min[0];
		newbb._min[1]=bb._min[1];
		newbb._min[2]=bb._min[2];
		newbb._max[0]=bb._max[0];
		newbb._max[1]=bb._max[1];
		newbb._max[2]=bb._max[2];

                // this code is not valid c is defined after the loop
                // FIXME
		for (var i = 0 ; i < 8; i++) {
                    var v = osg.Vec3.sub(bb.corner(c),this._center); // get the direction vector from corner
                    osg.Vec3.normalize(v,v); // normalise it.
                    nv[0] *= -this._radius; // move the vector in the opposite direction distance radius.
                    nv[1] *= -this._radius; // move the vector in the opposite direction distance radius.
                    nv[2] *= -this._radius; // move the vector in the opposite direction distance radius.
                    nv[0] += this._center[0]; // move to absolute position.
                    nv[1] += this._center[1]; // move to absolute position.
                    nv[2] += this._center[2]; // move to absolute position.
                    newbb.expandBy(nv); // add it into the new bounding box.
		}

		c = newbb.center();
		this._center[0] = c[0];
		this._center[1] = c[1];
		this._center[2] = c[2];
		this._radius    = newbb.radius();


	    }
	    else
	    {

		c = bb.center();
		this._center[0] = c[0];
		this._center[1] = c[1];
		this._center[2] = c[2];
		this._radius    = bb.radius();

	    }
	}

    },

    expandByVec3: function(v){
	if ( this.valid())
	{
	    var dv = osg.Vec3.sub(v,this.center());
	    r = osg.Vec3.length(dv);
	    if (r>this.radius())
	    {
		dr = (r-this.radius())*0.5;
		this._center[0] += dv[0] * (dr/r);
		this._center[1] += dv[1] * (dr/r);
		this._center[2] += dv[2] * (dr/r);
		this._radius += dr;
	    }
	}
	else
	{
	    this._center[0] = v[0];
	    this._center[1] = v[1];
	    this._center[2] = v[2];
	    this._radius = 0.0;
	}
    },

    expandRadiusBySphere: function(sh){
        if (sh.valid()) {
            if (this.valid()) {
                var sub = osg.Vec3.sub;
                var length = osg.Vec3.length;
                var r = length(sub(sh._center,this._center))+sh._radius;
                if (r>this._radius) {
                    this._radius = r;
                }
                // else do nothing as vertex is within sphere.
            } else {
                this._center = osg.Vec3.copy(sh._center);
                this._radius = sh._radius;
            }
        }
    },
    expandBy: function(sh){
	// ignore operation if incomming BoundingSphere is invalid.
	if (!sh.valid()) { return; }

	// This sphere is not set so use the inbound sphere
	if (!this.valid())
	{
	    this._center[0] = sh._center[0];
	    this._center[1] = sh._center[1];
	    this._center[2] = sh._center[2];
	    this._radius = sh.radius();

	    return;
	}


	// Calculate d == The distance between the sphere centers
	var tmp= osg.Vec3.sub( this.center() , sh.center() );
	d = osg.Vec3.length(tmp);

	// New sphere is already inside this one
	if ( d + sh.radius() <= this.radius() )
	{
	    return;
	}

	//  New sphere completely contains this one
	if ( d + this.radius() <= sh.radius() )
	{
	    this._center[0] = sh._center[0];
	    this._center[1] = sh._center[1];
	    this._center[2] = sh._center[2];
	    this._radius    = sh._radius;
	    return;
	}


	// Build a new sphere that completely contains the other two:
	//
	// The center point lies halfway along the line between the furthest
	// points on the edges of the two spheres.
	//
	// Computing those two points is ugly - so we'll use similar triangles
	new_radius = (this.radius() + d + sh.radius() ) * 0.5;
	ratio = ( new_radius - this.radius() ) / d ;

	this._center[0] += ( sh._center[0] - this._center[0] ) * ratio;
	this._center[1] += ( sh._center[1] - this._center[1] ) * ratio;
	this._center[2] += ( sh._center[2] - this._center[2] ) * ratio;

	this._radius = new_radius;

    },
    contains: function(v) {
	var vc = osg.Vec3.sub(v,this.center());
	return valid() && (osg.Vec3.length2(vc)<=radius2());
    },
    intersects: function( bs ) {
	var lc = osg.Vec3.length2(osg.Vec3.sub(this.center() , bs.center()));
	return valid() && bs.valid() &&
	    (lc <= (this.radius() + bs.radius())*(this.radius() + bs.radius()));
    }
};


osg.Node = function () {
    this.children = [];
    this.parents = [];
    this.nodeMask = ~0;
    this.boundingSphere = new osg.BoundingSphere();
    this.boundingSphereComputed = false;
};
osg.Node.prototype = {
    getOrCreateStateSet: function() {
        if (this.stateset === undefined) {
            this.stateset = new osg.StateSet();
        }
        return this.stateset;
    },
    getStateSet: function() { return this.stateset; },
    accept: function(nv) { 
        if (nv.validNodeMask(this)) {
            nv.apply(this);
        }
    },
    dirtyBound: function() {
        if (this.boundingSphereComputed === true) {
            this.boundingSphereComputed = false;
            for (var i = 0, l = this.parents.length; i < l; i++) {
                this.parents[i].dirtyBound();
            }
        }
    },
    setNodeMask: function(mask) { this.nodeMask = mask; }, 
    getNodeMask: function(mask) { return this.nodeMask; },
    setStateSet: function(s) { this.stateset = s; },
    setUpdateCallback: function(cb) { this.updateCallback = cb; },
    getUpdateCallback: function() { return this.updateCallback; },
    setName: function(name) { this.name = name; },
    getName: function() { return this.name; },
    hasChild: function(child) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            if (this.children[i] === child) {
                return true;
            }
        }
        return false;
    },
    addChild: function (child) {
	var c =  this.children.push(child);
        child.addParent(this);
	this.dirtyBound();
	return c;
    },
    getChildren: function() { return this.children; },
    addParent: function( parent) {
        this.parents.push(parent);
    },
    removeParent: function(parent) {
        var parents = this.parents;
        for (var i = 0, l = this.parents.length; i < l; i++) {
            if (parents[i] === parent) {
                parents.splice(i, 1);
                return;
            }
        }
    },
    removeChildren: function () {
        var children = this.children;
        if (children.length !== 0) {
            for (var i = 0, l = children.length; i < l; i++) {
                children[i].removeParent(this);
            }
	    this.children.length = 0;
	    this.dirtyBound();
        }
    },

    // preserve order
    removeChild: function (child) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            if (this.children[i] === child) {
                child.removeParent(this);
                this.children.splice(i, 1);
	        this.dirtyBound();
            }
        }
    },

    traverse: function (visitor) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            var child = this.children[i];
            child.accept(visitor);
        }
    },

    getBound: function() {
        if(!this.boundingSphereComputed) {
            this.computeBound(this.boundingSphere);
            this.boundingSphereComputed = true;
        }
        return this.boundingSphere;
    },

    computeBound: function (bsphere) {
        var bb = new osg.BoundingBox();
        bb.init();
        bsphere.init();
	for (var i = 0, l = this.children.length; i < l; i++) {
	    var child = this.children[i];
            if (child.referenceFrame === undefined || child.referenceFrame === osg.Transform.RELATIVE_RF) {
	        bb.expandBySphere(child.getBound());
            }
	}
        if (!bb.valid()) {
            return bsphere;
        }
        bsphere._center = bb.center();
        bsphere._radius = 0.0;
	for (var j = 0, l2 = this.children.length; j < l2; i++) {
	    var cc = this.children[j];
            if (cc.referenceFrame === undefined || cc.referenceFrame === osg.Transform.RELATIVE_RF) {
	        bsphere.expandRadiusBySphere(cc.getBound());
            }
	}
            
	return bsphere;
    }

};
osg.Node.create = function() {
    var node = new osg.Node();
    return node;
};


osg.Transform = function() {
    osg.Node.call(this);
    this.referenceFrame = osg.Transform.RELATIVE_RF;
};
osg.Transform.RELATIVE_RF = 0;
osg.Transform.ABSOLUTE_RF = 1;
osg.Transform.prototype = osg.objectInehrit(osg.Node.prototype, {
    setReferenceFrame: function(value) { this.referenceFrame = value; },
    getReferenceFrame: function() { return this.referenceFrame; },

    computeBound: function(bsphere) {
        osg.Node.prototype.computeBound.call(this, bsphere);
        if (!bsphere.valid()) {
            return bsphere;
        }
        var matrix = osg.Matrix.makeIdentity();
        this.computeLocalToWorldMatrix(matrix);

        var xdash = osg.Vec3.copy(bsphere._center);
        xdash[0] += bsphere._radius;
        osg.Matrix.transformVec3(matrix,xdash, xdash);

        var ydash = osg.Vec3.copy(bsphere._center);
        ydash[1] += bsphere._radius;
        osg.Matrix.transformVec3(matrix,ydash, ydash);

        var zdash = osg.Vec3.copy(bsphere._center);
        zdash[2] += bsphere._radius;
        osg.Matrix.transformVec3(matrix,zdash, zdash);

        osg.Matrix.transformVec3(matrix, bsphere._center, bsphere._center);

        osg.Vec3.sub(xdash,bsphere._center, xdash);
        var len_xdash = osg.Vec3.length(xdash);

        osg.Vec3.sub(ydash, bsphere._center, ydash);
        var len_ydash = osg.Vec3.length(ydash);

        osg.Vec3.sub(zdash, bsphere._center, zdash);
        var len_zdash = osg.Vec3.length(zdash);

        bsphere._radius = len_xdash;
        if (bsphere._radius<len_ydash) {
            bsphere._radius = len_ydash;
        }
        if (bsphere._radius<len_zdash) {
            bsphere._radius = len_zdash;
        }
        return bsphere;
    }
});


osg.MatrixTransform = function() {
    osg.Transform.call(this);
    this.matrix = osg.Matrix.makeIdentity();
};
osg.MatrixTransform.prototype = osg.objectInehrit(osg.Transform.prototype, {
    getMatrix: function() { return this.matrix; },
    setMatrix: function(m) { this.matrix = m; },
    computeLocalToWorldMatrix: function(matrix,nodeVisitor) {
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.mult(matrix, this.matrix, matrix);
        } else {
            matrix = this.matrix;
        }
        return true;
    },
    computeWorldToLocalMatrix: function(matrix,nodeVisitor) {
        var minverse = osg.Matrix.inverse(this.matrix);
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.mult(minverse, matrix, matrix);
        } else {// absolute
            matrix = inverse;
        }
        return true;
    }
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
    var p = new osg.Projection();
    return p;
};



osg.Texture = function() {
    this.setDefaultParameters();
    this.dirty = true;
};

osg.Texture.prototype = {
    attributeType: "Texture",
    cloneType: function() { var t = new osg.Texture(); t.default_type = true; return t;},
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType; },
    getOrCreateUniforms: function(unit) {
        if (osg.Texture.uniforms === undefined) {
            osg.Texture.uniforms = [];
        }
        if (osg.Texture.uniforms[unit] === undefined) {
            var name = this.getType() + unit;
            var uniforms = {};
            uniforms[name] = osg.Uniform.createInt1(unit, name);
            var uniformKeys = [name];
            uniforms.uniformKeys = uniformKeys;

            osg.Texture.uniforms[unit] = uniforms;
        }
        return osg.Texture.uniforms[unit];
    },
    setDefaultParameters: function() {
        this.mag_filter = 'LINEAR';
        this.min_filter = 'LINEAR';
        this.wrap_s = 'CLAMP_TO_EDGE';
        this.wrap_t = 'CLAMP_TO_EDGE';
        this.textureWidth = 0;
        this.textureHeight = 0;
        this.target = 'TEXTURE_2D';
    },
    setTextureSize: function(w,h) {
        this.textureWidth = w;
        this.textureHeight = h;
    },
    init: function() {
        if (!this.textureObject) {
            this.textureObject = gl.createTexture();
            this.dirty = true;
        }
    },
    getWidth: function() { return this.textureWidth; },
    getHeight: function() { return this.textureHeight; },

    setWrapS: function(value) { this.wrap_s = value; },
    setWrapT: function(value) { this.wrap_t = value; },

    setMinFilter: function(value) { this.min_filter = value; },
    setMagFilter: function(value) { this.mag_filter = value; },

    setImage: function(img) {
        this.image = img;
        this.dirty = true;
    },

    setFromCanvas: function(canvas) {
        this.init();
        gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        this.setTextureSize(canvas.width, canvas.height);
        this.applyFilterParameter();
        this.dirty = false;
    },

    isImageReady: function() {
        var image = this.image;
        if (image && image.complete) {
            if (typeof image.naturalWidth !== "undefined" &&  image.naturalWidth === 0) {
                return false;
            }
            return true;
        }
        return false;
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[this.mag_filter]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.min_filter]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[this.wrap_s]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[this.wrap_t]);
        if (this.min_filter === 'NEAREST_MIPMAP_NEAREST' ||
            this.min_filter === 'LINEAR_MIPMAP_NEAREST' ||
            this.min_filter === 'NEAREST_MIPMAP_LINEAR' ||
            this.min_filter === 'LINEAR_MIPMAP_LINEAR') {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    },

    apply: function(state) {
        if (this.image !== undefined) {
            if (!this.textureObject) {
                if (this.isImageReady()) {
                    if (!this.textureObject) {
                        this.init();
                    }
                    gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
                    this.applyFilterParameter();
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }
            } else {
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
            }
        } else if (this.textureHeight !== 0 && this.textureWidth !== 0 ) {
            if (!this.textureObject) {
                this.init();
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureWidth, this.textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                this.applyFilterParameter();
            } else {
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
            }
        } else if (this.textureObject !== undefined) {
            gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, null);
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
            str += "uniform sampler2D Texture" + unit +";\n";
            str += "vec4 texColor" + unit + ";\n";
            break;
        case osg.ShaderGeneratorType.FragmentMain:
            str = "texColor" + unit + " = texture2D( Texture" + unit + ", FragTexCoord" + unit + ".xy );\n";
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


osg.Depth = function (func, near, far, writeMask) {
    this.func = 'LESS';
    this.near = 0.0;
    this.far = 1.0;
    this.writeMask = true;

    if (func !== undefined) {
        this.func = func;
    }
    if (near !== undefined) {
        this.near = near;
    }
    if (far !== undefined) {
        this.far = far;
    }
    if (writeMask !== undefined) {
        this.writeMask = far;
    }
};
osg.Depth.prototype = {
    attributeType: "Depth",
    cloneType: function() {return new osg.Depth(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setRange: function(near, far) { this.near = near; this.far = far; },
    setWriteMask: function(mask) { this.mask = mask; },
    apply: function(state) {
        if (this.func === 'DISABLE') {
            gl.disable(gl.DEPTH_TEST);
        } else {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl[this.func]);
            gl.depthMask(this.writeMask);
            gl.depthRange(this.near, this.far);
        }
    }
};


osg.BlendFunc = function (source, destination) {
    this.sourceFactor = 'ONE';
    this.destinationFactor = 'ZERO';
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
    apply: function(state) { 
        gl.blendFunc(gl[this.sourceFactor], gl[this.destinationFactor]); 
    }
};

osg.LineWidth = function (lineWidth) {
    this.lineWidth = 1.0;
    if (lineWidth !== undefined) {
        this.lineWidth = lineWidth;
    }
};
osg.LineWidth.prototype = {
    attributeType: "LineWidth",
    cloneType: function() {return new osg.LineWidth(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) { gl.lineWidth(this.lineWidth); }
};


osg.CullFace = function (mode) {
    this.mode = 'BACK';
    if (mode !== undefined) {
        this.mode = mode;
    }
};
osg.CullFace.prototype = {
    attributeType: "CullFace",
    cloneType: function() {return new osg.CullFace(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) { 
        if (this.mode === 'DISABLE') {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl[this.mode]);
        }
    }
};


osg.FrameBufferObject = function () {
    this.fbo = undefined;
    this.attachments = [];
};
osg.FrameBufferObject.prototype = {
    attributeType: "FrameBufferObject",
    cloneType: function() {return new osg.FrameBufferObject(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setAttachment: function(attachment) { this.attachments.push(attachment); },
    apply: function(state) {
        var status;
        if (this.attachments.length > 0) {
            if (this.fbo === undefined) {
                this.fbo = gl.createFramebuffer();

                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

                for (var i = 0, l = this.attachments.length; i < l; ++i) {
                    var texture = this.attachments[i].texture;

                    // apply on unit 0 to init it
                    state.applyTextureAttribute(1, texture);

                    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachments[i].attachment, gl[texture.target], texture.textureObject, this.attachments[i].level);
                    //gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.textureObject, 0);
                }

                status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (status !== 0x8CD5) {
                    osg.log("framebuffer error check " + status);
                }

            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (status !== 0x8CD5) {
                    osg.log("framebuffer error check " + status);
                }
            }
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }
};

osg.Viewport = function (x,y, w, h) {
    if (x === undefined) { x = 0; }
    if (y === undefined) { y = 0; }
    if (w === undefined) { w = 800; }
    if (h === undefined) { h = 600; }

    var xstart = x;
    var ystart = y;
    var width = w;
    var height = h;
    this.x = function() { return xstart; };
    this.y = function() { return ystart; };
    this.width = function() { return width; };
    this.height = function() { return height; };
    this.computeWindowMatrix = function() {
        // res = Matrix offset * Matrix scale * Matrix translate
        var translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
        var scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
        var offset = osg.Matrix.makeTranslate(xstart,ystart,0.0);
        //return osg.Matrix.mult(osg.Matrix.mult(translate, scale, translate), offset, offset);
        return osg.Matrix.mult(offset, osg.Matrix.mult(scale, translate, scale),  offset);
    };
};
osg.Viewport.prototype = {
    attributeType: "Viewport",
    cloneType: function() {return new osg.Viewport(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) { gl.viewport(this.x(), this.y(), this.width(), this.height()); }
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
            var uniformKeys = [];
            for (var k in osg.Material.uniforms) {
                uniformKeys.push(k);
            }
            osg.Material.uniforms.uniformKeys = uniformKeys;
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

            var uniformKeys = [];
            for (var k in osg.Light.uniforms[this.getTypeMember()]) {
                uniformKeys.push(k);
            }
            osg.Light.uniforms[this.getTypeMember()].uniformKeys = uniformKeys;
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
                    //                    "uniform mat4 " + this.getParameterName('matrix') + ";",
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


osg.DrawArray = function (mode, first, count) 
{
    this.mode = mode;
    this.first = first;
    this.count = count;
};
osg.DrawArray.prototype = {
    draw: function(state) {
        gl.drawArrays(this.mode, this.first, this.count);
    },
    getMode: function() { return this.mode; },
    getCount: function() { return this.count; },
    getFirst: function() { return this.first; }
};
osg.DrawArray.create = function(mode, first, count) {
    var d = new osg.DrawArray(mode, first, count);
    return d;
};

osg.DrawArrays = osg.DrawArray;


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
    this.boundingBox = new osg.BoundingBox();
    this.boundingBoxComputed = false;
};

osg.Geometry.prototype = osg.objectInehrit(osg.Node.prototype, {
    dirtyBound: function() {
        if (this.boundingBoxComputed === true) {
            this.boundingBoxComputed = false;
        }
        //
        osg.Node.dirtyBound.call(this);
    },

    getPrimitives: function() { return this.primitives; },
    getAttributes: function() { return this.attributes; },

    drawImplementation: function(state) {
        
        var program = state.getLastProgramApplied();
        var attribute;
        var attributeList = [];
        var attributesCache = program.attributesCache;

        for (var i = 0, l = attributesCache.attributeKeys.length; i < l; i++) {
            var key = attributesCache.attributeKeys[i];
            attribute = attributesCache[key];

            if (this.attributes[key] === undefined) {
                continue;
            }
            attributeList.push(attribute);
            state.setVertexAttribArray(attribute, this.attributes[key], false);
        }

        var primitives = this.primitives;
        state.disableVertexAttribsExcept(attributeList);
        for (var j = 0, m = primitives.length; j < m; ++j) {
            primitives[j].draw(state);
        }
    },

    getBoundingBox: function() {
        if(!this.boundingBoxComputed) {
            this.computeBoundingBox(this.boundingBox);
            this.boundingBoxComputed = true;
        }
        return this.boundingBox;
    },
    computeBoundingBox: function(boundingBox) {
	var att = this.getAttributes();
	if ( att.Vertex.itemSize == 3 ) {
	    vertexes = att.Vertex.getElements();
	    for (var idx = 0, l = vertexes.length; idx < l; idx+=3) {
		var v=[vertexes[idx],vertexes[idx+1],vertexes[idx+2]];
		boundingBox.expandByVec3(v);
	    }
	}
        return boundingBox;
    },

    computeBound: function (boundingSphere) {
	boundingSphere.init();
	var bb = this.getBoundingBox();
	boundingSphere.expandByBox(bb);
	return boundingSphere;
    }
});
osg.Geometry.create = function() {
    var g = new osg.Geometry();
    return g;
};


osg.CullStack = function() {
    this.modelviewMatrixStack = [osg.Matrix.makeIdentity()];
    this.projectionMatrixStack = [osg.Matrix.makeIdentity()];
    this.viewportStack = [];
};
osg.CullStack.prototype = {
    getViewport: function () {
        if (this.viewportStack.length === 0) {
            return undefined;
        }
        return this.viewportStack[this.viewportStack.length-1];
    },
    getLookVectorLocal: function() {
        var m = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
        return [ -m[2], -m[6], -m[10] ];
    },
    pushViewport: function (vp) {
        this.viewportStack.push(vp);
    },
    popViewport: function () {
        this.viewportStack.pop();
    },
    pushModelviewMatrix: function (matrix) {
        this.modelviewMatrixStack.push(matrix);

        var lookVector = this.getLookVectorLocal();
        this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);        
        this.bbCornerNear = (~this.bbCornerFar)&7;
    },
    popModelviewMatrix: function () {

        this.modelviewMatrixStack.pop();
        var lookVector;
        if (this.modelviewMatrixStack.length !== 0) {
            lookVector = this.getLookVectorLocal();
        } else {
            lookVector = [0,0,-1];
        }
        this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
        this.bbCornerNear = (~this.bbCornerFar)&7;

    },
    pushProjectionMatrix: function (matrix) {
        this.projectionMatrixStack.push(matrix);
    },
    popProjectionMatrix: function () {
        this.projectionMatrixStack.pop();
    }
};

osg.CullSettings = function() {
    this.computeNearFar = true;
    this.nearFarRatio = 0.0005;

    var lookVector =[0.0,0.0,-1.0];
    this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this.bbCornerNear = (~this.bbCornerFar)&7;
};
osg.CullSettings.prototype = {
    setCullSettings: function(settings) {
        this.computeNearFar = settings.computeNearFar;
        this.nearFarRatio = settings.nearFarRatio;
    },
    setNearFarRatio: function( ratio) { this.nearFarRatio = ratio; },
    getNearFarRatio: function() { return this.nearFarRatio; },
    setComputeNearFar: function(value) { this.computeNearFar = value; },
    getComputeNearFar: function() { return this.computeNearFar; }
};


osg.Camera = function () {
    osg.Transform.call(this);
    osg.CullSettings.call(this);

    this.viewport = undefined;
    this.setClearColor([0, 0, 0, 1.0]);
    this.setClearDepth(1.0);
    this.setClearMask(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.setViewMatrix(osg.Matrix.makeIdentity());
    this.setProjectionMatrix(osg.Matrix.makeIdentity());
    this.renderOrder = osg.Camera.NESTED_RENDER;
    this.renderOrderNum = 0;
};
osg.Camera.PRE_RENDER = 0;
osg.Camera.NESTED_RENDER = 1;
osg.Camera.POST_RENDER = 2;

osg.Camera.prototype = osg.objectInehrit(osg.CullSettings.prototype, 
                                         osg.objectInehrit(osg.Transform.prototype, {

    setClearDepth: function(depth) { this.clearDepth = depth;}, 
    getClearDepth: function() { return this.clearDepth;},

    setClearMask: function(mask) { this.clearMask = mask;}, 
    getClearMask: function() { return this.clearMask;},

    setClearColor: function(color) { this.clearColor = color;},
    getClearColor: function() { return this.clearColor;},

    setViewport: function(vp) { 
        this.viewport = vp;
        this.getOrCreateStateSet().setAttribute(vp);
    },
    getViewport: function() { return this.viewport; },


    setViewMatrix: function(matrix) {
        this.modelviewMatrix = matrix;
    },

    setProjectionMatrix: function(matrix) {
        this.projectionMatrix = matrix;
    },

    getViewMatrix: function() { return this.modelviewMatrix; },
    getProjectionMatrix: function() { return this.projectionMatrix; },
    getRenderOrder: function() { return this.renderOrder; },
    setRenderOrder: function(order, orderNum) {
        this.renderOrder = order;
        this.renderOrderNum = orderNum; 
    },

    attachTexture: function(bufferComponent, texture, level) {
        if (this.attachments === undefined) {
            this.attachments = {};
        }
        this.attachments[bufferComponent] = { 'texture' : texture , 'level' : level };
    },

    computeLocalToWorldMatrix: function(matrix,nodeVisitor) {
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.mult(matrix, this.modelviewMatrix, matrix);
        } else {// absolute
            matrix = this.modelviewMatrix;
        }
        return true;
    },

    computeWorldToLocalMatrix: function(matrix, nodeVisitor) {
        var inverse = osg.Matrix.inverse(this.modelviewMatrix);
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.mult(inverse, matrix, matrix);
        } else {
            matrix = inverse;
        }
        return true;
    }

}));









osg.NodeVisitor = function () {
    this.traversalMask = ~0x0;
    this.nodeMaskOverride = 0;
};
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


osg.StateGraph = function () {
    this.depth = 0;
    this.children = {};
    this.children.keys = [];
    this.leafs = [];
    this.stateset = undefined;
    this.parent = undefined;
};

osg.StateGraph.prototype = {
    clean: function() {
        this.leafs.length = 0;
        // keep it
        //this.stateset = undefined;
        //this.parent = undefined;
        //this.depth = 0;
        for (var i = 0, l = this.children.keys.length; i < l; i++) {
            var key = this.children.keys[i];
            this.children[key].clean();
        }
    },
    findOrInsert: function (stateset)
    {
        var sg;
        if (!this.children[stateset.id]) {
            sg = new osg.StateGraph();
            sg.parent = this;
            sg.depth = this.depth + 1;
            sg.stateset = stateset;
            this.children[stateset.id] = sg;
            this.children.keys.push(stateset.id);
        } else {
            sg = this.children[stateset.id];
        }
        return sg;
    },
    moveStateGraph: function(state, sg_current, sg_new)
    {
        var stack;
        var i;
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
            for (i = 0, l = stack.length; i < l; ++i) {
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



osg.RenderBin = function (stateGraph) {
    this.leafs = [];
    this.stateGraph = stateGraph;
    this.positionedAttribute = [];
    this.renderStage = undefined;
    this.renderBin = {};
    this.stateGraphList = [];
};
osg.RenderBin.prototype = {
    getStage: function() { return this.renderStage; },
    addStateGraph: function(sg) { this.stateGraphList.push(sg); },
    reset: function() {
        this.stateGraph = undefined;
        this.stateGraphList.length = 0;
        this.renderBin = {};
        this.positionedAttribute.length = 0;
        this.leafs.length = 0;
    },
    applyPositionedAttribute: function(state, positionedAttibutes) {
        // the idea is to set uniform 'globally' in uniform map.
        for (var index = 0, l = positionedAttibutes.length; index < l; index++) {
            var element = positionedAttibutes[index];
            // add or set uniforms in state
            var stateAttribute = element[1];
            var matrix = element[0];
            state.setGlobalDefaultValue(stateAttribute);
            stateAttribute.applyPositionedUniform(matrix, state);
        }
    },

    drawImplementation: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        // draw prev bins
        for (var key in this.renderBin) {
            if (key < 0 ) {
                previous = this.renderBin[key].drawImplementation(state, previous);
            }
        }
        
        // draw leafs
        previous = this.drawLeafs(state, previous);

        // draw post bins
        for (key in this.renderBin) {
            if (key >= 0 ) {
                previous = this.renderBin[key].drawImplementation(state, previous);
            }
        }
        return previous;
    },

    drawLeafs: function(state, previousRenderLeaf) {
        // no sort right now
        //this.drawImplementation(state, previousRenderLeaf);
        var stateList = this.stateGraphList;
        var leafs = this.leafs;
        var normalUniform;
        var modelViewUniform;
        var projectionUniform;
        var program;
        var stateset;
        var previousLeaf = previousRenderLeaf;

        if (this.positionedAttribute) {
            this.applyPositionedAttribute(state, this.positionedAttribute);
        }

        for (var i = 0, l = stateList.length; i < l; i++) {
            var sg = stateList[i];
            for (var j = 0, ll = sg.leafs.length; j < ll; j++) {

                var leaf = sg.leafs[j];
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
        return previousLeaf;
    }
};

/**
 * From OpenSceneGraph http://www.openscenegraph.org
 * RenderStage base class. Used for encapsulate a complete stage in
 * rendering - setting up of viewport, the projection and model
 * matrices and rendering the RenderBin's enclosed with this RenderStage.
 * RenderStage also has a dependency list of other RenderStages, each
 * of which must be called before the rendering of this stage.  These
 * 'pre' rendering stages are used for advanced rendering techniques
 * like multistage pixel shading or impostors.
 */
osg.RenderStage = function () {
    osg.RenderBin.call(this);
    this.positionedAttribute = [];
    this.clearDepth = 1.0;
    this.clearColor = [0,0,0,1];
    this.clearMask = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
    this.camera = undefined;
    this.viewport = undefined;
    this.preRenderList = [];
    this.postRenderList = [];
    this.renderStage = this;
};
osg.RenderStage.prototype = osg.objectInehrit(osg.RenderBin.prototype, {
    reset: function() { 
        osg.RenderBin.prototype.reset.call(this);
        this.preRenderList.length = 0;
        this.postRenderList.length = 0;
    },
    setClearDepth: function(depth) { this.clearDepth = depth;},
    getClearDepth: function() { return this.clearDepth;},
    setClearColor: function(color) { this.clearColor = color;},
    getClearColor: function() { return this.clearColor;},
    setClearMask: function(mask) { this.clearMask = mask;},
    getClearMask: function() { return this.clearMask;},
    setViewport: function(vp) { this.viewport = vp; },
    getViewport: function() { return this.viewport; },
    setCamera: function(camera) { this.camera = camera; },
    addPreRenderStage: function(rs, order) {
        for (var i = 0, l = this.preRenderList.length; i < l; i++) {
            var render = this.preRenderList[i];
            if (order < render.order) {
                break;
            }
        }
        if (i < this.preRenderList.length) {
            this.preRenderList = this.preRenderList.splice(i,0, { 'order' : order, 'renderStage' : rs });
        } else {
            this.preRenderList.push({ 'order' : order, 'renderStage' : rs });
        }
    },
    addPostRenderStage: function(rs, order) {
        for (var i = 0, l = this.postRenderList.length; i < l; i++) {
            var render = this.postRenderList[i];
            if (order < render.order) {
                break;
            }
        }
        if (i < this.postRenderList.length) {
            this.postRenderList = this.postRenderList.splice(i,0, { 'order' : order, 'renderStage' : rs });
        } else {
            this.postRenderList.push({ 'order' : order, 'renderStage' : rs });
        }
    },

    drawPreRenderStages: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        for (var i = 0, l = this.preRenderList.length; i < l; ++i) {
            var sg = this.preRenderList[i].renderStage;
            previous = sg.draw(state, previous);
        }
        return previous;
    },

    draw: function(state, previousRenderLeaf) {
        var previous = this.drawPreRenderStages(state, previousRenderLeaf);
        previous = this.drawImplementation(state, previous);

        previous = this.drawPostRenderStages(state, previous);
        return previous;
    },

    drawPostRenderStages: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        for (var i = 0, l = this.postRenderList.length; i < l; ++i) {
            var sg = this.postRenderList[i].renderStage;
            previous = sg.draw(state, previous);
        }
        return previous;
    },

    applyCamera: function(state) {
        if (this.camera === undefined) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        var fbo = this.camera.frameBufferObject;
        if (this.camera.frameBufferObject === undefined) {
            fbo = new osg.FrameBufferObject();
            this.camera.frameBufferObject = fbo;
            if (this.camera.attachments !== undefined) {
                for ( var key in this.camera.attachments) {
                    var a = this.camera.attachments[key];
                    fbo.setAttachment({ 'attachment': key, 'texture': a.texture, 'level': 0 });
                }
            }
        }
        fbo.apply(state);
    },

    drawImplementation: function(state, previousRenderLeaf) {
        var error;
        if (osg.reportErrorGL === true) {
            error = gl.getError();
            osg.checkError(error);
        }

        this.applyCamera(state);

        if (this.viewport === undefined) {
            osg.log("RenderStage does not have a valid viewport");
        }

        state.applyAttribute(this.viewport);

        if (this.clearMask & gl.COLOR_BUFFER_BIT) {
            gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        }
        if (this.clearMask & gl.DEPTH_BUFFER_BIT) {
            gl.clearDepth(this.clearDepth);
        }
        gl.clear(this.clearMask);

        if (this.positionedAttribute) {
            this.applyPositionedAttribute(state, this.positionedAttribute);
        }

        var previous = osg.RenderBin.prototype.drawImplementation.call(this, state, previousRenderLeaf);

        if (osg.reportErrorGL === true) {
            error = gl.getError();
            osg.checkError(error);
        }

        return previous;
        //debugger;
        //state.apply();
    }
});


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
    osg.CullSettings.call(this);
    osg.CullStack.call(this);

    this.rootStateGraph = undefined;
    this.currentStateGraph = undefined;
    this.currentRenderBin = undefined;
    this.currentRenderStage = undefined;
    this.rootRenderStage = undefined;

    this.computeNearFar = true;
    this.computedNear = Number.POSITIVE_INFINITY;
    this.computedFar = Number.NEGATIVE_INFINITY;

    var lookVector =[0.0,0.0,-1.0];
    this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this.bbCornerNear = (~this.bbCornerFar)&7;
};

osg.CullVisitor.prototype = osg.objectInehrit(osg.CullStack.prototype ,osg.objectInehrit(osg.CullSettings.prototype, osg.objectInehrit(osg.NodeVisitor.prototype, {
    distance: function(coord,matrix) {
        return -( coord[0]*matrix[2]+ coord[1]*matrix[6] + coord[2]*matrix[10] + matrix[14]);
    },
    updateCalculatedNearFar: function( matrix, drawable) {

        var bb = drawable.getBoundingBox();
        var d_near, d_far;

        // efficient computation of near and far, only taking into account the nearest and furthest
        // corners of the bounding box.
        d_near = this.distance(bb.corner(this.bbCornerNear),matrix);
        d_far = this.distance(bb.corner(this.bbCornerFar),matrix);
        
        if (d_near>d_far) {
            var tmp = d_near;
            d_near = d_far;
            d_far = tmp;
        }

        if (d_far<0.0) {
            // whole object behind the eye point so discard
            return false;
        }

        if (d_near<this.computedNear) {
            this.computedNear = d_near;
        }

        if (d_far>this.computedFar) {
            this.computedFar = d_far;
        }

        return true;
    },

    clampProjectionMatrix: function(projection, znear, zfar, nearFarRatio, resultNearFar) {
        var epsilon = 1e-6;
        if (zfar<znear-epsilon) {
            osg.log("clampProjectionMatrix not applied, invalid depth range, znear = " + znear + "  zfar = " + zfar);
            return false;
        }
        
        var desired_znear, desired_zfar;
        if (zfar<znear+epsilon) {
            // znear and zfar are too close together and could cause divide by zero problems
            // late on in the clamping code, so move the znear and zfar apart.
            var average = (znear+zfar)*0.5;
            znear = average-epsilon;
            zfar = average+epsilon;
            // OSG_INFO << "_clampProjectionMatrix widening znear and zfar to "<<znear<<" "<<zfar<<std::endl;
        }

        if (Math.abs(osg.Matrix.get(projection,0,3))<epsilon  && 
            Math.abs(osg.Matrix.get(projection,1,3))<epsilon  && 
            Math.abs(osg.Matrix.get(projection,2,3))<epsilon ) {
            // OSG_INFO << "Orthographic matrix before clamping"<<projection<<std::endl;

            var delta_span = (zfar-znear)*0.02;
            if (delta_span<1.0) {
		delta_span = 1.0;
	    }
            desired_znear = znear - delta_span;
            desired_zfar = zfar + delta_span;

            // assign the clamped values back to the computed values.
            znear = desired_znear;
            zfar = desired_zfar;

            osg.Matrix.set(projection,2,2, -2.0/(desired_zfar-desired_znear));
            osg.Matrix.set(projection,3,2, -(desired_zfar+desired_znear)/(desired_zfar-desired_znear));

            // OSG_INFO << "Orthographic matrix after clamping "<<projection<<std::endl;
        } else {

            // OSG_INFO << "Persepective matrix before clamping"<<projection<<std::endl;
            //std::cout << "_computed_znear"<<_computed_znear<<std::endl;
            //std::cout << "_computed_zfar"<<_computed_zfar<<std::endl;

            var zfarPushRatio = 1.02;
            var znearPullRatio = 0.98;

            //znearPullRatio = 0.99; 

            desired_znear = znear * znearPullRatio;
            desired_zfar = zfar * zfarPushRatio;

            // near plane clamping.
            var min_near_plane = zfar*nearFarRatio;
            if (desired_znear<min_near_plane) {
		desired_znear=min_near_plane;
	    }

            // assign the clamped values back to the computed values.
            znear = desired_znear;
            zfar = desired_zfar;
            
            var m22 = osg.Matrix.get(projection,2,2);
            var m32 = osg.Matrix.get(projection,3,2);
            var m23 = osg.Matrix.get(projection,2,3);
            var m33 = osg.Matrix.get(projection,3,3);
            var trans_near_plane = (-desired_znear*m22 + m32)/(-desired_znear*m23+m33);
            var trans_far_plane = (-desired_zfar*m22+m32)/(-desired_zfar*m23+m33);

            var ratio = Math.abs(2.0/(trans_near_plane-trans_far_plane));
            var center = -(trans_near_plane+trans_far_plane)/2.0;

            var matrix = [1.0,0.0,0.0,0.0,
                          0.0,1.0,0.0,0.0,
                          0.0,0.0,ratio,0.0,
                          0.0,0.0,center*ratio,1.0];
            osg.Matrix.mult(matrix, projection, projection);
            // OSG_INFO << "Persepective matrix after clamping"<<projection<<std::endl;
        }
        if (resultNearFar !== undefined) {
            resultNearFar[0] = znear;
            resultNearFar[1] = zfar;
        }
        return true;
    },

    setStateGraph: function(sg) {
        this.rootStateGraph = sg;
        this.currentStateGraph = sg;
    },
    setRenderStage: function(rg) {
        this.rootRenderStage = rg;
        this.currentRenderBin = rg;
    },
    reset: function () {
        this.modelviewMatrixStack.length = 1;
        this.projectionMatrixStack.length = 1;
    },
    getCurrentRenderBin: function() { return this.currentRenderBin; },
    setCurrentRenderBin: function(rb) { this.currentRenderBin = rb; },
    addPositionedAttribute: function (attribute) {
        var matrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length - 1];
        this.currentRenderBin.getStage().positionedAttribute.push([matrix, attribute]);
    },
    pushStateSet: function (stateset) {
        this.currentStateGraph = this.currentStateGraph.findOrInsert(stateset);
    },
    popStateSet: function () {
        this.currentStateGraph = this.currentStateGraph.parent;
    },

    applyCamera: function( camera ) {
        if (camera.stateset) {
            this.pushStateSet(camera.stateset);
        }

        if (camera.light) {
            this.addPositionedAttribute(camera.light);
        }

        var originalModelView = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];

        var modelview;
        var projection;
        if (camera.getReferenceFrame() === osg.Transform.RELATIVE_RF) {
            var lastProjectionMatrix = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
            projection = osg.Matrix.mult(lastProjectionMatrix, camera.getProjectionMatrix());
            this.pushProjectionMatrix(projection);
            var lastViewMatrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
            modelview = osg.Matrix.mult(lastViewMatrix, camera.getViewMatrix());
            this.pushModelviewMatrix(modelview);
        } else {
            // absolute
            modelview = osg.Matrix.copy(camera.getViewMatrix());
            projection = osg.Matrix.copy(camera.getProjectionMatrix());
            this.pushProjectionMatrix(projection);
            this.pushModelviewMatrix(modelview);
        }

        if (camera.getViewport()) {
            this.pushViewport(camera.getViewport());
        }

        // save current state of the camera
        var previous_znear = this.computedNear;
        var previous_zfar = this.computedFar;
        var previous_cullsettings = new osg.CullSettings();
        previous_cullsettings.setCullSettings(this);

        this.computedNear = Number.POSITIVE_INFINITY;
        this.computedFar = Number.NEGATIVE_INFINITY;
        this.setCullSettings(camera);

        // nested camera
        if (camera.getRenderOrder() === osg.Camera.NESTED_RENDER) {
            
            if (camera.traverse) {
                this.traverse(camera);
            }
            
        } else {
            // not tested

            var previous_stage = this.getCurrentRenderBin().getStage();

            // use render to texture stage
            var rtts = new osg.RenderStage();
            rtts.setCamera(camera);
            rtts.setClearDepth(camera.getClearDepth());
            rtts.setClearColor(camera.getClearColor());

            rtts.setClearMask(camera.getClearMask());
            
            var vp;
            if (camera.getViewport() === undefined) {
                vp = previous_stage.getViewport();
            } else {
                vp = camera.getViewport();
            }
            rtts.setViewport(vp);
            
            // skip positional state for now
            // ...

            var previousRenderBin = this.getCurrentRenderBin();

            this.setCurrentRenderBin(rtts);

            if (camera.traverse) {
                camera.traverse(this);
            }

            this.setCurrentRenderBin(previousRenderBin);

            if (camera.getRenderOrder() === osg.Camera.PRE_RENDER) {
                this.getCurrentRenderBin().getStage().addPreRenderStage(rtts,camera.renderOrderNum);
            } else {
                this.getCurrentRenderBin().getStage().addPostRenderStage(rtts,camera.renderOrderNum);
            }
        }

        this.popModelviewMatrix();
        this.popProjectionMatrix();

        if (camera.getViewport()) {
            this.popViewport();
        }

        // restore previous state of the camera
        this.setCullSettings(previous_cullsettings);
        this.computedNear = previous_znear;
        this.computedFar = previous_zfar;

        if (camera.stateset) {
            this.popStateSet();
        }

    },

    popProjectionMatrix: function () {
        if (this.computeNearFar === true && this.computedFar >= this.computedNear) {
            var m = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
            this.clampProjectionMatrix(m, this.computedNear, this.computedFar, this.nearFarRatio);
        }
        osg.CullStack.prototype.popProjectionMatrix.call(this);
        //this.projectionMatrixStack.pop();
    },

    apply: function( node ) {
        var lastMatrixStack;
        var matrix;

        if (node.getProjectionMatrix && node.getViewMatrix) {
            this.applyCamera(node);
            return;
        }

        if (node.getMatrix) {

            lastMatrixStack = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
            matrix = osg.Matrix.mult(lastMatrixStack, node.getMatrix());
            this.pushModelviewMatrix(matrix);
        } else if (node.getViewMatrix) {
            lastMatrixStack = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
            matrix = osg.Matrix.mult(lastMatrixStack, node.getViewMatrix());
            this.pushModelviewMatrix(matrix);
        }

        if (node.getProjectionMatrix) {
            lastMatrixStack = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
            matrix = osg.Matrix.mult(lastMatrixStack, node.getProjectionMatrix());
            this.pushProjectionMatrix(matrix);
        }


        if (node.drawImplementation) {
            matrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
            var bb = node.getBoundingBox();
            if (this.computeNearFar && bb.valid()) {
                if (!this.updateCalculatedNearFar(matrix,node)) {
                    if (node.traverse) {
                        this.traverse(node);
                        if (node.getMatrix || node.getViewMatrix !== undefined) {
                            this.popModelviewMatrix();
                        }
                    }
                    return;
                }
            }
        }

        if (node.stateset) {
            this.pushStateSet(node.stateset);
        }
        if (node.light) {
            this.addPositionedAttribute(node.light);
        }

        if (node.drawImplementation) {

            var leafs = this.currentStateGraph.leafs;
            if (leafs.length === 0) {
                this.currentRenderBin.addStateGraph(this.currentStateGraph);
            }
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
})));

osg.ParseSceneGraph = function (node)
{
    var newnode;
    if (node.primitives) {
        newnode = osg.Geometry.create();
        jQuery.extend(newnode, node);
        node = newnode;

        var i;
        for ( i in node.primitives) {
            var mode = node.primitives[i].mode;
            if (node.primitives[i].indices) {
                var array = node.primitives[i].indices;
                array = osg.BufferArray.create(gl[array.type], array.elements, array.itemSize );
                if (!mode) {
                    mode = gl.TRIANGLES;
                } else {
                    mode = gl[mode];
                }
                node.primitives[i] = osg.DrawElements.create(mode, array);
            } else {
                mode = gl[mode];
                var first = node.primitives[i].first;
                var count = node.primitives[i].count;
                if (count > 65535) {
                    count = 32740;
		}
                node.primitives[i] = new osg.DrawArrays(mode, first, count);
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
            for (var t = 0, tl = textures.length; t < tl; t++) {
                if (!textures[t].file) {
                    if (console !== undefined) {
                        console.log("no 'file' field for texture " + textures[t]);
                    }
                    continue;
                }
                var tex = new osg.Texture();
                jQuery.extend(tex, textures[t]);
                var img = new Image();
                img.src = textures[t].file;
                tex.setImage(img);
                
                //var tex = osg.Texture.create(textures[t].file);
                newstateset.setTexture(t, tex);
                newstateset.addUniform(osg.Uniform.createInt1(t,"Texture" + t));
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

        if (node.children === undefined) {
            newnode = new osg.Node();
            jQuery.extend(newnode, node);
            node = newnode;
        }

        for (var child = 0, childLength = node.children.length; child < childLength; child++) {
            node.children[child] = osg.ParseSceneGraph(node.children[child]);
        }
    }

    // no properties then we create a node by default
    if (node.accept === undefined) {
        newnode = new osg.Node();
        jQuery.extend(newnode, node);
        node = newnode;
    }

    return node;
};


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

osg.WGS_84_RADIUS_EQUATOR = 6378137.0;
osg.WGS_84_RADIUS_POLAR = 6356752.3142;

osg.EllipsoidModel = function() {
    this._radiusEquator = osg.WGS_84_RADIUS_EQUATOR;
    this._radiusPolar = osg.WGS_84_RADIUS_POLAR;
    this.computeCoefficients();
};
osg.EllipsoidModel.prototype = {
    setRadiusEquator: function(r) { this._radiusEquator = radius; this.computeCoefficients();},
    getRadiusEquator: function() { return this._radiusEquator;},
    setRadiusPolar: function(radius) { this._radiusPolar = radius; 
                                              this.computeCoefficients(); },
    getRadiusPolar: function() { return this._radiusPolar; },
    convertLatLongHeightToXYZ: function ( latitude, longitude, height ) {
        var sin_latitude = Math.sin(latitude);
        var cos_latitude = Math.cos(latitude);
        var N = this._radiusEquator / Math.sqrt( 1.0 - this._eccentricitySquared*sin_latitude*sin_latitude);
        var X = (N+height)*cos_latitude*Math.cos(longitude);
        var Y = (N+height)*cos_latitude*Math.sin(longitude);
        var Z = (N*(1-this._eccentricitySquared)+height)*sin_latitude;
        return [X, Y, Z];
    },
    convertXYZToLatLongHeight: function ( X,  Y,  Z ) {
        // http://www.colorado.edu/geography/gcraft/notes/datum/gif/xyzllh.gif
        var p = Math.sqrt(X*X + Y*Y);
        var theta = Math.atan2(Z*this._radiusEquator , (p*this._radiusPolar));
        var eDashSquared = (this._radiusEquator*this._radiusEquator - this._radiusPolar*this._radiusPolar)/ (this._radiusPolar*this._radiusPolar);

        var sin_theta = Math.sin(theta);
        var cos_theta = Math.cos(theta);

        latitude = Math.atan( (Z + eDashSquared*this._radiusPolar*sin_theta*sin_theta*sin_theta) /
                         (p - this._eccentricitySquared*this._radiusEquator*cos_theta*cos_theta*cos_theta) );
        longitude = Math.atan2(Y,X);

        var sin_latitude = Math.sin(latitude);
        var N = this._radiusEquator / Math.sqrt( 1.0 - this._eccentricitySquared*sin_latitude*sin_latitude);

        height = p/Math.cos(latitude) - N;
        return [latitude, longitude, height];
    },
    computeLocalUpVector: function(X, Y, Z) {
        // Note latitude is angle between normal to ellipsoid surface and XY-plane
        var  latitude, longitude, altitude;
        var coord = this.convertXYZToLatLongHeight(X,Y,Z,latitude,longitude,altitude);
        latitude = coord[0];
        longitude = coord[1];
        altitude = coord[2];

        // Compute up vector
        return [ Math.cos(longitude) * Math.cos(latitude),
                 Math.sin(longitude) * Math.cos(latitude),
                 Math.sin(latitude) ];
    },
    isWGS84: function() { return(this._radiusEquator == osg.WGS_84_RADIUS_EQUATOR && this._radiusPolar == osg.WGS_84_RADIUS_POLAR);},

    computeCoefficients: function() {
        var flattening = (this._radiusEquator-this._radiusPolar)/this._radiusEquator;
        this._eccentricitySquared = 2*flattening - flattening*flattening;
    },
    computeLocalToWorldTransformFromLatLongHeight : function(latitude, longitude, height) {
        var pos = this.convertLatLongHeightToXYZ(latitude, longitude, height);
        var m = osg.Matrix.makeTranslate(pos[0], pos[1], pos[2]);
        this.computeCoordinateFrame(latitude, longitude, m);
        return m;
    },
    computeLocalToWorldTransformFromXYZ : function(X, Y, Z) {
        var lla = this.convertXYZToLatLongHeight(X, Y, Z);
        var m = osg.Matrix.makeTranslate(X, Y, Z);
        this.computeCoordinateFrame(lla[0], lla[1], m);
        return m;
    },
    computeCoordinateFrame: function ( latitude,  longitude, localToWorld) {
        // Compute up vector
        var  up = [ Math.cos(longitude)*Math.cos(latitude), Math.sin(longitude)*Math.cos(latitude), Math.sin(latitude) ];

        // Compute east vector
        var east = [-Math.sin(longitude), Math.cos(longitude), 0];

        // Compute north vector = outer product up x east
        var north = osg.Vec3.cross(up,east);

        // set matrix
        osg.Matrix.set(localToWorld,0,0, east[0]);
        osg.Matrix.set(localToWorld,0,1, east[1]);
        osg.Matrix.set(localToWorld,0,2, east[2]);

        osg.Matrix.set(localToWorld,1,0, north[0]);
        osg.Matrix.set(localToWorld,1,1, north[1]);
        osg.Matrix.set(localToWorld,1,2, north[2]);

        osg.Matrix.set(localToWorld,2,0, up[0]);
        osg.Matrix.set(localToWorld,2,1, up[1]);
        osg.Matrix.set(localToWorld,2,2, up[2]);
    }
};

osg.createTexturedQuad = function(cornerx, cornery, cornerz,
                                  wx, wy, wz,
                                  hx, hy, hz,
                                  l,b,r,t) {

    if (r === undefined && t === undefined) {
        r = l;
        t = b;
        l = 0;
        b = 0;
    }

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

    if (r === undefined) {
        r = 1.0;
    }
    if (t === undefined) {
        t = 1.0;
    }

    var uvs = [];
    uvs[0] = l;
    uvs[1] = t;

    uvs[2] = l;
    uvs[3] = b;

    uvs[4] = r;
    uvs[5] = b;

    uvs[6] = r;
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
osg.createTexuredQuad = osg.createTexturedQuad;
