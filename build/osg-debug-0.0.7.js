// osg-debug-0.0.7.js commit 441b6ca43bbf3686aeace2f888796b2c3c9e0ba4 - http://github.com/cedricpinson/osgjs
/** -*- compile-command: "jslint-cli osg.js" -*- */
var osg = {};

osg.version = '0.0.7';
osg.copyright = 'Cedric Pinson - cedric.pinson@plopbyte.com';
osg.instance = 0;
osg.version = 0;
osg.log = function (str) {
    if (window.console !== undefined) {
        window.console.log(str);
    }
};
osg.info = function (str) { osg.log(str); };
osg.debug = function (str) { osg.log(str); };

osg.DEBUG = 0;
osg.INFO = 1;
osg.NOTICE = 2;
osg.setNotifyLevel = function (level) {
    var log = function (str) {
        if (window.console !== undefined) {
            window.console.log(str);
        }
    };
    var dummy = function () {};

    osg.debug = dummy;
    osg.info = dummy;
    osg.log = dummy;

    if (level <= osg.DEBUG) {
        osg.debug = log;
    }
    if (level <= osg.INFO) {
        osg.info = log;
    }
    if (level <= osg.NOTICE) {
        osg.log = log;
    }
};

osg.reportErrorGL = false;
osg.ReportWebGLError = false;

osg.init = function () {
    osg.setNotifyLevel(osg.NOTICE);
};

osg.checkError = function (error) {
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

// from jquery
osg.isArray = function ( obj ) {
    return toString.call(obj) === "[object Array]";
};

osg.extend = function () {
    // Save a reference to some core methods
    var toString = Object.prototype.toString,
    hasOwnPropertyFunc = Object.prototype.hasOwnProperty;

    var isFunction = function (obj) {
        return toString.call(obj) === "[object Function]";
    };
    var isArray = osg.isArray;
    var isPlainObject = function ( obj ) {
	// Must be an Object.
	// Because of IE, we also have to check the presence of the constructor property.
	// Make sure that DOM nodes and window objects don't pass through, as well
	if ( !obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval ) {
            return false;
	}
	
	// Not own constructor property must be Object
	if ( obj.constructor && 
             !hasOwnPropertyFunc.call(obj, "constructor") && 
             !hasOwnPropertyFunc.call(obj.constructor.prototype, "isPrototypeOf") ) {
            return false;
	}
	
	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	
	var key;
	for ( key in obj ) {}
	
	return key === undefined || hasOwnPropertyFunc.call( obj, key );
    };

    // copy reference to target object
    var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

    // Handle a deep copy situation
    if ( typeof target === "boolean" ) {
	deep = target;
	target = arguments[1] || {};
	// skip the boolean and the target
	i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && !isFunction (target) ) {
	target = {};
    }

    // extend jQuery itself if only one argument is passed
    if ( length === i ) {
	target = this;
	--i;
    }

    for ( ; i < length; i++ ) {
	// Only deal with non-null/undefined values
	if ( (options = arguments[ i ]) !== null ) {
            // Extend the base object
            for ( name in options ) {
		src = target[ name ];
		copy = options[ name ];

		// Prevent never-ending loop
		if ( target === copy ) {
                    continue;
		}

		// Recurse if we're merging object literal values or arrays
		if ( deep && copy && ( isPlainObject(copy) || isArray(copy) ) ) {
                    var clone = src && ( isPlainObject(src) || isArray(src) ) ? src
			: isArray(copy) ? [] : {};

                    // Never move original objects, clone them
                    target[ name ] = osg.extend( deep, clone, copy );

                    // Don't bring in undefined values
		} else if ( copy !== undefined ) {
                    target[ name ] = copy;
		}
            }
	}
    }

    // Return the modified object
    return target;
};


osg.objectInehrit = function (base, extras) {
    function F(){}
    F.prototype = base;
    var obj = new F();
    if(extras)  {osg.objectMix(obj, extras, false); }
    return obj;
};
osg.objectMix = function (obj, properties, test){
    for (var key in properties) {
        if(!(test && obj[key])) { obj[key] = properties[key]; }
    }
    return obj;
};

osg.objectType = {};
osg.objectType.type = 0;
osg.objectType.generate = function (arg) {
    var t = osg.objectType.type;
    osg.objectType[t] = arg;
    osg.objectType[arg] = t;
    osg.objectType.type += 1;
    return t;
};

osg.Float32Array = Float32Array;
osg.Int32Array = Int32Array;
osg.Uint16Array = Uint16Array;


/** @class Vec2 Operations */
osg.Vec2 = {
    copy: function(a, r) {
        r[0] = a[0];
        r[1] = a[1];
        return r;
    },

    valid: function(a) {
        if (isNaN(a[0])) {
            return false;
        }
        if (isNaN(a[1])) {
            return false;
        }
        return true;
    },

    mult: function(a, b, r) {
        r[0] = a[0] * b;
        r[1] = a[1] * b;
        return r;
    },

    length2: function(a) {
        return a[0]*a[0] + a[1]*a[1];
    },

    length: function(a) {
        return Math.sqrt( a[0]*a[0] + a[1]* a[1]);
    },

    /** 
        normalize an Array of 2 elements and write it in r
     */
    normalize: function(a, r) {
        var norm = this.length2(a);
        if (norm > 0.0) {
            var inv = 1.0/Math.sqrt(norm);
            r[0] = a[0] * inv;
            r[1] = a[1] * inv;
        } else {
            r[0] = a[0];
            r[1] = a[1];
        }
        return r;
    },

    /** 
        Compute the dot product 
    */
    dot: function(a, b) {
        return a[0]*b[0]+a[1]*b[1];
    },

    /**
       Compute a - b and put the result in r
     */
    sub: function(a, b, r) {
        r[0] = a[0]-b[0];
        r[1] = a[1]-b[1];
        return r;
    },

    add: function(a, b, r) {
        r[0] = a[0]+b[0];
        r[1] = a[1]+b[1];
        return r;
    },

    neg: function(a, r) {
        r[0] = -a[0];
        r[1] = -a[1];
        return r;
    },

    lerp: function(t, a, b, r) {
        var tmp = 1.0-t;
        r[0] = a[0]*tmp + t*b[0];
        r[1] = a[1]*tmp + t*b[1];
        return r;
    }

};
/** @class Vec3 Operations */
osg.Vec3 = {
    copy: function(a, r) {
        r[0] = a[0];
        r[1] = a[1];
        r[2] = a[2];
        return r;
    },

    cross: function(a, b, r) {
        r[0] = a[1]*b[2]-a[2]*b[1];
        r[1] = a[2]*b[0]-a[0]*b[2];
        r[2] = a[0]*b[1]-a[1]*b[0];
        return r;
    },

    valid: function(a) {
        if (isNaN(a[0])) {
            return false;
        }
        if (isNaN(a[1])) {
            return false;
        }
        if (isNaN(a[2])) {
            return false;
        }
        return true;
    },

    mult: function(a, b, r) {
        r[0] = a[0] * b;
        r[1] = a[1] * b;
        r[2] = a[2] * b;
        return r;
    },

    length2: function(a) {
        return a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
    },

    length: function(a) {
        return Math.sqrt( a[0]*a[0] + a[1]* a[1] + a[2]*a[2] );
    },

    normalize: function(a, r) {
        var norm = this.length2(a);
        if (norm > 0.0) {
            var inv = 1.0/Math.sqrt(norm);
            r[0] = a[0] * inv;
            r[1] = a[1] * inv;
            r[2] = a[2] * inv;
        } else {
            r[0] = a[0];
            r[1] = a[1];
            r[2] = a[2];
        }
        return r;
    },

    dot: function(a, b) {
        return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    },

    sub: function(a, b, r) {
        r[0] = a[0]-b[0];
        r[1] = a[1]-b[1];
        r[2] = a[2]-b[2];
        return r;
    },

    add: function(a, b, r) {
        r[0] = a[0]+b[0];
        r[1] = a[1]+b[1];
        r[2] = a[2]+b[2];
        return r;
    },

    neg: function(a, r) {
        r[0] = -a[0];
        r[1] = -a[1];
        r[2] = -a[2];
        return r;
    },

    lerp: function(t, a, b, r) {
        r[0] = a[0] + (b[0]-a[0])*t;
        r[1] = a[1] + (b[1]-a[1])*t;
        r[2] = a[2] + (b[2]-a[2])*t;
        return r;
    }

};



/** @class Vec4 Operations */
osg.Vec4 = {

    dot: function(a, b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
    },

    copy: function(a, r) {
        r[0] = a[0];
        r[1] = a[1];
        r[2] = a[2];
        r[3] = a[3];
        return r;
    },

    sub: function(a, b, r) {
        r[0] = a[0] - b[0];
        r[1] = a[1] - b[1];
        r[2] = a[2] - b[2];
        r[3] = a[3] - b[3];
        return r;
    },

    mult: function(a, b, result) {
        r[0] = a[0] * b;
        r[1] = a[1] * b;
        r[2] = a[2] * b;
        r[3] = a[3] * b;
        return r;
    },

    add: function(a, b, r) {
        r[0] = a[0] + b[0];
        r[1] = a[1] + b[1];
        r[2] = a[2] + b[2];
        r[3] = a[3] + b[3];
        return r;
    },

    neg: function(a, r) {
        r[0] = -a[0];
        r[1] = -a[1];
        r[2] = -a[2];
        r[3] = -a[3];
        return r;
    },

    lerp: function(t, a, b, r) {
        var tmp = 1.0-t;
        r[0] = a[0]*tmp + t*b[0];
        r[1] = a[1]*tmp + t*b[1];
        r[2] = a[2]*tmp + t*b[2];
        r[3] = a[3]*tmp + t*b[3];
        return r;
    }
};
/** -*- compile-command: "jslint-cli Object.js" -*- */

/** 
 *  Object class
 *  @class Object
 */
osg.Object = function () {};

/** @lends osg.Node.prototype */
osg.Object.prototype = {
    setName: function(name) { this._name = name; },
    getName: function() { return this._name; }
};


/** @class Matrix Operations */
osg.Matrix = {
    _tmp0: [],
    _tmp1: [],
    valid: function(matrix) {
        for (var i = 0; i < 16; i++) {
            if (isNaN(matrix[i])) {
                return false;
            }
        }
        return true;
    },
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
            osg.log("osg.Matrix.makeIdentity without matrix destination is deprecated"); 
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
    getRotate: function (mat, quatResult) {
        if (quatResult === undefined) {
            quatResult = [];
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
            quatResult[3] = tq[0];
            quatResult[0] = mat[1*4+2]-mat[2*4+1];
            quatResult[1] = mat[2*4+0]-mat[0  +2]; 
            quatResult[2] = mat[0  +1]-mat[1*4+0]; 
        }
        else if (j==1)
        {
            quatResult[3] = mat[1*4+2]-mat[2*4+1]; 
            quatResult[0] = tq[1];
            quatResult[1] = mat[0  +1]+mat[1*4+0]; 
            quatResult[2] = mat[2*4+0]+mat[0  +2];
        }
        else if (j==2)
        {
            quatResult[3] = mat[2*4+0]-mat[0+2]; 
            quatResult[0] = mat[0  +1]+mat[1*4+0]; 
            quatResult[1] = tq[2];
            quatResult[2] = mat[1*4+2]+mat[2*4+1]; 
        }
        else /* if (j==3) */
        {
            quatResult[3] = mat[0  +1]-mat[1*4+0]; 
            quatResult[0] = mat[2*4+0]+mat[0  +2]; 
            quatResult[1] = mat[1*4+2]+mat[2*4+1];
            quatResult[2] = tq[3];
        }

        s = Math.sqrt(0.25/tq[j]);
        quatResult[3] *= s;
        quatResult[0] *= s;
        quatResult[1] *= s;
        quatResult[2] *= s;

        return quatResult;
    },

    // Matrix M = Matrix M * Matrix Translate
    preMultTranslate: function(mat, translate) {
        if (translate[0] !== 0.0) {
            val = translate[0];
            mat[12] += val * mat[0];
            mat[13] += val * mat[1];
            mat[14] += val * mat[2];
            mat[15] += val * mat[3];
        }

        if (translate[1] !== 0.0) {
            val = translate[1];
            mat[12] += val * mat[4];
            mat[13] += val * mat[5];
            mat[14] += val * mat[6];
            mat[15] += val * mat[7];
        }

        if (translate[2] !== 0.0) {
            val = translate[2];
            mat[12] += val * mat[8];
            mat[13] += val * mat[9];
            mat[14] += val * mat[10];
            mat[15] += val * mat[11];
        }
        return mat;
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
            osg.log("osg.makeRotate without given matrix destination is deprecated");
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
        } else {
            return osg.Matrix.makeIdentity(result);
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

    inverse: function(matrix, result) {
        if (result === matrix) {
            osg.Matrix.copy(matrix, osg.Matrix._tmp1);
            matrix = osg.Matrix._tmp1;
        }
        
        if (matrix[3] === 0.0 && matrix[7] === 0.0 && matrix[11] === 0.0 && matrix[15] === 1.0) {
            return this.inverse4x3(matrix,result);
        } else {
            return this.inverse4x4(matrix,result);
        }
    },

    /**
     *  if a result argument is given the return of the function is true or false
     *  depending if the matrix can be inverted, else if no result argument is given
     *  the return is identity if the matrix can not be inverted and the matrix overthise
     */
    inverse4x4: function(matrix, result) {
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
            return false;
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

        return true;
    },

    // comes from OpenSceneGraph
    /*
      Matrix inversion technique:
      Given a matrix mat, we want to invert it.
      mat = [ r00 r01 r02 a
              r10 r11 r12 b
              r20 r21 r22 c
              tx  ty  tz  d ]
      We note that this matrix can be split into three matrices.
      mat = rot * trans * corr, where rot is rotation part, trans is translation part, and corr is the correction due to perspective (if any).
      rot = [ r00 r01 r02 0
              r10 r11 r12 0
              r20 r21 r22 0
              0   0   0   1 ]
      trans = [ 1  0  0  0
                0  1  0  0
                0  0  1  0
                tx ty tz 1 ]
      corr = [ 1 0 0 px
               0 1 0 py
               0 0 1 pz
               0 0 0 s ]

      where the elements of corr are obtained from linear combinations of the elements of rot, trans, and mat.
      So the inverse is mat' = (trans * corr)' * rot', where rot' must be computed the traditional way, which is easy since it is only a 3x3 matrix.
      This problem is simplified if [px py pz s] = [0 0 0 1], which will happen if mat was composed only of rotations, scales, and translations (which is common).  In this case, we can ignore corr entirely which saves on a lot of computations.
    */

    inverse4x3: function(matrix, result) {

        // Copy rotation components
        var r00 = matrix[0];
        var r01 = matrix[1];
        var r02 = matrix[2];

        var r10 = matrix[4];
        var r11 = matrix[5];
        var r12 = matrix[6];

        var r20 = matrix[8];
        var r21 = matrix[9];
        var r22 = matrix[10];

        // Partially compute inverse of rot
        result[0] = r11*r22 - r12*r21;
        result[1] = r02*r21 - r01*r22;
        result[2] = r01*r12 - r02*r11;

        // Compute determinant of rot from 3 elements just computed
        var one_over_det = 1.0/(r00*result[0] + r10*result[1] + r20*result[2]);
        r00 *= one_over_det; r10 *= one_over_det; r20 *= one_over_det;  // Saves on later computations

        // Finish computing inverse of rot
        result[0] *= one_over_det;
        result[1] *= one_over_det;
        result[2] *= one_over_det;
        result[3] = 0.0;
        result[4] = r12*r20 - r10*r22; // Have already been divided by det
        result[5] = r00*r22 - r02*r20; // same
        result[6] = r02*r10 - r00*r12; // same
        result[7] = 0.0;
        result[8] = r10*r21 - r11*r20; // Have already been divided by det
        result[9] = r01*r20 - r00*r21; // same
        result[10] = r00*r11 - r01*r10; // same
        result[11] = 0.0;
        result[15] = 1.0;

        var tx,ty,tz;

        var d  = matrix[15];
        var dm = d-1.0;
        if( dm*dm > 1.0e-6 )  // Involves perspective, so we must
        {                       // compute the full inverse
            
            var inv = osg.Matrix._tmp0;
            result[12] = result[13] = result[14] = 0.0;

            var a  = matrix[3]; 
            var b  = matrix[7]; 
            var c  = matrix[11];
            var px = result[0]*a + result[1]*b + result[2] *c;
            var py = result[4]*a + result[5]*b + result[6] *c;
            var pz = result[8]*a + result[9]*b + result[10]*c;

            tx = matrix[12]; 
            ty = matrix[13]; 
            tz = matrix[14];
            var one_over_s  = 1.0/(d - (tx*px + ty*py + tz*pz));

            tx *= one_over_s; 
            ty *= one_over_s; 
            tz *= one_over_s;  // Reduces number of calculations later on

            // Compute inverse of trans*corr
            inv[0] = tx*px + 1.0;
            inv[1] = ty*px;
            inv[2] = tz*px;
            inv[3] = -px * one_over_s;
            inv[4] = tx*py;
            inv[5] = ty*py + 1.0;
            inv[6] = tz*py;
            inv[7] = -py * one_over_s;
            inv[8] = tx*pz;
            inv[9] = ty*pz;
            inv[10] = tz*pz + 1.0;
            inv[11] = -pz * one_over_s;
            inv[12] = -tx;
            inv[13] = -ty;
            inv[14] = -tz;
            inv[15] = one_over_s;

            osg.Matrix.preMult(result, inv); // Finish computing full inverse of mat
        } else {

            tx = matrix[12]; 
            ty = matrix[13]; 
            tz = matrix[14];

            // Compute translation components of mat'
            result[12] = -(tx*result[0] + ty*result[4] + tz*result[8]);
            result[13] = -(tx*result[1] + ty*result[5] + tz*result[9]);
            result[14] = -(tx*result[2] + ty*result[6] + tz*result[10]);
        }
        return true;

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
osg.ShaderGeneratorType = {
    VertexInit: 0,
    VertexFunction: 1,
    VertexMain: 2,
    VertexEnd: 3,
    FragmentInit: 5,
    FragmentFunction: 6,
    FragmentMain: 7,
    FragmentEnd: 8
};

/** 
 * Shader manage shader for vertex and fragment, you need both to create a glsl program.
 * @class Shader
 */
osg.Shader = function(type, text) {
    this.type = type;
    this.setText(text);
};

osg.Shader.VERTEX_SHADER = 0x8B31;
osg.Shader.FRAGMENT_SHADER = 0x8B30;

/** @lends osg.Shader.prototype */
osg.Shader.prototype = {
    setText: function(text) { this.text = text; },
    getText: function() { return this.text; },
    compile: function() {
        this.shader = gl.createShader(this.type);
        gl.shaderSource(this.shader, this.text);
        gl.compileShader(this.shader);
        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
            osg.log("can't compile shader:\n" + this.text + "\n");
            var tmpText = "\n" + this.text;
            var splittedText = tmpText.split("\n");
            var newText = "\n";
            for (var i = 0, l = splittedText.length; i < l; ++i ) {
                newText += i + " " + splittedText[i] + "\n";
            }
            osg.log(newText);
            osg.log(gl.getShaderInfoLog(this.shader));
        }
    }
};

osg.Shader.create = function( type, text )
{
    osg.log("osg.Shader.create is deprecated, use new osg.Shader with the same arguments instead");
    return new osg.Shader(type, text);
};
/** 
 * StateAttribute base class
 * @class StateAttribute
 */
osg.StateAttribute = function() {
    osg.Object.call(this);
    this._dirty = true;
};

/** @lends osg.StateAttribute.prototype */
osg.StateAttribute.prototype = osg.objectInehrit(osg.Object.prototype, {
    isDirty: function() { return this._dirty; },
    dirty: function() { this._dirty = true; },
    setDirty: function(dirty) { this._dirty = dirty; }
});

osg.StateAttribute.OFF = 0;
osg.StateAttribute.ON = 1;
osg.StateAttribute.OVERRIDE = 2;
osg.StateAttribute.PROTECTED = 4;
osg.StateAttribute.INHERIT = 8;
/** -*- compile-command: "jslint-cli Uniform.js" -*- */

/** 
 * Uniform manage variable used in glsl shader.
 * @class Uniform
 */
osg.Uniform = function () { this.transpose = false; this._dirty = true; };

/** @lends osg.Uniform.prototype */
osg.Uniform.prototype = {

    get: function() { // call dirty if you update this array outside
        return this.data;
    },
    set: function(array) {
        this.data = array;
        this.dirty();
    },
    dirty: function() { this._dirty = true; },
    apply: function(location) {
        if (this._dirty) {
            this.update.call(this.glData, this.data);
            this._dirty = false;
        }
        this.glCall(location, this.glData);
    },
    applyMatrix: function(location) {
        if (this._dirty) {
            this.update.call(this.glData, this.data);
            this._dirty = false;
        }
        this.glCall(location, this.transpose, this.glData);
    },
    update: function(array) {
        for (var i = 0, l = array.length; i < l; ++i ) { // FF not traced maybe short
            this[i] = array[i];
        }
    },

    _updateFloat1: function(f) {
        this[0] = f[0];
    },
    _updateFloat2: function(f) {
        this[0] = f[0];
        this[1] = f[1];
    },
    _updateFloat3: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
    },
    _updateFloat4: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
        this[3] = f[3];
    },
    _updateFloat9: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
        this[3] = f[3];
        this[4] = f[4];
        this[5] = f[5];
        this[6] = f[6];
        this[7] = f[7];
        this[8] = f[8];
    },
    _updateFloat16: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
        this[3] = f[3];
        this[4] = f[4];
        this[5] = f[5];
        this[6] = f[6];
        this[7] = f[7];
        this[8] = f[8];
        this[9] = f[9];
        this[10] = f[10];
        this[11] = f[11];
        this[12] = f[12];
        this[13] = f[13];
        this[14] = f[14];
        this[15] = f[15];
    }
};

osg.Uniform.createFloat1 = function(value, name) {
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat1;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat2 = function(vec2, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec2;
    uniform.glCall = function (location, glData) {
        gl.uniform2fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat2;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat3 = function(vec3, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec3;
    uniform.glCall = function (location, glData) {
        gl.uniform3fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat3;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat4 = function(vec4, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec4;
    uniform.glCall = function (location, glData) {
        gl.uniform4fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat4;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt1 = function(value, name) {
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt2 = function(vec2, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec2;
    uniform.glCall = function (location, glData) {
        gl.uniform2iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt3 = function(vec3, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec3;
    uniform.glCall = function (location, glData) {
        gl.uniform3iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt4 = function(vec4, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec4;
    uniform.glCall = function (location, glData) {
        gl.uniform4iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
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
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat4;
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
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat9;
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
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat16;
    uniform.name = name;
    return uniform;
};
/** -*- compile-command: "jslint-cli Node.js" -*- */

/** 
 *  Node that can contains child node
 *  @class Node
 */
osg.Node = function () {
    osg.Object.call(this);

    this.children = [];
    this.parents = [];
    this.nodeMask = ~0;
    this.boundingSphere = new osg.BoundingSphere();
    this.boundingSphereComputed = false;
    this._updateCallbacks = [];
};

/** @lends osg.Node.prototype */
osg.Node.prototype = osg.objectInehrit(osg.Object.prototype, {
    /**
        Return StateSet and create it if it does not exist yet
        @type osg.StateSet
     */
    getOrCreateStateSet: function() {
        if (this.stateset === undefined) {
            this.stateset = new osg.StateSet();
        }
        return this.stateset;
    },
    getStateSet: function() { return this.stateset; },
    accept: function(nv) { 
        if (nv.validNodeMask(this)) {
            nv.pushOntoNodePath(this);
            nv.apply(this);
            nv.popFromNodePath();
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

    /**
       <p>
        Set update node callback, called during update traversal.
        The Object must have the following method
        update(node, nodeVisitor) {}
        note, callback is responsible for scenegraph traversal so
        they must call traverse(node,nv) to ensure that the
        scene graph subtree (and associated callbacks) are traversed.
        </p>
        <p>
        Here a dummy UpdateCallback example
        </p>
        @example
        var DummyUpdateCallback = function() {};
        DummyUpdateCallback.prototype = {
            update: function(node, nodeVisitor) {
                return true;
            }
        };

        @param Oject callback
     */
    setUpdateCallback: function(cb) { this._updateCallbacks[0] = cb; },
    /** Get update node callback, called during update traversal.
        @type Oject
     */
    getUpdateCallback: function() { return this._updateCallbacks[0]; },
    
    addUpdateCallback: function(cb) { this._updateCallbacks.push(cb);},
    getUpdateCallbackList: function() { return this._updateCallbacks; },

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
    getParents: function() {
        return this.parents;
    },
    addParent: function( parent) {
        this.parents.push(parent);
    },
    removeParent: function(parent) {
        for (var i = 0, l = this.parents.length, parents = this.parents; i < l; i++) {
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
            this.children.splice(0, this.children.length);
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

    ascend: function (visitor) {
        for (var i = 0, l = this.parents.length; i < l; i++) {
            var parent = this.parents[i];
            parent.accept(visitor);
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
	for (var j = 0, l2 = this.children.length; j < l2; j++) {
            var cc = this.children[j];
            if (cc.referenceFrame === undefined || cc.referenceFrame === osg.Transform.RELATIVE_RF) {
                bsphere.expandRadiusBySphere(cc.getBound());
            }
	}
            
	return bsphere;
    },

    getWorldMatrices: function(halt) {
        var CollectParentPaths = function(halt) {
            this.nodePaths = [];
            this.halt = halt;
            osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_PARENTS);
        };
        CollectParentPaths.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
            apply: function(node) {
                if (node.parents.length === 0 || node === this.halt) {
                    // copy
                    this.nodePaths.push(this.nodePath.slice(0));
                } else {
                    this.traverse(node);
                }
            }
        });
        var collected = new CollectParentPaths(halt);
        this.accept(collected);
        var matrixList = [];

        for(var i = 0, l = collected.nodePaths.length; i < l; i++) {
            var np = collected.nodePaths[i];
            if (np.length === 0) {
                matrixList.push(osg.Matrix.makeIdentity([]));
            } else {
                matrixList.push(osg.computeLocalToWorld(np));
            }
        }
        return matrixList;
    }
    

});
osg.Node.prototype.objectType = osg.objectType.generate("Node");
osg.NodeVisitor = function (traversalMode) {
    this.traversalMask = ~0x0;
    this.nodeMaskOverride = 0;
    this.traversalMode = traversalMode;
    if (traversalMode === undefined) {
        this.traversalMode = osg.NodeVisitor.TRAVERSE_ALL_CHILDREN;
    }
    this.nodePath = [];
};
//osg.NodeVisitor.TRAVERSE_NONE = 0;
osg.NodeVisitor.TRAVERSE_PARENTS = 1;
osg.NodeVisitor.TRAVERSE_ALL_CHILDREN = 2;
//osg.NodeVisitor.TRAVERSE_ACTIVE_CHILDREN = 3;
osg.NodeVisitor._traversalFunctions = {};
osg.NodeVisitor._traversalFunctions[osg.NodeVisitor.TRAVERSE_PARENTS] = function(node) { node.ascend(this); };
osg.NodeVisitor._traversalFunctions[osg.NodeVisitor.TRAVERSE_ALL_CHILDREN] = function(node) { node.traverse(this); };

osg.NodeVisitor._pushOntoNodePath = {};
osg.NodeVisitor._pushOntoNodePath[osg.NodeVisitor.TRAVERSE_PARENTS] = function(node) { this.nodePath.unshift(node); };
osg.NodeVisitor._pushOntoNodePath[osg.NodeVisitor.TRAVERSE_ALL_CHILDREN] = function(node) { this.nodePath.push(node); };

osg.NodeVisitor._popFromNodePath = {};
osg.NodeVisitor._popFromNodePath[osg.NodeVisitor.TRAVERSE_PARENTS] = function() { return this.nodePath.shift(); };
osg.NodeVisitor._popFromNodePath[osg.NodeVisitor.TRAVERSE_ALL_CHILDREN] = function() { this.nodePath.pop(); };

osg.NodeVisitor.prototype = {
    setNodeMaskOverride: function(m) { this.nodeMaskOverride = m; },
    getNodeMaskOverride: function() { return this.nodeMaskOverride; },

    setTraversalMask: function(m) { this.traversalMask = m; },
    getTraversalMask: function() { return this.traversalMask; },

    pushOntoNodePath: function(node) {
        osg.NodeVisitor._pushOntoNodePath[this.traversalMode].call(this, node);
    },
    popFromNodePath: function() {
        osg.NodeVisitor._popFromNodePath[this.traversalMode].call(this);
    },
    validNodeMask: function(node) {
        var nm = node.getNodeMask();
        return ((this.traversalMask & (this.nodeMaskOverride | nm)) !== 0);
    },
    apply: function ( node ) {
        this.traverse(node);
    },
    traverse: function ( node ) {
        osg.NodeVisitor._traversalFunctions[this.traversalMode].call(this, node);
    }
};
/** -*- compile-command: "jslint-cli Transform.js" -*- */

/** 
 * Transform - base class for Transform type node ( Camera, MatrixTransform )
 * @class Transform
 * @inherits osg.Node
 */
osg.Transform = function() {
    osg.Node.call(this);
    this.referenceFrame = osg.Transform.RELATIVE_RF;
};
osg.Transform.RELATIVE_RF = 0;
osg.Transform.ABSOLUTE_RF = 1;

/** @lends osg.Transform.prototype */
osg.Transform.prototype = osg.objectInehrit(osg.Node.prototype, {
    setReferenceFrame: function(value) { this.referenceFrame = value; },
    getReferenceFrame: function() { return this.referenceFrame; },

    computeBound: function(bsphere) {
        osg.Node.prototype.computeBound.call(this, bsphere);
        if (!bsphere.valid()) {
            return bsphere;
        }
        var matrix = osg.Matrix.makeIdentity([]);
        this.computeLocalToWorldMatrix(matrix);

        var xdash = osg.Vec3.copy(bsphere._center, []);
        xdash[0] += bsphere._radius;
        osg.Matrix.transformVec3(matrix, xdash, xdash);

        var ydash = osg.Vec3.copy(bsphere._center, []);
        ydash[1] += bsphere._radius;
        osg.Matrix.transformVec3(matrix, ydash, ydash);

        var zdash = osg.Vec3.copy(bsphere._center, []);
        zdash[2] += bsphere._radius;
        osg.Matrix.transformVec3(matrix, zdash, zdash);

        osg.Matrix.transformVec3(matrix, bsphere._center, bsphere._center);

        osg.Vec3.sub(xdash,
                     bsphere._center, 
                     xdash);
        var len_xdash = osg.Vec3.length(xdash);

        osg.Vec3.sub(ydash, 
                     bsphere._center, 
                     ydash);
        var len_ydash = osg.Vec3.length(ydash);

        osg.Vec3.sub(zdash, 
                     bsphere._center, 
                     zdash);
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

osg.computeLocalToWorld = function (nodePath, ignoreCameras) {
    var ignoreCamera = ignoreCameras;
    if (ignoreCamera === undefined) {
        ignoreCamera = true;
    }
    var matrix = osg.Matrix.makeIdentity([]);

    var j = 0;
    if (ignoreCamera) {
        for (j = nodePath.length-1; j > 0; j--) {
            var camera = nodePath[j];
            if (camera.objectType === osg.Camera.prototype.objectType &&
                (camera.getReferenceFrame !== osg.Transform.RELATIVE_RF || camera.getParents().length === 0 )) {
                break;
            }
        }
    }

    for (var i = j, l = nodePath.length; i < l; i++) {
        var node = nodePath[i];
        if (node.computeLocalToWorldMatrix) {
            node.computeLocalToWorldMatrix(matrix);
        }
    }
    return matrix;
};
/** 
 *  Manage Blending mode
 *  @class BlendFunc
 */
osg.BlendFunc = function (sourceRGB, destinationRGB, sourceAlpha, destinationAlpha) {
    osg.StateAttribute.call(this);
    this._sourceFactor = osg.BlendFunc.ONE;
    this._destinationFactor = osg.BlendFunc.ZERO;
    this._sourceFactorAlpha = this._sourceFactor;
    this._destinationFactorAlpha = this._destinationFactor;
    this._separate = false;
    if (sourceRGB !== undefined) {
        this.setSource(sourceRGB);
    }
    if (destinationRGB !== undefined) {
        this.setDestination(destinationRGB);
    }

    if (sourceAlpha !== undefined) {
        this.setSourceAlpha(sourceAlpha);
    }
    if (destinationAlpha !== undefined) {
        this.setDestinationAlpha(destinationAlpha);
    }
};

osg.BlendFunc.ZERO                           = 0;
osg.BlendFunc.ONE                            = 1;
osg.BlendFunc.SRC_COLOR                      = 0x0300;
osg.BlendFunc.ONE_MINUS_SRC_COLOR            = 0x0301;
osg.BlendFunc.SRC_ALPHA                      = 0x0302;
osg.BlendFunc.ONE_MINUS_SRC_ALPHA            = 0x0303;
osg.BlendFunc.DST_ALPHA                      = 0x0304;
osg.BlendFunc.ONE_MINUS_DST_ALPHA            = 0x0305;
osg.BlendFunc.DST_COLOR                      = 0x0306;
osg.BlendFunc.ONE_MINUS_DST_COLOR            = 0x0307;
osg.BlendFunc.SRC_ALPHA_SATURATE             = 0x0308;

/* Separate Blend Functions */
osg.BlendFunc.BLEND_DST_RGB                  = 0x80C8;
osg.BlendFunc.BLEND_SRC_RGB                  = 0x80C9;
osg.BlendFunc.BLEND_DST_ALPHA                = 0x80CA;
osg.BlendFunc.BLEND_SRC_ALPHA                = 0x80CB;
osg.BlendFunc.CONSTANT_COLOR                 = 0x8001;
osg.BlendFunc.ONE_MINUS_CONSTANT_COLOR       = 0x8002;
osg.BlendFunc.CONSTANT_ALPHA                 = 0x8003;
osg.BlendFunc.ONE_MINUS_CONSTANT_ALPHA       = 0x8004;
osg.BlendFunc.BLEND_COLOR                    = 0x8005;


/** @lends osg.BlendFunc.prototype */
osg.BlendFunc.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    /** 
        StateAttribute type of BlendFunc
        @type String
     */
    attributeType: "BlendFunc",
    /** 
        Create an instance of this StateAttribute
    */ 
    cloneType: function() /**osg.BlendFunc*/ {return new osg.BlendFunc(); },
    /** 
        @type String
    */ 
    getType: function() { return this.attributeType;},
    /** 
        @type String
    */ 
    getTypeMember: function() { return this.attributeType;},
    setSource: function(f) { 
        this.setSourceRGB(f); 
        this.setSourceAlpha(f); 
    },
    setDestination: function(f) { 
        this.setDestinationRGB(f); 
        this.setDestinationAlpha(f);
    },
    checkSeparate: function() {
        return (this._sourceFactor !== this._sourceFactorAlpha ||
                this._destinationFactor !== this._destinationFactorAlpha);
    },
    setSourceRGB: function(f) { 
        if (typeof f === "string") {
            this._sourceFactor = osg.BlendFunc[f];
        } else {
            this._sourceFactor = f;
        }
        this._separate = this.checkSeparate();
    },
    setSourceAlpha: function(f) {
        if (typeof f === "string") {
            this._sourceFactorAlpha = osg.BlendFunc[f];
        } else {
            this._sourceFactorAlpha = f;
        }
        this._separate = this.checkSeparate();
    },
    setDestinationRGB: function(f) { 
        if (typeof f === "string") {
            this._destinationFactor = osg.BlendFunc[f];
        } else {
            this._destinationFactor = f;
        }
        this._separate = this.checkSeparate();
    },
    setDestinationAlpha: function(f) { 
        if (typeof f === "string") {
            this._destinationFactorAlpha = osg.BlendFunc[f];
        } else {
            this._destinationFactorAlpha = f;
        }
        this._separate = this.checkSeparate();
    },

    /** 
        Apply the mode, must be called in the draw traversal
        @param state
    */
    apply: function(state) {
        var gl = state.getGraphicContext();
        gl.enable(gl.BLEND);
        if (this._separate) {
            gl.blendFuncSeparate(this._sourceFactor, this._destinationFactor,
                                 this._sourceFactorAlpha, this._destinationFactorAlpha);
        } else {
            gl.blendFunc(this._sourceFactor, this._destinationFactor); 
        }
    }
});
osg.BoundingBox = function() {
    this.init();
};
osg.BoundingBox.prototype = {
    _cache_radius2_tmp: [0, 0, 0],

    init: function() {
	this._min = [Infinity, Infinity, Infinity];
	this._max = [-Infinity, -Infinity, -Infinity];
    },

    valid: function() {
        return (this._max[0] >= this._min[0] &&  this._max[1] >= this._min[1] &&  this._max[2] >= this._min[2]);
    },

    expandBySphere: function(sh) {
        if (!sh.valid()) {
            return;
        }
        var max = this._max;
        var min = this._min;
        min[0] = Math.min(min[0], sh._center[0]-sh._radius);
        min[1] = Math.min(min[1], sh._center[1]-sh._radius);
        min[2] = Math.min(min[2], sh._center[2]-sh._radius);

        max[0] = Math.max(max[0], sh._center[0]+sh._radius);
        max[1] = Math.max(max[1], sh._center[1]+sh._radius);
        max[2] = Math.max(max[2], sh._center[2]+sh._radius);
    },

    expandByVec3: function(v){
        var min = this._min;
        var max = this._max;
	min[0] = Math.min(min[0], v[0]);
	min[1] = Math.min(min[1], v[1]);
	min[2] = Math.min(min[2], v[2]);

	max[0] = Math.max(max[0], v[0]);
	max[1] = Math.max(max[1], v[1]);
	max[2] = Math.max(max[2], v[2]);
    },

    center: function() {
        var min = this._min;
        var max = this._max;
	return [ (min[0] + max[0])*0.5,
                 (min[1] + max[1])*0.5,
                 (min[2] + max[2])*0.5 ];
    },

    radius: function() {
	return Math.sqrt(this.radius2());
    },

    radius2: function() {
        var min = this._min;
        var max = this._max;
        var cache = this._cache_radius2_tmp;
        cache[0] = max[0] - min[0];
        cache[1] = max[1] - min[1];
        cache[2] = max[2] - min[2];
	return 0.25*(cache[0] * cache[0] + cache[1] * cache[1] + cache[2] * cache[2]);
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
            if (this.valid()) {
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
                    var v = osg.Vec3.sub(bb.corner(c),this._center, []); // get the direction vector from corner
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
            } else {
		c = bb.center();
		this._center[0] = c[0];
		this._center[1] = c[1];
		this._center[2] = c[2];
		this._radius    = bb.radius();
            }
	}

    },

    expandByVec3: function(v){
	if ( this.valid()) {
            var dv = osg.Vec3.sub(v,this.center(), []);
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
                var r = length( sub(sh._center,
                                    this._center, 
                                    [])
                              ) + sh._radius;
                if (r>this._radius) {
                    this._radius = r;
                }
                // else do nothing as vertex is within sphere.
            } else {
                this._center = osg.Vec3.copy(sh._center, []);
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
        var tmp= osg.Vec3.sub( this.center() , sh.center(), [] );
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
        var vc = osg.Vec3.sub(v,this.center(), []);
        return valid() && (osg.Vec3.length2(vc)<=radius2());
    },
    intersects: function( bs ) {
        var lc = osg.Vec3.length2(osg.Vec3.sub(this.center() , 
                                               bs.center(),
                                              []));
        return valid() && bs.valid() &&
            (lc <= (this.radius() + bs.radius())*(this.radius() + bs.radius()));
    }
};
/** -*- compile-command: "jslint-cli BufferArray.js" -*- */

/** 
 * BufferArray manage vertex / normal / ... array used by webgl.
 * @class BufferArray
 */
osg.BufferArray = function (type, elements, itemSize) {
    if (osg.BufferArray.instanceID === undefined) {
        osg.BufferArray.instanceID = 0;
    }
    this.instanceID = osg.BufferArray.instanceID;
    osg.BufferArray.instanceID += 1;
    this.dirty();

    this._itemSize = itemSize;
    if (typeof(type) === "string") {
        type = osg.BufferArray[type];
    }
    this._type = type;

    if (this._type === osg.BufferArray.ELEMENT_ARRAY_BUFFER) {
        this._elements = new osg.Uint16Array(elements);
    } else {
        this._elements = new osg.Float32Array(elements);
    }
};

osg.BufferArray.ELEMENT_ARRAY_BUFFER = 0x8893;
osg.BufferArray.ARRAY_BUFFER = 0x8892;

/** @lends osg.BufferArray.prototype */
osg.BufferArray.prototype = {
    releaseGLObjects: function(gl) {
        if (this._buffer !== undefined && this._buffer !== null) {
            gl.deleteBuffer(this._buffer);
        }
        this._buffer = undefined;
    },
    bind: function(gl) {
        var type = this._type;
        var buffer = this._buffer;

        if (buffer) {
            gl.bindBuffer(type, buffer);
            return;
        }

        if (!buffer && this._elements.length > 0 ) {
            this._buffer = gl.createBuffer();
            this._numItems = this._elements.length / this._itemSize;
            gl.bindBuffer(type, this._buffer);
        }
    },
    getItemSize: function() { return this._itemSize; },
    dirty: function() { this._dirty = true; },
    isDirty: function() { return this._dirty; },
    compile: function(gl) {
        if (this._dirty) {
            gl.bufferData(this._type, this._elements, gl.STATIC_DRAW);
            this._dirty = false;
        }
    },
    getElements: function() { return this._elements;}
};

osg.BufferArray.create = function(type, elements, itemSize) {
    osg.log("osg.BufferArray.create is deprecated, use new osg.BufferArray with same arguments instead");
    return new osg.BufferArray(type, elements, itemSize);
};
/** 
 *  Manage CullFace attribute
 *  @class CullFace
 */
osg.CullFace = function (mode) {
    osg.StateAttribute.call(this);
    if (mode === undefined) {
        mode = osg.CullFace.BACK;
    }
    this.setMode(mode);
};

osg.CullFace.DISABLE        = 0x0;
osg.CullFace.FRONT          = 0x0404;
osg.CullFace.BACK           = 0x0405;
osg.CullFace.FRONT_AND_BACK = 0x0408;

/** @lends osg.CullFace.prototype */
osg.CullFace.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "CullFace",
    cloneType: function() {return new osg.CullFace(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setMode: function(mode) {
        if ( typeof mode === 'string') {
            mode = osg.CullFace[mode];
        }
        this._mode = mode;
    },
    getMode: function() { return this._mode; },
    apply: function(state) {
        var gl = state.getGraphicContext();
        if (this._mode === osg.CullFace.DISABLE) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(this._mode);
        }
        this._dirty = false;
    }
});
osg.CullSettings = function() {
    this._computeNearFar = true;
    this._nearFarRatio = 0.0005;

    var lookVector =[0.0,0.0,-1.0];
    this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this.bbCornerNear = (~this.bbCornerFar)&7;
};
osg.CullSettings.prototype = {
    setCullSettings: function(settings) {
        this._computeNearFar = settings._computeNearFar;
        this._nearFarRatio = settings._nearFarRatio;
    },
    setNearFarRatio: function( ratio) { this._nearFarRatio = ratio; },
    getNearFarRatio: function() { return this._nearFarRatio; },
    setComputeNearFar: function(value) { this._computeNearFar = value; },
    getComputeNearFar: function() { return this._computeNearFar; }
};
/** 
 * Camera - is a subclass of Transform which represents encapsulates the settings of a Camera.
 * @class Camera
 * @inherits osg.Transform osg.CullSettings
 */
osg.Camera = function () {
    osg.Transform.call(this);
    osg.CullSettings.call(this);

    this.viewport = undefined;
    this.setClearColor([0, 0, 0, 1.0]);
    this.setClearDepth(1.0);
    this.setClearMask(osg.Camera.COLOR_BUFFER_BIT | osg.Camera.DEPTH_BUFFER_BIT);
    this.setViewMatrix(osg.Matrix.makeIdentity([]));
    this.setProjectionMatrix(osg.Matrix.makeIdentity([]));
    this.renderOrder = osg.Camera.NESTED_RENDER;
    this.renderOrderNum = 0;
};

osg.Camera.PRE_RENDER = 0;
osg.Camera.NESTED_RENDER = 1;
osg.Camera.POST_RENDER = 2;

osg.Camera.COLOR_BUFFER_BIT = 0x00004000;
osg.Camera.DEPTH_BUFFER_BIT = 0x00000100;
osg.Camera.STENCIL_BUFFER_BIT = 0x00000400;

/** @lends osg.Camera.prototype */
osg.Camera.prototype = osg.objectInehrit(
    osg.CullSettings.prototype, 
    osg.objectInehrit(osg.Transform.prototype, {

        setClearDepth: function(depth) { this.clearDepth = depth;}, 
        getClearDepth: function() { return this.clearDepth;},

        setClearMask: function(mask) { this.clearMask = mask;}, 
        getClearMask: function() { return this.clearMask;},

        setClearColor: function(color) { this.clearColor = color;},
        getClearColor: function() { return this.clearColor;},

        setViewport: function(vp) { 
            this.viewport = vp;
            this.getOrCreateStateSet().setAttributeAndMode(vp);
        },
        getViewport: function() { return this.viewport; },


        setViewMatrix: function(matrix) {
            this.modelviewMatrix = matrix;
        },

        setProjectionMatrix: function(matrix) {
            this.projectionMatrix = matrix;
        },

        /** Set to an orthographic projection. See OpenGL glOrtho for documentation further details.*/
        setProjectionMatrixAsOrtho: function(left, right,
                                             bottom, top,
                                             zNear, zFar) {
            osg.Matrix.makeOrtho(left, right, bottom, top, zNear, zFar, this.getProjectionMatrix());
        },

        getViewMatrix: function() { return this.modelviewMatrix; },
        getProjectionMatrix: function() { return this.projectionMatrix; },
        getRenderOrder: function() { return this.renderOrder; },
        setRenderOrder: function(order, orderNum) {
            this.renderOrder = order;
            this.renderOrderNum = orderNum; 
        },

        attachTexture: function(bufferComponent, texture, level) {
            if (this.frameBufferObject) {
                this.frameBufferObject.dirty();
            }
            if (level === undefined) {
                level = 0;
            }
            if (this.attachments === undefined) {
                this.attachments = {};
            }
            this.attachments[bufferComponent] = { 'texture' : texture , 'level' : level };
        },

        attachRenderBuffer: function(bufferComponent, internalFormat) {
            if (this.frameBufferObject) {
                this.frameBufferObject.dirty();
            }
            if (this.attachments === undefined) {
                this.attachments = {};
            }
            this.attachments[bufferComponent] = { 'format' : internalFormat };
        },

        computeLocalToWorldMatrix: function(matrix,nodeVisitor) {
            if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
                osg.Matrix.preMult(matrix, this.modelviewMatrix);
            } else {// absolute
                matrix = this.modelviewMatrix;
            }
            return true;
        },

        computeWorldToLocalMatrix: function(matrix, nodeVisitor) {
            var inverse = [];
            osg.Matrix.inverse(this.modelviewMatrix, inverse);
            if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
                osg.Matrix.postMult(inverse, matrix);
            } else {
                matrix = inverse;
            }
            return true;
        }

    }));
osg.Camera.prototype.objectType = osg.objectType.generate("Camera");

osg.Depth = function (func, near, far, writeMask) {
    osg.StateAttribute.call(this);
    
    this._func = osg.Depth.LESS;
    this._near = 0.0;
    this._far = 1.0;
    this._writeMask = true;

    if (func !== undefined) {
        if (typeof(func) === "string") {
            this._func = osg.Depth[func];
        } else {
            this._func = func;
        }
    }
    if (near !== undefined) {
        this._near = near;
    }
    if (far !== undefined) {
        this._far = far;
    }
    if (writeMask !== undefined) {
        this._writeMask = writeMask;
    }
};

osg.Depth.DISABLE   = 0x0000;
osg.Depth.NEVER     = 0x0200;
osg.Depth.LESS      = 0x0201;
osg.Depth.EQUAL     = 0x0202;
osg.Depth.LEQUAL    = 0x0203;
osg.Depth.GREATE    = 0x0204;
osg.Depth.NOTEQU    = 0x0205;
osg.Depth.GEQUAL    = 0x0206;
osg.Depth.ALWAYS    = 0x0207;

osg.Depth.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Depth",
    cloneType: function() {return new osg.Depth(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setRange: function(near, far) { this._near = near; this._far = far; },
    setWriteMask: function(mask) { this._writeMask = mask; },
    apply: function(state) {
        var gl = state.getGraphicContext();
        if (this._func === 0) {
            gl.disable(gl.DEPTH_TEST);
        } else {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(this._func);
            gl.depthMask(this._writeMask);
            gl.depthRange(this._near, this._far);
        }
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
        var m = osg.Matrix.makeTranslate(pos[0], pos[1], pos[2], []);
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
        var north = osg.Vec3.cross(up,east, []);

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
/** 
 * FrameBufferObject manage fbo / rtt 
 * @class FrameBufferObject
 */
osg.FrameBufferObject = function () {
    osg.StateAttribute.call(this);
    this.fbo = undefined;
    this.attachments = [];
    this.dirty();
};

osg.FrameBufferObject.COLOR_ATTACHMENT0 = 0x8CE0;
osg.FrameBufferObject.DEPTH_ATTACHMENT = 0x8D00;
osg.FrameBufferObject.DEPTH_COMPONENT16 = 0x81A5;

/** @lends osg.FrameBufferObject.prototype */
osg.FrameBufferObject.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "FrameBufferObject",
    cloneType: function() {return new osg.FrameBufferObject(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setAttachment: function(attachment) { this.attachments.push(attachment); },
    apply: function(state) {
        var gl = state.getGraphicContext();
        var status;
        if (this.attachments.length > 0) {
            if (this.isDirty()) {

                if (!this.fbo) {
                    this.fbo = gl.createFramebuffer();
                }

                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                var hasRenderBuffer = false;
                for (var i = 0, l = this.attachments.length; i < l; ++i) {
                    
                    if (this.attachments[i].texture === undefined) { // render buffer
                        var rb = gl.createRenderbuffer();
                        gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
                        gl.renderbufferStorage(gl.RENDERBUFFER, this.attachments[i].format, this.attachments[i].width, this.attachments[i].height);
                        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, this.attachments[i].attachment, gl.RENDERBUFFER, rb);
                        hasRenderBuffer = true;
                    } else {
                        var texture = this.attachments[i].texture;
                        // apply on unit 0 to init it
                        state.applyTextureAttribute(0, texture);
                        
                        //gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachments[i].attachment, texture.getTextureTarget(), texture.getTextureObject(), this.attachments[i].level);
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachments[i].attachment, texture.getTextureTarget(), texture.getTextureObject(), this.attachments[i].level);
                    }
                }
                status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (status !== 0x8CD5) {
                    osg.log("framebuffer error check " + status);
                }
                
                if (hasRenderBuffer) { // set it to null only if used renderbuffer
                    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                }
                this.setDirty(false);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                if (osg.reportErrorGL === true) {
                    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                    if (status !== 0x8CD5) {
                        osg.log("framebuffer error check " + status);
                    }
                }
            }
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
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
/** -*- compile-command: "jslint-cli Geometry.js" -*- */

/** 
 * Geometry manage array and primitives to draw a geometry.
 * @class Geometry
 */
osg.Geometry = function () {
    osg.Node.call(this);
    this.primitives = [];
    this.attributes = {};
    this.boundingBox = new osg.BoundingBox();
    this.boundingBoxComputed = false;
    this.cacheAttributeList = {};
};

/** @lends osg.Geometry.prototype */
osg.Geometry.prototype = osg.objectInehrit(osg.Node.prototype, {
    releaseGLObjects: function(gl) {
        var i;
        for (i in this.attributes) {
            this.attributes[i].releaseGLObjects(gl);
        }
        for (var j = 0, l = this.primitives.length; j < l; j++) {
            var prim = this.primitives[j];
            if (prim.getIndices !== undefined) {
                if (prim.getIndices() !== undefined && prim.getIndices() !== null) {
                    prim.indices.releaseGLObjects(gl);
                }
            }
        }
    },
    dirtyBound: function() {
        if (this.boundingBoxComputed === true) {
            this.boundingBoxComputed = false;
        }
        osg.Node.dirtyBound.call(this);
    },

    dirty: function() {
        this.cacheAttributeList = {};
    },
    getPrimitives: function() { return this.primitives; },
    getAttributes: function() { return this.attributes; },
    getVertexAttributeList: function() { return this.attributes; },
    getPrimitiveSetList: function() { return this.primitives; },

    drawImplementation: function(state) {
        var program = state.getLastProgramApplied();
        var prgID = program.instanceID;
        if (this.cacheAttributeList[prgID] === undefined) {
            var attribute;
            var attributesCache = program.attributesCache;
            var attributeList = [];

            var generated = "//generated by Geometry::implementation\n";
            generated += "state.lazyDisablingOfVertexAttributes();\n";

            for (var i = 0, l = attributesCache.attributeKeys.length; i < l; i++) {
                var key = attributesCache.attributeKeys[i];
                attribute = attributesCache[key];
                var attr = this.attributes[key];
                if (attr === undefined) {
                    continue;
                }
                attributeList.push(attribute);
                generated += "state.setVertexAttribArray(" + attribute + ", this.attributes[\""+key+ "\"], false);\n";
            }
            generated += "state.applyDisablingOfVertexAttributes();\n";
            var primitives = this.primitives;
            generated += "var primitives = this.primitives;\n";
            for (var j = 0, m = primitives.length; j < m; ++j) {
                generated += "primitives["+j+"].draw(state);\n";
            }
            this.cacheAttributeList[prgID] = new Function ("state", generated);
        }
        this.cacheAttributeList[prgID].call(this, state);
    },

    // for testing disabling drawing
    drawImplementationDummy: function(state) {
        var program = state.getLastProgramApplied();
        var attribute;
        var attributeList = [];
        var attributesCache = program.attributesCache;


        var primitives = this.primitives;
        //state.disableVertexAttribsExcept(attributeList);

        for (var j = 0, m = primitives.length; j < m; ++j) {
            //primitives[j].draw(state);
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
        var vertexArray = this.getAttributes().Vertex;

        if ( vertexArray && vertexArray.getItemSize() > 2 ) {
            var v = [0,0,0];
            vertexes = vertexArray.getElements();
            for (var idx = 0, l = vertexes.length; idx < l; idx+=3) {
                v[0] = vertexes[idx];
                v[1] = vertexes[idx+1];
                v[2] = vertexes[idx+2];
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
osg.Geometry.prototype.objectType = osg.objectType.generate("Geometry");
/** -*- compile-command: "jslint-cli Node.js" -*- */

/** 
 *  Light
 *  @class Light
 */
osg.Light = function (lightNumber) {
    osg.StateAttribute.call(this);

    if (lightNumber === undefined) {
        lightNumber = 0;
    }

    this._ambient = [ 0.2, 0.2, 0.2, 1.0 ];
    this._diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
    this._specular = [ 0.2, 0.2, 0.2, 1.0 ];
    this._position = [ 0.0, 0.0, 1.0, 0.0 ];
    this._direction = [ 0.0, 0.0, -1.0 ];
    this._spotCutoff = 180.0;
    this._spotCutoffEnd = 180.0;
    this._constantAttenuation = 1.0;
    this._linearAttenuation = 0.0;
    this._quadraticAttenuation = 0.0;
    this._lightUnit = lightNumber;
    this._enabled = 0;

    this.dirty();
};

/** @lends osg.Light.prototype */
osg.Light.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Light",
    cloneType: function() {return new osg.Light(this._lightUnit); },
    getType: function() { return this.attributeType; },
    getTypeMember: function() { return this.attributeType + this._lightUnit;},
    getOrCreateUniforms: function() {
        if (osg.Light.uniforms === undefined) {
            osg.Light.uniforms = {};
        }
        if (osg.Light.uniforms[this.getTypeMember()] === undefined) {
            osg.Light.uniforms[this.getTypeMember()] = { "ambient": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName("ambient")) ,
                                                         "diffuse": osg.Uniform.createFloat4([ 0.8, 0.8, 0.8, 1], this.getParameterName('diffuse')) ,
                                                         "specular": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName('specular')) ,
                                                         "position": osg.Uniform.createFloat4([ 0, 0, 1, 0], this.getParameterName('position')),
                                                         "direction": osg.Uniform.createFloat3([ 0, 0, 1], this.getParameterName('direction')),
                                                         "spotCutoff": osg.Uniform.createFloat1( 180.0, this.getParameterName('spotCutoff')),
                                                         "spotCutoffEnd": osg.Uniform.createFloat1( 180.0, this.getParameterName('spotCutoffEnd')),
                                                         "constantAttenuation": osg.Uniform.createFloat1( 0, this.getParameterName('constantAttenuation')),
                                                         "linearAttenuation": osg.Uniform.createFloat1( 0, this.getParameterName('linearAttenuation')),
                                                         "quadraticAttenuation": osg.Uniform.createFloat1( 0, this.getParameterName('quadraticAttenuation')),
                                                         "enable": osg.Uniform.createInt1( 0, this.getParameterName('enable')),
                                                         "matrix": osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), this.getParameterName('matrix')),
                                                         "invMatrix": osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), this.getParameterName('invMatrix'))
                                                       };

            var uniformKeys = [];
            for (var k in osg.Light.uniforms[this.getTypeMember()]) {
                uniformKeys.push(k);
            }
            osg.Light.uniforms[this.getTypeMember()].uniformKeys = uniformKeys;
        }
        return osg.Light.uniforms[this.getTypeMember()];
    },

    setPosition: function(pos) { osg.Vec4.copy(pos, this._position); },
    setAmbient: function(a) { this._ambient = a; this.dirty(); },
    setSpecular: function(a) { this._specular = a; this.dirty(); },
    setDiffuse: function(a) { this._diffuse = a; this.dirty(); },
    setSpotCutoff: function(a) { this._spotCutoff = a; this.dirty(); },
    setSpotCutoffEnd: function(a) { this._spotCutoffEnd = a; this.dirty(); },

    setConstantAttenuation: function(value) { this._constantAttenuation = value; this.dirty();},
    setLinearAttenuation: function(value) { this._linearAttenuation = value; this.dirty();},
    setQuadraticAttenuation: function(value) { this._quadraticAttenuation = value; this.dirty();},

    setDirection: function(a) { this._direction = a; this.dirty(); },
    setLightNumber: function(unit) { this._lightUnit = unit; this.dirty(); },

    getPrefix: function() { return this.getType() + this._lightUnit; },
    getParameterName: function (name) { return this.getPrefix()+ "_" + name; },

    applyPositionedUniform: function(matrix, state) {
        var uniform = this.getOrCreateUniforms();
        osg.Matrix.copy(matrix, uniform.matrix.get());
        uniform.matrix.dirty();

        osg.Matrix.copy(matrix, uniform.invMatrix.get());
        uniform.invMatrix.get()[12] = 0;
        uniform.invMatrix.get()[13] = 0;
        uniform.invMatrix.get()[14] = 0;
        osg.Matrix.inverse(uniform.invMatrix.get(), uniform.invMatrix.get());
        osg.Matrix.transpose(uniform.invMatrix.get(), uniform.invMatrix.get());
        uniform.invMatrix.dirty();
    },

    apply: function(state)
    {
        var light = this.getOrCreateUniforms();

        light.ambient.set(this._ambient);
        light.diffuse.set(this._diffuse);
        light.specular.set(this._specular);
        light.position.set(this._position);
        light.direction.set(this._direction);

        light.spotCutoff.get()[0] = this._spotCutoff;
        light.spotCutoff.dirty();

        light.spotCutoffEnd.get()[0] = this._spotCutoffEnd;
        light.spotCutoffEnd.dirty();

        light.constantAttenuation.get()[0] = this._constantAttenuation;
        light.constantAttenuation.dirty();

        light.linearAttenuation.get()[0] = this._linearAttenuation;
        light.linearAttenuation.dirty();

        light.quadraticAttenuation.get()[0] = this._quadraticAttenuation;
        light.quadraticAttenuation.dirty();

        //light._enable.set([this.enable]);

        this.setDirty(false);
    },

    writeShaderInstance: function(type) {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str = [ "",
                    "varying vec3 FragNormal;",
                    "varying vec3 FragEyeVector;",
                    "",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexFunction:
            str = [ "",
                    "vec3 computeNormal() {",
                    "   return vec3(NormalMatrix * vec4(Normal, 0.0));",
                    "}",
                    "",
                    "vec3 computeEyeVertex() {",
                    "   return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
                    "}",
                    "",
                    "float getLightAttenuation(vec3 lightDir, float constant, float linear, float quadratic) {",
                    "    ",
                    "    float d = length(lightDir);",
                    "    float att = 1.0 / ( constant + linear*d + quadratic*d*d);",
                    "    return att;",
                    "}",
                    ""].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            str = [ "",
                    "  vec3 vertexEye = computeEyeVertex();",
                    "  FragEyeVector = -vertexEye;",
                    "  FragNormal = computeNormal();",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentInit:
            str = [ "varying vec3 FragNormal;",
                    "varying vec3 FragEyeVector;",
                    "vec4 LightColor = vec4(0.0);",
                    "" ].join('\n');
            break;

        case osg.ShaderGeneratorType.FragmentFunction:
            str = [ "",
                    "vec4 computeLightContribution(vec4 materialEmission,",
                    "                              vec4 materialAmbient,",
                    "                              vec4 materialDiffuse,",
                    "                              vec4 materialSpecular,",
                    "                              float materialShininess,",
                    "                              vec4 lightAmbient,",
                    "                              vec4 lightDiffuse,",
                    "                              vec4 lightSpecular,",
                    "                              vec3 normal,",
                    "                              vec3 eye,",
                    "                              vec3 lightDirection,",
                    "                              vec3 lightSpotDirection,",
                    "                              float lightCosSpotCutoff,",
                    "                              float lightCosSpotCutoffEnd,",
                    "                              float lightAttenuation)",
                    "{",
                    "    vec3 L = lightDirection;",
                    "    vec3 N = normal;",
                    "    float NdotL = max(dot(L, N), 0.0);",
                    "    vec4 ambient = lightAmbient;",
                    "    vec4 diffuse = vec4(0.0);",
                    "    vec4 specular = vec4(0.0);",
                    "    float spot = 0.0;",
                    "",
                    "    if (NdotL > 0.0) {",
                    "        vec3 E = eye;",
                    "        vec3 R = reflect(-L, N);",
                    "        float RdotE = pow( max(dot(R, E), 0.0), materialShininess );",
                    "",
                    "        vec3 D = lightSpotDirection;",
                    "        spot = 1.0;",
                    "        if (lightCosSpotCutoff > 0.0) {",
                    "          float cosCurAngle = dot(L, D);",
                    "          float cosInnerMinusOuterAngle = lightCosSpotCutoff - lightCosSpotCutoffEnd;",
                    "",
                    "          spot = clamp((cosCurAngle - lightCosSpotCutoffEnd) / cosInnerMinusOuterAngle, 0.0, 1.0);",
                    "        }",

                    "        diffuse = lightDiffuse * NdotL;",
                    "        specular = lightSpecular * RdotE;",
                    "    }",
                    "",
                    "    return materialEmission + (materialAmbient*ambient + (materialDiffuse*diffuse + materialSpecular*specular) * spot) * lightAttenuation;",
                    "}",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentMain:
            str = [ "",
                    "  vec3 normal = normalize(FragNormal);",
                    "  vec3 eyeVector = normalize(FragEyeVector);",
                    ""].join("\n");
            break;
        case osg.ShaderGeneratorType.FragmentEnd:
            str = [ "",
                    "  fragColor *= LightColor;",
                    ""].join('\n');
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
                    "varying vec3 FragDirection;",
                    "varying vec3 FragSpotDirection;",
                    "varying float FragAttenuation;",
                    "uniform vec4 LightPosition;",
                    "uniform vec3 LightDirection;",
                    "uniform mat4 LightMatrix;",
                    "uniform mat4 LightInvMatrix;",
                    "uniform float LightConstantAttenuation;",
                    "uniform float LightLinearAttenuation;",
                    "uniform float LightQuadraticAttenuation;",
                    "",
                    "" ].join('\n');
            str = str.replace(/LightMatrix/g, this.getParameterName('matrix'));
            str = str.replace(/LightInvMatrix/g, this.getParameterName('invMatrix'));
            str = str.replace(/FragDirection/g, this.getParameterName('fragDirection'));
            str = str.replace(/FragSpotDirection/g, this.getParameterName('fragSpotDirection'));
            str = str.replace(/LightPosition/g, this.getParameterName('position'));
            str = str.replace(/LightDirection/g, this.getParameterName('direction'));
            str = str.replace(/FragAttenuation/g, this.getParameterName('fragAttenuation'));
            str = str.replace(/LightConstantAttenuation/g, this.getParameterName('constantAttenuation'));
            str = str.replace(/LightLinearAttenuation/g, this.getParameterName('linearAttenuation'));
            str = str.replace(/LightQuadraticAttenuation/g, this.getParameterName('quadraticAttenuation'));
            break;
        case osg.ShaderGeneratorType.VertexMain:
            str = [ "",
                    "  vec3 lightEye = vec3(LightMatrix * LightPosition);",
                    "  vec3 lightDir;",
                    "  if (LightPosition[3] == 1.0) {",
                    "    lightDir = lightEye - vertexEye;",
                    "  } else {",
                    "    lightDir = lightEye;",
                    "  }",
                    "  FragSpotDirection = normalize(mat3(LightInvMatrix)*LightDirection);",
                    "  FragDirection = lightDir;",
                    "  FragAttenuation = getLightAttenuation(lightDir, LightAttenuationConstant, LightAttenuationLinear, LightAttenuationQuadratic);",
                    "" ].join('\n');
            str = str.replace(/LightMatrix/g, this.getParameterName('matrix'));
            str = str.replace(/LightInvMatrix/g, this.getParameterName('invMatrix'));
            str = str.replace(/LightPosition/g, this.getParameterName('position'));
            str = str.replace(/lightEye/g, this.getParameterName('eye'));
            str = str.replace(/FragDirection/g, this.getParameterName('fragDirection'));
            str = str.replace(/FragSpotDirection/g, this.getParameterName('fragSpotDirection'));
            str = str.replace(/LightDirection/g, this.getParameterName('direction'));
            str = str.replace(/lightDir/g, this.getParameterName('lightDir'));
            str = str.replace(/FragAttenuation/g, this.getParameterName('fragAttenuation'));
            str = str.replace(/LightAttenuationConstant/g, this.getParameterName('constantAttenuation'));
            str = str.replace(/LightAttenuationLinear/g, this.getParameterName('linearAttenuation'));
            str = str.replace(/LightAttenuationQuadratic/g, this.getParameterName('quadraticAttenuation'));
            break;
        case osg.ShaderGeneratorType.FragmentInit:
            str = [ "",
                    "varying vec3 FragDirection;",
                    "varying vec3 FragSpotDirection;",
                    "varying float FragAttenuation;",
                    "uniform vec4 LightAmbient;",
                    "uniform vec4 LightDiffuse;",
                    "uniform vec4 LightSpecular;",
                    "uniform float LightSpotCutoff;",
                    "uniform float LightSpotCutoffEnd;",
                    "" ].join('\n');
            str = str.replace(/FragDirection/g, this.getParameterName('fragDirection'));
            str = str.replace(/FragSpotDirection/g, this.getParameterName('fragSpotDirection'));
            str = str.replace(/LightAmbient/g, this.getParameterName('ambient'));
            str = str.replace(/LightDiffuse/g, this.getParameterName('diffuse'));
            str = str.replace(/LightSpecular/g, this.getParameterName('specular'));
            str = str.replace(/LightSpotCutoff/g, this.getParameterName('spotCutoff'));
            str = str.replace(/LightSpotCutoffEnd/g, this.getParameterName('spotCutoffEnd'));
            str = str.replace(/FragAttenuation/g, this.getParameterName('fragAttenuation'));
            break;
        case osg.ShaderGeneratorType.FragmentMain:
            str = [ "",
                    "  vec3 lightDirectionNormalized = normalize(FragDirection);",
                    "  float lightCosSpotCutoff = cos(radians(LightSpotCutoff));",
                    "  float lightCosSpotCutoffEnd = cos(radians(LightSpotCutoffEnd));",
                    "  LightColor += computeLightContribution(MaterialEmission,",
                    "                                         MaterialAmbient,",
                    "                                         MaterialDiffuse, ",
                    "                                         MaterialSpecular,",
                    "                                         MaterialShininess,",
                    "                                         LightAmbient,",
                    "                                         LightDiffuse,",
                    "                                         LightSpecular,",
                    "                                         normal,",
                    "                                         eyeVector,",
                    "                                         lightDirectionNormalized,",
                    "                                         FragSpotDirection,",
                    "                                         lightCosSpotCutoff,",
                    "                                         lightCosSpotCutoffEnd,",
                    "                                         FragAttenuation);",
                    "" ].join('\n');

            str = str.replace(/lightDirectionNormalized/g, this.getParameterName('lightDirectionNormalized'));
            str = str.replace(/FragDirection/g, this.getParameterName('fragDirection'));
            str = str.replace(/FragSpotDirection/g, this.getParameterName('fragSpotDirection'));
            str = str.replace(/LightAmbient/g, this.getParameterName('ambient'));
            str = str.replace(/LightDiffuse/g, this.getParameterName('diffuse'));
            str = str.replace(/LightSpecular/g, this.getParameterName('specular'));
            str = str.replace(/LightSpotCutoff/g, this.getParameterName('spotCutoff'));
            str = str.replace(/LightSpotCutoffEnd/g, this.getParameterName('spotCutoffEnd'));
            str = str.replace(/lightSpotCutoff/g, this.getParameterName('lightSpotCutoff'));
            str = str.replace(/lightSpotCutoffEnd/g, this.getParameterName('lightSpotCutoffEnd'));
            str = str.replace(/lightCosSpotCutoff/g, this.getParameterName('lightCosSpotCutoff'));
            str = str.replace(/lightCosSpotCutoffEnd/g, this.getParameterName('lightCosSpotCutoffEnd'));
            str = str.replace(/FragAttenuation/g, this.getParameterName('fragAttenuation'));
            break;
        }
        return str;
    }
});
/** -*- compile-command: "jslint-cli Node.js" -*- */

/** 
 *  LightSource is a positioned node to use with StateAttribute Light
 *  @class LightSource
 */
osg.LightSource = function() {
    osg.Node.call(this);
    this._light = undefined;
};

/** @lends osg.LightSource.prototype */
osg.LightSource.prototype = osg.objectInehrit(osg.Node.prototype, {
    getLight: function() { return this._light; },
    setLight: function(light) { this._light = light; }
});
osg.LightSource.prototype.objectType = osg.objectType.generate("LightSource");
osg.LineWidth = function (lineWidth) {
    osg.StateAttribute.call(this);
    this.lineWidth = 1.0;
    if (lineWidth !== undefined) {
        this.lineWidth = lineWidth;
    }
};
osg.LineWidth.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "LineWidth",
    cloneType: function() {return new osg.LineWidth(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) { state.getGraphicContext().lineWidth(this.lineWidth); }
});
/** 
 * Material
 * @class Material
 */
osg.Material = function () {
    osg.StateAttribute.call(this);
    this.ambient = [ 0.2, 0.2, 0.2, 1.0 ];
    this.diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
    this.specular = [ 0.0, 0.0, 0.0, 1.0 ];
    this.emission = [ 0.0, 0.0, 0.0, 1.0 ];
    this.shininess = 12.5;
    this._dirty = true;
};
/** @lends osg.Material.prototype */
osg.Material.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {

    setEmission: function(a) { osg.Vec4.copy(a, this.emission); this._dirty = true; },
    setAmbient: function(a) { osg.Vec4.copy(a, this.ambient); this._dirty = true; },
    setSpecular: function(a) { osg.Vec4.copy(a, this.specular); this._dirty = true; },
    setDiffuse: function(a) { osg.Vec4.copy(a, this.diffuse); this._dirty = true; },
    setShininess: function(a) { this.shininess = a; this._dirty = true; },

    getEmission: function() { return this.emission;},
    getAmbient: function() { return this.ambient; },
    getSpecular: function() { return this.specular;},
    getDiffuse: function() { return this.diffuse;},
    getShininess: function() { return this.shininess; },

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
        uniforms.shininess.set([this.shininess]);
        this._dirty = false;
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
                     ""].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentInit:
            str =  [ "uniform vec4 MaterialAmbient;",
                     "uniform vec4 MaterialDiffuse;",
                     "uniform vec4 MaterialSpecular;",
                     "uniform vec4 MaterialEmission;",
                     "uniform float MaterialShininess;",
                     ""].join('\n');
            break;
        }
        return str;
    }
});
/** -*- compile-command: "jslint-cli Node.js" -*- */

/** 
 *  MatrixTransform is a Transform Node that can be customized with user matrix
 *  @class MatrixTransform
 */
osg.MatrixTransform = function() {
    osg.Transform.call(this);
    this.matrix = osg.Matrix.makeIdentity([]);
};

/** @lends osg.MatrixTransform.prototype */
osg.MatrixTransform.prototype = osg.objectInehrit(osg.Transform.prototype, {
    getMatrix: function() { return this.matrix; },
    setMatrix: function(m) { this.matrix = m; },
    computeLocalToWorldMatrix: function(matrix,nodeVisitor) {
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.preMult(matrix, this.matrix);
        } else {
            matrix = this.matrix;
        }
        return true;
    },
    computeWorldToLocalMatrix: function(matrix,nodeVisitor) {
        var minverse = [];
        osg.Matrix.inverse(this.matrix, minverse);
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.postMult(minverse, matrix);
        } else {// absolute
            matrix = inverse;
        }
        return true;
    }
});
osg.MatrixTransform.prototype.objectType = osg.objectType.generate("MatrixTransform");
osg.PrimitiveSet = function() {};
osg.PrimitiveSet.POINTS                         = 0x0000;
osg.PrimitiveSet.LINES                          = 0x0001;
osg.PrimitiveSet.LINE_LOOP                      = 0x0002;
osg.PrimitiveSet.LINE_STRIP                     = 0x0003;
osg.PrimitiveSet.TRIANGLES                      = 0x0004;
osg.PrimitiveSet.TRIANGLE_STRIP                 = 0x0005;
osg.PrimitiveSet.TRIANGLE_FAN                   = 0x0006;

/** 
 * DrawArrays manage rendering primitives
 * @class DrawArrays
 */
osg.DrawArrays = function (mode, first, count) 
{
    this.mode = mode;
    this.first = first;
    this.count = count;
};

/** @lends osg.DrawArrays.prototype */
osg.DrawArrays.prototype = {
    draw: function(state) {
        var gl = state.getGraphicContext();
        gl.drawArrays(this.mode, this.first, this.count);
    },
    getMode: function() { return this.mode; },
    getCount: function() { return this.count; },
    getFirst: function() { return this.first; }
};
osg.DrawArrays.create = function(mode, first, count) {
    osg.log("osg.DrawArrays.create is deprecated, use new osg.DrawArrays with same arguments");
    var d = new osg.DrawArrays(mode, first, count);
    return d;
};


/** 
 * DrawArrayLengths manage rendering primitives
 * @class DrawArrayLengths
 */
osg.DrawArrayLengths = function (mode, first, array)
{
    this._mode = mode;
    this._first = first;
    this._arrayLengths = array.slice(0);
};

/** @lends osg.DrawArrayLengths.prototype */
osg.DrawArrayLengths.prototype = {
    draw: function(state) {
        var gl = state.getGraphicContext();
        var mode = this._mode;
        var first = this._first;
        var array = this._arrayLengths;
        for (var i = 0, l = array.length; i < l; i++) {
            var count = array[i];
            gl.drawArrays(mode, first, count);
            first += count;
        }
    },
    getMode: function() { return this._mode; },
    getNumIndices: function() {
        var count = 0;
        var array = this._arrayLengths;
        for (var i = 0, l = array.length; i < l; i++) {
            count += array[i];
        }
        return count; 
    },
    getArrayLengths: function() { return this._arrayLengths; },
    getFirst: function() { return this._first; },
    setFirst: function(first) { this._first = first; }
};


/** 
 * DrawElements manage rendering of indexed primitives
 * @class DrawElements
 */
osg.DrawElements = function (mode, indices) {
    this.mode = osg.PrimitiveSet.POINTS;
    if (mode !== undefined) {
        this.mode = mode;
    }

    this.count = 0;
    this.offset = 0;
    this.indices = indices;
    if (indices !== undefined) {
        this.count = indices.getElements().length;
    }
};

/** @lends osg.DrawElements.prototype */
osg.DrawElements.prototype = {
    getMode: function() { return this.mode; },
    draw: function(state) {
        state.setIndexArray(this.indices);
        var gl = state.getGraphicContext();
        gl.drawElements(this.mode, this.count, gl.UNSIGNED_SHORT, this.offset );
    },
    getIndices: function() { return this.indices; },
    setFirst: function(val) { this.offset = val; },
    getFirst: function() { return this.offset;},
    setCount: function(val) { this.count = val;},
    getCount: function() { return this.count; }

};

osg.DrawElements.create = function(mode, indices) {
    osg.log("osg.DrawElements.create is deprecated, use new osg.DrawElements with same arguments");
    return new osg.DrawElements(mode, indices);
};
/** 
 * Program encapsulate an vertex and fragment shader
 * @class Program
 */
osg.Program = function (vShader, fShader) { 
    osg.StateAttribute.call(this);

    if (osg.Program.instanceID === undefined) {
        osg.Program.instanceID = 0;
    }
    this.instanceID = osg.Program.instanceID;

    osg.Program.instanceID+= 1;

    this.program = null;
    this.setVertexShader(vShader);
    this.setFragmentShader(fShader);
    this.dirty = true;
};

/** @lends osg.Program.prototype */
osg.Program.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {

    attributeType: "Program",
    cloneType: function() { var p = new osg.Program(); p.default_program = true; return p; },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setVertexShader: function(vs) { this.vertex = vs; },
    setFragmentShader: function(fs) { this.fragment = fs; },
    getVertexShader: function() { return this.vertex; },
    getFragmentShader: function() { return this.fragment; },
    apply: function(state) {
        if (!this.program || this.isDirty()) {

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
            gl.validateProgram(this.program);
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS) &&
                !gl.isContextLost()) {
                osg.log("can't link program\n" + "vertex shader:\n" + this.vertex.text +  "\n fragment shader:\n" + this.fragment.text);
                osg.log(gl.getProgramInfoLog(this.program));
                this.setDirty(false);
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

            this.setDirty(false);
        }

        gl.useProgram(this.program);
    },

    cacheUniformList: function(str) {
        var r = str.match(/uniform\s+\w+\s+\w+/g);
        if (r !== null) {
            for (var i = 0, l = r.length; i < l; i++) {
                var uniform = r[i].match(/uniform\s+\w+\s+(\w+)/)[1];
                var location = gl.getUniformLocation(this.program, uniform);
                if (location !== undefined && location !== null) {
                    if (this.uniformsCache[uniform] === undefined) {
                        this.uniformsCache[uniform] = location;
                        this.uniformsCache.uniformKeys.push(uniform);
                    }
                }
            }
        }
    },

    cacheAttributeList: function(str) {
        var r = str.match(/attribute\s+\w+\s+\w+/g);
        if (r !== null) {
            for (var i = 0, l = r.length; i < l; i++) {
                var attr = r[i].match(/attribute\s+\w+\s+(\w+)/)[1];
                var location = gl.getAttribLocation(this.program, attr);
                if (location !== -1 && location !== undefined) {
                    if (this.attributesCache[attr] === undefined) {
                        this.attributesCache[attr] = location;
                        this.attributesCache.attributeKeys.push(attr);
                    }
                }
            }
        }
    }
});

osg.Program.create = function(vShader, fShader) {
    console.log("osg.Program.create is deprecated use new osg.Program(vertex, fragment) instead");
    var program = new osg.Program(vShader, fShader);
    return program;
};
osg.Projection = function () {
    osg.Node.call(this);
    this.projection = osg.Matrix.makeIdentity([]);
};
osg.Projection.prototype = osg.objectInehrit(osg.Node.prototype, {
    getProjectionMatrix: function() { return this.projection; },
    setProjectionMatrix: function(m) { this.projection = m; }
});
osg.Projection.prototype.objectType = osg.objectType.generate("Projection");

/** @class Quaternion Operations */
osg.Quat = {
    copy: function(s, d) {
        d[0] = s[0];
        d[1] = s[1];
        d[2] = s[2];
        d[3] = s[3];
        return d;
    },
    makeIdentity: function(element) { return osg.Quat.init(element); },
    zeroRotation: function(element) { return osg.Quat.init(element); },

    init: function(element) {
        element[0] = 0;
        element[1] = 0;
        element[2] = 0;
        element[3] = 1;
        return element;
    },

    sub: function(a, b, result) {
        result[0] = a[0] - b[0];
        result[1] = a[1] - b[1];
        result[2] = a[2] - b[2];
        result[3] = a[3] - b[3];
        return result;
    },

    add: function(a, b, result) {
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

    lerp: function(t, a, b, r) {
        r[0] = a[0] + (b[0]-a[0])*t;
        r[1] = a[1] + (b[1]-a[1])*t;
        r[2] = a[2] + (b[2]-a[2])*t;
        r[3] = a[3] + (b[3]-a[3])*t;
        return r;
    },

    slerp: function(t, from, to, result) {
        var epsilon = 0.00001;

        var quatTo = to;
        var cosomega = this.dot(from,quatTo);
        if ( cosomega <0.0 )
        {
            cosomega = -cosomega;
            this.neg(to, quatTo);
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

        result[0] = from[0]*scale_from + quatTo[0]*scale_to;
        result[1] = from[1]*scale_from + quatTo[1]*scale_to;
        result[2] = from[2]*scale_from + quatTo[2]*scale_to;
        result[3] = from[3]*scale_from + quatTo[3]*scale_to;
        return result;
    },

    normalize: function(q, qr) {
        var div = 1.0/this.length2(q);
        qr[0] = q[0]*div;
        qr[1] = q[1]*div;
        qr[2] = q[2]*div;
        qr[3] = q[3]*div;
        return qr;
    },

    // we suppose to have unit quaternion
    conj: function(a, result) {
        result[0] = -a[0];
        result[1] = -a[1];
        result[2] = -a[2];
        result[3] = a[3];
        return result;
    },

    inverse: function(a, result) {
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
        result[0] =  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0];
        result[1] = -a[0] * b[2] + a[1] * b[3] + a[2] * b[0] + a[3] * b[1];
        result[2] =  a[0] * b[1] - a[1] * b[0] + a[2] * b[3] + a[3] * b[2];
        result[3] = -a[0] * b[0] - a[1] * b[1] - a[2] * b[2] + a[3] * b[3];
        return result;
    },
    div: function(a, b, result) {
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
    }

};
osg.RenderBin = function () {
    this._leafs = [];
    this.positionedAttribute = [];
    this._renderStage = undefined;
    this._bins = {};
    this.stateGraphList = [];
    this._parent = undefined;
    this._binNum = 0;

    this._sorted = false;
    this._sortMode = osg.RenderBin.SORT_BY_STATE;

};
osg.RenderBin.SORT_BY_STATE = 0;
osg.RenderBin.SORT_BACK_TO_FRONT = 1;
osg.RenderBin.BinPrototypes = {
    RenderBin: function() {
        return new osg.RenderBin();
    },
    DepthSortedBin: function() {
        var rb = new osg.RenderBin();
        rb._sortMode = osg.RenderBin.SORT_BACK_TO_FRONT;
        return rb;
    }
};

osg.RenderBin.prototype = {
    _createRenderBin: function(binName) {
        if (binName === undefined || osg.RenderBin.BinPrototypes[binName] === undefined) {
            return osg.RenderBin.BinPrototypes.RenderBin();
        }
        return osg.RenderBin.BinPrototypes[binName]();
    },
    getStateGraphList: function() { return this.stateGraphList; },
    copyLeavesFromStateGraphListToRenderLeafList: function() {

        this._leafs.splice(0, this._leafs.length);
        var detectedNaN = false;

        for (var i = 0, l = this.stateGraphList.length; i < l; i++) {
            var leafs = this.stateGraphList[i].leafs;
            for (var j = 0, k = leafs.length; j < k; j++) {
                var leaf = leafs[j];
                if (isNaN(leaf.depth)) {
                    detectedNaN = true;
                } else {
                    this._leafs.push(leaf);
                }
            }
        }

        if (detectedNaN) {
            osg.debug("warning: RenderBin::copyLeavesFromStateGraphListToRenderLeafList() detected NaN depth values, database may be corrupted.");
        }        
        // empty the render graph list to prevent it being drawn along side the render leaf list (see drawImplementation.)
        this.stateGraphList.splice(0, this.stateGraphList.length);
    },
    
    sortBackToFront: function() {
        this.copyLeavesFromStateGraphListToRenderLeafList();
        var cmp = function(a, b) {
            return b.depth - a.depth;
        };
        this._leafs.sort(cmp);
    },

    sortImplementation: function() {
        var SortMode = osg.RenderBin;
        switch(this._sortMode) {
        case SortMode.SORT_BACK_TO_FRONT:
            this.sortBackToFront();
            break;
        case SortMode.SORT_BY_STATE:
            // do nothing
            break;
        }
    },

    sort: function() {
        if (this._sorted) {
            return;
        }

        var bins = this._bins;
        var keys = Object.keys(bins);
        for (var i = 0, l = keys.length; i < l; i++) {
            bins[keys[i]].sort();
        }
        this.sortImplementation();

        _sorted = true;
    },

    setParent: function(parent) { this._parent = parent; },
    getParent: function() { return this._parent; },
    getBinNumber: function() { return this._binNum; },
    findOrInsert: function(binNum, binName) {
        var bin = this._bins[binNum];
        if (bin === undefined) {
            bin = this._createRenderBin(binName);
            bin._parent = this;
            bin._binNum = binNum;
            bin._renderStage = this._renderStage;
            this._bins[binNum] = bin;
        }
        return bin;
    },
    getStage: function() { return this._renderStage; },
    addStateGraph: function(sg) { this.stateGraphList.push(sg); },
    reset: function() {
        this.stateGraphList.length = 0;
        this._bins = {};
        this.positionedAttribute.length = 0;
        this._leafs.length = 0;
        this._sorted = false;
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
            stateAttribute.apply(state);
            state.haveAppliedAttribute(stateAttribute);
        }
    },

    drawImplementation: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        var binsKeys = Object.keys(this._bins);
        var bins = this._bins;
        var binsArray = [];
        for (var i = 0, l = binsKeys.length; i < l; i++) {
            var k = binsKeys[i];
            binsArray.push(bins[k]);
        }
        var cmp = function(a, b) {
            return a._binNum - b._binNum;
        };
        binsArray.sort(cmp);

        var current = 0;
        var end = binsArray.length;

        var bin;
        // draw pre bins
        for (; current < end; current++) {
            bin = binsArray[current];
            if (bin.getBinNumber() > 0) {
                break;
            }
            previous = bin.drawImplementation(state, previous);
        }
        
        // draw leafs
        previous = this.drawLeafs(state, previous);

        // draw post bins
        for (; current < end; current++) {
            bin = binsArray[current];
            previous = bin.drawImplementation(state, previous);
        }
        return previous;
    },

    drawLeafs: function(state, previousRenderLeaf) {

        var stateList = this.stateGraphList;
        var leafs = this._leafs;
        var normalUniform;
        var modelViewUniform;
        var projectionUniform;
        var program;
        var stateset;
        var previousLeaf = previousRenderLeaf;
        var normal = [];
        var normalTranspose = [];

        var Matrix = osg.Matrix;

        if (previousLeaf) {
            osg.StateGraph.prototype.moveToRootStateGraph(state, previousRenderLeaf.parent);
        }

        var leaf, push;
        var prev_rg, prev_rg_parent, rg;

        // draw fine grained ordering.
        for (var d = 0, dl = leafs.length; d < dl; d++) {
            leaf = leafs[d];
            push = false;
            if (previousLeaf !== undefined) {

                // apply state if required.
                prev_rg = previousLeaf.parent;
                prev_rg_parent = prev_rg.parent;
                rg = leaf.parent;
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
                program = state.getLastProgramApplied();

                modelViewUniform = program.uniformsCache[state.modelViewMatrix.name];
                projectionUniform = program.uniformsCache[state.projectionMatrix.name];
                normalUniform = program.uniformsCache[state.normalMatrix.name];
            }


            if (modelViewUniform !== undefined) {
                state.modelViewMatrix.set(leaf.modelview);
                state.modelViewMatrix.apply(modelViewUniform);
            }
            if (projectionUniform !== undefined) {
                state.projectionMatrix.set(leaf.projection);
                state.projectionMatrix.apply(projectionUniform);
            }
            if (normalUniform !== undefined) {
                Matrix.copy(leaf.modelview, normal);
                //Matrix.setTrans(normal, 0, 0, 0);
                normal[12] = 0;
                normal[13] = 0;
                normal[14] = 0;

                Matrix.inverse(normal, normal);
                Matrix.transpose(normal, normal);
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

        
        // draw coarse grained ordering.
        for (var i = 0, l = stateList.length; i < l; i++) {
            var sg = stateList[i];
            for (var j = 0, ll = sg.leafs.length; j < ll; j++) {

                leaf = sg.leafs[j];
                push = false;
                if (previousLeaf !== undefined) {

                    // apply state if required.
                    prev_rg = previousLeaf.parent;
                    prev_rg_parent = prev_rg.parent;
                    rg = leaf.parent;
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
                    program = state.getLastProgramApplied();

                    modelViewUniform = program.uniformsCache[state.modelViewMatrix.name];
                    projectionUniform = program.uniformsCache[state.projectionMatrix.name];
                    normalUniform = program.uniformsCache[state.normalMatrix.name];
                }


                if (modelViewUniform !== undefined) {
                    state.modelViewMatrix.set(leaf.modelview);
                    state.modelViewMatrix.apply(modelViewUniform);
                }
                if (projectionUniform !== undefined) {
                    state.projectionMatrix.set(leaf.projection);
                    state.projectionMatrix.apply(projectionUniform);
                }
                if (normalUniform !== undefined) {
                    Matrix.copy(leaf.modelview, normal);
                    //Matrix.setTrans(normal, 0, 0, 0);
                    normal[12] = 0;
                    normal[13] = 0;
                    normal[14] = 0;

                    Matrix.inverse(normal, normal);
                    Matrix.transpose(normal, normal);
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
    this.clearMask = osg.Camera.COLOR_BUFFER_BIT | osg.Camera.DEPTH_BUFFER_BIT;
    this.camera = undefined;
    this.viewport = undefined;
    this.preRenderList = [];
    this.postRenderList = [];
    this._renderStage = this;
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

    sort: function() {
        for (var i = 0, l = this.preRenderList.length; i < l; ++i) {
            this.preRenderList[i].renderStage.sort();
        }

        osg.RenderBin.prototype.sort.call(this);

        for (var j = 0, k = this.postRenderList.length; i < l; ++i) {
            this.postRenderList[i].renderStage.sort();
        }
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
        var gl = state.getGraphicContext();
        if (this.camera === undefined) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        var viewport = this.camera.getViewport();
        var fbo = this.camera.frameBufferObject;

        if (!fbo) {
            fbo = new osg.FrameBufferObject();
            this.camera.frameBufferObject = fbo;
        }

        if (fbo.isDirty()) {
            if (this.camera.attachments !== undefined) {
                for ( var key in this.camera.attachments) {
                    var a = this.camera.attachments[key];
                    var attach;
                    if (a.texture === undefined) { //renderbuffer
                        attach = { attachment: key, 
                                   format: a.format, 
                                   width: viewport.width(),
                                   height: viewport.height()
                                 };
                    } else if (a.texture !== undefined) {
                        attach = { 
                            attachment: key, 
                            texture: a.texture, 
                            level: a.level 
                        };
                        if (a.format) {
                            attach.format = a.format;
                        }
                    }
                    fbo.setAttachment(attach);
                }
            }
        }
        fbo.apply(state);
    },

    drawImplementation: function(state, previousRenderLeaf) {
        var error;
        var gl = state.getGraphicContext();

        this.applyCamera(state);

        if (this.viewport === undefined) {
            osg.log("RenderStage does not have a valid viewport");
        }

        state.applyAttribute(this.viewport);

        if (this.clearMask & gl.COLOR_BUFFER_BIT) {
            gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        }
        if (this.clearMask & gl.DEPTH_BUFFER_BIT) {
            gl.depthMask(true);
            gl.clearDepth(this.clearDepth);
        }
        gl.clear(this.clearMask);

        if (this.positionedAttribute) {
            this.applyPositionedAttribute(state, this.positionedAttribute);
        }

        var previous = osg.RenderBin.prototype.drawImplementation.call(this, state, previousRenderLeaf);

        return previous;
    }
});
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
                //if (state.textureAttributeMapList[a][attrName].globalDefault === undefined) {
                    //debugger;
                //}
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
        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

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
            var type = element.getType();
            if (element.writeShaderInstance !== undefined && instanciedTypeShader[type] === undefined) {
                shader += element.writeShaderInstance(mode);
                instanciedTypeShader[type] = true;
            }

            if (element.writeToShader) {
                shader += element.writeToShader(mode);
            }
        }
        return shader;
    },

    getOrCreateVertexShader: function (state, validAttributeKeys, validTextureAttributeKeys) {
        var i;
        var modes = osg.ShaderGeneratorType;
        var shader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec4 Color;",
            "attribute vec3 Normal;",
            "uniform int ArrayColorEnabled;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "uniform mat4 NormalMatrix;",
            "varying vec4 VertexColor;",
            ""
        ].join('\n');

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.VertexInit);

        var func = [
            "",
            "vec4 ftransform() {",
            "  return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}"].join('\n');

        shader += func;

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.VertexFunction);

        var body = [
            "",
            "void main(void) {",
            "  gl_Position = ftransform();",
            "  if (ArrayColorEnabled == 1)",
            "    VertexColor = Color;",
            "  else",
            "    VertexColor = vec4(1.0,1.0,1.0,1.0);",
            ""
        ].join('\n');

        shader += body;

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.VertexMain);

        shader += [
            "}",
            ""
        ].join('\n');

        return shader;
    },

    _writeShaderFromMode: function(state, validAttributeKeys, validTextureAttributeKeys, mode) {
        var str = "";
        str += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        str += this.fillShader(state.attributeMap, validAttributeKeys, mode);
        return str;
    },

    getOrCreateFragmentShader: function (state, validAttributeKeys, validTextureAttributeKeys) {
        var i;
        var shader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec4 VertexColor;",
            "uniform int ArrayColorEnabled;",
            "vec4 fragColor;",
            ""
        ].join("\n");

        var modes = osg.ShaderGeneratorType;
        
        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentInit);

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentFunction);

        shader += [
            "void main(void) {",
            "  fragColor = VertexColor;",
            ""
        ].join('\n');

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentMain);

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentEnd);

        shader += [
            "",
            "  gl_FragColor = fragColor;",
            "}"
        ].join('\n');

        return shader;
    }
};
/**
 * Create a Textured Box on the given center with given size
 * @name osg.createTexturedBox
 */
osg.createTexturedBoxGeometry = function(centerx, centery, centerz,
                                         sizex, sizey, sizez) {

    var g = new osg.Geometry();
    var dx,dy,dz;
    dx = sizex/2.0;
    dy = sizey/2.0;
    dz = sizez/2.0;

    var vertexes = [];
    var uv = [];
    var normal = [];

    // -ve y plane
    vertexes[0] = centerx - dx;
    vertexes[1] = centery - dy;
    vertexes[2] = centerz + dz;
    normal[0] = 0;
    normal[1] = -1;
    normal[2] = 0;
    uv[0] = 0;
    uv[1] = 1;

    vertexes[3] = centerx - dx;
    vertexes[4] = centery - dy;
    vertexes[5] = centerz - dz;
    normal[3] = 0;
    normal[4] = -1;
    normal[5] = 0;
    uv[2] = 0;
    uv[3] = 0;

    vertexes[6] = centerx + dx;
    vertexes[7] = centery - dy;
    vertexes[8] = centerz - dz;
    normal[6] = 0;
    normal[7] = -1;
    normal[8] = 0;
    uv[4] = 1;
    uv[5] = 0;

    vertexes[9] =  centerx + dx;
    vertexes[10] = centery - dy;
    vertexes[11] = centerz + dz;
    normal[9] = 0;
    normal[10] = -1;
    normal[11] = 0;
    uv[6] = 1;
    uv[7] = 1;


    // +ve y plane
    vertexes[12] = centerx + dx;
    vertexes[13] = centery + dy;
    vertexes[14] = centerz + dz;
    normal[12] = 0;
    normal[13] = 1;
    normal[14] = 0;
    uv[8] = 0;
    uv[9] = 1;

    vertexes[15] = centerx + dx;
    vertexes[16] = centery + dy;
    vertexes[17] = centerz - dz;
    normal[15] = 0;
    normal[16] = 1;
    normal[17] = 0;
    uv[10] = 0;
    uv[11] = 0;

    vertexes[18] = centerx - dx;
    vertexes[19] = centery + dy;
    vertexes[20] = centerz - dz;
    normal[18] = 0;
    normal[19] = 1;
    normal[20] = 0;
    uv[12] = 1;
    uv[13] = 0;

    vertexes[21] = centerx - dx;
    vertexes[22] = centery + dy;
    vertexes[23] = centerz + dz;
    normal[21] = 0;
    normal[22] = 1;
    normal[23] = 0;
    uv[14] = 1;
    uv[15] = 1;
    

    // +ve x plane
    vertexes[24] = centerx + dx;
    vertexes[25] = centery - dy;
    vertexes[26] = centerz + dz;
    normal[24] = 1;
    normal[25] = 0;
    normal[26] = 0;
    uv[16] = 0;
    uv[17] = 1;

    vertexes[27] = centerx + dx;
    vertexes[28] = centery - dy;
    vertexes[29] = centerz - dz;
    normal[27] = 1;
    normal[28] = 0;
    normal[29] = 0;
    uv[18] = 0;
    uv[19] = 0;

    vertexes[30] = centerx + dx;
    vertexes[31] = centery + dy;
    vertexes[32] = centerz - dz;
    normal[30] = 1;
    normal[31] = 0;
    normal[32] = 0;
    uv[20] = 1;
    uv[21] = 0;

    vertexes[33] = centerx + dx;
    vertexes[34] = centery + dy;
    vertexes[35] = centerz + dz;
    normal[33] = 1;
    normal[34] = 0;
    normal[35] = 0;
    uv[22] = 1;
    uv[23] = 1;

    // -ve x plane
    vertexes[36] = centerx - dx;
    vertexes[37] = centery + dy;
    vertexes[38] = centerz + dz;
    normal[36] = -1;
    normal[37] = 0;
    normal[38] = 0;
    uv[24] = 0;
    uv[25] = 1;

    vertexes[39] = centerx - dx;
    vertexes[40] = centery + dy;
    vertexes[41] = centerz - dz;
    normal[39] = -1;
    normal[40] = 0;
    normal[41] = 0;
    uv[26] = 0;
    uv[27] = 0;

    vertexes[42] = centerx - dx;
    vertexes[43] = centery - dy;
    vertexes[44] = centerz - dz;
    normal[42] = -1;
    normal[43] = 0;
    normal[44] = 0;
    uv[28] = 1;
    uv[29] = 0;

    vertexes[45] = centerx - dx;
    vertexes[46] = centery - dy;
    vertexes[47] = centerz + dz;
    normal[45] = -1;
    normal[46] = 0;
    normal[47] = 0;
    uv[30] = 1;
    uv[31] = 1;

    // top
    // +ve z plane
    vertexes[48] = centerx - dx;
    vertexes[49] = centery + dy;
    vertexes[50] = centerz + dz;
    normal[48] = 0;
    normal[49] = 0;
    normal[50] = 1;
    uv[32] = 0;
    uv[33] = 1;

    vertexes[51] = centerx - dx;
    vertexes[52] = centery - dy;
    vertexes[53] = centerz + dz;
    normal[51] = 0;
    normal[52] = 0;
    normal[53] = 1;
    uv[34] = 0;
    uv[35] = 0;

    vertexes[54] = centerx + dx;
    vertexes[55] = centery - dy;
    vertexes[56] = centerz + dz;
    normal[54] = 0;
    normal[55] = 0;
    normal[56] = 1;
    uv[36] = 1;
    uv[37] = 0;

    vertexes[57] = centerx + dx;
    vertexes[58] = centery + dy;
    vertexes[59] = centerz + dz;
    normal[57] = 0;
    normal[58] = 0;
    normal[59] = 1;
    uv[38] = 1;
    uv[39] = 1;

    // bottom
    // -ve z plane
    vertexes[60] = centerx + dx;
    vertexes[61] = centery + dy;
    vertexes[62] = centerz - dz;
    normal[60] = 0;
    normal[61] = 0;
    normal[62] = -1;
    uv[40] = 0;
    uv[41] = 1;

    vertexes[63] = centerx + dx;
    vertexes[64] = centery - dy;
    vertexes[65] = centerz - dz;
    normal[63] = 0;
    normal[64] = 0;
    normal[65] = -1;
    uv[42] = 0;
    uv[43] = 0;

    vertexes[66] = centerx - dx;
    vertexes[67] = centery - dy;
    vertexes[68] = centerz - dz;
    normal[66] = 0;
    normal[67] = 0;
    normal[68] = -1;
    uv[44] = 1;
    uv[45] = 0;

    vertexes[69] = centerx - dx;
    vertexes[70] = centery + dy;
    vertexes[71] = centerz - dz;
    normal[69] = 0;
    normal[70] = 0;
    normal[71] = -1;
    uv[46] = 1;
    uv[47] = 1;

    var indexes = [];
    indexes[0] = 0;
    indexes[1] = 1;
    indexes[2] = 2;
    indexes[3] = 0;
    indexes[4] = 2;
    indexes[5] = 3;

    indexes[6] = 4;
    indexes[7] = 5;
    indexes[8] = 6;
    indexes[9] = 4;
    indexes[10] = 6;
    indexes[11] = 7;

    indexes[12] = 8;
    indexes[13] = 9;
    indexes[14] = 10;
    indexes[15] = 8;
    indexes[16] = 10;
    indexes[17] = 11;

    indexes[18] = 12;
    indexes[19] = 13;
    indexes[20] = 14;
    indexes[21] = 12;
    indexes[22] = 14;
    indexes[23] = 15;

    indexes[24] = 16;
    indexes[25] = 17;
    indexes[26] = 18;
    indexes[27] = 16;
    indexes[28] = 18;
    indexes[29] = 19;

    indexes[30] = 20;
    indexes[31] = 21;
    indexes[32] = 22;
    indexes[33] = 20;
    indexes[34] = 22;
    indexes[35] = 23;

    g.getAttributes().Vertex = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, vertexes, 3 );
    g.getAttributes().Normal = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, normal, 3 );
    g.getAttributes().TexCoord0 = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, uv, 2 );
    
    var primitive = new osg.DrawElements(osg.PrimitiveSet.TRIANGLES, new osg.BufferArray(osg.BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ));
    g.getPrimitives().push(primitive);
    return g;
};


osg.createTexturedQuadGeometry = function(cornerx, cornery, cornerz,
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

    var n = osg.Vec3.cross([wx,wy,wz], [hx, hy, hz], []);
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

    g.getAttributes().Vertex = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, vertexes, 3 );
    g.getAttributes().Normal = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, normal, 3 );
    g.getAttributes().TexCoord0 = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, uvs, 2 );
    
    var primitive = new osg.DrawElements(osg.PrimitiveSet.TRIANGLES, new osg.BufferArray(osg.BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ));
    g.getPrimitives().push(primitive);
    return g;
};

osg.createTexturedBox = function(centerx, centery, centerz,
                                 sizex, sizey, sizez) {
    osg.log("osg.createTexturedBox is deprecated use instead osg.createTexturedBoxGeometry");
    return osg.createTexturedBoxGeometry(centerx, centery, centerz,
                                         sizex, sizey, sizez);
};

osg.createTexturedQuad = function(cornerx, cornery, cornerz,
                                  wx, wy, wz,
                                  hx, hy, hz,
                                  l,b,r,t) {
    osg.log("osg.createTexturedQuad is deprecated use instead osg.createTexturedQuadGeometry");
    return osg.createTexturedQuadGeometry(cornerx, cornery, cornerz,
                                          wx, wy, wz,
                                          hx, hy, hz,
                                          l,b,r,t);
};

osg.createAxisGeometry = function(size) {
    if (size === undefined) {
        size = 5.0;
    }
    if (osg.createAxisGeometry.getShader === undefined) {
        osg.createAxisGeometry.getShader = function() {
            if (osg.createAxisGeometry.getShader.program === undefined) {
                var vertexshader = [
                    "#ifdef GL_ES",
                    "precision highp float;",
                    "#endif",
                    "attribute vec3 Vertex;",
                    "attribute vec4 Color;",
                    "uniform mat4 ModelViewMatrix;",
                    "uniform mat4 ProjectionMatrix;",
                    "",
                    "varying vec4 FragColor;",
                    "",
                    "vec4 ftransform() {",
                    "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
                    "}",
                    "",
                    "void main(void) {",
                    "gl_Position = ftransform();",
                    "FragColor = Color;",
                    "}"
                ].join('\n');

                var fragmentshader = [
                    "#ifdef GL_ES",
                    "precision highp float;",
                    "#endif",
                    "varying vec4 FragColor;",

                    "void main(void) {",
                    "gl_FragColor = FragColor;",
                    "}"
                ].join('\n');

                var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                              new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
                osg.createAxisGeometry.getShader.program = program;
            }
            return osg.createAxisGeometry.getShader.program;
        };
    }

    var g = new osg.Geometry();

    var vertexes = [];
    vertexes.push(0,0,0);
    vertexes.push(size,0,0);

    vertexes.push(0,0,0);
    vertexes.push(0,size,0);

    vertexes.push(0,0,0);
    vertexes.push(0,0,size);

    var colors = [];
    colors.push(1, 0, 0, 1.0);
    colors.push(1, 0, 0, 1.0);

    colors.push(0, 1, 0, 1.0);
    colors.push(0, 1, 0, 1.0);

    colors.push(0, 0, 1, 1.0);
    colors.push(0, 0, 1, 1.0);

    g.getAttributes().Vertex = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, vertexes, 3 );
    g.getAttributes().Color = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, colors, 4 );

    var primitive = new osg.DrawArrays(osg.PrimitiveSet.LINES, 0, 6);
    g.getPrimitives().push(primitive);
    g.getOrCreateStateSet().setAttributeAndMode(osg.createAxisGeometry.getShader());

    return g;
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
        this.leafs.splice(0, this.leafs.length);
        this.stateset = undefined;
        this.parent = undefined;
        //this.depth = 0;
        var keys = this.children.keys;
        for (var i = 0, l = keys.length; i < l; i++) {
            var key = keys[i];
            this.children[key].clean();
        }
        this.children = {};
        keys.splice(0, keys.length);
        this.children.keys = keys;
    },
    getStateSet: function() { return this.stateset; },
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
    moveToRootStateGraph: function(state, sg_current)
    {
        // need to pop back all statesets and matrices.
        while (sg_current)
        {
            if (sg_current.stateSet) {
                state.popStateSet();
            }
            sg_current = sg_current._parent;
        }
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
osg.State = function () {
    this._graphicContext = undefined;

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

    this.modelViewMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "ModelViewMatrix");
    this.projectionMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "ProjectionMatrix");
    this.normalMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "NormalMatrix");

    this.uniformArrayState = {};
    this.uniformArrayState.uniformKeys = [];
    this.uniformArrayState.Color = osg.Uniform.createInt1(0, "ArrayColorEnabled");
    this.uniformArrayState.uniformKeys.push("Color");

    this.vertexAttribMap = {};
    this.vertexAttribMap._disable = [];
    this.vertexAttribMap._keys = [];
};

osg.State.prototype = {

    setGraphicContext: function(graphicContext) { this._graphicContext = graphicContext; },
    getGraphicContext: function() { return this._graphicContext;},

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

    popAllStateSets: function() {
        while (this.stateSets.length) {
            this.popStateSet();
        }
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

    haveAppliedAttribute: function(attribute) {
        var key = attribute.getTypeMember();
        var attributeStack = this.attributeMap[key];
        attributeStack.lastApplied = attribute;
        attributeStack.asChanged = true;
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
//        if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
            if (attribute.apply) {
                attribute.apply(this);
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
        }
    },
    applyTextureAttribute: function(unit, attribute) {
        var gl = this.getGraphicContext();
        gl.activeTexture(gl.TEXTURE0 + unit);
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
        //if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
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
        if (this.attributeMap.Program !== undefined && this.attributeMap.Program.length !== 0) {
            program = this.attributeMap.Program.back().object;
            value = this.attributeMap.Program.back().value;
            if (program !== undefined && value !== osg.StateAttribute.OFF) {
                this.programs.push(this.getObjectPair(program, value));
                return program;
            }
        }

        var attributes = {
            'textureAttributeMapList': this.textureAttributeMapList,
            'attributeMap': this.attributeMap
        };

        program = this.shaderGenerator.getOrCreateProgram(attributes);
        this.programs.push(this.getObjectPair(program, osg.StateAttribute.ON));
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
        var gl = this._graphicContext;
        this.applyAttributeMap(this.attributeMap);
        this.applyTextureAttributeMapList(this.textureAttributeMapList);

        this.pushGeneratedProgram();
        var program = this.programs.back().object;
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
                if (attributeKeys !== undefined) {
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
                }

                var textureAttributeKeysList = program.trackAttributes.textureAttributeKeys;
                if (textureAttributeKeysList !== undefined) {
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
                        uniform = uniformStack.back().object;
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
                    uniform = uniformStack.back().object;
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
                attribute = attributeStack.back().object;
            }

            if (attributeStack.asChanged) {
//            if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
                if (attribute.apply) {
                    attribute.apply(this);
                }
                attributeStack.lastApplied = attribute;
                attributeStack.asChanged = false;
            }
        }
    },

    getObjectPair: function(uniform, value) {
        return { object: uniform, value: value};
    },
    pushUniformsList: function(uniformMap, uniformList) {
        var name;
        var uniform;
        for ( var i = 0, l = uniformList.uniformKeys.length; i < l; i++) {
            var key = uniformList.uniformKeys[i];
            uniformPair = uniformList[key];
            uniform = uniformPair.object;
            name = uniform.name;
            if (uniformMap[name] === undefined) {
                uniformMap[name] = osg.Stack.create();
                uniformMap[name].globalDefault = uniform;
                uniformMap.uniformKeys.push(name);
            }
            var stack = uniformMap[name];
            if (stack.length === 0) {
                stack.push(this.getObjectPair(uniform, uniformPair.value));
            } else if ((stack[stack.length-1].value & osg.StateAttribute.OVERRIDE) && !(uniformPair.value & osg.StateAttribute.PROTECTED) ) {
                stack.push(stack[stack.length-1]);
            } else {
                stack.push(this.getObjectPair(uniform, uniformPair.value));
            }
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
        var gl = this._graphicContext;
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
                    attribute = attributeStack.back().object;
                }
                if (attributeStack.asChanged) {
//                if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
                    gl.activeTexture(gl.TEXTURE0 + textureUnit);
                    attribute.apply(this);
                    attributeStack.lastApplied = attribute;
                    attributeStack.asChanged = false;
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
            var attributePair = attributeList[type];
            var attribute = attributePair.object;
            if (attributeMap[type] === undefined) {
                attributeMap[type] = osg.Stack.create();
                attributeMap[type].globalDefault = attribute.cloneType();

                attributeMap.attributeKeys.push(type);
            }

            attributeStack = attributeMap[type];
            if (attributeStack.length === 0) {
                attributeStack.push(this.getObjectPair(attribute, attributePair.value));
            } else if ( (attributeStack[attributeStack.length-1].value & osg.StateAttribute.OVERRIDE) && !(attributePair.value & osg.StateAttribute.PROTECTED)) {
                attributeStack.push(attributeStack[attributeStack.length-1]);
            } else {
                attributeStack.push(this.getObjectPair(attribute, attributePair.value));
            }

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

    setIndexArray: function(array) {
        var gl = this._graphicContext;
        if (this.currentIndexVBO !== array) {
            array.bind(gl);
            this.currentIndexVBO = array;
        }
        if (array.isDirty()) {
            array.compile(gl);
        }
    },

    lazyDisablingOfVertexAttributes: function() {
        var keys = this.vertexAttribMap._keys;
        for (var i = 0, l = keys.length; i < l; i++) {
            var attr = keys[i];
            if (this.vertexAttribMap[attr]) {
                this.vertexAttribMap._disable[attr] = true;
            }
        }
    },

    applyDisablingOfVertexAttributes: function() {
        var keys = this.vertexAttribMap._keys;
        for (var i = 0, l = keys.length; i < l; i++) {
            if (this.vertexAttribMap._disable[keys[i] ] === true) {
                var attr = keys[i];
                this._graphicContext.disableVertexAttribArray(attr);
                this.vertexAttribMap._disable[attr] = false;
                this.vertexAttribMap[attr] = false;
            }
        }

        // it takes 4.26% of global cpu
        // there would be a way to cache it and track state if the program has not changed ...
        var colorAttrib;
        var program = this.programs.lastApplied;
        if (program.generated === true) {
            var updateColorUniform = false;
            if (this.previousAppliedProgram !== this.programs.lastApplied) {
                updateColorUniform = true;
                this.previousAppliedProgram = this.programs.lastApplied;
            } else {
                colorAttrib = program.attributesCache.Color;
                if ( this.vertexAttribMap[colorAttrib] !== this.previousColorAttrib) {
                    updateColorUniform = true;
                }
            }

            if (updateColorUniform) {
                colorAttrib = program.attributesCache.Color;
                if (colorAttrib !== undefined) {
                    if (this.vertexAttribMap[colorAttrib]) {
                        this.uniformArrayState.Color.set([1]);
                    } else {
                        this.uniformArrayState.Color.set([0]);
                    }
                    this.previousColorAttrib = this.vertexAttribMap[colorAttrib];
                    this.uniformArrayState.Color.apply(program.uniformsCache.ArrayColorEnabled);
                }
            }
        }
    },
    setVertexAttribArray: function(attrib, array, normalize) {
        var vertexAttribMap = this.vertexAttribMap;
        vertexAttribMap._disable[ attrib ] = false;
        var gl = this._graphicContext;
        var binded = false;
        if (array.isDirty()) {
            array.bind(gl);
            array.compile(gl);
            binded = true;
        }

        if (vertexAttribMap[attrib] !== array) {

            if (!binded) {
                array.bind(gl);
            }

            if (! vertexAttribMap[attrib]) {
                gl.enableVertexAttribArray(attrib);
                
                if ( vertexAttribMap[attrib] === undefined) {
                    vertexAttribMap._keys.push(attrib);
                }
            }

            vertexAttribMap[attrib] = array;
            gl.vertexAttribPointer(attrib, array._itemSize, gl.FLOAT, normalize, 0, 0);
        }
    }

};
/** 
 * StateSet encapsulate StateAttribute
 * @class StateSet
 */
osg.StateSet = function () {
    osg.Object.call(this);
    this.id = osg.instance++;
    this.attributeMap = {};
    this.attributeMap.attributeKeys = [];

    this.textureAttributeMapList = [];

    this._binName = undefined;
    this._binNumber = 0;
};

/** @lends osg.StateSet.prototype */
osg.StateSet.prototype = osg.objectInehrit(osg.Object.prototype, {
    getObjectPair: function(attribute, value) {
        return {object: attribute, value: value};
    },
    addUniform: function (uniform, mode) {
        if (mode === undefined) {
            mode = osg.StateAttribute.ON;
        }
        if (!this.uniforms) {
            this.uniforms = {};
            this.uniforms.uniformKeys = [];
        }
        var name = uniform.name;
        this.uniforms[name] = this.getObjectPair(uniform, mode);
        if (this.uniforms.uniformKeys.indexOf(name) === -1) {
            this.uniforms.uniformKeys.push(name);
        }
    },
    getUniform: function (uniform) {
        if (this.uniforms && this.uniforms[uniform]) {
            return this.uniforms[uniform].object;
        }
        return undefined;
    },
    getUniformList: function () { return this.uniforms; },

    setTextureAttributeAndMode: function (unit, attribute, mode) {
        if (mode === undefined) {
            mode = osg.StateAttribute.ON;
        }
        this._setTextureAttribute(unit, this.getObjectPair(attribute, mode) );
    },
    getTextureAttribute: function(unit, attribute) {
        if (this.textureAttributeMapList[unit] === undefined || this.textureAttributeMapList[unit][attribute] === undefined) {
            return undefined;
        }
        return this.textureAttributeMapList[unit][attribute].object;
    },
    getAttribute: function(attributeType) { 
        if (this.attributeMap[attributeType] === undefined) {
            return undefined;
        }
        return this.attributeMap[attributeType].object;
    },
    setAttributeAndMode: function(attribute, mode) { 
        if (mode === undefined) {
            mode = osg.StateAttribute.ON;
        }
        this._setAttribute(this.getObjectPair(attribute, mode)); 
    },

    removeAttribute: function(attributeName) {
        if (this.attributeMap[attributeName] !== undefined) {
            delete this.attributeMap[attributeName];
            var idx = this.attributeMap.attributeKeys.indexOf(attributeName);
            this.attributeMap.attributeKeys.splice(idx,1);
        }
    },

    setRenderingHint: function(hint) {
        if (hint === 'OPAQUE_BIN') {
            this.setRenderBinDetails(0,"RenderBin");
        } else if (hint === 'TRANSPARENT_BIN') {
            this.setRenderBinDetails(10,"DepthSortedBin");
        } else {
            this.setRenderBinDetails(0,"");
        }
    },

    setRenderBinDetails: function(num, binName) {
        this._binNumber = num;
        this._binName = binName;
    },
    getBinNumber: function() { return this._binNumber; },
    getBinName: function() { return this._binName; },
    setBinNumber: function(binNum) { this._binNumber = binNum; },
    setBinName: function(binName) { this._binName = binName; },

    _getUniformMap: function () {
        return this.uniforms;
    },

    // for internal use, you should not call it directly
    _setTextureAttribute: function (unit, attributePair) {
        if (this.textureAttributeMapList[unit] === undefined) {
            this.textureAttributeMapList[unit] = {};
            this.textureAttributeMapList[unit].attributeKeys = [];
        }
        var name = attributePair.object.getTypeMember();
        this.textureAttributeMapList[unit][name] = attributePair;
        if (this.textureAttributeMapList[unit].attributeKeys.indexOf(name) === -1) {
            this.textureAttributeMapList[unit].attributeKeys.push(name);
        }
    },
    // for internal use, you should not call it directly
    _setAttribute: function (attributePair) {
        var name = attributePair.object.getTypeMember();
        this.attributeMap[name] = attributePair;
        if (this.attributeMap.attributeKeys.indexOf(name) === -1) {
            this.attributeMap.attributeKeys.push(name);
        }
    }
});
/** -*- compile-command: "jslint-cli Texture.js" -*- */

/** 
 * Texture encapsulate webgl texture object
 * @class Texture
 * @inherits osg.StateAttribute
 */
osg.Texture = function() {
    osg.StateAttribute.call(this);
    this.setDefaultParameters();
};
osg.Texture.DEPTH_COMPONENT = 0x1902;
osg.Texture.ALPHA = 0x1906;
osg.Texture.RGB = 0x1907;
osg.Texture.RGBA = 0x1908;
osg.Texture.LUMINANCE = 0x1909;
osg.Texture.LUMINANCE_ALPHA = 0x190A;

// filter mode
osg.Texture.LINEAR = 0x2601;
osg.Texture.NEAREST = 0x2600;
osg.Texture.NEAREST_MIPMAP_NEAREST = 0x2700;
osg.Texture.LINEAR_MIPMAP_NEAREST = 0x2701;
osg.Texture.NEAREST_MIPMAP_LINEAR = 0x2702;
osg.Texture.LINEAR_MIPMAP_LINEAR = 0x2703;

// wrap mode
osg.Texture.CLAMP_TO_EDGE = 0x812F;
osg.Texture.REPEAT = 0x2901;
osg.Texture.MIRRORED_REPEAT = 0x8370;

// target
osg.Texture.TEXTURE_2D = 0x0DE1;
osg.Texture.TEXTURE_CUBE_MAP = 0x8513;
osg.Texture.TEXTURE_BINDING_CUBE_MAP       = 0x8514;
osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;
osg.Texture.MAX_CUBE_MAP_TEXTURE_SIZE      = 0x851C;


/** @lends osg.Texture.prototype */
osg.Texture.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
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
        // uniform for an texture attribute should directly in osg.Texture.uniforms[unit] and not in osg.Texture.uniforms[unit][Texture0]
        return osg.Texture.uniforms[unit];
    },
    setDefaultParameters: function() {
        this._magFilter = osg.Texture.LINEAR;
        this._minFilter = osg.Texture.LINEAR;
        this._wrapS = osg.Texture.CLAMP_TO_EDGE;
        this._wrapT = osg.Texture.CLAMP_TO_EDGE;
        this._textureWidth = 0;
        this._textureHeight = 0;
        this._unrefImageDataAfterApply = false;
        this.setInternalFormat(osg.Texture.RGBA);
        this._textureTarget = osg.Texture.TEXTURE_2D;
    },
    getTextureTarget: function() { return this._textureTarget;},
    getTextureObject: function() { return this._textureObject;},
    setTextureSize: function(w,h) {
        this._textureWidth = w;
        this._textureHeight = h;
    },
    init: function(gl) {
        if (!this._textureObject) {
            this._textureObject = gl.createTexture();
            this.dirty();
        }
    },
    getWidth: function() { return this._textureWidth; },
    getHeight: function() { return this._textureHeight; },
    releaseGLObjects: function(gl) {
        if (this._textureObject !== undefined && this._textureObject !== null) {
            gl.deleteTexture(this._textureObject);
            this._textureObject = null;
            this._image = undefined;
        }
    },
    setWrapS: function(value) {
        if (typeof(value) === "string") {
            this._wrapS = osg.Texture[value];
        } else {
            this._wrapS = value; 
        }
    },
    setWrapT: function(value) { 
        if (typeof(value) === "string") {
            this._wrapT = osg.Texture[value];
        } else {
            this._wrapT = value; 
        }
    },

    getWrapT: function() { return this._wrapT; },
    getWrapS: function() { return this._wrapS; },
    getMinFilter: function(value) { return this._minFilter; },
    getMagFilter: function(value) { return this._magFilter; },

    setMinFilter: function(value) {
        if (typeof(value) === "string") {
            this._minFilter = osg.Texture[value];
        } else {
            this._minFilter = value; 
        }
    },
    setMagFilter: function(value) { 
        if (typeof(value) === "string") {
            this._magFilter = osg.Texture[value];
        } else {
            this._magFilter = value; 
        }
    },

    setImage: function(img, imageFormat) {
        this._image = img;
        this.setImageFormat(imageFormat);
        this.dirty();
    },
    getImage: function() { return this._image; },
    setImageFormat: function(imageFormat) {
        if (imageFormat) {
            if (typeof(imageFormat) === "string") {
                imageFormat = osg.Texture[imageFormat];
            }
            this._imageFormat = imageFormat;
        } else {
            this._imageFormat = osg.Texture.RGBA;
        }
        this.setInternalFormat(this._imageFormat);
    },
    setUnrefImageDataAfterApply: function(bool) {
        this._unrefImageDataAfterApply = bool;
    },
    setInternalFormat: function(internalFormat) {
        this._internalFormat = internalFormat;
    },
    setFromCanvas: function(canvas, format) {
        this.setImage(canvas, format);
    },

    isImageReady: function(image) {
        if (image) {
            if (image instanceof Image) {
                if (image.complete) {
                    if (image.naturalWidth !== undefined &&  image.naturalWidth === 0) {
                        return false;
                    }
                    return true;
                }
            } else if (image instanceof HTMLCanvasElement) {
                return true;
            }
        }
        return false;
    },

    applyFilterParameter: function(gl, target) {
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, this._magFilter);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, this._minFilter);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, this._wrapS);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, this._wrapT);
    },

    generateMipmap: function(gl, target) {
        if (this._minFilter === gl.NEAREST_MIPMAP_NEAREST ||
            this._minFilter === gl.LINEAR_MIPMAP_NEAREST ||
            this._minFilter === gl.NEAREST_MIPMAP_LINEAR ||
            this._minFilter === gl.LINEAR_MIPMAP_LINEAR) {
            gl.generateMipmap(target);
        }
    },

    apply: function(state) {
        var gl = state.getGraphicContext();
        if (this._textureObject !== undefined && !this.isDirty()) {
            gl.bindTexture(this._textureTarget, this._textureObject);
        } else if (this.default_type) {
            gl.bindTexture(this._textureTarget, null);
        } else {
            var image = this._image;
            if (image !== undefined) {
                if (this.isImageReady(image)) {
                    if (!this._textureObject) {
                        this.init(gl);
                    }
                    if (image instanceof Image) {
                        this.setTextureSize(image.naturalWidth, image.naturalHeight);
                    } else if (image instanceof HTMLCanvasElement) {
                        this.setTextureSize(image.width, image.height);
                    }
                    this.setDirty(false);
                    gl.bindTexture(this._textureTarget, this._textureObject);
                    gl.texImage2D(this._textureTarget, 0, this._internalFormat, this._imageFormat, gl.UNSIGNED_BYTE, this._image);
                    this.applyFilterParameter(gl, this._textureTarget);
                    this.generateMipmap(gl, this._textureTarget);

                    if (this._unrefImageDataAfterApply) {
                        delete this._image;
                    }
                } else {
                    gl.bindTexture(this._textureTarget, null);
                }

            } else if (this._textureHeight !== 0 && this._textureWidth !== 0 ) {
                if (!this._textureObject) {
                    this.init(gl);
                }
                gl.bindTexture(this._textureTarget, this._textureObject);
                gl.texImage2D(this._textureTarget, 0, this._internalFormat, this._textureWidth, this._textureHeight, 0, this._internalFormat, gl.UNSIGNED_BYTE, null);
                this.applyFilterParameter(gl, this._textureTarget);
                this.generateMipmap(gl, this._textureTarget);
                this.setDirty(false);
            }
        }
    },


    /**
      set the injection code that will be used in the shader generation
      for FragmentMain part we would write something like that
      @example
      var fragmentGenerator = function(unit) {
          var str = "texColor" + unit + " = texture2D( Texture" + unit + ", FragTexCoord" + unit + ".xy );\n";
          str += "fragColor = fragColor * texColor" + unit + ";\n";
      };
      setShaderGeneratorFunction(fragmentGenerator, osg.ShaderGeneratorType.FragmentMain);

    */
    setShaderGeneratorFunction: function(
        /**Function*/ injectionFunction, 
        /**osg.ShaderGeneratorType*/ mode) {
        this[mode] = injectionFunction;
    },

    writeToShader: function(unit, type)
    {
        if (this[type]) {
            return this[type].call(this,unit);
        }
        return "";
    }
});
osg.Texture.prototype[osg.ShaderGeneratorType.VertexInit] = function(unit) {
    var str = "attribute vec2 TexCoord"+unit+";\n";
    str += "varying vec2 FragTexCoord"+unit+";\n";
    return str;
};
osg.Texture.prototype[osg.ShaderGeneratorType.VertexMain] = function(unit) {
        return "FragTexCoord"+unit+" = TexCoord" + unit + ";\n";
};
osg.Texture.prototype[osg.ShaderGeneratorType.FragmentInit] = function(unit) {
    var str = "varying vec2 FragTexCoord" + unit +";\n";
    str += "uniform sampler2D Texture" + unit +";\n";
    str += "vec4 texColor" + unit + ";\n";
    return str;
};
osg.Texture.prototype[osg.ShaderGeneratorType.FragmentMain] = function(unit) {
    var str = "texColor" + unit + " = texture2D( Texture" + unit + ", FragTexCoord" + unit + ".xy );\n";
    str += "fragColor = fragColor * texColor" + unit + ";\n";
    return str;
};


osg.Texture.createFromURL = function(imageSource, format) {
    var a = new osg.Texture();
    if (imageSource !== undefined) {
        var img = new Image();
        img.src = imageSource;
        a.setImage(img, format);
    }
    return a;
};
osg.Texture.createFromImg = function(img, format) {
    var a = new osg.Texture();
    a.setImage(img, format);
    return a;
};
osg.Texture.createFromImage = osg.Texture.createFromImg;
osg.Texture.createFromCanvas = function(ctx, format) {
    var a = new osg.Texture();
    a.setFromCanvas(ctx, format);
    return a;
};

osg.Texture.create = function(url) {
    osg.log("osg.Texture.create is deprecated, use osg.Texture.createFromURL instead");
    return osg.Texture.createFromURL(url);
};
/** 
 * TextureCubeMap
 * @class TextureCubeMap
 * @inherits osg.Texture
 */
osg.TextureCubeMap = function() {
    osg.Texture.call(this);
    this._images = {};
};

/** @lends osg.TextureCubeMap.prototype */
osg.TextureCubeMap.prototype = osg.objectInehrit(osg.Texture.prototype, {
    attributeType: "TextureCubeMap",
    setDefaultParameters: function() {
        osg.Texture.prototype.setDefaultParameters.call(this);
        this._textureTarget = osg.Texture.TEXTURE_CUBE_MAP;
    },
    cloneType: function() { var t = new osg.TextureCubeMap(); t.default_type = true; return t;},
    setImage: function(face, img, imageFormat) {
        if ( typeof(face) === "string" ) {
            face = osg.Texture[face];
        }

        if (this._images[face] === undefined) {
            this._images[face] = {};
        }

        if ( typeof(imageFormat) === "string") {
            imageFormat = osg.Texture[imageFormat];
        }
        if (imageFormat === undefined) {
            imageFormat = osg.Texture.RGBA;
        }

        this._images[face].image = img;
        this._images[face].format = imageFormat;
        this._images[face].dirty = true;
        this.dirty();
    },
    getImage: function(face) { return this._images[face].image; },

    applyTexImage2D_load: function(gl, target, level, internalFormat, format, type, image) {
        if (!image) {
            return false;
        }

        if (!osg.Texture.prototype.isImageReady(image)) {
            return false;
        }

        if (image instanceof Image) {
            this.setTextureSize(image.naturalWidth, image.naturalHeight);
        } else if (image instanceof HTMLCanvasElement) {
            this.setTextureSize(image.width, image.height);
        }

        gl.texImage2D(target, 0, internalFormat, format, type, image);
        return true;
    },

    _applyImageTarget: function(gl, internalFormat, target) {
        var imgObject = this._images[target];
        if (!imgObject) {
            return 0;
        }

        if (!imgObject.dirty) {
            return 1;
        }

        if (this.applyTexImage2D_load(gl,
                                      target,
                                      0,
                                      internalFormat,
                                      imgObject.format,
                                      gl.UNSIGNED_BYTE,
                                      imgObject.image) ) {
            imgObject.dirty = false;
            if (this._unrefImageDataAfterApply) {
                delete this._images[target];
            }
            return 1;
        }
        return 0;
    },

    apply: function(state) {
        var gl = state.getGraphicContext();
        if (this._textureObject !== undefined && !this.isDirty()) {
            gl.bindTexture(this._textureTarget, this._textureObject);

        } else if (this.default_type) {
            gl.bindTexture(this._textureTarget, null);
        } else {
            var images = this._images;
            if (!this._textureObject) {
                this.init(gl);
            }
            gl.bindTexture(this._textureTarget, this._textureObject);

            var internalFormat = this._internalFormat;

            var valid = 0;
            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_X);
            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_X);

            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);

            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
            valid += this._applyImageTarget(gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
            if (valid === 6) {
                this.setDirty(false);
                this.applyFilterParameter(gl, this._textureTarget);
                this.generateMipmap(gl, this._textureTarget);
            }
        } // render to cubemap not yet implemented
    }
});
osg.UpdateVisitor = function () { 
    osg.NodeVisitor.call(this);
    var framestamp = new osg.FrameStamp();
    this.getFrameStamp = function() { return framestamp; };
    this.setFrameStamp = function(s) { framestamp = s; };
};
osg.UpdateVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    apply: function(node) {
        var ncs = node.getUpdateCallbackList();
        for (var i = 0, l = ncs.length; i < l; i++) {
            if (!ncs[i].update(node, this)) {
                return;
            }
        }
        this.traverse(node);
    }
});
osg.Viewport = function (x,y, w, h) {
    osg.StateAttribute.call(this);

    if (x === undefined) { x = 0; }
    if (y === undefined) { y = 0; }
    if (w === undefined) { w = 800; }
    if (h === undefined) { h = 600; }

    this._x = x;
    this._y = y;
    this._width = w;
    this._height = h;
    this._dirty = true;
};

osg.Viewport.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Viewport",
    cloneType: function() {return new osg.Viewport(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) {
        var gl = state.getGraphicContext();
        gl.viewport(this._x, this._y, this._width, this._height); 
        this._dirty = false;
    },
    setViewport: function(x, y, width, height) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this.dirty();
    },
    x: function() { return this._x; },
    y: function() { return this._y; },
    width: function() { return this._width; },
    height: function() { return this._height; },
    computeWindowMatrix: function() {
        // res = Matrix offset * Matrix scale * Matrix translate
        var translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
        var scale = osg.Matrix.makeScale(0.5*this._width, 0.5*this._height, 0.5);
        var offset = osg.Matrix.makeTranslate(this._x,this._y,0.0);
        //return osg.Matrix.mult(osg.Matrix.mult(translate, scale, translate), offset, offset);
        return osg.Matrix.preMult(offset, osg.Matrix.preMult(scale, translate));
    }
});
osg.CullStack = function() {
    this._modelviewMatrixStack = [];
    this._projectionMatrixStack = [];
    this._viewportStack = [];
    this._bbCornerFar = 0;
    this._bbCornerNear = 0;
};

osg.CullStack.prototype = {
    getViewport: function () {
        if (this._viewportStack.length === 0) {
            return undefined;
        }
        return this._viewportStack[this._viewportStack.length-1];
    },
    getLookVectorLocal: function() {
        var m = this._modelviewMatrixStack[this._modelviewMatrixStack.length-1];
        return [ -m[2], -m[6], -m[10] ];
    },
    pushViewport: function (vp) {
        this._viewportStack.push(vp);
    },
    popViewport: function () {
        this._viewportStack.pop();
    },
    pushModelviewMatrix: function (matrix) {
        this._modelviewMatrixStack.push(matrix);

        var lookVector = this.getLookVectorLocal();
        this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);        
        this._bbCornerNear = (~this._bbCornerFar)&7;
    },
    popModelviewMatrix: function () {

        this._modelviewMatrixStack.pop();
        var lookVector;
        if (this._modelviewMatrixStack.length !== 0) {
            lookVector = this.getLookVectorLocal();
        } else {
            lookVector = [0,0,-1];
        }
        this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
        this._bbCornerNear = (~this._bbCornerFar)&7;

    },
    pushProjectionMatrix: function (matrix) {
        this._projectionMatrixStack.push(matrix);
    },
    popProjectionMatrix: function () {
        this._projectionMatrixStack.pop();
    }
};
/** 
 * CullVisitor traverse the tree and collect Matrix/State for the rendering traverse 
 * @class CullVisitor
 */
osg.CullVisitor = function () {
    osg.NodeVisitor.call(this);
    osg.CullSettings.call(this);
    osg.CullStack.call(this);

    this._rootStateGraph = undefined;
    this._currentStateGraph = undefined;
    this._currentRenderBin = undefined;
    this._currentRenderStage = undefined;
    this._rootRenderStage = undefined;

    this._computeNearFar = true;
    this._computedNear = Number.POSITIVE_INFINITY;
    this._computedFar = Number.NEGATIVE_INFINITY;

    var lookVector =[0.0,0.0,-1.0];
    this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this._bbCornerNear = (~this._bbCornerFar)&7;


    // keep a matrix in memory to avoid to create matrix
    this._reserveMatrixStack = [[]];
    this._reserveMatrixStack.current = 0;

    this._reserveLeafStack = [{}];
    this._reserveLeafStack.current = 0;

    this._renderBinStack = [];
};

/** @lends osg.CullVisitor.prototype */
osg.CullVisitor.prototype = osg.objectInehrit(osg.CullStack.prototype ,osg.objectInehrit(osg.CullSettings.prototype, osg.objectInehrit(osg.NodeVisitor.prototype, {
    distance: function(coord, matrix) {
        return -( coord[0]*matrix[2]+ coord[1]*matrix[6] + coord[2]*matrix[10] + matrix[14]);
    },
    updateCalculatedNearFar: function( matrix, drawable) {

        var bb = drawable.getBoundingBox();
        var d_near, d_far;

        // efficient computation of near and far, only taking into account the nearest and furthest
        // corners of the bounding box.
        d_near = this.distance(bb.corner(this._bbCornerNear),matrix);
        d_far = this.distance(bb.corner(this._bbCornerFar),matrix);
        
        if (d_near>d_far) {
            var tmp = d_near;
            d_near = d_far;
            d_far = tmp;
        }

        if (d_far<0.0) {
            // whole object behind the eye point so discard
            return false;
        }

        if (d_near<this._computedNear) {
            this._computedNear = d_near;
        }

        if (d_far>this._computedFar) {
            this._computedFar = d_far;
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
            osg.Matrix.postMult(matrix, projection);
            // OSG_INFO << "Persepective matrix after clamping"<<projection<<std::endl;
        }
        if (resultNearFar !== undefined) {
            resultNearFar[0] = znear;
            resultNearFar[1] = zfar;
        }
        return true;
    },

    setStateGraph: function(sg) {
        this._rootStateGraph = sg;
        this._currentStateGraph = sg;
    },
    setRenderStage: function(rg) {
        this._rootRenderStage = rg;
        this._currentRenderBin = rg;
    },
    reset: function () {
        //this._modelviewMatrixStack.length = 0;
        this._modelviewMatrixStack.splice(0, this._modelviewMatrixStack.length);
        //this._projectionMatrixStack.length = 0;
        this._projectionMatrixStack.splice(0, this._projectionMatrixStack.length);
        this._reserveMatrixStack.current = 0;
        this._reserveLeafStack.current = 0;

        this._computedNear = Number.POSITIVE_INFINITY;
        this._computedFar = Number.NEGATIVE_INFINITY;
    },
    getCurrentRenderBin: function() { return this._currentRenderBin; },
    setCurrentRenderBin: function(rb) { this._currentRenderBin = rb; },
    addPositionedAttribute: function (attribute) {
        var matrix = this._modelviewMatrixStack[this._modelviewMatrixStack.length - 1];
        this._currentRenderBin.getStage().positionedAttribute.push([matrix, attribute]);
    },

    pushStateSet: function (stateset) {
        this._currentStateGraph = this._currentStateGraph.findOrInsert(stateset);
        if (stateset.getBinName() !== undefined) {
            var renderBinStack = this._renderBinStack;
            var currentRenderBin = this._currentRenderBin;
            renderBinStack.push(currentRenderBin);
            this._currentRenderBin = currentRenderBin.getStage().findOrInsert(stateset.getBinNumber(),stateset.getBinName());
        }
    },

    /** Pop the top state set and hence associated state group.
     * Move the current state group to the parent of the popped
     * state group.
     */
    popStateSet: function () {
        var currentStateGraph = this._currentStateGraph;
        var stateset = currentStateGraph.getStateSet();
        this._currentStateGraph = currentStateGraph.parent;
        if (stateset.getBinName() !== undefined) {
            var renderBinStack = this._renderBinStack;
            if (renderBinStack.length === 0) {
                this._currentRenderBin = this._currentRenderBin.getStage();
            } else {
                this._currentRenderBin = renderBinStack.pop();
            }
        }
    },

    popProjectionMatrix: function () {
        if (this._computeNearFar === true && this._computedFar >= this._computedNear) {
            var m = this._projectionMatrixStack[this._projectionMatrixStack.length-1];
            this.clampProjectionMatrix(m, this._computedNear, this._computedFar, this._nearFarRatio);
        }
        osg.CullStack.prototype.popProjectionMatrix.call(this);
    },

    apply: function( node ) {
        this[node.objectType].call(this, node);
    },

    _getReservedMatrix: function() {
        var m = this._reserveMatrixStack[this._reserveMatrixStack.current++];
        if (this._reserveMatrixStack.current === this._reserveMatrixStack.length) {
            this._reserveMatrixStack.push(osg.Matrix.makeIdentity([]));
        }
        return m;
    },
    _getReservedLeaf: function() {
        var l = this._reserveLeafStack[this._reserveLeafStack.current++];
        if (this._reserveLeafStack.current === this._reserveLeafStack.length) {
            this._reserveLeafStack.push({});
        }
        return l;
    }
})));

osg.CullVisitor.prototype[osg.Camera.prototype.objectType] = function( camera ) {

    var stateset = camera.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (camera.light) {
        this.addPositionedAttribute(camera.light);
    }

    var originalModelView = this._modelviewMatrixStack[this._modelviewMatrixStack.length-1];

    var modelview = this._getReservedMatrix();
    var projection = this._getReservedMatrix();

    if (camera.getReferenceFrame() === osg.Transform.RELATIVE_RF) {
        var lastProjectionMatrix = this._projectionMatrixStack[this._projectionMatrixStack.length-1];
        osg.Matrix.mult(lastProjectionMatrix, camera.getProjectionMatrix(), projection);
        var lastViewMatrix = this._modelviewMatrixStack[this._modelviewMatrixStack.length-1];
        osg.Matrix.mult(lastViewMatrix, camera.getViewMatrix(), modelview);
    } else {
        // absolute
        osg.Matrix.copy(camera.getViewMatrix(), modelview);
        osg.Matrix.copy(camera.getProjectionMatrix(), projection);
    }
    this.pushProjectionMatrix(projection);
    this.pushModelviewMatrix(modelview);

    if (camera.getViewport()) {
        this.pushViewport(camera.getViewport());
    }

    // save current state of the camera
    var previous_znear = this._computedNear;
    var previous_zfar = this._computedFar;
    var previous_cullsettings = new osg.CullSettings();
    previous_cullsettings.setCullSettings(this);

    this._computedNear = Number.POSITIVE_INFINITY;
    this._computedFar = Number.NEGATIVE_INFINITY;
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
    this._computedNear = previous_znear;
    this._computedFar = previous_zfar;

    if (stateset) {
        this.popStateSet();
    }

};


osg.CullVisitor.prototype[osg.MatrixTransform.prototype.objectType] = function (node) {
    var matrix = this._getReservedMatrix();

    if (node.getReferenceFrame() === osg.Transform.RELATIVE_RF) {
        var lastMatrixStack = this._modelviewMatrixStack[this._modelviewMatrixStack.length-1];
        osg.Matrix.mult(lastMatrixStack, node.getMatrix(), matrix);
    } else {
        // absolute
        osg.Matrix.copy(node.getMatrix(), matrix);
    }
    this.pushModelviewMatrix(matrix);


    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (node.light) {
        this.addPositionedAttribute(node.light);
    }

    if (node.traverse) {
        this.traverse(node);
    }

    if (stateset) {
        this.popStateSet();
    }
    
    this.popModelviewMatrix();

};

osg.CullVisitor.prototype[osg.Projection.prototype.objectType] = function (node) {
    lastMatrixStack = this._projectionMatrixStack[this._projectionMatrixStack.length-1];
    var matrix = this._getReservedMatrix();
    osg.Matrix.mult(lastMatrixStack, node.getProjectionMatrix(), matrix);
    this.pushProjectionMatrix(matrix);

    var stateset = node.getStateSet();

    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (node.traverse) {
        this.traverse(node);
    }

    if (stateset) {
        this.popStateSet();
    }

    this.popProjectionMatrix();
};

osg.CullVisitor.prototype[osg.Node.prototype.objectType] = function (node) {

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }
    if (node.light) {
        this.addPositionedAttribute(node.light);
    }

    if (node.traverse) {
        this.traverse(node);
    }

    if (stateset) {
        this.popStateSet();
    }
};
osg.CullVisitor.prototype[osg.Geometry.prototype.objectType] = function (node) {
    var modelview = this._modelviewMatrixStack[this._modelviewMatrixStack.length-1];
    var bb = node.getBoundingBox();
    if (this._computeNearFar && bb.valid()) {
        if (!this.updateCalculatedNearFar(modelview,node)) {
            return;
        }
    }

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    var leafs = this._currentStateGraph.leafs;
    if (leafs.length === 0) {
        this._currentRenderBin.addStateGraph(this._currentStateGraph);
    }

    var leaf = this._getReservedLeaf();
    var depth = 0;    
    if (bb.valid()) {
        depth = this.distance(bb.center(), modelview);
    }
    if (isNaN(depth)) {
        osg.log("warning geometry has a NaN depth, " + modelview + " center " + bb.center());
    } else {
        //leaf.id = this._reserveLeafStack.current;
        leaf.parent = this._currentStateGraph;
        leaf.projection = this._projectionMatrixStack[this._projectionMatrixStack.length-1];
        leaf.geometry = node;
        leaf.modelview = modelview;
        leaf.depth = depth;
        leafs.push(leaf);
    }

    if (stateset) {
        this.popStateSet();
    }
};
/** -*- compile-command: "jslint-cli osgAnimation.js" -*-
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
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */


var osgAnimation = {};

osgAnimation.EaseOutQuad = function(t) { return - (t* (t-2.0)); };
osgAnimation.EaseInQuad = function(t) { return (t*t); };
osgAnimation.EaseOutCubic = function(t) { t = t-1.0; return (t*t*t + 1); };
osgAnimation.EaseInCubic = function(t) { return (t*t*t); };
osgAnimation.EaseOutQuart = function(t) { t = t - 1; return - (t*t*t*t -1); };
osgAnimation.EaseInQuart = function(t) { return (t*t*t*t); };
osgAnimation.EaseOutElastic = function(t) { return Math.pow(2.0, -10.0 * t) * Math.sin((t - 0.3 / 4.0) * (2.0 * Math.PI) / 0.3) + 1.0; };
//osgAnimation.EaseInElastic = function(t) { return ; };

osgAnimation.easeOutQuad = osgAnimation.EaseOutQuad;
osgAnimation.easeInQuad = osgAnimation.EaseInQuad;
osgAnimation.easeOutCubic = osgAnimation.EaseOutCubic;
osgAnimation.easeInCubic = osgAnimation.EaseInCubic;
osgAnimation.easeOutQuart = osgAnimation.EaseOutQuart;
osgAnimation.easeInQuart = osgAnimation.EaseInQuart;
osgAnimation.easeOutElastic = osgAnimation.EaseOutElastic;

/** -*- compile-command: "jslint-cli Animation.js" -*-
 *
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


/** 
 *  Animation
 *  @class Animation
 */
osgAnimation.Animation = function() {
    osg.Object.call(this);
    this._channels = [];
};

/** @lends osgAnimation.Animation.prototype */
osgAnimation.Animation.prototype = osg.objectInehrit(osg.Object.prototype, {
    getChannels: function() { return this._channels; },
    getDuration: function() {
        var tmin = 1e5;
        var tmax = -1e5;
        for (var i = 0, l = this._channels.length; i < l; i++) {
            var channel = this._channels[i];
            tmin = Math.min(tmin, channel.getStartTime());
            tmax = Math.max(tmax, channel.getEndTime());
        }
        return tmax-tmin;
    }

});
/** -*- compile-command: "jslint-cli AnimationManager.js" -*-
 *
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


/** 
 *  BasicAnimationManager
 *  @class BasicAnimationManager
 */
osgAnimation.BasicAnimationManager = function() {
    osg.Object.call(this);
    this._animations = {};

    this._actives = {};
    this._actives._keys = [];

    this._lastUpdate = undefined;
    this._targets = [];
};

/** @lends osgAnimation.BasicAnimationManager.prototype */
osgAnimation.BasicAnimationManager.prototype = osg.objectInehrit(osg.Object.prototype, {
    _updateAnimation: function(animationParameter, t, priority) {
        var duration = animationParameter.duration;
        var weight = animationParameter.weight;
        var animation = animationParameter.anim;
        var start = animationParameter.start;
        var loop = animationParameter.loop;

        if (loop > 0) {
            var playedTimes = t-start;
            if (playedTimes >= loop*duration) {
                return true;
            }
        }

        t = (t-start) % duration;
        var callback = animationParameter.callback;
        if (callback) {
            callback(t);
        }

        var channels = animation.getChannels();
        for ( var i = 0, l = channels.length; i < l; i++) {
            var channel = channels[i];
            channel.update(t, weight, priority);
        }
        return false;
    },
    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        this.updateManager(t);
        return true;
    },
    updateManager: function(t) {
        
        var targets = this._targets;
        for (var i = 0, l = targets.length; i < l; i++) {
            targets[i].reset();
        }
        if (this._actives._keys.length > 0) {
            var pri = this._actives._keys.length - 1;
            while (pri >= 0) {
                var layer = this._actives[pri];
                var keys = this._actives[pri]._keys;
                var removes = [];
                for (var ai = 0, al = keys.length; ai < al; ai++) {
                    var key = keys[ai];
                    var anim = layer[key];
                    if (anim.start === undefined) {
                        anim.start = t;
                    }
                    var remove = this._updateAnimation(anim, t, pri);
                    if (remove) {
                        removes.push(ai);
                    }
                }

                // remove finished animation
                for (var j = removes.length-1; j >= 0; j--) {
                    var k = keys[j];
                    keys.splice(j,1);
                    delete layer[k];
                }

                pri--;
            }
        }
    },

    stopAll: function() {},
    isPlaying: function(name) {
        if (this._actives._keys.length > 0) {
            var pri = this._actives._keys.length - 1;
            while (pri >=0 ) {
                if (this._actives[pri][name]) {
                    return true;
                }
                pri--;
            }
        }
        return false;
    },
    stopAnimation: function(name) {
        if (this._actives._keys.length > 0) {
            var pri = this._actives._keys.length - 1;
            var filterFunction = function(element, index, array) { return element !== "_keys";};
            while (pri >=0 ) {
                if (this._actives[pri][name]) {
                    delete this._actives[pri][name];
                    this._actives[pri]._keys = Object.keys(this._actives[pri]).filter(filterFunction);
                    return;
                }
                pri--;
            }
        }
    },
    playAnimationObject: function(obj) {
        if (obj.name === undefined) {
            return;
        }

        var anim = this._animations[obj.name];
        if (anim === undefined) {
            osg.log("no animation " + obj.name + " found");
            return;
        }

        if (this.isPlaying(obj.name)) {
            return;
        }

        if (obj.priority === undefined) {
            obj.priority = 0;
        }

        if (obj.weight === undefined) {
            obj.weight = 1.0;
        }

        if (obj.timeFactor === undefined) {
            obj.timeFactor = 1.0;
        }

        if (obj.loop === undefined) {
            obj.loop = 0;
        }
        
        if (this._actives[obj.priority] === undefined) {
            this._actives[obj.priority] = {};
            this._actives[obj.priority]._keys = [];
            this._actives._keys.push(obj.priority); // = Object.keys(this._actives);
        }

        obj.start = undefined;
        obj.duration = anim.getDuration();
        obj.anim = anim;
        this._actives[obj.priority][obj.name] = obj;
        this._actives[obj.priority]._keys.push(obj.name);
    },

    playAnimation: function(name, priority, weight) {
        var animName = name;
        if (typeof name === "object") {
            if (name.getName === undefined) {
                return this.playAnimationObject(name);
            } else {
                animName = name.getName();
            }
        }
        var obj = { 'name': animName,
                    'priority': priority,
                    'weight': weight };

        return this.playAnimationObject(obj);
    },

    registerAnimation: function(anim) {
        this._animations[anim.getName()] = anim;
        this.buildTargetList();
    },
    getAnimationMap: function() { return this._animations; },
    buildTargetList: function() {
        this._targets.length = 0;
        var keys = Object.keys(this._animations);
        for (var i = 0, l = keys.length; i < l; i++) {
            var a = this._animations[ keys[i] ];
            var channels = a.getChannels();
            for (var c = 0, lc = channels.length; c < lc; c++) {
                var channel = channels[c];
                this._targets.push(channel.getTarget());
            }
        }
    }

});
/** -*- compile-command: "jslint-cli Channel.js" -*-
 *
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


/** 
 *  Channel is responsible to interpolate keys
 *  @class Channel
 */
osgAnimation.Channel = function(sampler, target) {
    osg.Object.call(this);
    this._sampler = sampler;
    this._target = target;
    this._targetName = undefined;
    this._data = { 'value': undefined, 'key' : 0 };
};

/** @lends osgAnimation.Channel.prototype */
osgAnimation.Channel.prototype = osg.objectInehrit(osg.Object.prototype, {
    getKeyframes: function() { return this._sampler.getKeyframes(); },
    setKeyframes: function(keys) { this._sampler.setKeyframes(keys); },
    getStartTime: function() { return this._sampler.getStartTime(); },
    getEndTime: function() { return this._sampler.getEndTime(); },
    getSampler: function() { return this._sampler; },
    setSampler: function(sampler) { this._sampler = sampler; },
    getTarget: function() { return this._target; },
    setTarget: function(target) { this._target = target; },
    setTargetName: function(name) { this._targetName = name; },
    getTargetName: function() { return this._targetName; },
    update: function(t, weight, priority) {
        weight = weight || 1.0;
        priority = priority || 0.0;

        // skip if weight == 0
        if (weight < 1e-4)
            return;
        var data = this._data;
        this._sampler.getValueAt(t, data);
        this._target.update.call(this._target, weight, data.value, priority);
    },
    reset: function() { this._target.reset(); }
});


osgAnimation.Vec3LerpChannel = function(keys, target)
{
    var sampler = new osgAnimation.Sampler();
    if (!keys) {
        keys = [];
    }
    if (!target) {
        target = new osgAnimation.Vec3Target();
    }
    osgAnimation.Channel.call(this, sampler, target);
    sampler.setInterpolator(osgAnimation.Vec3LerpInterpolator);
    this.setKeyframes(keys);
    this._data.value = osg.Vec3.copy(target.getValue(), []);
};
osgAnimation.Vec3LerpChannel.prototype = osgAnimation.Channel.prototype;



osgAnimation.FloatLerpChannel = function(keys, target)
{
    var sampler = new osgAnimation.Sampler();
    if (!keys) {
        keys = [];
    }
    if (!target) {
        target = new osgAnimation.FloatTarget();
    }
    osgAnimation.Channel.call(this, sampler, target);
    sampler.setInterpolator(osgAnimation.FloatLerpInterpolator);
    this.setKeyframes(keys);
    this._data.value = target.getValue();
};
osgAnimation.FloatLerpChannel.prototype = osgAnimation.Channel.prototype;


osgAnimation.QuatLerpChannel = function(keys, target)
{
    var sampler = new osgAnimation.Sampler();
    if (!keys) {
        keys = [];
    }
    if (!target) {
        target = new osgAnimation.QuatTarget();
    }
    osgAnimation.Channel.call(this, sampler, target);
    sampler.setInterpolator(osgAnimation.QuatLerpInterpolator);
    this.setKeyframes(keys);
    this._data.value = osg.Quat.copy(target.getValue(), []);
};
osgAnimation.QuatLerpChannel.prototype = osgAnimation.Channel.prototype;


osgAnimation.QuatSlerpChannel = function(keys, target)
{
    osgAnimation.QuatLerpChannel.call(this, keys, target);
    this.getSampler().setInterpolator(osgAnimation.QuatSlerpInterpolator);
};
osgAnimation.QuatSlerpChannel.prototype = osgAnimation.Channel.prototype;
/** -*- compile-command: "jslint-cli Interpolator.js" -*-
 *
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


/** 
 *  Interpolator provide interpolation function to sampler
 */
osgAnimation.Vec3LerpInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value[0] = keyEnd[0];
        result.value[1] = keyEnd[1];
        result.value[2] = keyEnd[2];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value[0] = keyStart[0];
            result.value[1] = keyStart[1];
            result.value[2] = keyStart[2];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var x1=keys[i1][0];
    var y1=keys[i1][1];
    var z1=keys[i1][2];
    
    var t2=keys[i2].t;
    var x2=keys[i2][0];
    var y2=keys[i2][1];
    var z2=keys[i2][2];
    
    var r = (t-t1)/(t2-t1);

    result.value[0] = x1+(x2-x1)*r;
    result.value[1] = y1+(y2-y1)*r;
    result.value[2] = z1+(z2-z1)*r;
    result.key = i1;
};


osgAnimation.QuatLerpInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value[0] = keyEnd[0];
        result.value[1] = keyEnd[1];
        result.value[2] = keyEnd[2];
        result.value[3] = keyEnd[3];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value[0] = keyStart[0];
            result.value[1] = keyStart[1];
            result.value[2] = keyStart[2];
            result.value[3] = keyStart[3];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var x1=keys[i1][0];
    var y1=keys[i1][1];
    var z1=keys[i1][2];
    var w1=keys[i1][3];
    
    var t2=keys[i2].t;
    var x2=keys[i2][0];
    var y2=keys[i2][1];
    var z2=keys[i2][2];
    var w2=keys[i2][3];
    
    var r = (t-t1)/(t2-t1);

    result.value[0] = x1+(x2-x1)*r;
    result.value[1] = y1+(y2-y1)*r;
    result.value[2] = z1+(z2-z1)*r;
    result.value[3] = w1+(w2-w1)*r;
    result.key = i1;
};

osgAnimation.QuatSlerpInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value[0] = keyEnd[0];
        result.value[1] = keyEnd[1];
        result.value[2] = keyEnd[2];
        result.value[3] = keyEnd[3];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value[0] = keyStart[0];
            result.value[1] = keyStart[1];
            result.value[2] = keyStart[2];
            result.value[3] = keyStart[3];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var t2=keys[i2].t;
    var r = (t-t1)/(t2-t1);

    osg.Quat.slerp(r, keys[i1], keys[i2], result.value);
    result.key = i1;
};


/** 
 *  Interpolator provide interpolation function to sampler
 */
osgAnimation.FloatLerpInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value = keyEnd[0];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value = keyStart[0];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var x1=keys[i1][0];
    
    var t2=keys[i2].t;
    var x2=keys[i2][0];
    
    var r = (t-t1)/(t2-t1);
    result.value = x1+(x2-x1)*r;
    result.key = i1;
};


/** 
 *  Interpolator provide interpolation function to sampler
 */
osgAnimation.FloatStepInterpolator = function(keys, t, result)
{
    var keyStart;
    var startTime;
    var keyEnd = keys[keys.length-1];
    var endTime = keyEnd.t;
    if (t >= endTime) {
        result.key = 0;
        result.value = keyEnd[0];
        return;
    } else {
        keyStart = keys[0];
        startTime = keyStart.t;
        
        if (t <= startTime) {
            result.key = 0;
            result.value = keyStart[0];
            return;
        }
    }

    var i1 = result.key;
    while(keys[i1+1].t < t) {
        i1++;
    }
    var i2 = i1+1;

    var t1=keys[i1].t;
    var x1=keys[i1][0];
    result.value = x1;
    result.key = i1;
};
/** -*- compile-command: "jslint-cli Keyframe.js" -*-
 *
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


osgAnimation.createVec3Keyframe = function(t, array) {
    var k = array.slice(0);
    k.t = t;
    return k;
};

osgAnimation.createQuatKeyframe = function(t, array) {
    var k = array.slice(0);
    k.t = t;
    return k;
};

osgAnimation.createFloatKeyframe = function(t, value) {
    var k = [value];
    k.t = t;
    return k;
};
/** -*- compile-command: "jslint-cli LinkVisitor.js" -*-
 *
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


/** 
 *  LinkVisitor search for animationUpdateCallback and link animation data
 *  @class LinkVisitor
 */
osgAnimation.LinkVisitor = function() {
    osg.NodeVisitor.call(this);
    this._animations = undefined;
    this._nbLinkTarget = 0;
};

/** @lends osgAnimation.LinkVisitor.prototype */
osgAnimation.LinkVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    setAnimationMap: function(anims) { 
        this._animations = anims;
        this._animationKeys = Object.keys(anims);
    },

    apply: function(node) {
        var cbs = node.getUpdateCallbackList();
        for (var i = 0, l = cbs.length; i < l; i++) {
            var cb = cbs[i];
            if ( cb instanceof osgAnimation.AnimationUpdateCallback ) {
                this.link(cb);
            }
        }
        this.traverse(node);
    },

    link: function(animCallback) {
        var result = 0;
        var anims = this._animations;
        var animKeys = this._animationKeys;
        for (var i = 0, l = animKeys.length; i < l; i++) {
            var key = animKeys[i];
            var anim = anims[key];
            result += animCallback.linkAnimation(anim);
        }
        this._nbLinkedTarget += result;
        osg.log("linked " + result + " for \"" + animCallback.getName() + '"');
    }

});/** -*- compile-command: "jslint-cli Sampler.js" -*-
 *
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


/** 
 *  Sampler is responsible to interpolate keys
 *  @class Sampler
 */
osgAnimation.Sampler = function(keys, interpolator) {
    if (!keys) {
        keys = [];
    }
    this._keys = keys;
    this._interpolator = interpolator;
};

/** @lends osgAnimation.Sampler.prototype */
osgAnimation.Sampler.prototype = {

    getKeyframes: function() { return this._keys;},
    setKeyframes: function(keys) { this._keys = keys; },
    setInterpolator: function(interpolator) { this._interpolator = interpolator; },
    getInterpolator: function() { return this._interpolator; },
    getStartTime: function() {
        if (this._keys.length === 0) {
            return undefined;
        }
        return this._keys[0].t;
    },
    getEndTime: function() {
        if (this._keys.length === 0) {
            return undefined;
        }
        return this._keys[this._keys.length-1].t;
    },

    // result contains the keyIndex where to start, this key
    // will be updated when calling the Interpolator
    // result.value will contain the interpolation result
    // { 'value': undefined, 'keyIndex': 0 };
    getValueAt: function(t, result) {
        // reset the key if invalid
        if (this._keys[result.key].t > t) {
            result.key = 0;
        }
        this._interpolator(this._keys, t, result);
    }
};
/** -*- compile-command: "jslint-cli StackedTransformElement.js" -*-
 *
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


/** 
 *  StackedTranslate
 *  @class StackedTranslate
 */
osgAnimation.StackedTranslate = function (name, translate) {
    osg.Object.call(this);
    if (!translate) {
        translate = [ 0,0,0 ];
    }
    this._translate = translate;
    this._target = undefined;
    this.setName(name);
};

/** @lends osgAnimation.StackedTranslate.prototype */
osgAnimation.StackedTranslate.prototype = osg.objectInehrit(osg.Object.prototype, {
    setTranslate: function(translate) { osg.Vec3.copy(translate, this._translate); },
    setTarget: function(target) { this._target = target; },
    getTarget: function() { return this._target; },
    update: function() {
        if (this._target !== undefined) {
            osg.Vec3.copy(this._target.getValue(), this._translate);
        }
    },
    getOrCreateTarget: function() {
        if (!this._target) {
            this._target = new osgAnimation.Vec3Target(this._translate);
        }
        return this._target;
    },
    applyToMatrix: function(m) {
        osg.Matrix.preMultTranslate(m, this._translate);
    }
});


/** 
 *  StackedRotateAxis
 *  @class StackedRotateAxis
 */
osgAnimation.StackedRotateAxis = function (name, axis, angle) {
    osg.Object.call(this);
    if (!axis) {
        axis = [ 1,0,0 ];
    }
    if (!angle) {
        angle = 0;
    }
    this._axis = axis;
    this._angle = angle;
    this._target = undefined;
    this.setName(name);

    this._matrixTmp = [];
    osg.Matrix.makeIdentity(this._matrixTmp);
    this._quatTmp = [];
    osg.Quat.makeIdentity(this._quatTmp);
};

/** @lends osgAnimation.StackedRotateAxis.prototype */
osgAnimation.StackedRotateAxis.prototype = osg.objectInehrit(osg.Object.prototype, {
    setAxis: function(axis) { osg.Vec3.copy(axis, this._axis); },
    setAngle: function(angle) { this._angle = angle; },
    setTarget: function(target) { this._target = target; },
    getTarget: function() { return this._target; },
    update: function() {
        if (this._target !== undefined) {
            this._angle = this._target.getValue();
        }
    },
    getOrCreateTarget: function() {
        if (!this._target) {
            this._target = new osgAnimation.FloatTarget(this._angle);
        }
        return this._target;
    },
    applyToMatrix: function(m) {
        var axis = this._axis;
        var qtmp = this._quatTmp;
        var mtmp = this._matrixTmp;

        osg.Quat.makeRotate(this._angle, axis[0], axis[1], axis[2], qtmp);
        osg.Matrix.setRotateFromQuat(mtmp, qtmp);
        osg.Matrix.preMult(m, mtmp);
    }

});





/** 
 *  StackedQuaternion
 *  @class StackedQuaternion
 */
osgAnimation.StackedQuaternion = function (name, quat) {
    osg.Object.call(this);
    if (!quat) {
        quat = [ 0,0,0,1 ];
    }
    this._quaternion = quat;
    this._target = undefined;
    this._matrixTmp = [];
    osg.Matrix.makeIdentity(this._matrixTmp);
    this.setName(name);
};

/** @lends osgAnimation.StackedQuaternion.prototype */
osgAnimation.StackedQuaternion.prototype = osg.objectInehrit(osg.Object.prototype, {
    setQuaternion: function(q) { osg.Quat.copy(q, this._quaternion); },
    setTarget: function(target) { this._target = target; },
    getTarget: function() { return this._target; },
    update: function() {
        if (this._target !== undefined) {
            osg.Quat.copy(this._target.getValue(), this._quaternion);
        }
    },
    getOrCreateTarget: function() {
        if (!this._target) {
            this._target = new osgAnimation.QuatTarget(this._quaternion);
        }
        return this._target;
    },
    applyToMatrix: function(m) {
        var mtmp = this._matrixTmp;
        osg.Matrix.setRotateFromQuat(mtmp, this._quaternion);
        osg.Matrix.preMult(m, mtmp);
    }
});
/** -*- compile-command: "jslint-cli Target.js" -*-
 *
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


/** 
 *  Target keep internal data of element to animate, and some function to merge them
 *  @class Target
 */
osgAnimation.Target = function() {
    this._weight = 0;
    this._priorityWeight = 0;
    this._count = 0;
    this._lastPriority = 0;
    this._target = undefined;
};

osgAnimation.Target.prototype = {
    reset: function() { this._weight = 0; this._priorityWeight = 0; },
    getValue: function() { return this._target; }
};

osgAnimation.Vec3Target = function() {
    osgAnimation.Target.call(this);
    this._target = [0 ,0, 0];
};
osgAnimation.Vec3Target.prototype = osg.objectInehrit(osgAnimation.Target.prototype, {
    update: function(weight, val, priority) {
        if (this._weight || this._priorityWeight) {

            if (this._lastPriority != priority) {
                // change in priority
                // add to weight with the same previous priority cumulated weight
                this._weight += this._priorityWeight * (1.0 - this._weight);
                this._priorityWeight = 0;
                this._lastPriority = priority;
            }

            this._priorityWeight += weight;
            t = (1.0 - this._weight) * weight / this._priorityWeight;
            osg.Vec3.lerp(t, this._target, val, this._target);
        } else {

            this._priorityWeight = weight;
            this._lastPriority = priority;
            osg.Vec3.copy(val, this._target);
        }
    }
});



osgAnimation.FloatTarget = function(value) {
    osgAnimation.Target.call(this);
    this._target = [value];
};

osgAnimation.FloatTarget.prototype = osg.objectInehrit(osgAnimation.Target.prototype, {
    update: function(weight, val, priority) {
        if (this._weight || this._priorityWeight) {

            if (this._lastPriority != priority) {
                // change in priority
                // add to weight with the same previous priority cumulated weight
                this._weight += this._priorityWeight * (1.0 - this._weight);
                this._priorityWeight = 0;
                this._lastPriority = priority;
            }

            this._priorityWeight += weight;
            t = (1.0 - this._weight) * weight / this._priorityWeight;
            this._target += (val - this._target)*t;
        } else {

            this._priorityWeight = weight;
            this._lastPriority = priority;
            this._target = val;
        }
    }
});




osgAnimation.QuatTarget = function() {
    osgAnimation.Target.call(this);
    this._target = [];
    osg.Quat.makeIdentity(this._target);
};
osgAnimation.QuatTarget.prototype = osg.objectInehrit(osgAnimation.Target.prototype, {
    update: function(weight, val, priority) {
        if (this._weight || this._priorityWeight) {

            if (this._lastPriority != priority) {
                // change in priority
                // add to weight with the same previous priority cumulated weight
                this._weight += this._priorityWeight * (1.0 - this._weight);
                this._priorityWeight = 0;
                this._lastPriority = priority;
            }

            this._priorityWeight += weight;
            t = (1.0 - this._weight) * weight / this._priorityWeight;
            osg.Quat.lerp(t, this._target, val, this._target);
            osg.Quat.normalize(this._target, this._target);

        } else {

            this._priorityWeight = weight;
            this._lastPriority = priority;
            osg.Quat.copy(val, this._target);
        }
    }
});
/** -*- compile-command: "jslint-cli UpdateCallback.js" -*-
 *
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


/** 
 *  AnimationUpdateCallback
 *  @class AnimationUpdateCallback
 */
osgAnimation.AnimationUpdateCallback = function () {};

/** @lends osgAnimation.AnimationUpdateCallback.prototype */
osgAnimation.AnimationUpdateCallback.prototype = osg.objectInehrit(osg.Object.prototype, {
    
    linkChannel: function() {},
    linkAnimation: function(anim) {
        var name = this.getName();
        if (name.length === 0) {
            osg.log("no name on an update callback, discard");
            return 0;
        }
        var nbLinks = 0;
        var channels = anim.getChannels();
        for (var i = 0, l = channels.length; i < l; i++) {
            var channel = channels[i];
            if (channel.getTargetName() === name) {
                this.linkChannel(channel);
                nbLinks++;
            }
        }
        return nbLinks;
    }
});/** -*- compile-command: "jslint-cli UpdateMatrixTransform.js" -*-
 *
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


/** 
 *  UpdateMatrixTransform
 *  @class UpdateMatrixTransform
 */
osgAnimation.UpdateMatrixTransform = function () {
    osgAnimation.AnimationUpdateCallback.call(this);
    this._stackedTransforms = [];
};

/** @lends osgAnimation.AnimationUpdateCallback.prototype */
osgAnimation.UpdateMatrixTransform.prototype = osg.objectInehrit(osgAnimation.AnimationUpdateCallback.prototype, {
    getStackedTransforms: function() { return this._stackedTransforms; },
    update: function(node, nv) {

        // not optimized, we could avoid operation the animation did not change
        // the content of the transform element
        var matrix = node.getMatrix();
        osg.Matrix.makeIdentity(matrix);
        var transforms = this._stackedTransforms;
        for (var i = 0, l = transforms.length; i < l; i++) {
            var transform = transforms[i];
            transform.update();
            transform.applyToMatrix(matrix);
        }
        return true;
    },
    linkChannel: function(channel) {
        var channelName = channel.getName();
        var transforms = this._stackedTransforms;
        for (var i = 0, l = transforms.length; i < l; i++) {
            var transform = transforms[i];
            var elementName = transform.getName();
            if (channelName.length > 0 && elementName === channelName) {
                var target = transform.getOrCreateTarget();
                if (target) {
                    channel.setTarget(target);
                    return true;
                }
            }
        }
        osg.log("can't link channel " + channelName + ", does not contain a symbolic name that can be linked to TransformElements");
    }

});/** -*- compile-command: "jslint-cli osgUtil.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

var osgUtil = {};
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

    applyDrawElementsTriangles: function(count, vertexes, indexes) {
        var v0 = [];
        var v1 = [];
        var v2 = [];
        
        var idx0, idx1, idx2;
        for ( var idx = 0; idx < count; idx+= 3) {
            idx0 = indexes[idx]*3;
            v0[0] = vertexes[idx0];
            v0[1] = vertexes[idx0+1];
            v0[2] = vertexes[idx0+2];

            idx1 = indexes[idx+1]*3;
            v1[0] = vertexes[idx1];
            v1[1] = vertexes[idx1 +1];
            v1[2] = vertexes[idx1 +2];

            idx2 = indexes[idx+2]*3;
            v2[0] = vertexes[idx2];
            v2[1] = vertexes[idx2 +1];
            v2[2] = vertexes[idx2 +2];
            this.intersect(v0, v1, v2);
        }
    },

    applyDrawElementsTriangleStrip: function(count, vertexes, indexes) {
        var v0 = [];
        var v1 = [];
        var v2 = [];

        var idx0, idx1, idx2;
        for ( var i = 2, idx = 0; i < count; i++, idx++) {
            if (i % 2) {
                idx0 = indexes[idx]*3;
                idx1 = indexes[idx+2]*3;
                idx2 = indexes[idx+1]*3;
            } else {
                idx0 = indexes[idx]*3;
                idx1 = indexes[idx+1]*3;
                idx2 = indexes[idx+2]*3;
            }
            v0[0] = vertexes[idx0];
            v0[1] = vertexes[idx0+1];
            v0[2] = vertexes[idx0+2];

            v1[0] = vertexes[idx1];
            v1[1] = vertexes[idx1 +1];
            v1[2] = vertexes[idx1 +2];

            v2[0] = vertexes[idx2];
            v2[1] = vertexes[idx2 +1];
            v2[2] = vertexes[idx2 +2];
            this.intersect(v0, v1, v2);
        }
    },

    applyDrawElementsTriangleFan: function(count, vertexes, indexes ) {
        var v0 = [];
        var v1 = [];
        var v2 = [];

        var idx0 = indexes[0]*3;
        v0[0] = vertexes[idx0];
        v0[1] = vertexes[idx0+1];
        v0[2] = vertexes[idx0+2];

        var idx1, idx2;
        for ( var i = 2, idx = 1; i < count; i++, idx++) {
            idx1 = indexes[idx]*3;
            idx2 = indexes[idx+1]*3;

            v1[0] = vertexes[idx1];
            v1[1] = vertexes[idx1 +1];
            v1[2] = vertexes[idx1 +2];

            v2[0] = vertexes[idx2];
            v2[1] = vertexes[idx2 +1];
            v2[2] = vertexes[idx2 +2];
            this.intersect(v0, v1, v2);
        }
    },

    applyDrawArraysTriangles: function(first, count, vertexes) {
        var v0 = [];
        var v1 = [];
        var v2 = [];

        for (var idx = first; idx < count; idx+= 9) {
            v0[0] = vertexes[idx];
            v0[1] = vertexes[idx+1];
            v0[2] = vertexes[idx+2];

            v1[0] = vertexes[idx+3];
            v1[1] = vertexes[idx+4];
            v1[2] = vertexes[idx+5];

            v2[0] = vertexes[idx+6];
            v2[1] = vertexes[idx+7];
            v2[2] = vertexes[idx+8];
            this.intersect(v0, v1, v2);
        }
    },

    applyDrawArraysTriangleStrip: function(first, count, vertexes) {
        var v0 = [];
        var v1 = [];
        var v2 = [];

        var idx0, idx1, idx2;
        for (var i = 2, idx = first; i < count; i++, idx++) {
            if (i % 2) {
                idx0 = idx*3;
                idx1 = (idx+2)*3;
                idx2 = (idx+1)*3;
            } else {
                idx0 = idx*3;
                idx1 = (idx+1)*3;
                idx2 = (idx+2)*3;
            }
            v0[0] = vertexes[idx0];
            v0[1] = vertexes[idx0+1];
            v0[2] = vertexes[idx0+2];

            v1[0] = vertexes[idx1];
            v1[1] = vertexes[idx1+1];
            v1[2] = vertexes[idx1+2];

            v2[0] = vertexes[idx2];
            v2[1] = vertexes[idx2+1];
            v2[2] = vertexes[idx2+2];
            this.intersect(v0, v1, v2);
        }
    },

    applyDrawArraysTriangleFan: function(first, count, vertexes) {
        var v0 = [];
        var v1 = [];
        var v2 = [];

        var idx0 = first*3;
        v0[0] = vertexes[idx0];
        v0[1] = vertexes[idx0+1];
        v0[2] = vertexes[idx0+2];

        var idx1, idx2;
        for ( var i = 2, idx = first+1; i < count; i++, idx++) {
            idx1 = idx*3;
            idx2 = (idx+1)*3;

            v1[0] = vertexes[idx1];
            v1[1] = vertexes[idx1 +1];
            v1[2] = vertexes[idx1 +2];

            v2[0] = vertexes[idx2];
            v2[1] = vertexes[idx2 +1];
            v2[2] = vertexes[idx2 +2];
            this.intersect(v0, v1, v2);
        }
    },

    apply: function(node) {
        var primitive;
        var lastIndex;
        var vertexes = node.getAttributes().Vertex.getElements();
        this.index = 0;
        for (var i = 0, l = node.primitives.length; i < l; i++) {
            primitive = node.primitives[i];
            if (primitive.getIndices !== undefined) {
                var indexes = primitive.indices.getElements();
                switch(primitive.getMode()) {
                case gl.TRIANGLES:
                    this.applyDrawElementsTriangles(primitive.getCount(), vertexes, indexes);
                    break;
                case gl.TRIANGLE_STRIP:
                    this.applyDrawElementsTriangleStrip(primitive.getCount(), vertexes, indexes);
                    break;
                case gl.TRIANGLE_FAN:
                    this.applyDrawElementsTriangleFan(primitive.getCount(), vertexes, indexes);
                    break;
                }
            } else { // draw array
                switch(primitive.getMode()) {
                case gl.TRIANGLES:
                    this.applyDrawArraysTriangles(primitive.getFirst(), primitive.getCount(), vertexes);
                    break;
                case gl.TRIANGLE_STRIP:
                    this.applyDrawArraysTriangleStrip(primitive.getFirst(), primitive.getCount(), vertexes);
                    break;
                case gl.TRIANGLE_FAN:
                    this.applyDrawArraysTriangleFan(primitive.getFirst(), primitive.getCount(), vertexes);
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

        var pnt = [];
        pnt[0] = this.start[0] * (1.0-r)+  this.end[0]*r;
        pnt[1] = this.start[1] * (1.0-r)+  this.end[1]*r;
        pnt[2] = this.start[2] * (1.0-r)+  this.end[2]*r;

        this.hits.push({ 'ratio': r,
                         'nodepath': this.nodePath.slice(0),
                         'triangleHit': new osgUtil.TriangleHit(this.index-1, normal, r1, v1, r2, v2, r3, v3),
                         'point': pnt
                         
                       });
        this.hit = true;
    }
};
/** -*- compile-command: "jslint-cli IntersectVisitor.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

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
            osg.Matrix.preMult(m, matrix);
            this.matrix.push(m);
        } else {
            this.matrix.push(matrix);
        }
    },
    getModelMatrix: function() {
        if (this.matrix.length ===0 ) {
            return osg.Matrix.makeIdentity([]);
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
    pushCamera: function(camera) {
        // we should support hierarchy of camera
        // but right now we want just simple picking on main
        // camera
        this.projectionMatrix = camera.getProjectionMatrix();
        this.viewMatrix = camera.getViewMatrix();

        var vp = camera.getViewport();
        if (vp !== undefined) {
            this.windowMatrix = vp.computeWindowMatrix();
        }
    },
    applyCamera: function(camera) {
        // we should support hierarchy of camera
        // but right now we want just simple picking on main
        // camera
        this.pushCamera(camera);
        this.traverse(camera);
    },

    applyNode: function(node) {
        if (node.getMatrix) {
            this.pushModelMatrix(node.getMatrix());
        }

        if (node.primitives) {
            var matrix = [];
            osg.Matrix.copy(this.getWindowMatrix(), matrix);
            osg.Matrix.preMult(matrix, this.getProjectionMatrix());
            osg.Matrix.preMult(matrix, this.getViewMatrix());
            osg.Matrix.preMult(matrix, this.getModelMatrix());
            
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

        if (node.getViewMatrix) { // Camera/View
            this.applyCamera(node);
        } else {
            this.applyNode(node);
        }
    },

    enterNode: function(node) {
        var bsphere = node.boundingSphere;
        if (bsphere !== undefined ) {
            if (!this.intersectSegmentWithSphere) {
                return false;
            }
        }
        return true;
    }
});
/** -*- compile-command: "jslint-cli ShaderParameterVisitor.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

osgUtil.ParameterVisitor = function() {
    osg.NodeVisitor.call(this);
    this.targetHTML = document.body;

    var ArraySlider = function() {
        this.params = {};
    };

    ArraySlider.prototype = {
        setTargetHTML: function(target) {
            this.parent = target;
        },
        selectParamFromName: function(name) {
            var keys = Object.keys(this.params);
            if (keys.length === 1) {
                return this.params[ keys[0] ];
            }
            for (var i = 0; i < keys.length; i++) {
                var p = this.params[ keys[i] ];
                var matchs = p.match;
                if (matchs === undefined) {
                    matchs = [ keys[i] ];
                }
                for (var m = 0; m < matchs.length; m++) {
                    if (name.search(matchs[m]) !== -1) {
                        return p;
                    }
                }
            }
            return this.params.default;
        },
        getValue: function(name) {
            if (window.localStorage) {
                var value = window.localStorage.getItem(name);
                return value;
            }
            return null;
        },
        setValue: function(name, value) {
            if (window.localStorage) {
                window.localStorage.setItem(name, value);
            }
        },
        addToDom: function(content) {
            var mydiv = document.createElement('div');
            mydiv.innerHTML = content;
            this.parent.appendChild(mydiv);
        },
        createSlider: function(min, max, step, value, name, cbname) {
            var input = '<div>NAME [ MIN - MAX ] <input type="range" min="MIN" max="MAX" value="VALUE" step="STEP" onchange="ONCHANGE" /><span id="UPDATE"></span></div>';
            var onchange = cbname + '(this.value)';
            input = input.replace(/MIN/g, min);
            input = input.replace(/MAX/g, (max+step));
            input = input.replace('STEP', step);
            input = input.replace('VALUE', value);
            input = input.replace(/NAME/g, name);
            input = input.replace(/UPDATE/g, cbname);
            input = input.replace('ONCHANGE', onchange);
            return input;
        },

        createUniformFunction: function(name, index, uniform, cbnameIndex) {
            self = this;
            return (function() {
                var cname = name;
                var cindex = index;
                var cuniform = uniform;
                var id = cbnameIndex;
                var func = function(value) {
                    cuniform.get()[cindex] = value;
                    cuniform.dirty();
                    osg.log(cname + ' value ' + value);
                    document.getElementById(cbnameIndex).innerHTML = Number(value).toFixed(4);
                    self.setValue(id, value);
                    // store the value to localstorage
                };
                return func;
            })();
        },

        createFunction: function(name, index, object, field, cbnameIndex) {
            self = this;
            return (function() {
                var cname = name;
                var cindex = index;
                var cfield = field;
                var id = cbnameIndex;
                var obj = object;
                var func = function(value) {
                    if (typeof(value) === 'string') {
                        value = parseFloat(value);
                    }

                    if (typeof(object[cfield]) === 'number') {
                        obj[cfield] = value;
                    } else {
                        obj[cfield][index] = value;
                    }
                    osg.log(cname + ' value ' + value);
                    document.getElementById(cbnameIndex).innerHTML = Number(value).toFixed(4);
                    self.setValue(id, value);
                    // store the value to localstorage
                };
                return func;
            })();
        },

        getCallbackName: function(name, prgId) {
            return 'change_'+prgId+"_"+name;
        },

        createInternalSliderUniform: function(name, dim, uniformFunc, prgId, originalUniform) {
            var params = this.selectParamFromName(name);
            var uvalue = params.value();
            var uniform = originalUniform;
            if (uniform === undefined) {
                uniform = uniformFunc(uvalue, name);
            }

            var cbname = this.getCallbackName(name, prgId);
            for (var i = 0; i < dim; i++) {

                var istring = i.toString();
                var nameIndex = name + istring;
                var cbnameIndex = cbname+istring;

                // default value
                var value = uvalue[i];

                // read local storage value if it exist
                var readValue = this.getValue(cbnameIndex);
                if (readValue !== null) {
                    value = readValue;
                } else if (originalUniform && originalUniform.get()[i]) {
                    // read value from original uniform
                    value = originalUniform.get()[i];
                }

                var dom = this.createSlider(params.min, params.max, params.step, value, nameIndex, cbnameIndex);
                this.addToDom(dom);
                window[cbnameIndex] = this.createUniformFunction(nameIndex, i, uniform, cbnameIndex);
                osg.log(nameIndex + " " + value);
                window[cbnameIndex](value);
            }
            this.uniform = uniform;
            return uniform;
        },

        createInternalSlider: function(name, dim, id, object, field) {
            var params = this.selectParamFromName(name);
            var uvalue = params.value();

            var cbname = this.getCallbackName(name, id);
            for (var i = 0; i < dim; i++) {

                var istring = i.toString();
                var nameIndex = name + istring;
                var cbnameIndex = cbname+istring;

                // default value
                var value = uvalue[i];

                // read local storage value if it exist
                var readValue = this.getValue(cbnameIndex);
                if (readValue !== null) {
                    value = readValue;
                } else {
                    if (typeof object[field] === 'number') {
                        value = object[field];
                    } else {
                        value = object[field][i];
                    }
                }

                var dom = this.createSlider(params.min, params.max, params.step, value, nameIndex, cbnameIndex);
                this.addToDom(dom);
                window[cbnameIndex] = this.createFunction(nameIndex, i, object, field, cbnameIndex);
                osg.log(nameIndex + " " + value);
                window[cbnameIndex](value);
            }
        }
    };

    var Vec4Slider = function() {
        ArraySlider.call(this);
        this.params['color'] = { 'min': 0,
                                 'max': 1.0,
                                 'step':0.01,
                                 'value': function() { return [0.5, 0.5, 0.5, 1.0]; },
                                 'match' : ['color', 'diffuse', 'specular', 'ambient', 'emission']
                               };
        this.params['default'] = this.params['color'];
        
    };
    Vec4Slider.prototype = osg.objectInehrit(ArraySlider.prototype, {
        createSliderUniform: function(name, prgId, uniform) {
            return this.createInternalSliderUniform(name, 4, osg.Uniform.createFloat4, prgId, uniform);
        },
        createSliderObject: function(name, id, object, field) {
            return this.createInternalSlider(name, 4, id, object, field);
        }

    });

    var Vec3Slider = function() {
        ArraySlider.call(this);
        this.params['position'] = { 'min': -50,
                                    'max': 50.0,
                                    'step':0.1,
                                    'value': function() { return [0.0, 0.0, 0.0]; },
                                    'match' : ['position']
                                  };
        this.params['normalized'] = { 'min': 0,
                                      'max': 1.0,
                                      'step':0.01,
                                      'value': function() { return [1.0, 0.0, 0.0]; },
                                      'match' : ['normal', 'direction']
                                    };
        this.params['default'] = this.params['position'];
    };
    Vec3Slider.prototype = osg.objectInehrit(ArraySlider.prototype, {
        createSliderUniform: function(name, prgId, uniform) {
            return this.createInternalSliderUniform(name, 3, osg.Uniform.createFloat3, prgId, uniform);
        },
        createSliderObject: function(name, id, object, field) {
            return this.createInternalSlider(name, 3, id, object, field);
        }
    });


    var Vec2Slider = function() {
        ArraySlider.call(this);
        this.params['uv'] = { 'min': -1,
                                    'max': 1.0,
                                    'step':0.01,
                                    'value': function() { return [0.0, 0.0]; },
                                    'match' : ['texcoord, uv']
                                  };
        this.params['default'] = this.params['uv'];
    };
    Vec2Slider.prototype = osg.objectInehrit(ArraySlider.prototype, {
        createSliderUniform: function(name, prgId, uniform) {
            return this.createInternalSliderUniform(name, 2, osg.Uniform.createFloat2, prgId, uniform);
        },
        createSliderObject: function(name, id, object, field) {
            return this.createInternalSlider(name, 2, id, object, field);
        }
    });


    var FloatSlider = function() {
        ArraySlider.call(this);
        this.params['default'] = { 'min': -1,
                             'max': 1.0,
                             'step':0.01,
                             'value': function() { return [0.0]; },
                             'match' : []
                           };
    };
    FloatSlider.prototype = osg.objectInehrit(ArraySlider.prototype, {
        createSliderUniform: function(name, prgId, uniform) {
            return this.createInternalSliderUniform(name, 1, osg.Uniform.createFloat1, prgId, uniform);
        },
        createSliderObject: function(name, id, object, field) {
            return this.createInternalSlider(name, 1, id, object, field);
        }

    });

    this.types = {};
    this.types.vec4 = new Vec4Slider();
    this.types.vec3 = new Vec3Slider();
    this.types.vec2 = new Vec2Slider();
    this.types.float = new FloatSlider();

    this.setTargetHTML(document.body);
};

osgUtil.ParameterVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {

    setTargetHTML: function(html) {
        this.targetHTML = html;
        var keys = Object.keys(this.types);
        for (var i = 0, l = keys.length; i < l; i++) {
            var k = keys[i];
            this.types[k].setTargetHTML(this.targetHTML);
        }
    },
    getUniformList: function(str, map) {
        var r = str.match(/uniform\s+\w+\s+\w+/g);
        var list = map;
        if (r !== null) {
            for (var i = 0, l = r.length; i < l; i++) {
                var result = r[i].match(/uniform\s+(\w+)\s+(\w+)/);
                var name = result[2];
                var uniform = { 'type': result[1], 'name': name};
                list[name] = uniform;
            }
        }
        return list;
    },

    getUniformFromStateSet: function(stateSet, uniformMap) {
        var maps = stateSet.getUniformList();
        if (!maps) {
            return;
        }
        var keys = Object.keys(uniformMap);
        for (var i = 0, l = keys.length; i < l; i++) {
            var k = keys[i];
            // get the first one found in the tree
            if (maps[k] !== undefined && uniformMap[k].uniform === undefined) {
                uniformMap[k].uniform = maps[k].object;
            }
        }
    },
    
    findExistingUniform: function(node, uniformMap) {
        var BackVisitor = function() { osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_PARENTS); };
        BackVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
            setUniformMap: function(map) { this.uniformMap = map; },
            apply: function(node) {
                var stateSet = node.getStateSet();
                var getUniformFromStateSet = osgUtil.ShaderParameterVisitor.prototype.getUniformFromStateSet;
                if (stateSet) {
                    getUniformFromStateSet(stateSet, this.uniformMap);
                }
                this.traverse(node);
            }
        });
        var visitor = new BackVisitor();
        visitor.setUniformMap(uniformMap);
        node.accept(visitor);
    },

    applyProgram: function(node, stateset) {
        var program = stateset.getAttribute('Program');
        var programName = program.getName();
        var string = program.getVertexShader().getText();
        var uniformMap = {};
        this.getUniformList(program.getVertexShader().getText(), uniformMap);
        this.getUniformList(program.getFragmentShader().getText(), uniformMap);


        var keys = Object.keys(uniformMap);

        if (programName === undefined) {
            var hashCode = function(str) {
	        var hash = 0;
                var char = 0;
	        if (str.length == 0) return hash;
	        for (i = 0; i < str.length; i++) {
		    char = str.charCodeAt(i);
		    hash = ((hash<<5)-hash)+char;
		    hash = hash & hash; // Convert to 32bit integer
	        }
                if (hash < 0) {
                    hash = -hash;
                }
	        return hash;
            }
            var str = keys.join('');
            programName = hashCode(str).toString();
        }

        this.findExistingUniform(node, uniformMap);

        var addedSlider = false;
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var entry = uniformMap[k];
            var type = entry.type;
            var name = entry.name;
            if (this.types[type] !== undefined) {
                var uniform = this.types[type].createSliderUniform(name, programName, entry.uniform);
                if (entry.uniform === undefined && uniform) {
                    stateset.addUniform(uniform);
                }
                addedSlider = true;
            }
        }

        // add a separator
        if (addedSlider) {
            var mydiv = document.createElement('div');
            mydiv.innerHTML = "<p> </p>";
            this.targetHTML.appendChild(mydiv);
        }

        osg.log(uniformMap);
    },


    applyLight: function(node, stateset) {
        var attribute = stateset.getAttribute('Light0');

        this.types.float.params['spotCutoff'] = { min: 0, max: 180, step: 1, value: function() { return 180;} };
        this.types.float.params['spotCutoffEnd'] = this.types.float.params['spotCutoff'];
        this.types.vec4.params['position'] = { min: -50, max: 50, step: 1, value: function() { return [0,0,1,0];} };
        
        this.types.vec4.createSliderObject("ambient", attribute.getTypeMember()+"_ambient", attribute, '_ambient');
        this.types.vec4.createSliderObject("diffuse", attribute.getTypeMember()+"_diffuse", attribute, '_diffuse');
        this.types.vec4.createSliderObject("specular", attribute.getTypeMember()+"_specular", attribute, '_specular');
        this.types.vec3.createSliderObject("direction", attribute.getTypeMember()+"_direction", attribute, '_direction');
        this.types.vec4.createSliderObject("position", attribute.getTypeMember()+"_position", attribute, '_position');
        this.types.float.createSliderObject("spotCutoff", attribute.getTypeMember()+"_spotCutoff", attribute, '_spotCutoff');
        this.types.float.createSliderObject("spotCutoffEnd", attribute.getTypeMember()+"_spotCutoffEnd", attribute, '_spotCutoffEnd');

        // add a separator
        var mydiv = document.createElement('div');
        mydiv.innerHTML = "<p> </p>";
        this.targetHTML.appendChild(mydiv);
    },

    applyStateSet: function(node, stateset) {
        if (stateset.getAttribute('Program') !== undefined) {
            this.applyProgram(node, stateset);
        } else if (stateset.getAttribute('Light0') !== undefined) {
            this.applyLight(node, stateset);
        }
    },

    apply: function(node) {
        var element = this.targetHTML;
        if (element === undefined || element === null) {
            return;
        }

        var st = node.getStateSet();
        if (st !== undefined) {
            this.applyStateSet(node, st);
        }

        this.traverse(node);
    }
});

osgUtil.ParameterVisitor.SliderParameter = function() {};
osgUtil.ParameterVisitor.SliderParameter.prototype = {
    addToDom: function(parent, content) {
        var mydiv = document.createElement('div');
        mydiv.innerHTML = content;
        parent.appendChild(mydiv);
    },

    createInternalSlider: function(name, dim, id, params, object, field) {

        var cbname = this.getCallbackName(name, id);
        for (var i = 0; i < dim; i++) {

            var istring = i.toString();
            var nameIndex = name + istring;
            var cbnameIndex = cbname+istring;

            // default value
            var value;
            if (typeof(params.value) === 'number') {
                value = params.value;
            } else {
                value = params.value[i];
            }

            // read local storage value if it exist
            var readValue = this.getValue(cbnameIndex);
            if (readValue !== null) {
                value = readValue;
            } else {
                if (typeof object[field] === 'number') {
                    value = object[field];
                } else {
                    value = object[field][i];
                }
            }

            var dom = this.createDomSlider(value, params.min, params.max, params.step, nameIndex, cbnameIndex);
            this.addToDom(params.dom, dom);
            window[cbnameIndex] = this.createFunction(nameIndex, i, object, field, cbnameIndex, params.onchange);
            osg.log(nameIndex + " " + value);
            window[cbnameIndex](value);
        }
    },

    createDomSlider: function(value, min, max, step, name, cbname) {
        var input = '<div>NAME [ MIN - MAX ] <input type="range" min="MIN" max="MAX" value="VALUE" step="STEP" onchange="ONCHANGE" /><span id="UPDATE"></span></div>';
        var onchange = cbname + '(this.value)';
        input = input.replace(/MIN/g, min);
        input = input.replace(/MAX/g, (max+1e-3));
        input = input.replace('STEP', step);
        input = input.replace('VALUE', value);
        input = input.replace(/NAME/g, name);
        input = input.replace(/UPDATE/g, cbname);
        input = input.replace('ONCHANGE', onchange);
        return input;
    },
    getCallbackName: function(name, prgId) {
        return 'change_'+prgId+"_"+name;
    },

    createFunction: function(name, index, object, field, callbackName, userOnChange) {
        self = this;
        return (function() {
            var cname = name;
            var cindex = index;
            var cfield = field;
            var obj = object;
            var func = function(value) {
                if (typeof(value) === 'string') {
                    value = parseFloat(value);
                }

                if (typeof(object[cfield]) === 'number') {
                    obj[cfield] = value;
                } else {
                    obj[cfield][index] = value;
                }
                osg.log(cname + ' value ' + value);
                document.getElementById(callbackName).innerHTML = Number(value).toFixed(4);
                self.setValue(callbackName, value);
                if (userOnChange) {
                    userOnChange(obj[cfield]);
                }
                // store the value to localstorage
            };
            return func;
        })();
    },
    getValue: function(name) {
        if (window.localStorage) {
            var value = window.localStorage.getItem(name);
            return value;
        }
        return null;
    },
    setValue: function(name, value) {
        if (window.localStorage) {
            window.localStorage.setItem(name, value);
        }
    },
};

osgUtil.ParameterVisitor.createSlider = function (label, uniqNameId, object, field, value, min, max, step, dom, onchange) {
    var scope = osgUtil.ParameterVisitor;
    if (scope.sliders === undefined) {
        scope.sliders = new scope.SliderParameter();
    }

    var params = { value: value,
                   min: min,
                   max: max,
                   step: step,
                   onchange: onchange,
                   dom: dom };

    if (typeof(object[field]) === 'number') {
        return scope.sliders.createInternalSlider(label, 1, uniqNameId, params, object, field);
    } else {
        return scope.sliders.createInternalSlider(label, object[field].length, uniqNameId, params, object, field);
    }
};


osgUtil.ShaderParameterVisitor = osgUtil.ParameterVisitor;/** -*- compile-command: "jslint-cli osgDB.js" -*-
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
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */

var osgDB = {};

osgDB.ObjectWrapper = {};
osgDB.ObjectWrapper.serializers = {};
osgDB.ObjectWrapper.global = this;
osgDB.ObjectWrapper.getObject = function (path) {
    var scope = osgDB.ObjectWrapper.global;
    var splittedPath = path.split('.');
    for (var i = 0, l = splittedPath.length; i < l; i++) {
        var obj = scope[ splittedPath[i] ];
        if (obj === undefined) {
            return undefined;
        }
        scope = obj;
    }
    // create the new obj
    return new (scope)();
};
osgDB.ObjectWrapper.readObject = function (jsonObj) {

    var prop = Object.keys(jsonObj)[0];
    if (!prop) {
        osg.log("can't find property for object " + jsonObj);
        return undefined;
    }

    var obj = osgDB.ObjectWrapper.getObject(prop);
    if (!obj) {
        osg.log("can't instanciate object " + prop);
        return undefined;
    }

    var scope = osgDB.ObjectWrapper.serializers;
    var splittedPath = prop.split('.');
    for (var i = 0, l = splittedPath.length; i < l; i++) {
        var reader = scope[ splittedPath[i] ];
        if (reader === undefined) {
            osg.log("can't find function to read object " + prop + " - undefined");
            return undefined;
        }
        scope = reader;
    }
    scope(jsonObj[prop], obj);
    return obj;
};

osgDB.readImage = function (url) {
    var img = new Image();
    img.src = url;
    return img;
};


osgDB.parseSceneGraph = function (node) {
    if (node.Version && node.Version > 0) {
        var getPropertyValue = function(o) {
            var props = Object.keys(o);
            for (var i = 0, l = props.length; i < l; i++) {
                if (props[i] !== "Generator" && props[i] !== "Version") {
                    return props[i];
                }
            }
            return undefined;
        };
        var key = getPropertyValue(node);
        if (key) {
            var obj = {};
            obj[key] = node[key];
            return osgDB.ObjectWrapper.readObject(obj);
        } else {
            osg.log("Can't parse scenegraph " + node);
        }
    } else {
        return osgDB.parseSceneGraph_deprecated(node);
    }
};
osgDB.parseSceneGraph_deprecated = function (node)
{
    var getFieldBackwardCompatible = function(field, json) {
        var value = json[field];
        if (value === undefined) {
            value = json[field.toLowerCase()];
        }
        return value;
    };
    var setName = function(osgjs, json) {
        var name = getFieldBackwardCompatible("Name", json);
        if (name && osgjs.setName !== undefined) {
            osgjs.setName(name);
        }
    };

    var setMaterial = function(osgjs, json) {
        setName(osgjs, json);
        osgjs.setAmbient(getFieldBackwardCompatible("Ambient", json));
        osgjs.setDiffuse(getFieldBackwardCompatible("Diffuse", json));
        osgjs.setEmission(getFieldBackwardCompatible("Emission", json));
        osgjs.setSpecular(getFieldBackwardCompatible("Specular", json));
        osgjs.setShininess(getFieldBackwardCompatible("Shininess", json));
    };

    var setBlendFunc = function(osgjs, json) {
        setName(osgjs, json);
        osgjs.setSourceRGB(json.SourceRGB);
        osgjs.setSourceAlpha(json.SourceAlpha);
        osgjs.setDestinationRGB(json.DestinationRGB);
        osgjs.setDestinationAlpha(json.DestinationAlpha);
    };

    var setTexture = function( osgjs, json) {
        var magFilter = json.MagFilter || json.mag_filter || undefined;
        if (magFilter) {
            osgjs.setMagFilter(magFilter);
        }
        var minFilter = json.MinFilter || json.min_filter || undefined;
        if (minFilter) {
            osgjs.setMinFilter(minFilter);
        }
        var wrapT = json.WrapT || json.wrap_t || undefined;
        if (wrapT) {
            osgjs.setWrapT(wrapT);
        }
        var wrapS = json.WrapS || json.wrap_s || undefined;
        if (wrapS) {
            osgjs.setWrapS(wrapS);
        }
        var file = getFieldBackwardCompatible("File", json);
        var img = osgDB.readImage(file);
        osgjs.setImage(img);
    };

    var setStateSet = function(osgjs, json) {
        setName(osgjs, json);
        var textures = getFieldBackwardCompatible("Textures", json) || getFieldBackwardCompatible("TextureAttributeList", json) || undefined;
        if (textures) {
            for (var t = 0, tl = textures.length; t < tl; t++) {
                var file = getFieldBackwardCompatible("File", textures[t]);
                if (!file) {
                    osg.log("no texture on unit " + t + " skip it");
                    continue;
                }
                var tex = new osg.Texture();
                setTexture(tex, textures[t]);
                
                osgjs.setTextureAttributeAndMode(t, tex);
                osgjs.addUniform(osg.Uniform.createInt1(t,"Texture" + t));
            }
        }
        
        var blendfunc = getFieldBackwardCompatible("BlendFunc",json);
        if (blendfunc) {
            var newblendfunc = new osg.BlendFunc();
            setBlendFunc(newblendfunc, blendfunc);
            osgjs.setAttributeAndMode(newblendfunc);
        }

        var material = getFieldBackwardCompatible("Material",json);
        if (material) {
            var newmaterial = new osg.Material();
            setMaterial(newmaterial, material);
            osgjs.setAttributeAndMode(newmaterial);
        }
    };


    var newnode;
    var children = node.children;
    var primitives = node.primitives || node.Primitives || undefined;
    var attributes = node.attributes || node.Attributes || undefined;
    if (primitives || attributes) {
        newnode = new osg.Geometry();

        setName(newnode, node);

        osg.extend(newnode, node); // we should not do that
        node = newnode;
        node.primitives = primitives; // we should not do that
        node.attributes = attributes; // we should not do that

        var i;
        for ( var p = 0, lp = primitives.length; p < lp; p++) {
            var mode = primitives[p].mode;
            if (primitives[p].indices) {
                var array = primitives[p].indices;
                array = new osg.BufferArray(osg.BufferArray[array.type], array.elements, array.itemSize );
                if (!mode) {
                    mode = gl.TRIANGLES;
                } else {
                    mode = osg.PrimitiveSet[mode];
                }
                primitives[p] = new osg.DrawElements(mode, array);
            } else {
                mode = gl[mode];
                var first = primitives[p].first;
                var count = primitives[p].count;
                primitives[p] = new osg.DrawArrays(mode, first, count);
            }
        }

        for (var key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                var attributeArray = attributes[key];
                attributes[key] = new osg.BufferArray(gl[attributeArray.type], attributeArray.elements, attributeArray.itemSize );
            }
        }
    }

    var stateset = getFieldBackwardCompatible("StateSet", node);
    if (stateset) {
        var newstateset = new osg.StateSet();
        setStateSet(newstateset, stateset);
        node.stateset = newstateset;
    }

    var matrix = node.matrix || node.Matrix || undefined;
    if (matrix) {
        newnode = new osg.MatrixTransform();
        setName(newnode, node);

        osg.extend(newnode, node);
        newnode.setMatrix(osg.Matrix.copy(matrix));
        node = newnode;
    }

    var projection = node.projection || node.Projection || undefined;
    if (projection) {
        newnode = new osg.Projection();
        setName(newnode, node);
        osg.extend(newnode, node);
        newnode.setProjectionMatrix(osg.Matrix.copy(projection));
        node = newnode;
    }

    // default type
    if (node.objectType === undefined) {
        newnode = new osg.Node();
        setName(newnode, node);
        osg.extend(newnode, node);
        node = newnode;
    }


    if (children) {
        // disable children, it will be processed in the end
        node.children = [];

        for (var child = 0, childLength = children.length; child < childLength; child++) {
            node.addChild(osgDB.parseSceneGraph_deprecated(children[child]));
        }
    }

    return node;
};
/** -*- compile-command: "jslint-cli osgViewer.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

var osgViewer = {};
/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains functions every webgl program will need
 * a version of one way or another.
 *
 * Instead of setting up a context manually it is recommended to
 * use. This will check for success or failure. On failure it
 * will attempt to present an approriate message to the user.
 *
 *       gl = WebGLUtils.setupWebGL(canvas);
 *
 * For animated WebGL apps use of setTimeout or setInterval are
 * discouraged. It is recommended you structure your rendering
 * loop like this.
 *
 *       function render() {
 *         window.requestAnimationFrame(render, canvas);
 *
 *         // do rendering
 *         ...
 *       }
 *       render();
 *
 * This will call your rendering function up to the refresh rate
 * of your display but will stop rendering if your app is not
 * visible.
 */

WebGLUtils = function() {

    /**
     * Creates the HTLM for a failure message
     * @param {string} canvasContainerId id of container of th
     *        canvas.
     * @return {string} The html.
     */
    var makeFailHTML = function(msg) {
        return '' +
            '<div style="margin: auto; width:500px;z-index:10000;margin-top:20em;text-align:center;">' + msg + '</div>';
        // return '' +
        //   '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
        //   '<td align="center">' +
        //   '<div style="display: table-cell; vertical-align: middle;">' +
        //   '<div style="">' + msg + '</div>' +
        //   '</div>' +
        //   '</td></tr></table>';
    };

    /**
     * Mesasge for getting a webgl browser
     * @type {string}
     */
    var GET_A_WEBGL_BROWSER = '' +
        'This page requires a browser that supports WebGL.<br/>' +
        '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

    /**
     * Mesasge for need better hardware
     * @type {string}
     */
    var OTHER_PROBLEM = '' +
        "It doesn't appear your computer can support WebGL.<br/>" +
        '<a href="http://get.webgl.org">Click here for more information.</a>';

    /**
     * Creates a webgl context. If creation fails it will
     * change the contents of the container of the <canvas>
     * tag to an error message with the correct links for WebGL.
     * @return {WebGLRenderingContext} The created context.
     */
    var setupWebGL = function(
        /** Element */ canvas, 
        /** WebGLContextCreationAttirbutes */ opt_attribs, 
        /** function:(msg) */ opt_onError) {
        function handleCreationError(msg) {
            var container = document.getElementsByTagName("body")[0];
            //var container = canvas.parentNode;
            if (container) {
                var str = window.WebGLRenderingContext ?
                    OTHER_PROBLEM :
                    GET_A_WEBGL_BROWSER;
                if (msg) {
                    str += "<br/><br/>Status: " + msg;
                }
                container.innerHTML = makeFailHTML(str);
            }
        }

        opt_onError = opt_onError || handleCreationError;

        if (canvas.addEventListener) {
            canvas.addEventListener("webglcontextcreationerror", function(event) {
                opt_onError(event.statusMessage);
            }, false);
        }
        var context = create3DContext(canvas, opt_attribs);
        if (!context) {
            if (!window.WebGLRenderingContext) {
                opt_onError("");
            } else {
                opt_onError("");
            }
        }

        return context;
    };

    /**
     * Creates a webgl context.
     * @param {!Canvas} canvas The canvas tag to get context
     *     from. If one is not passed in one will be created.
     * @return {!WebGLContext} The created context.
     */
    var create3DContext = function(canvas, opt_attribs) {
        var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        var context = null;
        for (var ii = 0; ii < names.length; ++ii) {
            try {
                context = canvas.getContext(names[ii], opt_attribs);
            } catch(e) {}
            if (context) {
                break;
            }
        }
        return context;
    };

    return {
        create3DContext: create3DContext,
        setupWebGL: setupWebGL
    };
}();

/**
 * Provides requestAnimationFrame in a cross browser
 * way.
 */
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                window.setTimeout(callback, 1000/60);
            };
    })();
}

if (!window.cancelRequestAnimFrame) {
    window.cancelRequestAnimFrame = ( function() {
        return window.cancelAnimationFrame          ||
            window.webkitCancelRequestAnimationFrame    ||
            window.mozCancelRequestAnimationFrame       ||
            window.oCancelRequestAnimationFrame     ||
            window.msCancelRequestAnimationFrame        ||
            clearTimeout;
    } )();
}//Copyright (c) 2009 The Chromium Authors. All rights reserved.
//Use of this source code is governed by a BSD-style license that can be
//found in the LICENSE file.

// Various functions for helping debug WebGL apps.

WebGLDebugUtils = function() {

/**
 * Wrapped logging function.
 * @param {string} msg Message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Which arguements are enums.
 * @type {!Object.<number, string>}
 */
var glValidEnumContexts = {

  // Generic setters and getters

  'enable': { 0:true },
  'disable': { 0:true },
  'getParameter': { 0:true },

  // Rendering

  'drawArrays': { 0:true },
  'drawElements': { 0:true, 2:true },

  // Shaders

  'createShader': { 0:true },
  'getShaderParameter': { 1:true },
  'getProgramParameter': { 1:true },

  // Vertex attributes

  'getVertexAttrib': { 1:true },
  'vertexAttribPointer': { 2:true },

  // Textures

  'bindTexture': { 0:true },
  'activeTexture': { 0:true },
  'getTexParameter': { 0:true, 1:true },
  'texParameterf': { 0:true, 1:true },
  'texParameteri': { 0:true, 1:true, 2:true },
  'texImage2D': { 0:true, 2:true, 6:true, 7:true },
  'texSubImage2D': { 0:true, 6:true, 7:true },
  'copyTexImage2D': { 0:true, 2:true },
  'copyTexSubImage2D': { 0:true },
  'generateMipmap': { 0:true },

  // Buffer objects

  'bindBuffer': { 0:true },
  'bufferData': { 0:true, 2:true },
  'bufferSubData': { 0:true },
  'getBufferParameter': { 0:true, 1:true },

  // Renderbuffers and framebuffers

  'pixelStorei': { 0:true, 1:true },
  'readPixels': { 4:true, 5:true },
  'bindRenderbuffer': { 0:true },
  'bindFramebuffer': { 0:true },
  'checkFramebufferStatus': { 0:true },
  'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
  'framebufferTexture2D': { 0:true, 1:true, 2:true },
  'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
  'getRenderbufferParameter': { 0:true, 1:true },
  'renderbufferStorage': { 0:true, 1:true },

  // Frame buffer operations (clear, blend, depth test, stencil)

  'clear': { 0:true },
  'depthFunc': { 0:true },
  'blendFunc': { 0:true, 1:true },
  'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
  'blendEquation': { 0:true },
  'blendEquationSeparate': { 0:true, 1:true },
  'stencilFunc': { 0:true },
  'stencilFuncSeparate': { 0:true, 1:true },
  'stencilMaskSeparate': { 0:true },
  'stencilOp': { 0:true, 1:true, 2:true },
  'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },

  // Culling

  'cullFace': { 0:true },
  'frontFace': { 0:true }
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
var glEnums = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
function init(ctx) {
  if (glEnums === null) {
    glEnums = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        glEnums[ctx[propertyName]] = propertyName;
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums === null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
function mightBeEnum(value) {
  checkInit();
  return (glEnums[value] !== undefined);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
function glEnumToString(value) {
  checkInit();
  var name = glEnums[value];
  return (name !== undefined) ? name :
      ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
}

/**
 * Returns the string version of a WebGL argument.
 * Attempts to convert enum arguments to strings.
 * @param {string} functionName the name of the WebGL function.
 * @param {number} argumentIndx the index of the argument.
 * @param {*} value The value of the argument.
 * @return {string} The value as a string.
 */
function glFunctionArgToString(functionName, argumentIndex, value) {
  var funcInfo = glValidEnumContexts[functionName];
  if (funcInfo !== undefined) {
    if (funcInfo[argumentIndex]) {
      return glEnumToString(value);
    }
  }
  return value.toString();
}

function makePropertyWrapper(wrapper, original, propertyName) {
  //log("wrap prop: " + propertyName);
  wrapper.__defineGetter__(propertyName, function() {
    return original[propertyName];
  });
  // TODO(gmane): this needs to handle properties that take more than
  // one value?
  wrapper.__defineSetter__(propertyName, function(value) {
    //log("set: " + propertyName);
    original[propertyName] = value;
  });
}

// Makes a function that calls a function on another object.
function makeFunctionWrapper(original, functionName) {
  //log("wrap fn: " + functionName);
  var f = original[functionName];
  return function() {
    //log("call: " + functionName);
    var result = f.apply(original, arguments);
    return result;
  };
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 */
function makeDebugContext(ctx, opt_onErrorFunc) {
  init(ctx);
  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        // apparently we can't do args.join(",");
        var argStr = "";
        for (var ii = 0; ii < args.length; ++ii) {
          argStr += ((ii === 0) ? '' : ', ') +
              glFunctionArgToString(functionName, ii, args[ii]);
        }
        log("WebGL error "+ glEnumToString(err) + " in "+ functionName +
            "(" + argStr + ")");
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      var result = ctx[functionName].apply(ctx, arguments);
      var err = ctx.getError();
      if (err !== 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
       wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
     } else {
       makePropertyWrapper(wrapper, ctx, propertyName);
     }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow[err]) {
        glErrorShadow[err] = false;
        return err;
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}

    function resetToInitialState(ctx) {
        var numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
        var tmp = ctx.createBuffer();
        ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
        var ii;
        for (ii = 0; ii < numAttribs; ++ii) {
            ctx.disableVertexAttribArray(ii);
            ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
            ctx.vertexAttrib1f(ii, 0);
        }
        ctx.deleteBuffer(tmp);

        var numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
        for (ii = 0; ii < numTextureUnits; ++ii) {
            ctx.activeTexture(ctx.TEXTURE0 + ii);
            ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
            ctx.bindTexture(ctx.TEXTURE_2D, null);
        }

        ctx.activeTexture(ctx.TEXTURE0);
        ctx.useProgram(null);
        ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
        ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
        ctx.disable(ctx.BLEND);
        ctx.disable(ctx.CULL_FACE);
        ctx.disable(ctx.DEPTH_TEST);
        ctx.disable(ctx.DITHER);
        ctx.disable(ctx.SCISSOR_TEST);
        ctx.blendColor(0, 0, 0, 0);
        ctx.blendEquation(ctx.FUNC_ADD);
        ctx.blendFunc(ctx.ONE, ctx.ZERO);
        ctx.clearColor(0, 0, 0, 0);
        ctx.clearDepth(1);
        ctx.clearStencil(-1);
        ctx.colorMask(true, true, true, true);
        ctx.cullFace(ctx.BACK);
        ctx.depthFunc(ctx.LESS);
        ctx.depthMask(true);
        ctx.depthRange(0, 1);
        ctx.frontFace(ctx.CCW);
        ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
        ctx.lineWidth(1);
        ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
        ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
        ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
        ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        // TODO: Delete this IF.
        if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
            ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
        }
        ctx.polygonOffset(0, 0);
        ctx.sampleCoverage(1, false);
        ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
        ctx.stencilMask(0xFFFFFFFF);
        ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
        ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);

        // TODO: This should NOT be needed but Firefox fails with 'hint'
        while (ctx.getError()) {}
    }

    function makeLostContextSimulatingCanvas(canvas) {
        var unwrappedContext_;
        //var wrappedContext_;
        var onLost_ = [];
        var onRestored_ = [];
        var wrappedContext_ = {};
        var contextId_ = 1;
        var contextLost_ = false;
        var resourceId_ = 0;
        var resourceDb_ = [];
        var numCallsToLoseContext_ = 0;
        var numCalls_ = 0;
        var canRestore_ = false;
        var restoreTimeout_ = 0;

        // Holds booleans for each GL error so can simulate errors.
        var glErrorShadow_ = { };

        canvas.getContext = function(f) {
            return function() {
                var ctx = f.apply(canvas, arguments);
                // Did we get a context and is it a WebGL context?
                if (ctx instanceof WebGLRenderingContext) {
                    if (ctx != unwrappedContext_) {
                        if (unwrappedContext_) {
                            throw "got different context";
                        }
                        unwrappedContext_ = ctx;
                        wrappedContext_ = makeLostContextSimulatingContext(unwrappedContext_);
                    }
                    return wrappedContext_;
                }
                return ctx;
            };
        }(canvas.getContext);

        function wrapEvent(listener) {
            if (typeof(listener) == "function") {
                return listener;
            } else {
                return function(info) {
                    listener.handleEvent(info);
                }
            }
        }

        var addOnContextLostListener = function(listener) {
            onLost_.push(wrapEvent(listener));
        };

        var addOnContextRestoredListener = function(listener) {
            onRestored_.push(wrapEvent(listener));
        };


        function wrapAddEventListener(canvas) {
            var f = canvas.addEventListener;
            canvas.addEventListener = function(type, listener, bubble) {
                switch (type) {
                case 'webglcontextlost':
                    addOnContextLostListener(listener);
                    break;
                case 'webglcontextrestored':
                    addOnContextRestoredListener(listener);
                    break;
                default:
                    f.apply(canvas, arguments);
                }
            };
        }

        wrapAddEventListener(canvas);

        canvas.loseContext = function() {
            if (!contextLost_) {
                contextLost_ = true;
                numCallsToLoseContext_ = 0;
                ++contextId_;
                while (unwrappedContext_.getError()) {}
                clearErrors();
                glErrorShadow_[unwrappedContext_.CONTEXT_LOST_WEBGL] = true;
                var event = makeWebGLContextEvent("context lost");
                var callbacks = onLost_.slice();
                setTimeout(function() {
                    //log("numCallbacks:" + callbacks.length);
                    for (var ii = 0; ii < callbacks.length; ++ii) {
                        //log("calling callback:" + ii);
                        callbacks[ii](event);
                    }
                    if (restoreTimeout_ >= 0) {
                        setTimeout(function() {
                            canvas.restoreContext();
                        }, restoreTimeout_);
                    }
                }, 0);
            }
        };

        canvas.restoreContext = function() {
            if (contextLost_) {
                if (onRestored_.length) {
                    setTimeout(function() {
                        if (!canRestore_) {
                            throw "can not restore. webglcontestlost listener did not call event.preventDefault";
                        }
                        freeResources();
                        resetToInitialState(unwrappedContext_);
                        contextLost_ = false;
                        numCalls_ = 0;
                        canRestore_ = false;
                        var callbacks = onRestored_.slice();
                        var event = makeWebGLContextEvent("context restored");
                        for (var ii = 0; ii < callbacks.length; ++ii) {
                            callbacks[ii](event);
                        }
                    }, 0);
                }
            }
        };

        canvas.loseContextInNCalls = function(numCalls) {
            if (contextLost_) {
                throw "You can not ask a lost contet to be lost";
            }
            numCallsToLoseContext_ = numCalls_ + numCalls;
        };

        canvas.getNumCalls = function() {
            return numCalls_;
        };

        canvas.setRestoreTimeout = function(timeout) {
            restoreTimeout_ = timeout;
        };

        function isWebGLObject(obj) {
            //return false;
            return (obj instanceof WebGLBuffer ||
                    obj instanceof WebGLFramebuffer ||
                    obj instanceof WebGLProgram ||
                    obj instanceof WebGLRenderbuffer ||
                    obj instanceof WebGLShader ||
                    obj instanceof WebGLTexture);
        }

        function checkResources(args) {
            for (var ii = 0; ii < args.length; ++ii) {
                var arg = args[ii];
                if (isWebGLObject(arg)) {
                    return arg.__webglDebugContextLostId__ == contextId_;
                }
            }
            return true;
        }

        function clearErrors() {
            var k = Object.keys(glErrorShadow_);
            for (var ii = 0; ii < k.length; ++ii) {
                delete glErrorShadow_[k];
            }
        }

        function loseContextIfTime() {
            ++numCalls_;
            if (!contextLost_) {
                if (numCallsToLoseContext_ == numCalls_) {
                    canvas.loseContext();
                }
            }
        }

        // Makes a function that simulates WebGL when out of context.
        function makeLostContextFunctionWrapper(ctx, functionName) {
            var f = ctx[functionName];
            return function() {
                // log("calling:" + functionName);
                // Only call the functions if the context is not lost.
                loseContextIfTime();
                if (!contextLost_) {
                    //if (!checkResources(arguments)) {
                    //  glErrorShadow_[wrappedContext_.INVALID_OPERATION] = true;
                    //  return;
                    //}
                    var result = f.apply(ctx, arguments);
                    return result;
                }
            };
        }

        function freeResources() {
            for (var ii = 0; ii < resourceDb_.length; ++ii) {
                var resource = resourceDb_[ii];
                if (resource instanceof WebGLBuffer) {
                    unwrappedContext_.deleteBuffer(resource);
                } else if (resource instanceof WebGLFramebuffer) {
                    unwrappedContext_.deleteFramebuffer(resource);
                } else if (resource instanceof WebGLProgram) {
                    unwrappedContext_.deleteProgram(resource);
                } else if (resource instanceof WebGLRenderbuffer) {
                    unwrappedContext_.deleteRenderbuffer(resource);
                } else if (resource instanceof WebGLShader) {
                    unwrappedContext_.deleteShader(resource);
                } else if (resource instanceof WebGLTexture) {
                    unwrappedContext_.deleteTexture(resource);
                }
            }
        }

        function makeWebGLContextEvent(statusMessage) {
            return {
                statusMessage: statusMessage,
                preventDefault: function() {
                    canRestore_ = true;
                }
            };
        }

        return canvas;

        function makeLostContextSimulatingContext (ctx) {
            // copy all functions and properties to wrapper
            for (var propertyName in ctx) {
                if (typeof ctx[propertyName] == 'function') {
                    wrappedContext_[propertyName] = makeLostContextFunctionWrapper(
                        ctx, propertyName);
                } else {
                    makePropertyWrapper(wrappedContext_, ctx, propertyName);
                }
            }

            // Wrap a few functions specially.
            wrappedContext_.getError = function() {
                loseContextIfTime();
                var err;
                if (!contextLost_) {
                    while (err = unwrappedContext_.getError()) {
                        glErrorShadow_[err] = true;
                    }
                }
                for (err in glErrorShadow_) {
                    if (glErrorShadow_[err]) {
                        delete glErrorShadow_[err];
                        return err;
                    }
                }
                return wrappedContext_.NO_ERROR;
            };

            var creationFunctions = [
                "createBuffer",
                "createFramebuffer",
                "createProgram",
                "createRenderbuffer",
                "createShader",
                "createTexture"
            ];
            for (var ii = 0; ii < creationFunctions.length; ++ii) {
                var functionName = creationFunctions[ii];
                wrappedContext_[functionName] = function(f) {
                    return function() {
                        loseContextIfTime();
                        if (contextLost_) {
                            return null;
                        }
                        var obj = f.apply(ctx, arguments);
                        obj.__webglDebugContextLostId__ = contextId_;
                        resourceDb_.push(obj);
                        return obj;
                    };
                }(ctx[functionName]);
            }

            var functionsThatShouldReturnNull = [
                "getActiveAttrib",
                "getActiveUniform",
                "getBufferParameter",
                "getContextAttributes",
                "getAttachedShaders",
                "getFramebufferAttachmentParameter",
                "getParameter",
                "getProgramParameter",
                "getProgramInfoLog",
                "getRenderbufferParameter",
                "getShaderParameter",
                "getShaderInfoLog",
                "getShaderSource",
                "getTexParameter",
                "getUniform",
                "getUniformLocation",
                "getVertexAttrib"
            ];
            for (ii = 0; ii < functionsThatShouldReturnNull.length; ++ii) {
                var functionName = functionsThatShouldReturnNull[ii];
                wrappedContext_[functionName] = function(f) {
                    return function() {
                        loseContextIfTime();
                        if (contextLost_) {
                            return null;
                        }
                        return f.apply(ctx, arguments);
                    }
                }(wrappedContext_[functionName]);
            }

            var isFunctions = [
                "isBuffer",
                "isEnabled",
                "isFramebuffer",
                "isProgram",
                "isRenderbuffer",
                "isShader",
                "isTexture"
            ];
            for (var ii = 0; ii < isFunctions.length; ++ii) {
                var functionName = isFunctions[ii];
                wrappedContext_[functionName] = function(f) {
                    return function() {
                        loseContextIfTime();
                        if (contextLost_) {
                            return false;
                        }
                        return f.apply(ctx, arguments);
                    }
                }(wrappedContext_[functionName]);
            }

            wrappedContext_.checkFramebufferStatus = function(f) {
                return function() {
                    loseContextIfTime();
                    if (contextLost_) {
                        return wrappedContext_.FRAMEBUFFER_UNSUPPORTED;
                    }
                    return f.apply(ctx, arguments);
                };
            }(wrappedContext_.checkFramebufferStatus);

            wrappedContext_.getAttribLocation = function(f) {
                return function() {
                    loseContextIfTime();
                    if (contextLost_) {
                        return -1;
                    }
                    return f.apply(ctx, arguments);
                };
            }(wrappedContext_.getAttribLocation);

            wrappedContext_.getVertexAttribOffset = function(f) {
                return function() {
                    loseContextIfTime();
                    if (contextLost_) {
                        return 0;
                    }
                    return f.apply(ctx, arguments);
                };
            }(wrappedContext_.getVertexAttribOffset);

            wrappedContext_.isContextLost = function() {
                return contextLost_;
            };

            return wrappedContext_;
        }
    }

return {
    /**
     * Initializes this module. Safe to call more than once.
     * @param {!WebGLRenderingContext} ctx A WebGL context. If
    }
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  'init': init,

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   */
  'mightBeEnum': mightBeEnum,

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  'glEnumToString': glEnumToString,

  /**
   * Converts the argument of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 0, gl.TEXTURE_2D);
   *
   * would return 'TEXTURE_2D'
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} argumentIndx the index of the argument.
   * @param {*} value The value of the argument.
   * @return {string} The value as a string.
   */
  'glFunctionArgToString': glFunctionArgToString,

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not NO_ERROR.
   *
   * You can supply your own function if you want. For example, if you'd like
   * an exception thrown on any GL error you could do this
   *
   *    function throwOnGLError(err, funcName, args) {
   *      throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" +
   *            funcName;
   *    };
   *
   *    ctx = WebGLDebugUtils.makeDebugContext(
   *        canvas.getContext("webgl"), throwOnGLError);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
   *     to call when gl.getError returns an error. If not specified the default
   *     function calls console.log with a message.
   */
  'makeDebugContext': makeDebugContext,

  /**
   * Given a canvas element returns a wrapped canvas element that will
   * simulate lost context. The canvas returned adds the following functions.
   *
   * loseContext:
   *   simulates a lost context event.
   *
   * restoreContext:
   *   simulates the context being restored.
   *
   * lostContextInNCalls:
   *   loses the context after N gl calls.
   *
   * getNumCalls:
   *   tells you how many gl calls there have been so far.
   *
   * setRestoreTimeout:
   *   sets the number of milliseconds until the context is restored
   *   after it has been lost. Defaults to 0. Pass -1 to prevent
   *   automatic restoring.
   *
   * @param {!Canvas} canvas The canvas element to wrap.
   */
  'makeLostContextSimulatingCanvas': makeLostContextSimulatingCanvas,

  /**
   * Resets a context to the initial state.
   * @param {!WebGLRenderingContext} ctx The webgl context to
   *     reset.
   */
  'resetToInitialState': resetToInitialState
};

}();
/** -*- compile-command: "jslint-cli stats.js" -*-
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

var Stats = {};

Stats.Stats = function(canvas) {
    this.layers = [];
    this.last_update = undefined;
    this.canvas = canvas;
};

Stats.Stats.prototype = {
    addLayer: function(color, getter) {
        if (color === undefined) {
            color = "rgb(255,255,255)";
        }
        this.layers.push({ 
            previous: 0, 
            color: color,
            getValue: getter
        });
    },

    update: function() {
        
        var t = (new Date()).getTime();
        if (this.last_update === undefined) {
            this.last_update = t;
        }
        var delta = (t - this.last_update)* 2.0*60.0/1000.0;
        if (delta < 1.0) {
            return;
        }

        var report = delta - Math.floor(delta);
        t -= report/(2.0*60.0/1000.0);
        delta = Math.floor(delta);

        var translate = delta;
        var c = this.canvas;
        var width = c.width;
        var height = c.height;
        var ctx = c.getContext("2d");
        ctx.save();
        ctx.globalCompositeOperation="copy";
        ctx.mozImageSmoothingEnabled = false;
        ctx.translate(-delta,0);
        ctx.drawImage(c, 0, 0, width, height);
        ctx.restore();
        ctx.clearRect(width - delta, 0, delta, height);

        for (var i = 0, l = this.layers.length; i < l; i++) {
            var layer = this.layers[i];
            c = this.canvas;
            var value = layer.getValue(t);
            width = c.width;
            height = c.height;

            ctx.lineWidth = 1.0;
            ctx.strokeStyle = layer.color;
            ctx.beginPath();
            ctx.moveTo(width - delta, height - layer.previous);
            ctx.lineTo(width, height - value);
            ctx.stroke();
            layer.previous = value;
        }
        this.last_update = t;
    }
};/** -*- compile-command: "jslint-cli View.js" -*- */
osgViewer.View = function() {
    this._graphicContext = undefined;
    this._camera = new osg.Camera();
    this._scene = new osg.Node();
    this._sceneData = undefined;
    this._frameStamp = new osg.FrameStamp();
    this._lightingMode = undefined;
    this._manipulator = undefined;

    this.setLightingMode(osgViewer.View.LightingMode.HEADLIGHT);

    this._scene.getOrCreateStateSet().setAttributeAndMode(new osg.Material());
    this._scene.getOrCreateStateSet().setAttributeAndMode(new osg.Depth());
    this._scene.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc());
    this._scene.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace());
};

osgViewer.View.LightingMode = {
    NO_LIGHT:  0,
    HEADLIGHT: 1,
    SKY_LIGHT: 2
};

osgViewer.View.prototype = {
    setGraphicContext: function(gc) { this._graphicContext = gc; },
    getGraphicContext: function() { return this._graphicContext; },
    setUpView: function (canvas) {
        var ratio = canvas.width/canvas.height;
        this._camera.setViewport(new osg.Viewport(0,0, canvas.width, canvas.height));
        osg.Matrix.makeLookAt([0,0,-10], [0,0,0], [0,1,0], this._camera.getViewMatrix());
        osg.Matrix.makePerspective(60, ratio, 1.0, 1000.0, this._camera.getProjectionMatrix());
    },
    computeIntersections: function (x, y, traversalMask) {
        if (traversalMask === undefined) {
            traversalMask = ~0;
        }
        
        var iv = new osgUtil.IntersectVisitor();
        iv.setTraversalMask(traversalMask);
        iv.addLineSegment([x,y,0.0], [x,y,1.0]);
        iv.pushCamera(this._camera);
        this._sceneData.accept(iv);
        return iv.hits;
    },

    setFrameStamp: function(frameStamp) { this._frameStamp = frameStamp;},
    getFrameStamp: function() { return this._frameStamp; },
    setCamera: function(camera) { this._camera = camera; },
    getCamera: function() { return this._camera; },

    setSceneData: function(node) {
        this._scene.removeChildren();
        this._scene.addChild( node );
        this._sceneData = node;
    },
    getSceneData: function() { return this._sceneData; },
    getScene: function() { return this._scene;},

    getManipulator: function() { return this._manipulator; },
    setManipulator: function(manipulator) { this._manipulator = manipulator; },

    getLight: function() { return this._light; },
    setLight: function(light) { 
        this._light = light;
        if (this._lightingMode !== osgViewer.View.LightingMode.NO_LIGHT) {
            this._scene.getOrCreateStateSet().setAttributeAndMode(this._light);
        }
    },
    getLightingMode: function() { return this._lightingMode; },
    setLightingMode: function(lightingMode) {
        if (this._lightingMode !== lightingMode) {
            this._lightingMode = lightingMode;
            if (this._lightingMode !== osgViewer.View.LightingMode.NO_LIGHT) {
                if (! this._light) {
                    this._light = new osg.Light();
                    this._light.setAmbient([0.2,0.2,0.2,1.0]);
                    this._light.setDiffuse([0.8,0.8,0.8,1.0]);
                    this._light.setSpecular([0.5,0.5,0.5,1.0]);
                    this._scene.getOrCreateStateSet().setAttributeAndMode(this._light);
                }
            } else {
                this._light = undefined;
                this._scene.getOrCreateStateSet().removeAttribute("Light0");
            }
        }
    }

};
/** -*- compile-command: "jslint-cli Viewer.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */


osgViewer.Viewer = function(canvas, options, error) {
    osgViewer.View.call(this);

    if (options === undefined) {
        options = {antialias : true};
    }

    if (osg.SimulateWebGLLostContext) {
        canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(canvas);
        canvas.loseContextInNCalls(osg.SimulateWebGLLostContext);
    }

    gl = WebGLUtils.setupWebGL(canvas, options, error );
    var self = this;
    canvas.addEventListener("webglcontextlost", function(event) {
        self.contextLost();
        event.preventDefault();
    }, false);

    canvas.addEventListener("webglcontextrestored", function() {
        self.contextRestored();
    }, false);


    if (osg.ReportWebGLError) {
        gl = WebGLDebugUtils.makeDebugContext(gl);
    }


    if (gl) {
        this.setGraphicContext(gl);
        osg.init();
        this._canvas = canvas;
        this._frameRate = 60.0;
        osgUtil.UpdateVisitor = osg.UpdateVisitor;
        osgUtil.CullVisitor = osg.CullVisitor;
        this._urlOptions = true;

        this._mouseWheelEventNode = canvas;
        this._mouseEventNode = canvas;
        this._keyboardEventNode = document;
        if (options) {
            if(options.mouseWheelEventNode){
                this._mouseWheelEventNode = options.mouseWheelEventNode;
            }
            if(options.mouseEventNode){
                this._mouseEventNode = options.mouseEventNode;
            }
            if(options.keyboardEventNode){
                this._keyboardEventNode = options.keyboardEventNode;
            }
        }

        this.setUpView(canvas);
    } else {
        throw "No WebGL implementation found";
    }
};


osgViewer.Viewer.prototype = osg.objectInehrit(osgViewer.View.prototype, {

    contextLost: function() {
        osg.log("webgl context lost");
        cancelRequestAnimFrame(this._requestID);
    },
    contextRestored: function() {
        osg.log("webgl context restored, but not supported - reload the page");
    },

    init: function() {
        this._done = false;
        this._state = new osg.State();

        var gl = this.getGraphicContext();
        this._state.setGraphicContext(gl);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        this._updateVisitor = new osgUtil.UpdateVisitor();
        this._cullVisitor = new osgUtil.CullVisitor();

        this._renderStage = new osg.RenderStage();
        this._stateGraph = new osg.StateGraph();

        if (this._urlOptions) {
            this.parseOptions();
        }

        this.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
    },
    getState: function() {
        // would have more sense to be in view
        // but I would need to put cull and draw on lower Object
        // in View or a new Renderer object
        return this._state;
    },
    parseOptions: function() {

        var optionsURL = function() {
            var vars = [], hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for(var i = 0; i < hashes.length; i++)
            {
                hash = hashes[i].split('=');
                var element = hash[0].toLowerCase();
                vars.push(element);
                var result = hash[1];
                if (result === undefined) {
                    result = "1";
                }
                vars[element] = result.toLowerCase();

            }
            return vars;
        };
        
        var options = optionsURL();
        
        if (options.stats === "1") {
            this.initStats(options);
        }
        
        var gl = this.getGraphicContext();
        // not the best way to do it
        if (options.depth_test === "0") {
            this.getGraphicContext().disable(gl.DEPTH_TEST);
        }
        if (options.blend === "0") {
            this.getGraphicContext().disable(gl.BLEND);
        }
        if (options.cull_face === "0") {
            this.getGraphicContext().disable(gl.CULL_FACE);
        }
        if (options.light === "0") {
            this.setLightingMode(osgViewer.View.LightingMode.NO_LIGHT);
        }
    },

    

    initStats: function(options) {

        var maxMS = 50;
        var stepMS = 10;
        var fontsize = 14;

        if (options.statsMaxMS !== undefined) {
            maxMS = parseInt(options.statsMaxMS,10);
        }
        if (options.statsStepMS !== undefined) {
            stepMS = parseInt(options.statsStepMS,10);
        }

        var createDomElements = function (elementToAppend) {
            var dom = [
                "<div id='StatsDiv' style='float: left; position: relative; width: 300px; height: 150px; z-index: 10;'>",
                "<div id='StatsLegends' style='position: absolute; left: 0px; font-size: " + fontsize +"px;color: #ffffff;'>",

                "<div id='frameRate' style='color: #00ff00;' > frameRate </div>",
                "<div id='frameTime' style='color: #ffff00;' > frameTime </div>",
                "<div id='updateTime' style='color: #d07b1f;'> updateTime </div>",
                "<div id='cullTime' style='color: #73e0ff;'> cullTime </div>",
                "<div id='drawTime' style='color: #ff0000;'> drawTime </div>",
                "<div id='fps'> </div>",
                
                "</div>",

                "<div id='StatsCanvasDiv' style='position: relative;'>",
                "<canvas id='StatsCanvasGrid' width='300' height='150' style='z-index:-1; position: absolute; background: rgba(14,14,14,0.8); ' ></canvas>",
                "<canvas id='StatsCanvas' width='300' height='150' style='z-index:8; position: absolute;' ></canvas>",
                "<canvas id='StatsCanvasFps' width='30' height='15' style='z-index:9; position: absolute; top: 130px' ></canvas>",
                "</div>",

                "</div>"
            ].join("\n");
            var parent;
            if (elementToAppend === undefined) {
                parent = document.body;
                //elementToAppend = "body";
            } else {
                parent = document.getElementById(elementToAppend);
            }

            //jQuery(dom).appendTo(elementToAppend);
            var mydiv = document.createElement('div');
            mydiv.innerHTML = dom;
            parent.appendChild(mydiv);

            var grid = document.getElementById("StatsCanvasGrid");
            var ctx = grid.getContext("2d");
            ctx.clearRect(0,0,grid.width, grid.height);

            var step = Math.floor(maxMS/stepMS).toFixed(0);
            var r = grid.height/step;
            ctx.strokeStyle = "rgb(70,70,70)";
            for (var i = 0, l = step; i < l; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i*r);
                ctx.lineTo(grid.width, i*r);
                ctx.stroke();
            }

            // setup the font for fps
            var cfps = document.getElementById("StatsCanvasFps");
            ctx = cfps.getContext("2d");
            ctx.font = "14px Sans";

            return document.getElementById("StatsCanvas");
        };

        if (this._canvasStats === undefined || this._canvasStats === null) {
            this._canvasStats = createDomElements();
        }
        this._stats = new Stats.Stats(this._canvasStats);
        var that = this;
        this._frameRate = 1;
        this._frameTime = 0;
        this._updateTime = 0;
        this._cullTime = 0;
        this._drawTime = 0;
        var height = this._canvasStats.height;
        var ratio = height / maxMS;
        height = height - 2;
        var getStyle = function(el,styleProp)
        {
            var x = document.getElementById(el);
            if (x.style) {
		return x.style.getPropertyValue(styleProp);
            }
            return null;
        };
        this._stats.addLayer(getStyle("frameRate","color"), function(t) { 
            var v = (height)/60.0 * (1000/that._frameRate);
            if (v > height) {
                return height;
            }
            return v;} );
        this._stats.addLayer(getStyle("frameTime", "color"), function(t) { 
            var v = that._frameTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this._stats.addLayer(getStyle("updateTime","color"), function(t) { 
            var v = that._updateTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this._stats.addLayer(getStyle("cullTime","color"), function(t) { 
            var v = that._cullTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this._stats.addLayer(getStyle("drawTime","color"), function(t) { 
            var v = that._drawTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
    },

    update: function() {
        this.getScene().accept(this._updateVisitor);
    },
    cull: function() {
        // this part of code should be called for each view
        // right now, we dont support multi view
        this._stateGraph.clean();
        this._renderStage.reset();

        this._cullVisitor.reset();
        this._cullVisitor.setStateGraph(this._stateGraph);
        this._cullVisitor.setRenderStage(this._renderStage);
        var camera = this.getCamera();
        this._cullVisitor.pushStateSet(camera.getStateSet());
        this._cullVisitor.pushProjectionMatrix(camera.getProjectionMatrix());

        // update bound
        var bs = camera.getBound();

        var identity = osg.Matrix.makeIdentity([]);
        this._cullVisitor.pushModelviewMatrix(identity);

        if (this._light) {
            this._cullVisitor.addPositionedAttribute(this._light);
        }

        this._cullVisitor.pushModelviewMatrix(camera.getViewMatrix());
        this._cullVisitor.pushViewport(camera.getViewport());
        this._cullVisitor.setCullSettings(camera);

        this._renderStage.setClearDepth(camera.getClearDepth());
        this._renderStage.setClearColor(camera.getClearColor());
        this._renderStage.setClearMask(camera.getClearMask());
        this._renderStage.setViewport(camera.getViewport());

        this.getScene().accept(this._cullVisitor);

        // fix projection matrix if camera has near/far auto compute
        this._cullVisitor.popModelviewMatrix();
        this._cullVisitor.popProjectionMatrix();
        this._cullVisitor.popViewport();
        this._cullVisitor.popStateSet();

        this._renderStage.sort();
    },
    draw: function() {
        var state = this.getState();
        this._renderStage.draw(state);

        // noticed that we accumulate lot of stack, maybe because of the stateGraph
        state.popAllStateSets();
        // should not be necessary because of dirty flag now in attrubutes
        //this.state.applyWithoutProgram();
    },

    frame: function() {
        var frameTime, beginFrameTime;
        frameTime = (new Date()).getTime();
        if (this._lastFrameTime === undefined) {
            this._lastFrameTime = 0;
        }
        this._frameRate = frameTime - this._lastFrameTime;
        this._lastFrameTime = frameTime;
        beginFrameTime = frameTime;

        var frameStamp = this.getFrameStamp();

        if (frameStamp.getFrameNumber() === 0) {
            frameStamp.setReferenceTime(frameTime/1000.0);
            this._numberFrame = 0;
        }

        frameStamp.setSimulationTime(frameTime/1000.0 - frameStamp.getReferenceTime());

        if (this.getManipulator()) {
            osg.Matrix.copy(this.getManipulator().getInverseMatrix(), this.getCamera().getViewMatrix());
        }

        // setup framestamp
        this._updateVisitor.setFrameStamp(this.getFrameStamp());
        //this._cullVisitor.setFrameStamp(this.getFrameStamp());


        // time the update
        var updateTime = (new Date()).getTime();
        this.update();

        var cullTime = (new Date()).getTime();
        updateTime = cullTime - updateTime;
        this._updateTime = updateTime;

        this.cull();
        var drawTime = (new Date()).getTime();
        cullTime = drawTime - cullTime;
        this._cullTime = cullTime;

        this.draw();
        drawTime = (new Date()).getTime() - drawTime;
        this._drawTime = drawTime;

        var f = frameStamp.getFrameNumber()+1;
        frameStamp.setFrameNumber(f);

        this._numberFrame++;
        var endFrameTime = (new Date()).getTime();

        this._frameTime = (new Date()).getTime() - beginFrameTime;
        if (this._stats !== undefined) {
            this._stats.update();

            if (this._numberFrame % 60 === 0.0) {
                var nd = endFrameTime;
                var diff = nd - this._statsStartTime;
                var fps = (this._numberFrame*1000/diff).toFixed(1);
                this._statsStartTime = nd;
                this._numberFrame = 0;

                var cfps = document.getElementById("StatsCanvasFps");
                var ctx = cfps.getContext("2d");
                ctx.clearRect(0,0,cfps.width, cfps.height);
                ctx.fillStyle = "rgb(255,255,255)";
                ctx.fillText(fps, 0, cfps.height);
            }
        }
    },

    setDone: function() { this._done = true; },
    done: function() { return this._done; },

    run: function() {
        var self = this;
        var render = function() {
            if (!self.done()) {
                self._requestID = window.requestAnimationFrame(render, self.canvas);
                self.frame();
            }
        };
        render();
    },

    setupManipulator: function(manipulator, dontBindDefaultEvent) {
        if (manipulator === undefined) {
            manipulator = new osgGA.OrbitManipulator();
        }

        if (manipulator.setNode !== undefined) {
            manipulator.setNode(this.getSceneData());
        } else {
            // for backward compatibility
            manipulator.view = this;
        }

        this.setManipulator(manipulator);

        var that = this;
        var viewer = this;
	var fixEvent = function( event ) {

            //if ( event[ expando ] ) {
                //return event;
            //}

            // store a copy of the original event object
            // and "clone" to set read-only properties

            // nop
            //var originalEvent = event;
            //event = jQuery.Event( originalEvent );

            for ( var i = this.props.length, prop; i; ) {
                prop = this.props[ --i ];
                event[ prop ] = originalEvent[ prop ];
            }

            // Fix target property, if necessary
            if ( !event.target ) {
                event.target = event.srcElement || document; // Fixes #1925 where srcElement might not be defined either
            }

            // check if target is a textnode (safari)
            if ( event.target.nodeType === 3 ) {
                event.target = event.target.parentNode;
            }

            // Add relatedTarget, if necessary
            if ( !event.relatedTarget && event.fromElement ) {
                event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
            }

            // Calculate pageX/Y if missing and clientX/Y available
            if ( event.pageX === null && event.clientX !== null ) {
                var doc = document.documentElement, body = document.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
            }

            // Add which for key events
            if ( !event.which && ((event.charCode || event.charCode === 0) ? event.charCode : event.keyCode) ) {
                event.which = event.charCode || event.keyCode;
            }

            // Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
            if ( !event.metaKey && event.ctrlKey ) {
                event.metaKey = event.ctrlKey;
            }

            // Add which for click: 1 === left; 2 === middle; 3 === right
            // Note: button is not normalized, so don't use it
            if ( !event.which && event.button !== undefined ) {
                event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));
            }

            return event;
        };

        if (dontBindDefaultEvent === undefined || dontBindDefaultEvent === false) {

            var disableMouse = false;

            var touchDown = function(ev)
            {
                disableMouse = true;
                return viewer.getManipulator().touchDown(ev);
            };
            var touchUp = function(ev)
            {
                disableMouse = true;
                return viewer.getManipulator().touchUp(ev);
            };
            var touchMove = function(ev)
            {
                disableMouse = true;
                return viewer.getManipulator().touchMove(ev);
            };

            // touch events
            this._canvas.addEventListener("MozTouchDown", touchDown, false);
            this._canvas.addEventListener("MozTouchUp", touchUp, false);
            this._canvas.addEventListener("MozTouchMove", touchMove, false);

            // mouse
            var mousedown = function (ev)
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().mousedown(ev);
                }
            };
            var mouseup = function (ev)
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().mouseup(ev);
                }
            };
            var mousemove = function (ev)
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().mousemove(ev);
                }
            };
            var dblclick = function (ev)
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().dblclick(ev);
                }
            };
            var mousewheel = function (event)
            {
                if (disableMouse === false) {
                    // from jquery
                    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
                    //event = $.event.fix(orgEvent);
                    event.type = "mousewheel";
                    
                    // Old school scrollwheel delta
                    if ( event.wheelDelta ) { delta = event.wheelDelta/120; }
                    if ( event.detail     ) { delta = -event.detail/3; }
                    
                    // New school multidimensional scroll (touchpads) deltas
                    deltaY = delta;
                    
                    // Gecko
                    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
                        deltaY = 0;
                        deltaX = -1*delta;
                    }
                    
                    // Webkit
                    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
                    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
                    // Add event and delta to the front of the arguments
                    args.unshift(event, delta, deltaX, deltaY);
                    var m = viewer.getManipulator();
                    return m.mousewheel.apply(m, args);
                }
            };

            if (viewer.getManipulator().mousedown) {
                this._mouseEventNode.addEventListener("mousedown", mousedown, false);
            }
            if (viewer.getManipulator().mouseup) {
                this._mouseEventNode.addEventListener("mouseup", mouseup, false);
            }
            if (viewer.getManipulator().mousemove) {
                this._mouseEventNode.addEventListener("mousemove", mousemove, false);
            }
            if (viewer.getManipulator().dblclick) {
                this._mouseEventNode.addEventListener("dblclick", dblclick, false);
            }
            if (viewer.getManipulator().mousewheel) {
                this._mouseWheelEventNode.addEventListener("DOMMouseScroll", mousewheel, false);
                this._mouseWheelEventNode.addEventListener("mousewheel", mousewheel, false);
            }

            var keydown = function(ev) {return viewer.getManipulator().keydown(ev); };
            var keyup = function(ev) {return viewer.getManipulator().keyup(ev);};

            if (viewer.getManipulator().keydown) {
                this._keyboardEventNode.addEventListener("keydown", keydown, false);
            }
            if (viewer.getManipulator().keyup) {
                this._keyboardEventNode.addEventListener("keyup", keyup, false);
            }

            var self = this;
            var resize = function(ev) {
                var w = window.innerWidth;
                var h = window.innerHeight;

                var prevWidth = self._canvas.width;
                var prevHeight = self._canvas.height;
                self._canvas.width = w;
                self._canvas.height = h;
                self._canvas.style.width = w;
                self._canvas.style.height = h;
                osg.log("window resize "  + prevWidth + "x" + prevHeight + " to " + w + "x" + h);
                var camera = self.getCamera();
                var vp = camera.getViewport();
                var widthChangeRatio = w/vp.width();
                var heightChangeRatio = h/vp.height();
                var aspectRatioChange = widthChangeRatio / heightChangeRatio; 
                vp.setViewport(vp.x()*widthChangeRatio, vp.y()*heightChangeRatio, vp.width()*widthChangeRatio, vp.height()*heightChangeRatio);

                if (aspectRatioChange !== 1.0) {

                    osg.Matrix.postMult(osg.Matrix.makeScale(1.0, aspectRatioChange, 1.0 ,[]), camera.getProjectionMatrix());
                }
            };
            window.onresize = resize;
        }
    }
});
/** -*- compile-command: "jslint-cli osgGA.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

osgGA = {};
/** -*- compile-command: "jslint-cli Manipulator.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

/** 
 *  Manipulator
 *  @class
 */
osgGA.Manipulator = function() {};

/** @lends osgGA.Manipulator.prototype */
osgGA.Manipulator.prototype = {
    getPositionRelativeToCanvas: function(e) {
        var myObject = e.target;
        var posx,posy;
	if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}
        var divGlobalOffset = function(obj) {
            var x=0, y=0;
            x = obj.offsetLeft;
            y = obj.offsetTop;
            var body = document.getElementsByTagName('body')[0];
            while (obj.offsetParent && obj!=body){
                x += obj.offsetParent.offsetLeft;
                y += obj.offsetParent.offsetTop;
                obj = obj.offsetParent;
            }
            return [x,y];
        };
	// posx and posy contain the mouse position relative to the document
	// Do something with this information
        var globalOffset = divGlobalOffset(myObject);
        posx = posx - globalOffset[0];
        posy = myObject.height-(posy - globalOffset[1]);
        return [posx,posy];
    },

    /**
       Method called when a keydown event is triggered
        @type KeyEvent
     */
    keydown: function(event) {},
    /**
       Method called when a keyup event is triggered
       @type KeyEvent
     */
    keyup: function(event) {},
    mouseup: function(event) {},
    mousedown: function(event) {},
    mousemove: function(event) {},
    dblclick: function(event) {},
    touchDown: function(event) {},
    touchUp: function(event) {},
    touchMove: function(event) {},
    mousewheel: function(event, intDelta, deltaX, deltaY) {},
    getInverseMatrix: function () { return osg.Matrix.makeIdentity([]);}

};
/** -*- compile-command: "jslint-cli OrbitManipulator.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */
osgGA.OrbitManipulatorMode = {
    Rotate: 0,
    Pan: 1,
    Zoom: 2
};

/** 
 *  OrbitManipulator
 *  @class
 */
osgGA.OrbitManipulator = function () {
    osgGA.Manipulator.call(this);
    this.init();
};

/** @lends osgGA.OrbitManipulator.prototype */
osgGA.OrbitManipulator.prototype = osg.objectInehrit(osgGA.Manipulator.prototype, {
    init: function() {
        this.distance = 25;
        this.target = [ 0,0, 0];
        this.eye = [ 0, this.distance, 0];
        this.rotation = osg.Matrix.mult(osg.Matrix.makeRotate( Math.PI, 0,0,1, []), osg.Matrix.makeRotate( -Math.PI/10.0, 1,0,0, []), []); // osg.Quat.makeIdentity();
        this.up = [0, 0, 1];
        this.time = 0.0;
        this.dx = 0.0;
        this.dy = 0.0;
        this.buttonup = true;
        this.scale = 1.0;
        this.targetDistance = this.distance;
        this.currentMode = osgGA.OrbitManipulatorMode.Rotate;
        this.maxDistance = 0;
        this.minDistance = 0;
    },
    reset: function() {
        this.init();
    },
    setNode: function(node) {
        this.node = node;
    },
    setTarget: function(target) {
        osg.Vec3.copy(target, this.target);
    },
    computeHomePosition: function() {
        if (this.node !== undefined) {
            //this.reset();
            var bs = this.node.getBound();
            this.setDistance(bs.radius()*1.5);
            this.setTarget(bs.center());
        }
    },

    keydown: function(ev) {
        if (ev.keyCode === 32) {
            this.computeHomePosition();
        } else if (ev.keyCode === 33) { // pageup
            this.distanceIncrease();
            return false;
        } else if (ev.keyCode === 34) { //pagedown
            this.distanceDecrease();
            return false;
        }
    },
    mouseup: function(ev) {
        this.dragging = false;
        this.panning = false;
        this.releaseButton(ev);
    },
    mousedown: function(ev) {
        this.panning = true;
        this.dragging = true;
        var pos = this.getPositionRelativeToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
        ev.preventDefault();
    },
    mousemove: function(ev) {
        if (this.buttonup === true) {
            return;
        }
        var scaleFactor;
        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.getPositionRelativeToCanvas(ev);
        curX = pos[0];
        curY = pos[1];

        scaleFactor = 10.0;
        deltaX = (this.clientX - curX) / scaleFactor;
        deltaY = (this.clientY - curY) / scaleFactor;
        this.clientX = curX;
        this.clientY = curY;

        this.update(deltaX, deltaY);
        return false;
    },
    setMaxDistance: function(d) {
        this.maxDistance =  d;
    },
    setMinDistance: function(d) {
        this.minDistance =  d;
    },
    setDistance: function(d) {
        this.distance = d;
        this.targetDistance = d;
    },

    panModel: function(dx, dy) {
        var inv = [];
        osg.Matrix.inverse(this.rotation, inv);
        var x = [ osg.Matrix.get(inv, 0,0), osg.Matrix.get(inv, 0,1), 0 ];
        osg.Vec3.normalize(x, x);
        var y = [ osg.Matrix.get(inv, 1,0), osg.Matrix.get(inv, 1,1), 0 ];
        osg.Vec3.normalize(y, y);

        osg.Vec3.add(this.target, osg.Vec3.mult(x, -dx), this.target);
        osg.Vec3.add(this.target, osg.Vec3.mult(y, -dy), this.target);
    },

    zoomModel: function(dx, dy) {
        this.distance += dy;
    },

    computeRotation: function(dx, dy) {
        var of = osg.Matrix.makeRotate(dx / 10.0, 0,0,1, []);
        var r = osg.Matrix.mult(this.rotation, of, []);

        of = osg.Matrix.makeRotate(dy / 10.0, 1,0,0, []);
        var r2 = osg.Matrix.mult(of, r, []);

        // test that the eye is not too up and not too down to not kill
        // the rotation matrix
        var inv = [];
        osg.Matrix.inverse(r2, inv);
        var eye = osg.Matrix.transformVec3(inv, [0, this.distance, 0]);

        var dir = osg.Vec3.neg(eye, []);
        osg.Vec3.normalize(dir, dir);

        var p = osg.Vec3.dot(dir, [0,0,1]);
        if (Math.abs(p) > 0.95) {
            //discard rotation on y
            this.rotation = r;
            return;
        }
        this.rotation = r2;
    },

    update: function(dx, dy) {
        this.dx = dx;
        this.dy = dy;

        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            this.time = (new Date()).getTime();
        }
    },

    updateWithDelay: function() {
        var f = 1.0;
        var dt;
        var max = 2.0;
        var dx = this.dx;
        var dy = this.dy;
        if (this.buttonup) {
            f = 0.0;
            dt = ((new Date()).getTime() - this.time)/1000.0;
            if (dt < max) {
                f = 1.0 - osgAnimation.EaseOutQuad(dt/max);
            }
            dx *= f;
            dy *= f;
        } else {
            this.dx = 0;
            this.dy = 0;
        }

        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            if (this.currentMode === osgGA.OrbitManipulatorMode.Pan) {
                this.panModel(dx/this.scale, dy/this.scale);
            } else if ( this.currentMode === osgGA.OrbitManipulatorMode.Rotate) {
                this.computeRotation(dx, dy);
            } else if ( this.currentMode === osgGA.OrbitManipulatorMode.Zoom) {
                this.zoomModel(dx, dy);
            }
        }
    },
    releaseButton: function() {
        this.buttonup = true;
    },

    changeScale: function(d) {
        var curd = this.distance;
        var scaleChange = this.scale/d;
        this.scale = d;
        this.distance = this.targetDistance;
        this.targetDistance = this.distance * scaleChange;
        this.timeMotion = (new Date()).getTime();
    },
    mousewheel: function(ev, intDelta, deltaX, deltaY) {
	if (intDelta > 0){
            if (this.distanceDecrease) {
                this.distanceDecrease();
            }
	}
	else if (intDelta < 0){
            if (this.distanceIncrease) {
                this.distanceIncrease();
            }
	}
    },
    distanceIncrease: function() {
        var h = this.distance;
        var currentTarget = this.targetDistance;
        var newTarget = currentTarget + h/10.0;
        if (this.maxDistance > 0) {
            if (newTarget > this.maxDistance) {
                newTarget = this.maxDistance;
            }
        }
        this.distance = currentTarget;
        this.targetDistance = newTarget;
        this.timeMotion = (new Date()).getTime();
    },
    distanceDecrease: function() {
        var h = this.distance;
        var currentTarget = this.targetDistance;
        var newTarget = currentTarget - h/10.0;
        if (this.minDistance > 0) {
            if (newTarget < this.minDistance) {
                newTarget = this.minDistance;
            }
        }
        this.distance = currentTarget;
        this.targetDistance = newTarget;
        this.timeMotion = (new Date()).getTime();
    },

    pushButton: function() {
        this.dx = this.dy = 0;
        this.buttonup = false;
    },
    getInverseMatrix: function () {
        this.updateWithDelay();

        var target = this.target;
        var distance = this.distance;

        if (this.timeMotion !== undefined) { // we have a camera motion event
            var dt = ((new Date()).getTime() - this.timeMotion)/1000.0;
            var motionDuration = 1.0;
            if (dt < motionDuration) {
                var r = osgAnimation.EaseOutQuad(dt/motionDuration);
                if (this.targetMotion) {
                    target = osg.Vec3.add(this.target, osg.Vec3.mult(osg.Vec3.sub(this.targetMotion, this.target), r));
                }
                if (this.targetDistance) {
                    distance = this.distance + (this.targetDistance - this.distance) * r;
                }
            } else {
                if (this.targetMotion) {
                    this.target = this.targetMotion;
                    target = this.targetMotion;
                }
                if (this.targetDistance) {
                    this.distance = this.targetDistance;
                    distance = this.targetDistance;
                }
                this.timeMotion = undefined;
            }
        }
        
        var inv = [];
        var eye = [];
        osg.Matrix.inverse(this.rotation, inv);
        osg.Matrix.transformVec3(inv,
                                 [0, distance, 0],
                                 eye );

        osg.Matrix.makeLookAt(osg.Vec3.add(target, eye, eye),
                              target,
                              [0,0,1], 
                              inv);
        return inv;
    }
});

/** -*- compile-command: "jslint-cli FirstPersonManipulator.js" -*-
 * Authors:
 *  Matt Fontaine <tehqin@gmail.com>
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */


/** 
 *  FirstPersonManipulator
 *  @class
 */
osgGA.FirstPersonManipulator = function () {
    osgGA.Manipulator.call(this);
    this.init();
};

/** @lends osgGA.FirstPersonManipulator.prototype */
osgGA.FirstPersonManipulator.prototype = osg.objectInehrit(osgGA.Manipulator.prototype, {
    setNode: function(node) {
        this.node = node;
    },
    computeHomePosition: function() {
        if (this.node) {
            var bs = this.node.getBound();
            this.eye = [ 0, -bs.radius()*1.5, 0 ];
        }
    },
    init: function()
    {
        this.direction = [0.0, 1.0, 0.0];
        this.angleVertical = 0.0;
        this.angleHorizontal = 0.0;
        this.eye = [0, 25.0, 10.0];
        this.up = [0, 0, 1];
        this.time = 0.0;
        this.buttonup = true;
    },
    reset: function()
    {
        this.init();
    },
    mouseup: function(ev)
    {
        this.dragging = false;
        this.releaseButton(ev);
    },
    mousedown: function(ev)
    {
        this.dragging = true;
        var pos = this.getPositionRelativeToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
    },
    mousemove: function(ev)
    {
        if (this.buttonup === true) { return; }

        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.getPositionRelativeToCanvas(ev);

        curX = pos[0];
        curY = pos[1];
        deltaX = this.clientX - curX;
        deltaY = this.clientY - curY;
        this.clientX = curX;
        this.clientY = curY;

        this.update(deltaX, deltaY);
        this.computeRotation(this.dx, this.dy);
    },
    pushButton: function(ev)
    {
        this.dx = this.dy = 0;
        this.buttonup = false;
    },
    computeRotation: function(dx, dy)
    {
        this.angleVertical += dy*0.01;
        this.angleHorizontal -= dx*0.01;

        var first = [];
        var second = [];
        var rotMat = [];
        osg.Matrix.makeRotate(this.angleVertical, 1, 0, 0, first);
        osg.Matrix.makeRotate(this.angleHorizontal, 0, 0, 1, second);
        osg.Matrix.mult(second, first, rotMat);

        this.direction = osg.Matrix.transformVec3(rotMat, [0, 1, 0], []);
        this.up = osg.Matrix.transformVec3(rotMat, [0, 0, 1], [] );
    },
    update: function(dx, dy)
    {
        this.dx = dx;
        this.dy = dy;
        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            this.time = (new Date()).getTime();
        }
    },
    releaseButton: function()
    {
        this.buttonup = true;
    },
    getInverseMatrix: function()
    {
        var target = osg.Vec3.add(this.eye, this.direction, []);
        return osg.Matrix.makeLookAt(this.eye, target, this.up, []);
    },
    moveForward: function(distance)
    {
        var d = osg.Vec3.mult(osg.Vec3.normalize(this.direction, []), distance, []);
        this.eye = osg.Vec3.add(this.eye, d, []);
    },
    strafe: function(distance)
    {
        var cx = osg.Vec3.cross(this.direction, this.up, []);
        var d = osg.Vec3.mult(osg.Vec3.normalize(cx,cx), distance, []);
        this.eye = osg.Vec3.add(this.eye, d, []);
    },
    
    keydown: function(event) {
        if (event.keyCode === 32) {
            this.computeHomePosition();
        } else if (event.keyCode == 87){ // W
            this.moveForward(5.0);
            return false;
        }
        else if (event.keyCode == 83){ // S
            this.moveForward(-5.0);
            return false;
        }
        else if (event.keyCode == 68){ // D
            this.strafe(5.0);
            return false;
        }
        else if (event.keyCode == 65){ // A
            this.strafe(-5.0);
            return false;
        }
    }
});
/** -*- compile-command: "jslint-cli osg.js" -*-
 *
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

osgDB.ObjectWrapper.serializers.osg = {};

osgDB.ObjectWrapper.serializers.osg.Object = function(jsonObj, obj) {
    var check = function(o) {
        return true;
    };
    if (!check(jsonObj)) {
        return false;
    }
    
    if (jsonObj.Name) {
        obj.setName(jsonObj.Name);
    }
    return true;
};

osgDB.ObjectWrapper.serializers.osg.Node = function(jsonObj, node) {
    var check = function(o) {
        return true;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, node);

    if (jsonObj.UpdateCallbacks) {
        for (var j = 0, l = jsonObj.UpdateCallbacks.length; j < l; j++) {
            var cb = osgDB.ObjectWrapper.readObject(jsonObj.UpdateCallbacks[j]);
            if (cb) {
                node.addUpdateCallback(cb);
            }
        }
    }

    if (jsonObj.StateSet) {
        node.setStateSet(osgDB.ObjectWrapper.readObject(jsonObj.StateSet));
    }
    
    if (jsonObj.Children) {
        for (var i = 0, k = jsonObj.Children.length; i < k; i++) {
            var obj = osgDB.ObjectWrapper.readObject(jsonObj.Children[i]);
            if (obj) {
                node.addChild(obj);
            }
        }
    }
};

osgDB.ObjectWrapper.serializers.osg.StateSet = function(jsonObj, stateSet) {
    var check = function(o) {
        return true;
    };

    if (!check(jsonObj)) {
        return;
    }
    
    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, stateSet);

    if (jsonObj.AttributeList) {
        for (var i = 0, l = jsonObj.AttributeList.length; i < l; i++) {
            var attr = osgDB.ObjectWrapper.readObject(jsonObj.AttributeList[i]);
            stateSet.setAttributeAndMode(attr);
        }
    }

    if (jsonObj.TextureAttributeList) {
        var textures = jsonObj.TextureAttributeList;
        for (var t = 0, lt = textures.length; t < lt; t++) {
            var textureAttributes = textures[t];
            for (var a = 0, al = textureAttributes.length; a < al; a++) {
                var tattr = osgDB.ObjectWrapper.readObject(textureAttributes[a]);
                if (tattr)
                    stateSet.setTextureAttributeAndMode(t, tattr);
            }
        }
    }

};

osgDB.ObjectWrapper.serializers.osg.Material = function(jsonObj, material) {
    var check = function(o) {
        if (o.Diffuse && o.Emission && o.Specular && o.Shininess) {
            return true;
        }
        return false;
    };

    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, material);

    material.setAmbient(jsonObj.Ambient);
    material.setDiffuse(jsonObj.Diffuse);
    material.setEmission(jsonObj.Emission);
    material.setSpecular(jsonObj.Specular);
    material.setShininess(jsonObj.Shininess);
};


osgDB.ObjectWrapper.serializers.osg.BlendFunc = function(jsonObj, blend) {
    var check = function(o) {
        if (o.SourceRGB && o.SourceAlpha && o.DestinationRGB && o.DestinationAlpha) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, blend);

    blend.setSourceRGB(jsonObj.SourceRGB);
    blend.setSourceAlpha(jsonObj.SourceAlpha);
    blend.setDestinationRGB(jsonObj.DestinationRGB);
    blend.setDestinationAlpha(jsonObj.DestinationAlpha);
};

osgDB.ObjectWrapper.serializers.osg.Texture = function(jsonObj, texture) {
    var check = function(o) {
        return true;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, texture);

    if (jsonObj.MinFilter) {
        texture.setMinFilter(jsonObj.MinFilter);
    }
    if (jsonObj.MagFilter) {
        texture.setMagFilter(jsonObj.MagFilter);
    }

    if (jsonObj.WrapT) {
        texture.setWrapT(jsonObj.WrapT);
    }
    if (jsonObj.WrapS) {
        texture.setWrapS(jsonObj.WrapS);
    }

    if (jsonObj.File) {
        var img = osgDB.readImage(jsonObj.File);
        texture.setImage(img);
    }
};


osgDB.ObjectWrapper.serializers.osg.Projection = function(jsonObj, node) {
    var check = function(o) {
        if (o.Matrix) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Node(jsonObj, node);

    if (jsonObj.Matrix) {
        node.setMatrix(jsonObj.Matrix);
    }

};


osgDB.ObjectWrapper.serializers.osg.MatrixTransform = function(jsonObj, node) {
    var check = function(o) {
        if (o.Matrix) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Node(jsonObj, node);

    if (jsonObj.Matrix) {
        node.setMatrix(jsonObj.Matrix);
    }
};


osgDB.ObjectWrapper.serializers.osg.Geometry = function(jsonObj, node) {
    var check = function(o) {
        if (o.PrimitiveSetList && o.VertexAttributeList) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Node(jsonObj, node);

    var mode, first, count, array;
    for (var i = 0, l = jsonObj.PrimitiveSetList.length; i < l; i++) {
        var entry = jsonObj.PrimitiveSetList[i];
        
        var drawElementPrimitive = entry.DrawElementUShort || entry.DrawElementUByte || entry.DrawElementUInt || entry.DrawElementsUShort || entry.DrawElementsUByte || entry.DrawElementsUInt || undefined;
        if ( drawElementPrimitive ) {
            var jsonArray = drawElementPrimitive.Indices;
            mode = drawElementPrimitive.Mode;
            array = new osg.BufferArray(osg.BufferArray[jsonArray.Type], 
                                            jsonArray.Elements, 
                                            jsonArray.ItemSize );
            if (!mode) {
                mode = osg.PrimitiveSet.TRIANGLES;
            } else {
                mode = osg.PrimitiveSet[mode];
            }
            var drawElements = new osg.DrawElements(mode, array);
            node.getPrimitiveSetList().push(drawElements);
        }

        var drawArrayPrimitive = entry.DrawArray || entry.DrawArrays;
        if (drawArrayPrimitive) {

            mode = drawArrayPrimitive.Mode || drawArrayPrimitive.mode;
            first = drawArrayPrimitive.First !== undefined ? drawArrayPrimitive.First : drawArrayPrimitive.first;
            count = drawArrayPrimitive.Count !== undefined ? drawArrayPrimitive.Count : drawArrayPrimitive.count;
            var drawArray = new osg.DrawArrays(osg.PrimitiveSet[mode], first, count);
            node.getPrimitives().push(drawArray);

        }

        var drawArrayLengthsPrimitive = entry.DrawArrayLengths || undefined;
        if (drawArrayLengthsPrimitive) {
            mode = drawArrayLengthsPrimitive.Mode;
            first = drawArrayLengthsPrimitive.First;
            array = drawArrayLengthsPrimitive.ArrayLengths;
            var drawArrayLengths =  new osg.DrawArrayLengths(osg.PrimitiveSet[mode], first, array);
            node.getPrimitives().push(drawArrayLengths);
        }
    }
    for (var key in jsonObj.VertexAttributeList) {
        if (jsonObj.VertexAttributeList.hasOwnProperty(key)) {
            var attributeArray = jsonObj.VertexAttributeList[key];
            node.getVertexAttributeList()[key] = new osg.BufferArray(osg.BufferArray[attributeArray.Type], attributeArray.Elements, attributeArray.ItemSize );
        }
    }
};/** -*- compile-command: "jslint-cli osgAnimation.js" -*-
 *
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

osgDB.ObjectWrapper.serializers.osgAnimation = {};
osgDB.ObjectWrapper.serializers.osgAnimation.Animation = function(jsonObj, animation) {
    // check
    // 
    var check = function(o) {
        if (o.Name && o.Channels && o.Channels.length > 0) {
            return true;
        }
        if (!o.Name) {
            osg.log("animation has field Name, error");
            return false;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, animation)) {
        return false;
    }

    // channels
    for (var i = 0, l = jsonObj.Channels.length; i < l; i++) {
        var channel = osgDB.ObjectWrapper.readObject(jsonObj.Channels[i]);
        if (channel) {
            animation.getChannels().push(channel);
        }
    }
    return true;
};

osgDB.ObjectWrapper.serializers.osgAnimation.Vec3LerpChannel = function(jsonObj, channel) {
    // check
    // 
    var check = function(o) {
        if (o.KeyFrames && o.TargetName && o.Name) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    // doit
    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, channel)) {
        return false;
    }

    channel.setTargetName(jsonObj.TargetName);

    // channels
    var keys = channel.getSampler().getKeyframes();
    for (var i = 0, l = jsonObj.KeyFrames.length; i < l; i++) {
        var nodekey = jsonObj.KeyFrames[i];
        var mykey = nodekey.slice(1);
        mykey.t = nodekey[0];
        keys.push(mykey);
    }
    return true;
};


osgDB.ObjectWrapper.serializers.osgAnimation.QuatLerpChannel = function(jsonObj, channel) {

    return osgDB.ObjectWrapper.serializers.osgAnimation.Vec3LerpChannel(jsonObj, channel);
};

osgDB.ObjectWrapper.serializers.osgAnimation.QuatSlerpChannel = function(jsonObj, channel) {
    return osgDB.ObjectWrapper.serializers.osgAnimation.Vec3LerpChannel(jsonObj, channel);
};


osgDB.ObjectWrapper.serializers.osgAnimation.FloatLerpChannel = function(jsonObj, channel) {
    // check
    // 
    var check = function(o) {
        if (o.KeyFrames && o.TargetName && o.Name) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    // doit
    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, channel)) {
        return false;
    }

    channel.setTargetName(jsonObj.TargetName);

    // channels
    var keys = channel.getSampler().getKeyframes();
    for (var i = 0, l = jsonObj.KeyFrames.length; i < l; i++) {
        var nodekey = jsonObj.KeyFrames[i];
        var mykey = nodekey.slice(1);
        mykey.t = nodekey[0];
        keys.push(mykey);
    }
    return true;
};



osgDB.ObjectWrapper.serializers.osgAnimation.BasicAnimationManager = function(jsonObj, manager) {
    // check
    // 
    var check = function(o) {
        if (o.Animations) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    for (var i = 0, l = jsonObj.Animations.length; i < l; i++) {
        var entry = jsonObj.Animations[i];
        var anim = osgDB.ObjectWrapper.readObject(entry);
        if (anim) {
            manager.registerAnimation(anim);
        }
    }
    return true;
};


osgDB.ObjectWrapper.serializers.osgAnimation.UpdateMatrixTransform = function(jsonObj, umt) {
    // check
    // 
    var check = function(o) {
        if (o.Name && o.StackedTransforms) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj, umt)) {
        return false;
    }

    for (var i = 0, l = jsonObj.StackedTransforms.length; i < l; i++) {
        var entry = jsonObj.StackedTransforms[i];
        var ste = osgDB.ObjectWrapper.readObject(entry);
        if (ste) {
            umt.getStackedTransforms().push(ste);
        }
    }
    return true;
};


osgDB.ObjectWrapper.serializers.osgAnimation.StackedTranslate = function(jsonObj, st) {
    // check
    // 
    var check = function(o) {
        if (o.Name) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj,st)) {
        return false;
    }

    if (jsonObj.Translate) {
        st.setTranslate(jsonObj.Translate);
    }
    return true;
};


osgDB.ObjectWrapper.serializers.osgAnimation.StackedQuaternion = function(jsonObj, st) {
    // check
    // 
    var check = function(o) {
        if (o.Name) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj,st)) {
        return false;
    }

    if (jsonObj.Quaternion) {
        st.setQuaternion(jsonObj.Quaternion);
    }
    return true;
};

osgDB.ObjectWrapper.serializers.osgAnimation.StackedRotateAxis = function(jsonObj, st) {
    // check
    // 
    var check = function(o) {
        if (o.Axis) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return false;
    }

    if (!osgDB.ObjectWrapper.serializers.osg.Object(jsonObj,st)) {
        return false;
    }

    if (jsonObj.Angle) {
        st.setAngle(jsonObj.Angle);
    }

    st.setAxis(jsonObj.Axis);

    return true;
};
