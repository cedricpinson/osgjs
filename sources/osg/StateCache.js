import Depth from 'osg/Depth';
import BlendFunc from 'osg/BlendFunc';
import CullFace from 'osg/CullFace';

// To avoid to apply duplicate states we cache them and apply them only
// when there is a draw commands it means when calling state.drawGeometry
// called from Geometry.drawImplementation or state.clear

// Here what it does:
// state.applyCullFaceAttribute(cullFaceDisableAttribute);
// state.applyCullFaceAttribute(cullFaceEnableAttribute);
// state.applyCullFaceAttribute(cullFaceDisableAttribute);
// state.applyCullFaceAttribute(cullFaceEnableAttribute);
// state.drawGeometry()

//     in this case only the cullFaceEnableAttribute will be applied not the previous one

// Internal implementation use 2 buffers:
//     - buffer, it contains the required field that will be applied when executing a draw command
//     - state, that contains the last state appied to webgl, it's used to compare if a
//              change happend from the incoming attribute

var createStateBlendFunc = function() {
    return {
        buffer: {
            separate: false,
            enable: false,
            sourceFactor: BlendFunc.ONE,
            destinationFactor: BlendFunc.ZERO,
            sourceFactorAlpha: BlendFunc.ONE,
            destinationFactorAlpha: BlendFunc.ZERO
        },
        state: {
            separate: undefined,
            enable: false,
            sourceFactor: undefined,
            destinationFactor: undefined,
            sourceFactorAlpha: undefined,
            destinationFactorAlpha: undefined
        },
        changed: true
    };
};

var createStateDepth = function() {
    return {
        buffer: {
            func: Depth.LESS,
            enable: false,
            near: 0.0,
            far: 1.0
        },
        state: {
            func: undefined,
            enable: false,
            near: undefined,
            far: undefined
        },
        changed: true
    };
};

var createStateCullFace = function() {
    return {
        buffer: {
            enable: false,
            mode: CullFace.BACK
        },
        state: {
            enable: false,
            mode: undefined
        },
        changed: true
    };
};

var createStateScissor = function() {
    return {
        buffer: {
            enable: false,
            x: 0,
            y: 0,
            width: 640,
            height: 480
        },
        state: {
            enable: false,
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined
        },
        changed: true
    };
};

var createStateColorMask = function() {
    return {
        buffer: {
            red: true,
            green: true,
            blue: true,
            alpha: true
        },
        state: {
            red: undefined,
            green: undefined,
            blue: undefined,
            alpha: undefined
        },
        changed: true
    };
};

var createStateViewport = function() {
    return {
        buffer: {
            x: 0,
            y: 0,
            width: 640,
            height: 480
        },
        state: {
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined
        },
        changed: true
    };
};

var createStateDepthMask = function() {
    return {
        state: { value: true },
        buffer: { value: undefined },
        changed: true
    };
};

var createStateClearDepth = function() {
    return {
        buffer: { value: 1.0 },
        state: { value: undefined },
        changed: true
    };
};

var createStateClearColor = function() {
    return {
        buffer: {
            red: 0.0,
            green: 0.0,
            blue: 0.0,
            alpha: 0.0
        },
        state: {
            red: undefined,
            green: undefined,
            blue: undefined,
            alpha: undefined
        },
        changed: true
    };
};

var StateCache = function() {
    this._stateClearColor = createStateClearColor();
    this._stateClearDepth = createStateClearDepth();
    this._stateDepthMask = createStateDepthMask();
    this._stateViewport = createStateViewport();
    this._stateColorMask = createStateColorMask();
    this._stateScissor = createStateScissor();
    this._stateDepth = createStateDepth();
    this._stateCullFace = createStateCullFace();
    this._stateBlendFunc = createStateBlendFunc();
};

StateCache.prototype = {
    clearColor: function(array) {
        var data = this._stateClearColor;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        buffer.red = array[0];
        buffer.green = array[1];
        buffer.blue = array[2];
        buffer.alpha = array[3];

        if (
            state.red !== array[0] ||
            state.green !== array[1] ||
            state.blue !== array[2] ||
            state.alpha !== array[3]
        ) {
            data.changed = true;
        }
    },

    applyClearColor: function(gl) {
        var data = this._stateClearColor;
        var state = data.state;
        var buffer = data.buffer;
        data.changed = false;
        state.red = buffer.red;
        state.green = buffer.green;
        state.blue = buffer.blue;
        state.alpha = buffer.alpha;
        gl.clearColor(state.red, state.green, state.blue, state.alpha);
    },

    clearDepth: function(value) {
        var data = this._stateClearDepth;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        buffer.value = value;

        if (state.value !== value) {
            data.changed = true;
        }
    },

    applyClearDepth: function(gl) {
        var data = this._stateClearDepth;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;
        state.value = buffer.value;
        gl.clearDepth(state.value);
    },

    depthMask: function(value) {
        var data = this._stateDepthMask;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        buffer.value = value;

        if (state.value !== value) {
            data.changed = true;
        }
    },

    applyDepthMask: function(gl) {
        var data = this._stateDepthMask;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;
        state.value = buffer.value;
        gl.depthMask(state.value);
    },

    applyViewportAttribute: function(attribute) {
        this.viewport(attribute._x, attribute._y, attribute._width, attribute._height);
    },

    viewport: function(x, y, width, height) {
        var data = this._stateViewport;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        buffer.x = x;
        buffer.y = y;
        buffer.width = width;
        buffer.height = height;

        if (state.x !== x || state.y !== y || state.width !== width || state.height !== height) {
            data.changed = true;
        }
    },

    applyViewport: function(gl) {
        var data = this._stateViewport;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;
        state.x = buffer.x;
        state.y = buffer.y;
        state.width = buffer.width;
        state.height = buffer.height;
        gl.viewport(state.x, state.y, state.width, state.height);
    },

    applyColorMaskAttribute: function(attribute) {
        var data = this._stateColorMask;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        buffer.red = attribute._red;
        buffer.green = attribute._green;
        buffer.blue = attribute._blue;
        buffer.alpha = attribute._alpha;

        if (
            state.red !== attribute._red ||
            state.green !== attribute._green ||
            state.blue !== attribute._blue ||
            state.alpha !== attribute._alpha
        ) {
            data.changed = true;
        }
    },

    applyColorMask: function(gl) {
        var data = this._stateColorMask;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;
        state.red = buffer.red;
        state.green = buffer.green;
        state.blue = buffer.blue;
        state.alpha = buffer.alpha;
        gl.colorMask(state.red, state.green, state.blue, state.alpha);
    },

    applyScissorAttribute: function(attribute) {
        var enable = attribute._x !== -1;
        var data = this._stateScissor;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        buffer.enable = enable;
        buffer.x = attribute._x;
        buffer.y = attribute._y;
        buffer.width = attribute._width;
        buffer.height = attribute._height;

        if (state.enable !== enable ||
            state.x !== attribute._x ||
            state.y !== attribute._y ||
            state.width !== attribute._width ||
            state.height !== attribute._height ) {
            data.changed = true;
        }
    },

    applyScissor: function(gl) {
        var data = this._stateScissor;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        if (state.enable !== buffer.enable) {
            state.enable = buffer.enable;
            if (state.enable) {
                gl.enable(gl.SCISSOR_TEST);
            } else {
                gl.disable(gl.SCISSOR_TEST);
            }
        }

        if (!state.enable) return;

        if (
            state.x !== buffer.x ||
            state.y !== buffer.y ||
            state.width !== buffer.width ||
            state.height !== buffer.height
        ) {
            state.x = buffer.x;
            state.y = buffer.y;
            state.width = buffer.width;
            state.height = buffer.height;
            gl.scissor(state.x, state.y, state.width, state.height);
        }
    },

    applyCullFaceAttribute: function(attribute) {
        var data = this._stateCullFace;
        var buffer = data.buffer;
        var state = data.state;
        var enable = attribute._mode !== CullFace.DISABLE;
        data.changed = false;

        buffer.enable = enable;
        buffer.mode = attribute._mode;

        if (state.enable !== enable || state.mode !== attribute._mode) {
            data.changed = true;
        }
    },

    applyCullFace: function(gl) {
        var data = this._stateCullFace;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        if (state.enable !== buffer.enable) {
            state.enable = buffer.enable;
            if (state.enable) {
                gl.enable(gl.CULL_FACE);
            } else {
                gl.disable(gl.CULL_FACE);
            }
        }

        if (!state.enable) return;

        if (state.mode !== buffer.mode) {
            state.mode = buffer.mode;
            gl.cullFace(state.mode);
        }
    },

    applyDepthAttribute: function(attribute) {
        var enable = attribute._func !== Depth.DISABLE;
        var data = this._stateDepth;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        buffer.enable = enable;
        buffer.func = attribute._func;
        buffer.far = attribute._far;
        buffer.near = attribute._near;

        if (state.enable !== enable ||
            state.func !== attribute._func ||
            state.near !== attribute._near ||
            state.far !== attribute._far ) {
            data.changed = true;
        }

        this.depthMask(attribute._writeMask);
    },

    applyDepth: function(gl) {
        var data = this._stateDepth;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        if (state.enable !== buffer.enable) {
            state.enable = buffer.enable;
            if (state.enable) {
                gl.enable(gl.DEPTH_TEST);
            } else {
                gl.disable(gl.DEPTH_TEST);
            }
        }

        if (!state.enable) return;

        if (state.func !== buffer.func) {
            state.func = buffer.func;
            gl.depthFunc(state.func);
        }

        if (state.near !== buffer.near || state.far !== buffer.far) {
            state.far = buffer.far;
            state.near = buffer.near;
            gl.depthRange(state.near, state.far);
        }
    },

    applyBlendFuncAttribute: function(attribute) {
        var data = this._stateBlendFunc;
        var buffer = data.buffer;
        var state = data.state;
        var enable =
            attribute._sourceFactor !== BlendFunc.DISABLE &&
            attribute._destinationFactor !== BlendFunc.DISABLE;
        data.changed = false;

        buffer.enable = enable;
        buffer.separate = attribute._separate;
        buffer.sourceFactor = attribute._sourceFactor;
        buffer.destinationFactor = attribute._destinationFactor;
        buffer.sourceFactorAlpha = attribute._sourceFactorAlpha;
        buffer.destinationFactorAlpha = attribute._destinationFactorAlpha;

        if (state.enable !== enable ||
            state.sourceFactor !== attribute._sourceFactor ||
            state.destinationFactor !== attribute._destinationFactor ||
            state.sourceFactorAlpha !== attribute._sourceFactorAlpha ||
            state.destinationFactorAlpha !== attribute._destinationFactorAlpha
        ) {
            data.changed = true;
        }
    },

    applyBlendFunc: function(gl) {
        var data = this._stateBlendFunc;
        var buffer = data.buffer;
        var state = data.state;
        data.changed = false;

        if (state.enable !== buffer.enable) {
            state.enable = buffer.enable;
            if (state.enable) {
                gl.enable(gl.BLEND);
            } else {
                gl.disable(gl.BLEND);
            }
        }

        if (!state.enable) return;

        state.separate = buffer.separate;
        if (state.separate) {
            if (
                state.sourceFactor !== buffer.sourceFactor ||
                state.destinationFactor !== buffer.destinationFactor ||
                state.sourceFactorAlpha !== buffer.sourceFactorAlpha ||
                state.destinationFactorAlpha !== buffer.destinationFactorAlpha
            ) {
                state.sourceFactor = buffer.sourceFactor;
                state.destinationFactor = buffer.destinationFactor;
                state.sourceFactorAlpha = buffer.sourceFactorAlpha;
                state.destinationFactorAlpha = buffer.destinationFactorAlpha;
                gl.blendFuncSeparate(
                    state.sourceFactor,
                    state.destinationFactor,
                    state.sourceFactorAlpha,
                    state.destinationFactorAlpha
                );
            }
        } else if (
            state.sourceFactor !== buffer.sourceFactor ||
            state.destinationFactor !== buffer.destinationFactor
        ) {
            state.sourceFactor = buffer.sourceFactor;
            state.destinationFactor = buffer.destinationFactor;
            gl.blendFunc(state.sourceFactor, state.destinationFactor);
        }
    },

    applyClearStates: function(gl) {
        if (this._stateDepthMask.changed) {
            this.applyDepthMask(gl);
        }
        if (this._stateScissor.changed) {
            this.applyScissor(gl);
        }
        if (this._stateClearColor.changed) {
            this.applyClearColor(gl);
        }
        if (this._stateClearDepth.changed) {
            this.applyClearDepth(gl);
        }
        if (this._stateColorMask.changed) {
            this.applyColorMask(gl);
        }
    },

    applyDrawStates: function(gl) {
        if (this._stateViewport.changed) {
            this.applyViewport(gl);
        }
        if (this._stateScissor.changed) {
            this.applyScissor(gl);
        }
        if (this._stateDepth.changed) {
            this.applyDepth(gl);
        }
        if (this._stateDepthMask.changed) {
            this.applyDepthMask(gl);
        }
        if (this._stateCullFace.changed) {
            this.applyCullFace(gl);
        }
        if (this._stateBlendFunc.changed) {
            this.applyBlendFunc(gl);
        }
        if (this._stateColorMask.changed) {
            this.applyColorMask(gl);
        }
    },

    clear: function(gl, mask) {
        this.applyClearStates(gl);
        gl.clear(mask);
    },

    drawGeometry: function(gl) {
        this.applyDrawStates(gl);
    }
};

export default StateCache;
