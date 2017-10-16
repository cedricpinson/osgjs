import notify from 'osg/notify';

// Base class for GLResources: Textures, Buffers, Programs, Shaders, FrameBuffers and RenderBuffers
// It holds a reference to the graphic context that is needed for resource deletion
var GLObject = function() {
    this._gl = undefined;
    this._onLostContextCallback = undefined;
};

GLObject.prototype = {
    setGraphicContext: function(gl) {
        this._gl = gl;
        GLObject.addObject(this._gl, this);
    },
    getGraphicContext: function() {
        return this._gl;
    },
    setLostContextCallback: function(cb) {
        this._onLostContextCallback = cb;
    },
    onLostContext: function() {
        if (this.invalidate && typeof this.invalidate === 'function') {
            this.invalidate();
        }
        /* develblock:start */
        if (!this.invalidate || typeof this.invalidate !== 'function') {
            notify.error('GLObject needs Dirty mechanism for webgl restore');
        }
        /* develblock:end */
        if (this._onLostContextCallback) this._onLostContextCallback();
    }
};

// handle webgl restore by indexing all GLObject
GLObject._sResourcesArrayCache = new window.Map();

GLObject.addObject = function(gl, glObject) {
    if (!GLObject._sResourcesArrayCache.has(gl)) GLObject._sResourcesArrayCache.set(gl, []);
    var resourcesArray = GLObject._sResourcesArrayCache.get(gl);

    if (resourcesArray.indexOf(glObject) !== -1) return;
    resourcesArray.push(glObject);
};

GLObject.removeObject = function(gl, glObject) {
    if (!GLObject._sResourcesArrayCache.has(gl)) return;

    var resourcesArray = GLObject._sResourcesArrayCache.get(gl);
    var i = resourcesArray.indexOf(glObject);
    if (i === -1) return;
    resourcesArray.splice(i, 1);
};

GLObject.onLostContext = function(gl) {
    if (!GLObject._sResourcesArrayCache.has(gl)) return;

    var resourcesArray = GLObject._sResourcesArrayCache.get(gl);
    for (var i = 0, l = resourcesArray.length; i < l; i++) {
        resourcesArray[i].onLostContext();
    }
};

export default GLObject;
