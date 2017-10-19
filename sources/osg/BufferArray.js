import notify from 'osg/notify';
import utils from 'osg/utils';
import Object from 'osg/Object';
import GLObject from 'osg/GLObject';
import Timer from 'osg/Timer';

var getAttributeType = function(array) {
    var type;

    if (array instanceof utils.Float32Array) type = 0x1406;

    if (array instanceof utils.Int16Array) type = 0x1402;
    if (array instanceof utils.Uint16Array) type = 0x1403;

    if (array instanceof utils.Int8Array) type = 0x1400;
    if (array instanceof utils.Uint8Array) type = 0x1401;
    if (array instanceof utils.Uint8ClampedArray) type = 0x1401;

    if (array instanceof utils.Int32Array) type = 0x1404; // webgl2 for vertexAttribPointer
    if (array instanceof utils.Uint32Array) type = 0x1405; // webgl2 for vertexAttribPointer

    return type;
};

/**
 * BufferArray manage vertex / normal / ... array used by webgl.
 * osgjs automatically converts array buffers to Float32Array and
 * element array buffers to Uint16Array if not said explicitly with
 * preserveArrayType variable in constructor.
 * @class BufferArray
 */

var BufferArray = function(target, elements, itemSize) {
    GLObject.call(this);
    // maybe could inherit from Object
    this._instanceID = Object.getInstanceID();

    this.dirty();

    this._itemSize = itemSize;
    this._target = typeof target === 'string' ? BufferArray[target] : target;

    // initialized by setElements
    this._type = undefined;
    this._normalize = false;

    if (elements) {
        // byteLength should be enough to detect typedArray
        if (elements.byteLength === undefined) {
            notify.warn('BufferArray with non typedArray elements is deprecated');
            if (this._target === BufferArray.ELEMENT_ARRAY_BUFFER) {
                elements = new utils.Uint16Array(elements);
            } else {
                elements = new utils.Float32Array(elements);
            }
        }
        this.setElements(elements);
    }

    this._usage = BufferArray.STATIC_DRAW;
};

BufferArray.ELEMENT_ARRAY_BUFFER = 0x8893;
BufferArray.ARRAY_BUFFER = 0x8892;
BufferArray.STATIC_DRAW = 0x88e4;
BufferArray.DYNAMIC_DRAW = 0x88e8;
BufferArray.STREAM_DRAW = 0x88e0;

// static cache of glBuffers flagged for deletion, which will actually
// be deleted in the correct GL context.
BufferArray._sDeletedGLBufferArrayCache = new window.Map();

// static method to delete Program
BufferArray.deleteGLBufferArray = function(gl, buffer) {
    if (!BufferArray._sDeletedGLBufferArrayCache.has(gl))
        BufferArray._sDeletedGLBufferArrayCache.set(gl, []);
    BufferArray._sDeletedGLBufferArrayCache.get(gl).push(buffer);
};

// static method to flush all the cached glPrograms which need to be deleted in the GL context specified
BufferArray.flushDeletedGLBufferArrays = function(gl, availableTime) {
    // if no time available don't try to flush objects.
    if (availableTime <= 0.0) return availableTime;
    if (!BufferArray._sDeletedGLBufferArrayCache.has(gl)) return availableTime;
    var elapsedTime = 0.0;
    var beginTime = Timer.instance().tick();
    var deleteList = BufferArray._sDeletedGLBufferArrayCache.get(gl);
    var numBuffers = deleteList.length;
    for (var i = numBuffers - 1; i >= 0 && elapsedTime < availableTime; i--) {
        gl.deleteBuffer(deleteList[i]);
        deleteList.splice(i, 1);
        elapsedTime = Timer.instance().deltaS(beginTime, Timer.instance().tick());
    }
    return availableTime - elapsedTime;
};

BufferArray.flushAllDeletedGLBufferArrays = function(gl) {
    if (!BufferArray._sDeletedGLBufferArrayCache.has(gl)) return;
    var deleteList = BufferArray._sDeletedGLBufferArrayCache.get(gl);
    var numBuffers = deleteList.length;
    for (var i = numBuffers - 1; i >= 0; i--) {
        gl.deleteBuffer(deleteList[i]);
        deleteList.splice(i, 1);
    }
};

BufferArray.onLostContext = function(gl) {
    if (!BufferArray._sDeletedGLBufferArrayCache.has(gl)) return;
    var deleteList = BufferArray._sDeletedGLBufferArrayCache.get(gl);
    deleteList.length = 0;
};

utils.createPrototypeObject(
    BufferArray,
    utils.objectInherit(GLObject.prototype, {
        setUsage: function(usage) {
            this._usage = usage;
        },
        getUsage: function() {
            return this._usage;
        },
        getInstanceID: function() {
            return this._instanceID;
        },
        setItemSize: function(size) {
            this._itemSize = size;
        },
        isValid: function() {
            if (this._buffer) return true;
            if (this._elements && this._elements.length) return true;
            return false;
        },

        invalidate: function() {
            this._buffer = undefined;
            this.dirty();
        },

        releaseGLObjects: function() {
            if (this._buffer !== undefined && this._buffer !== null && this._gl !== undefined) {
                BufferArray.deleteGLBufferArray(this._gl, this._buffer);
                GLObject.removeObject(this._gl, this);
            }
            this.invalidate();
        },

        setNormalize: function(normalize) {
            this._normalize = normalize;
        },

        getNormalize: function() {
            return this._normalize;
        },

        bind: function(gl) {
            if (!this._gl) this.setGraphicContext(gl);
            var target = this._target;
            var buffer = this._buffer;

            if (buffer) {
                gl.bindBuffer(target, buffer);
                return;
            }

            if (!buffer && this._elements.length > 0) {
                this._buffer = gl.createBuffer();
                this._numItems = this._elements.length / this._itemSize;
                gl.bindBuffer(target, this._buffer);
            }
        },
        getItemSize: function() {
            return this._itemSize;
        },
        dirty: function() {
            this._dirty = true;
        },
        isDirty: function() {
            return this._dirty;
        },
        compile: function(gl) {
            if (this._dirty) {
                utils.timeStamp('osgjs.metrics:bufferData');
                gl.bufferData(this._target, this._elements, this._usage);
                this._dirty = false;
            }
        },
        getElements: function() {
            return this._elements;
        },
        setElements: function(elements) {
            this._elements = elements;
            this._type = getAttributeType(elements);
            this._dirty = true;
        },
        getType: function() {
            return this._type;
        }
    }),
    'osg',
    'BufferArray'
);

export default BufferArray;
