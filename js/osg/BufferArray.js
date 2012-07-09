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

    if (elements !== undefined) {
        if (this._type === osg.BufferArray.ELEMENT_ARRAY_BUFFER) {
            this._elements = new osg.Uint16Array(elements);
        } else {
            this._elements = new osg.Float32Array(elements);
        }
    }
};

osg.BufferArray.ELEMENT_ARRAY_BUFFER = 0x8893;
osg.BufferArray.ARRAY_BUFFER = 0x8892;


/** @lends osg.BufferArray.prototype */
osg.BufferArray.prototype = {
    setItemSize: function(size) { this._itemSize = size; },
    isValid: function() {
        if (this._buffer !== undefined || 
            this._elements !== undefined) {
            return true;
        }
        return false;
    },

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
    getElements: function() { return this._elements;},
    setElements: function(elements) { 
        this._elements = elements;
        this._dirty = true;
    }
};

osg.BufferArray.create = function(type, elements, itemSize) {
    osg.log("osg.BufferArray.create is deprecated, use new osg.BufferArray with same arguments instead");
    return new osg.BufferArray(type, elements, itemSize);
};
