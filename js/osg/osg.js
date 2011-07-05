/** -*- compile-command: "jslint-cli osg.js" -*- */
var osg = {};

osg.version = '0.0.5';
osg.copyright = 'Cedric Pinson - cedric.pinson@plopbyte.com';
osg.instance = 0;
osg.version = 0;
osg.log = function(str) {
    if (window.console !== undefined) {
        window.console.log(str);
    }
};
osg.reportErrorGL = false;

osg.init = function() {
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

// from jquery
osg.extend = function() {
    // Save a reference to some core methods
    var toString = Object.prototype.toString,
    hasOwnProperty = Object.prototype.hasOwnProperty;

    var isFunction = function(obj) {
        return toString.call(obj) === "[object Function]";
    };
    var isArray = function( obj ) {
	return toString.call(obj) === "[object Array]";
    };
    var isPlainObject = function( obj ) {
	// Must be an Object.
	// Because of IE, we also have to check the presence of the constructor property.
	// Make sure that DOM nodes and window objects don't pass through, as well
	if ( !obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval ) {
	    return false;
	}
	
	// Not own constructor property must be Object
	if ( obj.constructor && 
             !hasOwnProperty.call(obj, "constructor") && 
             !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf") ) {
	    return false;
	}
	
	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	
	var key;
	for ( key in obj ) {}
	
	return key === undefined || hasOwnProperty.call( obj, key );
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
    if ( typeof target !== "object" && !isFunction(target) ) {
	target = {};
    }

    // extend jQuery itself if only one argument is passed
    if ( length === i ) {
	target = this;
	--i;
    }

    for ( ; i < length; i++ ) {
	// Only deal with non-null/undefined values
	if ( (options = arguments[ i ]) != null ) {
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

osg.objectType = {};
osg.objectType.type = 0;
osg.objectType.generate = function(arg) {
    var t = osg.objectType.type;
    osg.objectType[t] = arg;
    osg.objectType[arg] = t;
    osg.objectType.type += 1;
    return t;
};

osg.Float32Array = Float32Array;
osg.Int32Array = Int32Array;
osg.Uint16Array = Uint16Array;

