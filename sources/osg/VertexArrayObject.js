import utils from 'osg/utils';
import Object from 'osg/Object';
import GLObject from 'osg/GLObject';
import Timer from 'osg/Timer';

/**
 * VertexArrayObject "Bundles" multipel vertex / normal / ... buffer bind
 * in one webgl call
 * @class VertexArrayObject
 */
var VertexArrayObject = function() {
    GLObject.call(this);
    // maybe could inherit from Object
    this._instanceID = Object.getInstanceID();
    this._vaoObject = undefined;
    this.dirty();
};

// static cache of glBuffers flagged for deletion, which will actually
// be deleted in the correct GL context.
VertexArrayObject._sDeletedGLVertexArrayObjectCache = new window.Map();

// static method to delete Program
VertexArrayObject.deleteGLVertexArrayObject = function(gl, buffer) {
    if (!VertexArrayObject._sDeletedGLVertexArrayObjectCache.has(gl))
        VertexArrayObject._sDeletedGLVertexArrayObjectCache.set(gl, []);
    VertexArrayObject._sDeletedGLVertexArrayObjectCache.get(gl).push(buffer);
};

// static method to flush all the cached glPrograms which need to be deleted in the GL context specified
VertexArrayObject.flushDeletedGLVertexArrayObjects = function(gl, availableTime) {
    // if no time available don't try to flush objects.
    if (availableTime <= 0.0) return availableTime;
    if (!VertexArrayObject._sDeletedGLVertexArrayObjectCache.has(gl)) return availableTime;
    var elapsedTime = 0.0;
    var beginTime = Timer.instance().tick();
    var deleteList = VertexArrayObject._sDeletedGLVertexArrayObjectCache.get(gl);
    var numBuffers = deleteList.length;
    for (var i = numBuffers - 1; i >= 0 && elapsedTime < availableTime; i--) {
        gl.deleteVertexArray(deleteList[i]);
        deleteList.splice(i, 1);
        elapsedTime = Timer.instance().deltaS(beginTime, Timer.instance().tick());
    }
    return availableTime - elapsedTime;
};

VertexArrayObject.flushAllDeletedGLVertexArrayObjects = function(gl) {
    if (!VertexArrayObject._sDeletedGLVertexArrayObjectCache.has(gl)) return;
    var deleteList = VertexArrayObject._sDeletedGLVertexArrayObjectCache.get(gl);
    var numBuffers = deleteList.length;
    for (var i = numBuffers - 1; i >= 0; i--) {
        gl.deleteVertexArray(deleteList[i]);
        deleteList.splice(i, 1);
    }
};

VertexArrayObject.onLostContext = function(gl) {
    if (!VertexArrayObject._sDeletedGLVertexArrayObjectCache.has(gl)) return;
    var deleteList = VertexArrayObject._sDeletedGLVertexArrayObjectCache.get(gl);
    deleteList.length = 0;
};

utils.createPrototypeObject(
    VertexArrayObject,
    utils.objectInherit(GLObject.prototype, {
        getInstanceID: function() {
            return this._instanceID;
        },

        invalidate: function() {
            this._vaoObject = undefined;
            this.dirty();
        },

        releaseGLObjects: function() {
            if (this._vaoObject !== undefined && this._gl !== undefined) {
                VertexArrayObject.deleteGLVertexArrayObject(this._gl, this._vaoObject);
                GLObject.removeObject(this._gl, this);
            }
            this.invalidate();
        },

        create: function(gl) {
            this._vaoObject = gl.createVertexArray();
            this._dirty = false;
        },

        bind: function(gl) {
            if (!this._gl) {
                this.setGraphicContext(gl);
            }

            var vao = this._vaoObject;
            if (!vao) return;

            gl.bindVertexArray(this._vaoObject);
        },

        dirty: function() {
            this._dirty = true;
        },

        isDirty: function() {
            return this._dirty;
        }
    }),
    'osg',
    'VertexArrayObject'
);

export default VertexArrayObject;
