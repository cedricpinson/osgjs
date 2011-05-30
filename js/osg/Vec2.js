
/** @class Vec2 Operations */
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

    /** 
        normalize an Array of 2 elements and write it in result 
     */
    normalize: function(a, result) {
        if (result === undefined) {
            result = [];
        }

        var norm = this.length2(a);
        if (norm > 0.0) {
            var inv = 1.0/Math.sqrt(norm);
            result[0] = a[0] * inv;
            result[1] = a[1] * inv;
        } else {
            result[0] = a[0];
            result[1] = a[1];
        }
        return result;
    },

    /** 
        return the dot product 
    */
    dot: function(a, b) {
        return a[0]*b[0]+a[1]*b[1];
    },

    /**
       Compute a - b and put the result in r
       @param Array a
       @param Array b
       @param Array result
       @type osg.Vec2
     */
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