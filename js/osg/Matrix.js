

/** @class Matrix Operations */
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

    /**
     * @param {Number} x position
     * @param {Number} y position
     * @param {Number} z position
     * @param {Array} matrix to write result
     */
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

    // do a * b and result in a
    preMult: function(a, b) {
        var atmp0, atmp1, atmp2, atmp3;

        atmp0 = (b[0] * a[0]) + (b[1] * a[4]) + (b[2] * a[8]) + (b[3] * a[12]);
        atmp1 = (b[4] * a[0]) + (b[5] * a[4]) + (b[6] * a[8]) + (b[7] * a[12]);
        atmp2 = (b[8] * a[0]) + (b[9] * a[4]) + (b[10] * a[8]) + (b[11] * a[12]);
        atmp3 = (b[12] * a[0]) + (b[13] * a[4]) + (b[14] * a[8]) + (b[15] * a[12]);
        a[0]  = atmp0;
        a[4]  = atmp1;
        a[8]  = atmp2;
        a[12] = atmp3;

        atmp0 = (b[0] * a[1]) + (b[1] * a[5]) + (b[2] * a[9]) + (b[3] * a[13]);
        atmp1 = (b[4] * a[1]) + (b[5] * a[5]) + (b[6] * a[9]) + (b[7] * a[13]);
        atmp2 = (b[8] * a[1]) + (b[9] * a[5]) + (b[10] * a[9]) + (b[11] * a[13]);
        atmp3 = (b[12] * a[1]) + (b[13] * a[5]) + (b[14] * a[9]) + (b[15] * a[13]);
        a[1]  = atmp0;
        a[5]  = atmp1;
        a[9]  = atmp2;
        a[13] = atmp3;

        atmp0 = (b[0] * a[2]) + (b[1] * a[6]) + (b[2] * a[10]) + (b[3] * a[14]);
        atmp1 = (b[4] * a[2]) + (b[5] * a[6]) + (b[6] * a[10]) + (b[7] * a[14]);
        atmp2 = (b[8] * a[2]) + (b[9] * a[6]) + (b[10] * a[10]) + (b[11] * a[14]);
        atmp3 = (b[12] * a[2]) + (b[13] * a[6]) + (b[14] * a[10]) + (b[15] * a[14]);
        a[2]  = atmp0;
        a[6]  = atmp1;
        a[10] = atmp2;
        a[14] = atmp3;

        atmp0 = (b[0] * a[3]) + (b[1] * a[7]) + (b[2] * a[11]) + (b[3] * a[15]);
        atmp1 = (b[4] * a[3]) + (b[5] * a[7]) + (b[6] * a[11]) + (b[7] * a[15]);
        atmp2 = (b[8] * a[3]) + (b[9] * a[7]) + (b[10] * a[11]) + (b[11] * a[15]);
        atmp3 = (b[12] * a[3]) + (b[13] * a[7]) + (b[14] * a[11]) + (b[15] * a[15]);
        a[3]  = atmp0;
        a[7]  = atmp1;
        a[11] = atmp2;
        a[15] = atmp3;

        return a;
    },

    // do a * b and result in b
    postMult: function(a, b) {
        // post mult
        btmp0 = (b[0] * a[0]) + (b[1] * a[4]) + (b[2] * a[8]) + (b[3] * a[12]);
        btmp1 = (b[0] * a[1]) + (b[1] * a[5]) + (b[2] * a[9]) + (b[3] * a[13]);
        btmp2 = (b[0] * a[2]) + (b[1] * a[6]) + (b[2] * a[10]) + (b[3] * a[14]);
        btmp3 = (b[0] * a[3]) + (b[1] * a[7]) + (b[2] * a[11]) + (b[3] * a[15]);
        b[0 ] = btmp0;
        b[1 ] = btmp1;
        b[2 ] = btmp2;
        b[3 ] = btmp3;

        btmp0 = (b[4] * a[0]) + (b[5] * a[4]) + (b[6] * a[8]) + (b[7] * a[12]);
        btmp1 = (b[4] * a[1]) + (b[5] * a[5]) + (b[6] * a[9]) + (b[7] * a[13]);
        btmp2 = (b[4] * a[2]) + (b[5] * a[6]) + (b[6] * a[10]) + (b[7] * a[14]);
        btmp3 = (b[4] * a[3]) + (b[5] * a[7]) + (b[6] * a[11]) + (b[7] * a[15]);
        b[4 ] = btmp0;
        b[5 ] = btmp1;
        b[6 ] = btmp2;
        b[7 ] = btmp3;

        btmp0 = (b[8] * a[0]) + (b[9] * a[4]) + (b[10] * a[8]) + (b[11] * a[12]);
        btmp1 = (b[8] * a[1]) + (b[9] * a[5]) + (b[10] * a[9]) + (b[11] * a[13]);
        btmp2 = (b[8] * a[2]) + (b[9] * a[6]) + (b[10] * a[10]) + (b[11] * a[14]);
        btmp3 = (b[8] * a[3]) + (b[9] * a[7]) + (b[10] * a[11]) + (b[11] * a[15]);
        b[8 ] = btmp0;
        b[9 ] = btmp1;
        b[10] = btmp2;
        b[11] = btmp3;

        btmp0 = (b[12] * a[0]) + (b[13] * a[4]) + (b[14] * a[8]) + (b[15] * a[12]);
        btmp1 = (b[12] * a[1]) + (b[13] * a[5]) + (b[14] * a[9]) + (b[15] * a[13]);
        btmp2 = (b[12] * a[2]) + (b[13] * a[6]) + (b[14] * a[10]) + (b[15] * a[14]);
        btmp3 = (b[12] * a[3]) + (b[13] * a[7]) + (b[14] * a[11]) + (b[15] * a[15]);
        b[12] = btmp0;
        b[13] = btmp1;
        b[14] = btmp2;
        b[15] = btmp3;

        return b;
    },
    multa: function(a, b, r) {
        if (r === a) {
            return this.preMult(a,b);
        } else if (r === b) {
            return this.postMult(a,b);
        } else {
            if (r === undefined) {
                r = [];
            }
            r[0] =  b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12];
            r[1] =  b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13];
            r[2] =  b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14];
            r[3] =  b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15];

            r[4] =  b[4] * a[0] + b[5] * a[4] + b[6] * a[8] + b[7] * a[12];
            r[5] =  b[4] * a[1] + b[5] * a[5] + b[6] * a[9] + b[7] * a[13];
            r[6] =  b[4] * a[2] + b[5] * a[6] + b[6] * a[10] + b[7] * a[14];
            r[7] =  b[4] * a[3] + b[5] * a[7] + b[6] * a[11] + b[7] * a[15];

            r[8] =  b[8] * a[0] + b[9] * a[4] + b[10] * a[8] + b[11] * a[12];
            r[9] =  b[8] * a[1] + b[9] * a[5] + b[10] * a[9] + b[11] * a[13];
            r[10] = b[8] * a[2] + b[9] * a[6] + b[10] * a[10] + b[11] * a[14];
            r[11] = b[8] * a[3] + b[9] * a[7] + b[10] * a[11] + b[11] * a[15];

            r[12] = b[12] * a[0] + b[13] * a[4] + b[14] * a[8] + b[15] * a[12];
            r[13] = b[12] * a[1] + b[13] * a[5] + b[14] * a[9] + b[15] * a[13];
            r[14] = b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14];
            r[15] = b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15];

            return r;
        }
    },
    /* r = a * b */
    mult: function(a, b, r) {
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
    multOrig: function(a, b, r) {
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
        } else if (r === b) {
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

        var f = osg.Vec3.sub(center, eye, []);
        osg.Vec3.normalize(f, f);

        var s = osg.Vec3.cross(f, up, []);
        osg.Vec3.normalize(s, s);

        var u = osg.Vec3.cross(s, f, []);
        osg.Vec3.normalize(u, u);

        // s[0], u[0], -f[0], 0.0,
        // s[1], u[1], -f[1], 0.0,
        // s[2], u[2], -f[2], 0.0,
        // 0,    0,    0,     1.0

        result[0]=s[0]; result[1]=u[0]; result[2]=-f[0]; result[3]=0.0;
        result[4]=s[1]; result[5]=u[1]; result[6]=-f[1]; result[7]=0.0;
        result[8]=s[2]; result[9]=u[2]; result[10]=-f[2];result[11]=0.0;
        result[12]=  0; result[13]=  0; result[14]=  0;  result[15]=1.0;

        osg.Matrix.multTranslate(result, osg.Vec3.neg(eye, []), result);
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
        var inv = [];
        var result = osg.Matrix.inverse(matrix, inv);
        if (!result) {
            osg.Matrix.makeIdentity(inv);
        }
        osg.Matrix.transformVec3(inv, [0,0,0], eye);
        osg.Matrix.transform3x3(matrix, [0,1,0], up);
        osg.Matrix.transform3x3(matrix, [0,0,-1], center);
        osg.Vec3.normalize(center, center);
        osg.Vec3.add(osg.Vec3.mult(center, distance, [] ), eye, center);
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

    transpose: function(mat, dest) {
        // from glMatrix
        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if(mat === dest) {
            var a01 = mat[1], a02 = mat[2], a03 = mat[3];
            var a12 = mat[6], a13 = mat[7];
            var a23 = mat[11];
            
            mat[1] = mat[4];
            mat[2] = mat[8];
            mat[3] = mat[12];
            mat[4] = a01;
            mat[6] = mat[9];
            mat[7] = mat[13];
            mat[8] = a02;
            mat[9] = a12;
            mat[11] = mat[14];
            mat[12] = a03;
            mat[13] = a13;
            mat[14] = a23;
            return mat;
        } else {
            dest[0] = mat[0];
            dest[1] = mat[4];
            dest[2] = mat[8];
            dest[3] = mat[12];
            dest[4] = mat[1];
            dest[5] = mat[5];
            dest[6] = mat[9];
            dest[7] = mat[13];
            dest[8] = mat[2];
            dest[9] = mat[6];
            dest[10] = mat[10];
            dest[11] = mat[14];
            dest[12] = mat[3];
            dest[13] = mat[7];
            dest[14] = mat[11];
            dest[15] = mat[15];
            return dest;
        }
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
