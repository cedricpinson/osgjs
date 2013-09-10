/** -*- compile-command: "jslint-cli osg.js" -*- */
var osg = {};

osg.version = '0.8.0';
osg.copyright = 'Cedric Pinson - cedric.pinson@plopbyte.com';

osg.DEBUG = 0;
osg.INFO = 1;
osg.NOTICE = 2;
osg.WARN = 3;
osg.ERROR = 4;

osg.setNotifyLevel = function (level) {

    var log = function (str) {
        if (window.console !== undefined) {
            window.console.log(str, getStackTrace());
        }
    };

    var info = function(str) {
        if (window.console !== undefined) {
            window.console.info(str, getStackTrace());
        }
    };

    var warn = function (str) {
        if (window.console !== undefined) {
            window.console.warn(str, getStackTrace());
        }
    };

    var error = function (str) {
        if (window.console !== undefined) {
            window.console.error(str, getStackTrace());
        }
    };

    var debug = function (str) {
        if (window.console !== undefined) {
            window.console.debug(str, getStackTrace());
        }
    };

    var dummy = function () {};

    osg.debug = dummy;
    osg.info = dummy;
    osg.log = dummy;
    osg.warn = dummy;
    osg.error = dummy;

    if (level <= osg.DEBUG) {
        osg.debug = debug;
    }
    if (level <= osg.INFO) {
        osg.info = info;
    }
    if (level <= osg.NOTICE) {
        osg.log = log;
    }
    if (level <= osg.WARN) {
        osg.warn = warn;
    }
    if (level <= osg.ERROR) {
        osg.error = error;
    }
};

osg.setNotifyLevel(osg.NOTICE);

osg.reportWebGLError = false;
osg.memoryPools = {};

osg.init = function () {
    osg.memoryPools.stateGraph = new OsgObjectMemoryPool(osg.StateGraph).grow(50);
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

osg.objectInehrit = osg.objectInherit = function (base, extras) {
    function F(){}
    F.prototype = base;
    var obj = new F();

    // let augment object with multiple arguement
    for (var i = 1; i < arguments.length; i++) {
        osg.objectMix(obj, arguments[i], false);
    }
    return obj;
};
osg.objectMix = function (obj, properties, test){
    for (var key in properties) {
        if(!(test && obj[key])) { obj[key] = properties[key]; }
    }
    return obj;
};

osg.objectLibraryClass = function(object, libName, className) {
    object.className = function() { return className; };
    object.libraryName = function() { return libName; };
    var libraryClassName = libName+"::"+className;
    object.libraryClassName = function() { return libraryClassName; };
    return object;
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

osg.Float32Array = typeof Float32Array !== 'undefined' ? Float32Array : null;
osg.Int32Array = typeof Int32Array !== 'undefined' ? Int32Array : null;
osg.Uint16Array = typeof Uint16Array !== 'undefined' ? Uint16Array : null;
