import utils from 'osg/utils';
import notify from 'osg/notify';
import GLObject from 'osg/GLObject';
import StateAttribute from 'osg/StateAttribute';
import ShaderProcessor from 'osgShader/ShaderProcessor';
import Timer from 'osg/Timer';

// singleton
var sp = new ShaderProcessor();
var errorCallback;

var uniformRegexp = /uniform\s+\w+\s+(\w+)((\s)?\[(.*?)\])?/g;
var attributesRegexp = /(in|attribute)\s+\w+\s+(\w+)\s*;/g;

var getAttributeList = function(shaderText) {
    var attributeMap = {};
    var r, attr;
    while ((r = attributesRegexp.exec(shaderText)) !== null) {
        attr = r[2];
        attributeMap[attr] = true;
    }

    return attributeMap;
};

var getUniformList = function(shaderText) {
    var uniformMap = {};
    var r;
    while ((r = uniformRegexp.exec(shaderText)) !== null) {
        var uniform = r[1];
        uniformMap[uniform] = true;
    }
    return uniformMap;
};

/**
 * Program encapsulate an vertex and fragment shader
 * @class Program
 */
var Program = function(vShader, fShader) {
    GLObject.call(this);
    StateAttribute.call(this);
    this._program = null;

    // used to know if it's a default program
    // a default program does nothing but avoid to do some
    // useless logic
    // if we vertex or fragment shader are set it's not a default
    // program anymore
    this._nullProgram = true;

    this._vertex = undefined;
    this._fragment = undefined;

    this._uniformsCache = undefined;
    this._attributesCache = undefined;
    // state caches
    this._activeUniforms = undefined;
    this._foreignUniforms = undefined;
    this._trackAttributes = undefined;

    if (vShader) this.setVertexShader(vShader);
    if (fShader) this.setFragmentShader(fShader);

    this._dirty = true;
};

// static cache of glPrograms flagged for deletion, which will actually
// be deleted in the correct GL context.
Program._sDeletedGLProgramCache = new window.Map();

// static method to delete Program
Program.deleteGLProgram = function(gl, program) {
    if (!Program._sDeletedGLProgramCache.has(gl)) Program._sDeletedGLProgramCache.set(gl, []);

    Program._sDeletedGLProgramCache.get(gl).push(program);
};

// static method to flush all the cached glPrograms which need to be deleted in the GL context specified
Program.flushDeletedGLPrograms = function(gl, availableTime) {
    // if no time available don't try to flush objects.
    if (availableTime <= 0.0) return availableTime;

    if (!Program._sDeletedGLProgramCache.has(gl)) return availableTime;

    var elapsedTime = 0.0;
    var beginTime = Timer.instance().tick();
    var deleteList = Program._sDeletedGLProgramCache.get(gl);
    var numPrograms = deleteList.length;

    for (var i = numPrograms - 1; i >= 0 && elapsedTime < availableTime; i--) {
        gl.deleteProgram(deleteList[i]);
        deleteList.splice(i, 1);
        elapsedTime = Timer.instance().deltaS(beginTime, Timer.instance().tick());
    }

    return availableTime - elapsedTime;
};

Program.flushAllDeletedGLPrograms = function(gl) {
    if (!Program._sDeletedGLProgramCache.has(gl)) return;

    var deleteList = Program._sDeletedGLProgramCache.get(gl);
    var numPrograms = deleteList.length;

    for (var i = numPrograms - 1; i >= 0; i--) {
        gl.deleteProgram(deleteList[i]);
        deleteList.splice(i, 1);
    }
};

Program.onLostContext = function(gl) {
    if (!Program._sDeletedGLProgramCache.has(gl)) return;
    var deleteList = Program._sDeletedGLProgramCache.get(gl);
    deleteList.length = 0;
    return;
};

/** @lends Program.prototype */
utils.createPrototypeStateAttribute(
    Program,
    utils.objectInherit(
        GLObject.prototype,
        utils.objectInherit(StateAttribute.prototype, {
            attributeType: 'Program',

            cloneType: function() {
                return new Program();
            },

            setVertexShader: function(vs) {
                this._vertex = vs;
                this._nullProgram = false;
                vs.setText(sp.processShader(vs.getText()));
            },

            setFragmentShader: function(fs) {
                this._fragment = fs;
                this._nullProgram = false;
                fs.setText(sp.processShader(fs.getText()));
            },

            getVertexShader: function() {
                return this._vertex;
            },
            getFragmentShader: function() {
                return this._fragment;
            },

            getProgram: function() {
                return this._program;
            },

            setActiveUniforms: function(activeUniforms) {
                this._activeUniforms = activeUniforms;
            },

            getActiveUniforms: function() {
                return this._activeUniforms;
            },

            setForeignUniforms: function(foreignUniforms) {
                this._foreignUniforms = foreignUniforms;
            },

            getForeignUniforms: function() {
                return this._foreignUniforms;
            },

            setUniformsCache: function(uniformsCache) {
                this._uniformsCache = uniformsCache;
            },

            getUniformsCache: function() {
                return this._uniformsCache;
            },

            setAttributesCache: function(attributesCache) {
                this._attributesCache = attributesCache;
            },

            getAttributesCache: function() {
                return this._attributesCache;
            },

            setTrackAttributes: function(trackAttributes) {
                this._trackAttributes = trackAttributes;
            },

            getTrackAttributes: function() {
                return this._trackAttributes;
            },

            releaseGLObjects: function() {
                // Call to releaseGLOBjects on shaders
                if (this._vertex !== undefined) this._vertex.releaseGLObjects();
                if (this._fragment !== undefined) this._fragment.releaseGLObjects();
                if (this._program === null) return;
                if (this._gl !== undefined) {
                    Program.deleteGLProgram(this._gl, this._program);
                    GLObject.removeObject(this._gl, this);
                }
                this.invalidate();
            },

            dirty: function() {
                this._program = undefined;
            },

            invalidate: function() {
                this._cacheUniformId = undefined;

                this._uniformsCache = undefined;
                this._attributesCache = undefined;
                this._foreignUniforms = undefined;
                this._trackAttributes = undefined;

                this._program = undefined;
            },

            _rebuildProgramFromSpector: function(
                vertexShaderText,
                fragmentShaderText,
                onCompiled,
                onError
            ) {
                this._dirty = true;
                this._vertex.invalidate();
                this._fragment.invalidate();
                this.invalidate();
                this._vertex.setText(vertexShaderText);
                this._fragment.setText(fragmentShaderText);
                this._spectorOnCompiled = onCompiled;
                this._spectorOnError = onError;
            },

            _onErrorToSpector: function(errLink) {
                if (!this._spectorOnError) return false;
                this._spectorOnError(errLink);
                return true;
            },

            _onCompilationToSpector: function() {
                if (!this._spectorOnCompiled) return;
                this._spectorOnCompiled(this._program);
            },

            _bindProgramToSpector: function() {
                if (!window || !window.spector || this._program.__SPECTOR_rebuildProgram) return;
                this._program.__SPECTOR_rebuildProgram = this._rebuildProgramFromSpector.bind(this);
            },

            _logDebugShaders: function(gl, errLink) {
                if (errLink !== 'Failed to create D3D shaders.\n') return;
                // rawgl trick is for webgl inspector
                var debugShader = gl.rawgl !== undefined ? gl.rawgl : gl;
                if (debugShader === undefined || debugShader.getExtension !== undefined) return;
                debugShader = debugShader.getExtension('WEBGL_debug_shaders');
                if (!debugShader) return;
                notify.error(debugShader.getTranslatedShaderSource(this._vertex.shader));
                notify.error(debugShader.getTranslatedShaderSource(this._fragment.shader));
            },

            _activateFailSafe: function(gl) {
                var program = gl.createProgram();
                this._vertex.failSafe(gl, this._vertex.getText());
                this._fragment.failSafe(gl, this._fragment.getText());
                this._glAttachAndCompile(gl, program, this._vertex, this._fragment);
                notify.warn('FailSafe shader Activated ');
                this._program = program;
            },

            _glAttachAndCompile: function(gl, programGL, vertexShader, fragmentShader) {
                gl.attachShader(programGL, vertexShader.shader);
                gl.attachShader(programGL, fragmentShader.shader);
                utils.timeStamp('osgjs.metrics:linkShader');
                gl.linkProgram(programGL);
            },

            compile: function() {
                var gl = this._gl;

                var shaderName = this._fragment
                    .getText()
                    .match(/#define[\s]+SHADER_NAME[\s]+([\S]+)(\n|$)/);

                var compileClean = true;

                this._shaderName = shaderName ? shaderName[1] : '';

                if (!this._vertex.shader) {
                    compileClean = this._vertex.compile(gl, errorCallback);
                }

                if (!this._fragment.shader) {
                    compileClean = this._fragment.compile(gl, errorCallback);
                }

                this._attributeMap = getAttributeList(this._vertex.getText());

                if (!compileClean) {
                    // Any error, Any
                    // Pink must die.
                    return false;
                }

                this._program = gl.createProgram();

                if (this._attributeMap.Vertex) {
                    // force Vertex to be on 0
                    gl.bindAttribLocation(this._program, 0, 'Vertex');
                }
                this._glAttachAndCompile(gl, this._program, this._vertex, this._fragment);

                this._uniformMap = getUniformList(
                    this._fragment.getText() + '\n' + this._vertex.getText()
                );

                return true;
            },

            getCompilationResult: function(compileClean, gl) {
                if (compileClean) {
                    if (
                        !gl.getProgramParameter(this._program, gl.LINK_STATUS) &&
                        !gl.isContextLost()
                    ) {
                        var errLink = gl.getProgramInfoLog(this._program);

                        notify.errorFold(
                            errLink,
                            "can't link program\nvertex shader:\n" +
                                this._vertex.text +
                                '\n fragment shader:\n' +
                                this._fragment.text
                        );

                        this._logDebugShaders(gl, errLink);
                        if (errorCallback) {
                            errorCallback(this._vertex.text, this._fragment.text, errLink);
                        }
                        compileClean = false;
                        if (this._onErrorToSpector(errLink)) return;
                    } else {
                        this._onCompilationToSpector(this._program);
                    }
                }

                this._bindProgramToSpector();

                this._uniformsCache = {};
                this._attributesCache = {};

                if (!compileClean) {
                    // Any error, Any
                    // Pink must die.
                    this._activateFailSafe(gl);
                } else {
                    this.cacheAttributeList(gl, window.Object.keys(this._attributeMap));
                    this.cacheUniformList(gl, window.Object.keys(this._uniformMap));
                }
                return compileClean;
            },

            apply: function(state) {
                if (this._nullProgram) return;

                if (!this._gl) {
                    this.setGraphicContext(state.getGraphicContext());
                }

                if (this._program && !this._dirty) {
                    state.applyProgram(this._program);
                    return;
                }

                this._compileClean = this.compile();
                this.getCompilationResult(this._compileClean, this._gl);
                state.applyProgram(this._program);
                this._dirty = false;
            },

            cacheUniformList: function(gl, uniformList) {
                var map = this._uniformsCache;
                for (var i = 0, l = uniformList.length; i < l; i++) {
                    var uniform = uniformList[i];
                    var location = gl.getUniformLocation(this._program, uniform);
                    if (location !== undefined && location !== null) {
                        if (map[uniform] === undefined) {
                            map[uniform] = location;
                        }
                    }
                }
            },

            cacheAttributeList: function(gl, attributeList) {
                var map = this._attributesCache;
                for (var i = 0, l = attributeList.length; i < l; i++) {
                    var attr = attributeList[i];
                    var location = gl.getAttribLocation(this._program, attr);

                    if (location !== -1 && location !== undefined) {
                        if (map[attr] === undefined) {
                            map[attr] = location;
                        }
                    }
                }
            }
        })
    ),
    'osg',
    'Program'
);

Program.registerErrorCallback = function(callback) {
    errorCallback = callback;
};

export default Program;
