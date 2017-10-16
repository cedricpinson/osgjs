import P from 'bluebird';
import Timer from 'osg/Timer';
import notify from 'osg/notify';

var utils = {};

utils.extend = function() {
    // Save a reference to some core methods
    var toString = window.Object.prototype.toString;
    var hasOwnPropertyFunc = window.Object.prototype.hasOwnProperty;

    var isFunction = function(obj) {
        return toString.call(obj) === '[object Function]';
    };
    var isArray = utils.isArray;
    var isPlainObject = function(obj) {
        // Must be an Object.
        // Because of IE, we also have to check the presence of the constructor property.
        // Make sure that DOM nodes and window objects don't pass through, as well
        if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
            return false;
        }

        // Not own constructor property must be Object
        if (
            obj.constructor &&
            !hasOwnPropertyFunc.call(obj, 'constructor') &&
            !hasOwnPropertyFunc.call(obj.constructor.prototype, 'isPrototypeOf')
        ) {
            return false;
        }

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var key;
        for (key in obj) {
        }

        return key === undefined || hasOwnPropertyFunc.call(obj, key);
    };

    // copy reference to target object
    var target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false,
        options,
        name,
        src,
        copy;

    // Handle a deep copy situation
    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== 'object' && !isFunction(target)) {
        target = {};
    }

    // extend jQuery itself if only one argument is passed
    if (length === i) {
        target = this;
        --i;
    }

    for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) !== null) {
            // Extend the base object
            for (name in options) {
                src = target[name];
                copy = options[name];

                // Prevent never-ending loop
                if (target === copy) {
                    continue;
                }

                // Recurse if we're merging object literal values or arrays
                if (deep && copy && (isPlainObject(copy) || isArray(copy))) {
                    var clone =
                        src && (isPlainObject(src) || isArray(src)) ? src : isArray(copy) ? [] : {};

                    // Never move original objects, clone them
                    target[name] = utils.extend(deep, clone, copy);

                    // Don't bring in undefined values
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }

    // Return the modified object
    return target;
};

utils.objectInherit = function(base /*, extras*/) {
    function F() {}
    F.prototype = base;
    var obj = new F();

    // let augment object with multiple arguement
    for (var i = 1; i < arguments.length; i++) {
        utils.objectMix(obj, arguments[i], false);
    }
    return obj;
};

utils.objectMix = function(obj, properties, test) {
    for (var key in properties) {
        if (!(test && obj[key])) {
            obj[key] = properties[key];
        }
    }
    return obj;
};

utils.objectType = {};
utils.objectType.type = 0;

utils.arrayDense = function(index, array, createDefaultType) {
    var length = array.length;
    if (index >= length) {
        for (var i = length; i <= index; i++) {
            array.push(createDefaultType ? createDefaultType() : null);
        }
    }
};

utils.objectLibraryClass = function(object, libName, className) {
    object.className = function() {
        return className;
    };
    object.libraryName = function() {
        return libName;
    };
    var libraryClassName = libName + '::' + className;
    object.libraryClassName = function() {
        return libraryClassName;
    };

    return object;
};

utils.setTypeID = function(classObject) {
    var className = classObject.prototype.libraryClassName();
    var typeID = utils.generateId(utils.objectType, className);
    var getTypeID = function() {
        return typeID;
    };
    classObject.typeID = classObject.prototype.typeID = typeID;
    classObject.getTypeID = classObject.prototype.getTypeID = getTypeID;
};

utils.createPrototypeObject = function(Constructor, prototype, libraryName, className) {
    // we need to create an instance of {} if prototype is already used in an object
    // else we will override typeID ClassName...
    if (prototype.hasOwnProperty('getTypeID')) {
        prototype = utils.objectInherit(prototype, {});
    }

    Constructor.prototype = prototype;
    prototype.constructor = Constructor;

    // if the user dont provide library name or class name this class will not have typeID
    // and will inherit the typeID from it's parent class if it has one
    // so all call to getTypeID will be affected, it's mostly not a probablem for internal class
    // but for Node and StateAttribute you have to be aware
    if (!libraryName || !className) return;

    utils.objectLibraryClass(prototype, libraryName, className);
    utils.setTypeID(Constructor);
};

// ============== Node ID =================================
utils.generateId = function(typeMap, className) {
    if (typeMap[className] !== undefined) {
        notify.error(className + ' is already defined, change class name or library name');
        return -1;
    }

    var index = typeMap.type;
    typeMap[index] = className;
    typeMap[className] = index;
    typeMap.type += 1;
    return index;
};

utils.objectNodeType = {};
utils.objectNodeType.type = 0;

utils.setNodeTypeID = function(classObject) {
    var className = classObject.prototype.libraryClassName();
    var typeID = utils.generateId(utils.objectNodeType, className);
    var getTypeID = function() {
        return typeID;
    };
    classObject.nodeTypeID = classObject.prototype.nodeTypeID = typeID;
    classObject.getNodeTypeID = classObject.prototype.getNodeTypeID = getTypeID;
};

utils.createPrototypeNode = function(Constructor, prototype, libraryName, className) {
    var cullVisitorHelper = require('osg/cullVisitorHelper').default;
    var parentNodeTypeID = prototype.nodeTypeID;
    utils.createPrototypeObject(Constructor, prototype, libraryName, className);

    // check the comment in function in utils.createPrototypeObject
    if (!libraryName || !className) return;

    utils.setNodeTypeID(Constructor);
    var nodeTypeId = Constructor.nodeTypeID;
    utils.arrayDense(nodeTypeId, cullVisitorHelper.applyFunctionArray);
    cullVisitorHelper.registerApplyFunction(
        nodeTypeId,
        cullVisitorHelper.getApplyFunction(parentNodeTypeID)
    );
};

// ===============================================

var typeMemberIndex = 0;
var textureTypeMemberIndex = 0;
var stateAttributeTypeMember = {};
var textureStateAttributeTypeMember = {};
var attributeTypeIndex = 0;
var stateAttributeType = {};

utils.getStateAttributeTypeNameToTypeId = function() {
    return stateAttributeType;
};

utils.createPrototypeStateAttribute = function(Constructor, prototype, libraryName, className) {
    utils.createPrototypeObject(Constructor, prototype, libraryName, className);
    var attributeId = utils.getOrCreateStateAttributeTypeId(Constructor);
    Constructor.prototype.attributeTypeId = attributeId;
};

utils.getMaxStateAttributeTypeID = function() {
    return attributeTypeIndex;
};

utils.getOrCreateStateAttributeTypeId = function(Constructor) {
    var attributeTypeName = Constructor.prototype.getType();

    if (stateAttributeType[attributeTypeName]) return stateAttributeType[attributeTypeName];

    var typeId = attributeTypeIndex++;
    stateAttributeType[attributeTypeName] = typeId;
    return typeId;
};

utils.getOrCreateStateAttributeTypeMemberIndex = function(attribute) {
    if (attribute._attributeTypeIndex !== undefined) return attribute._attributeTypeIndex;
    var typeMember = attribute.getTypeMember();
    attribute._attributeTypeIndex = utils.getOrCreateStateAttributeTypeMemberIndexFromName(
        typeMember
    );
    return attribute._attributeTypeIndex;
};

utils.getOrCreateStateAttributeTypeMemberIndexFromName = function(typeMemberName) {
    var type = stateAttributeTypeMember[typeMemberName];
    if (type !== undefined) return type;

    type = typeMemberIndex++;
    stateAttributeTypeMember[typeMemberName] = type;
    return type;
};

utils.getOrCreateTextureStateAttributeTypeMemberIndex = function(attribute) {
    if (attribute._attributeTypeIndex !== undefined) return attribute._attributeTypeIndex;
    var typeMember = attribute.getTypeMember();
    attribute._attributeTypeIndex = utils.getOrCreateTextureStateAttributeTypeMemberIndexFromName(
        typeMember
    );
    return attribute._attributeTypeIndex;
};

utils.getOrCreateTextureStateAttributeTypeMemberIndexFromName = function(typeMemberName) {
    var type = textureStateAttributeTypeMember[typeMemberName];
    if (type !== undefined) return type;

    type = textureTypeMemberIndex++;
    textureStateAttributeTypeMember[typeMemberName] = type;
    return type;
};

utils.getIdFromTypeMember = function(typeMember) {
    return stateAttributeTypeMember[typeMember];
};

utils.getTextureIdFromTypeMember = function(typeMember) {
    return textureStateAttributeTypeMember[typeMember];
};

utils.Int8Array = window.Int8Array;
utils.Uint8Array = window.Uint8Array;
utils.Uint8ClampedArray = window.Uint8ClampedArray;
utils.Int16Array = window.Int16Array;
utils.Uint16Array = window.Uint16Array;
utils.Int32Array = window.Int32Array;
utils.Uint32Array = window.Uint32Array;
utils.Float32Array = window.Float32Array;
utils.Float64Array = window.Float64Array;

var times = {};
var registeredTimers = {};
// we bind the function to notify.console once and for all to avoid costly apply function

utils.logTime = (notify.console.time ||
    function(name) {
        times[name] = Timer.instance().tick();
    }
).bind(notify.console);

utils.logTimeEnd = (notify.console.timeEnd ||
    function(name) {
        if (times[name] === undefined) return;

        var duration = Timer.instance().deltaM(times[name], Timer.instance().tick());

        notify.log(name + ': ' + duration + 'ms');
        times[name] = undefined;
    }
).bind(notify.console);

utils.time = function(name, logLevel) {
    var level = logLevel;
    if (level === undefined) level = notify.NOTICE;
    if (level > notify.getNotifyLevel()) return;
    registeredTimers[name] = 1;
    utils.logTime(name);
};

utils.timeEnd = function(name) {
    if (registeredTimers[name] === undefined) return;
    utils.logTimeEnd(name);
};

utils.timeStamp = (notify.console.timeStamp || notify.console.markTimeline || function() {}).bind(
    notify.console
);
utils.profile = (notify.console.profile || function() {}).bind(notify.console);
utils.profileEnd = (notify.console.profileEnd || function() {}).bind(notify.console);

utils.arrayUniq = function(a) {
    var len = a.length;
    var seen = {};
    var out = [];
    var j = 0;
    for (var i = 0; i < len; i++) {
        var item = a[i];
        if (seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
};

// mostly used as an osgDB helper to issue a warning and reject a promise
utils.rejectObject = function(msg, jsonObj) {
    if (jsonObj) msg = 'Invalid json ' + msg + ' ' + Object.keys(jsonObj);
    notify.warn(msg); // useful for line debugging
    return P.reject(msg); // reject with a message to avoid "undefined" rejection
};

export default utils;
