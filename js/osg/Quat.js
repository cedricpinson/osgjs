
/** @class Quaternion Operations */
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
    // multiply 2 quaternions
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
