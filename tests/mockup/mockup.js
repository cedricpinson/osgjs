'use strict';

var chai = require('chai');

var getScene = require('tests/mockup/scene');
var getBoxScene = require('tests/mockup/box');
var Channel = require('osgAnimation/channel');
var Animation = require('osgAnimation/animation');
var UpdateMatrixTransform = require('osgAnimation/UpdateMatrixTransform');
var StackedRotateAxis = require('osgAnimation/StackedRotateAxis');
var StackedScale = require('osgAnimation/StackedScale');
var StackedQuaternion = require('osgAnimation/StackedQuaternion');
var StackedTranslate = require('osgAnimation/StackedTranslate');
var StackedMatrix = require('osgAnimation/StackedMatrix');
var ViewerOriginal = require('osgViewer/Viewer');
var Utils = require('osg/Utils');

var isNodeContext = function() {
    return typeof process !== 'undefined' && process.release.name === 'node'; // eslint-disable-line no-undef
};

var isNumber = function(a) {
    return typeof a === 'number';
};

chai.assert.equalVector = function(actual, expected, message, thresh) {
    var threshold = thresh;
    var msg = message;

    if (isNumber(message)) threshold = message;
    if (typeof thresh === 'string') msg = thresh;

    if (threshold === undefined) threshold = 1e-5;

    var obj = new chai.Assertion(actual);
    var a = actual;
    var e = expected;
    var bool = true;

    var diff = [];
    for (var i = 0; i < a.length; ++i) {
        var number = isNumber(a[i]) && isNumber(e[i]);
        var val = Math.abs(a[i] - e[i]);
        diff[i] = val;
        if (val > threshold || number === false) {
            bool = false;
        }
    }

    obj.assert(
        bool,
        msg +
            '\nexpected [ ' +
            actual +
            '] approximate to [ ' +
            expected +
            ' ]\ndiff > threshold ' +
            threshold +
            '\n' +
            diff.join('\n')
    );
    return bool;
};

var checkNear = function(a, b, threshold) {
    return chai.assert.equalVector(a, b, '', threshold);
};

var createFakeRenderer = function() {
    return {
        TEXTURE0: 10,
        DEPTH_TEST: 1,
        CULL_FACE: 0,
        UNSIGNED_SHORT: 0,
        HIGH_FLOAT: 0,
        FRAGMENT_SHADER: 0,
        TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
        TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
        TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517,
        TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518,
        TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519,
        TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851a,
        MAX_CUBE_MAP_TEXTURE_SIZE: 0x851c,
        UNPACK_FLIP_Y_WEBGL: 0,
        drawBuffers: function() {},
        drawElements: function() {},
        createBuffer: function() {},
        deleteBuffer: function() {},

        scissor: function() {},
        blendColor: function() {},
        enable: function() {},
        disable: function() {},
        depthFunc: function() {},
        pixelStorei: function() {},
        depthRange: function() {},
        depthMask: function() {},
        deleteTexture: function() {},
        activeTexture: function() {},
        bindTexture: function() {},
        bufferData: function() {},
        bindBuffer: function() {},
        blendFunc: function() {},
        getExtension: function() {},
        bindAttribLocation: function() {},
        getShaderPrecisionFormat: function() {
            return {
                precision: 1
            };
        },
        getSupportedExtensions: function() {
            return {};
        },
        enableVertexAttribArray: function() {},
        vertexAttribPointer: function() {},
        createTexture: function() {},
        createFramebuffer: function() {
            return 1;
        },
        deleteFramebuffer: function() {},
        bindFramebuffer: function() {},
        framebufferTexture2D: function() {},
        checkFramebufferStatus: function() {
            return 0x8cd5;
        },
        createRenderbuffer: function() {
            return 1;
        },
        deleteRenderbuffer: function() {},
        bindRenderbuffer: function() {},
        renderbufferStorage: function() {},
        framebufferRenderbuffer: function() {},
        clear: function() {},
        viewport: function() {},
        cullFace: function() {},
        texImage2D: function() {},
        texParameteri: function() {},
        createShader: function() {
            return 1;
        },
        deleteShader: function() {},
        shaderSource: function() {},
        compileShader: function() {},
        getShaderParameter: function() {
            return true;
        },
        isContextLost: function() {
            return false;
        },
        getShaderInfoLog: function() {},
        createProgram: function() {
            return {};
        },
        createVertexArray: function() {
            return {};
        },
        bindVertexArray: function() {},
        deleteProgram: function() {},
        attachShader: function() {},
        validateProgram: function() {},
        linkProgram: function() {},
        getParameter: function() {},
        getProgramParameter: function() {
            return true;
        },
        getProgramInfoLog: function() {},
        getUniformLocation: function() {
            return 0;
        },
        getAttribLocation: function() {
            return 0;
        },
        useProgram: function() {},
        uniformMatrix4fv: function() {},
        uniform1fv: function() {},
        uniform4fv: function() {},
        uniform3fv: function() {},
        uniform1iv: function() {},
        canvas: {
            clientWidth: 300,
            clientHeight: 300
        }
    };
};

var createFakeWebGLCanvas = function() {
    var obj = {
        addEventListener: function() {},
        getContext: function(dimension) {
            var grey = true;
            if (dimension === '2d') {
                return {
                    createImageData: function() {
                        return {
                            data: [0, 0, 0, 0]
                        };
                    },
                    getImageData: function() {
                        return { data: grey ? [0, 0, 0, 0] : [1, 0, 0, 0] };
                    },
                    putImageData: function() {},
                    measureText: function() {
                        return {
                            width: 100
                        };
                    },
                    fillText: function() {},
                    clearRect: function() {},
                    drawImage: function(img) {
                        if (img.src === 'mockup/rgba32.png') grey = false;
                    }
                };
            } else {
                return createFakeRenderer();
            }
        },
        style: {
            width: 300
        },
        getAttribute: function() {
            return 0;
        },
        isReady: function() {
            return true;
        },
        setAttribute: function() {},
        width: 300,
        height: 300
    };
    return obj;
};

var createVec3Keyframes = function() {
    var keys = [1, 1, 1, 0, 0, 0, 3, 3, 3];
    var times = [0, 1, 2];
    return Channel.createVec3Channel(keys, times);
};

var createFloatKeyframes = function() {
    var keys = [1, 0, 3];

    var start = 0;
    if (
        arguments.length > 0 // offset time keyframes
    )
        start = arguments[0];

    var times = [start + 0, start + 1, start + 2];
    return Channel.createFloatChannel(keys, times);
};

var createFloatCubicBezierKeyframes = function() {
    var keys = [1, 2, 3, 0, 1, 3, 3, 4, 5];
    var times = [0, 1, 2];
    return Channel.createFloatCubicBezierChannel(keys, times);
};

var createVec3CubicBezierKeyframes = function() {
    var keys = [1, 1, 1, 2, 2, 2, 5, 5, 5, 6, 6, 6, 9, 9, 9, 8, 8, 8, 6, 6, 6, 6, 6, 6, 6, 6, 6];
    var times = [0, 1, 2];
    return Channel.createVec3CubicBezierChannel(keys, times);
};

var createQuatLerpKeyFrames = function() {
    var keys = [
        1.22465e-16,
        1.22465e-16,
        1.22465e-16,
        -1,
        0.300706,
        7.99708e-17,
        1.53623e-16,
        -0.953717,
        0.382683,
        6.62774e-17,
        1.60008e-16,
        -0.92388,
        0.382683,
        6.62774e-17,
        1.60008e-16,
        -0.92388,
        0.126911,
        -0.0991929,
        0.119115,
        -0.979727
    ];

    var times = [0, 0.202899, 0.456522, 1.21739, 1.47101];
    return Channel.createQuatChannel(keys, times);
};

var createAnimation = function(name, target1, target2) {
    var a = createFloatKeyframes();
    a.target = target1 || 'a';
    a.name = 'rotateX';

    var b = createFloatKeyframes(2);
    b.target = target2 || 'b';
    b.name = 'rotateY';

    return Animation.createAnimation([a, b], name);
};

var createAnimationWithNegativeKey = function(name, target1, target2) {
    var a = createFloatKeyframes(-10);
    a.target = target1 || 'a';
    a.name = 'rotateX';

    var b = createFloatKeyframes(10);
    b.target = target2 || 'b';
    b.name = 'rotateY';

    return Animation.createAnimation([a, b], name);
};

var stackedElement = {
    translate: StackedTranslate,
    rotate: StackedRotateAxis,
    rotateX: StackedRotateAxis,
    rotateY: StackedRotateAxis,
    rotateZ: StackedRotateAxis,
    matrix: StackedMatrix,
    scale: StackedScale,
    quat: StackedQuaternion
};

var createAnimationUpdateCallback = function(animations) {
    var cbMap = {};

    for (var a = 0; a < animations.length; a++) {
        var animation = animations[a];
        for (var i = 0; i < animation.channels.length; i++) {
            var channel = animation.channels[i];

            var target = channel.target;
            var name = channel.name;

            var ucb = cbMap[target];
            if (!ucb) {
                cbMap[target] = new UpdateMatrixTransform();
                ucb = cbMap[target];
                ucb.setName(target);
            }
            var stacked = ucb.getStackedTransforms();
            var st = new stackedElement[name](name);
            stacked.push(st);
        }
    }
    return cbMap;
};

// override initEventProxy because no events/no canvas in nodejs context
// but keep the same class if in browser context
var Viewer = function() {
    ViewerOriginal.apply(this, arguments);
};

Utils.createPrototypeObject(
    Viewer,
    Utils.objectInherit(ViewerOriginal.prototype, {
        initEventProxy: function() {
            if (isNodeContext()) return {};

            return ViewerOriginal.prototype.initEventProxy.apply(this, arguments);
        }
    })
);

var createCanvas = function(noGL) {
    if (noGL || isNodeContext()) {
        return createFakeWebGLCanvas();
    }

    var parent = document.body;

    var t = '' + new Date().getTime();
    var cnv = "<canvas id='" + t + "'></canvas>";

    var mydiv = document.createElement('div');
    mydiv.setAttribute('id', 'div_' + t);
    mydiv.innerHTML = cnv;
    parent.appendChild(mydiv);
    return document.getElementById(t);
};

var removeCanvas = function(canvas) {
    if (!canvas) return;
    var id = canvas.getAttribute('id');
    var parent = document.getElementById('div_' + id);
    if (!parent) return;
    parent.removeChild(canvas);
};

document.createElementOld = document.createElement;

document.createElement = function(type) {
    if (type === 'canvas') {
        return createCanvas();
    }
    return document.createElementOld(type);
};

module.exports = {
    checkNear: checkNear,
    createFakeRenderer: createFakeRenderer,
    removeCanvas: removeCanvas,
    createCanvas: createCanvas,
    createVec3Keyframes: createVec3Keyframes,
    createFloatKeyframes: createFloatKeyframes,
    createFloatCubicBezierKeyframes: createFloatCubicBezierKeyframes,
    createVec3CubicBezierKeyframes: createVec3CubicBezierKeyframes,
    createQuatLerpKeyFrames: createQuatLerpKeyFrames,
    createAnimation: createAnimation,
    createAnimationWithNegativeKey: createAnimationWithNegativeKey,
    createAnimationUpdateCallback: createAnimationUpdateCallback,
    getBoxScene: getBoxScene,
    getScene: getScene,
    Viewer: Viewer,
    isNodeContext: isNodeContext
};
