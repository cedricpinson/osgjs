
/** @class Vec4 Operations */
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
