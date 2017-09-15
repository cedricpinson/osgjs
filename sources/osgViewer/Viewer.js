'use strict';
var Notify = require('osg/notify');
var mat4 = require('osg/glMatrix').mat4;
var Options = require('osg/Options');
var P = require('bluebird');
var Timer = require('osg/Timer');
var TimerGPU = require('osg/TimerGPU');
var UpdateVisitor = require('osg/UpdateVisitor');
var MACROUTILS = require('osg/Utils');
var Texture = require('osg/Texture');
var OrbitManipulator = require('osgGA/OrbitManipulator');
var EventProxy = require('osgViewer/eventProxy/eventProxy');
var View = require('osgViewer/View');
var WebGLUtils = require('osgViewer/webgl-utils');
var WebGLDebugUtils = require('osgViewer/webgl-debug');
var requestFile = require('osgDB/requestFile');
var Stats = require('osgStats/Stats');
var defaultStats = require('osgStats/defaultStats');
var glStats = require('osgStats/glStats');
var browserStats = require('osgStats/browserStats');

var getGLSLOptimizer = function() {
    return new P(function(resolve, reject) {
        window.deferOptimizeGLSL = resolve;
        var mod = [
            '        var Module = {',
            '            preRun: [],',
            '            postRun: [ function () {',
            '                var func = Module.cwrap( "optimize_glsl", "string", [ "string", "number", "number" ] );',
            '                window.deferOptimizeGLSL( func );',
            '            } ],',
            '            print: function ( text ) {',
            '                Notify.debug( text );',
            '            },',
            '            printErr: function ( text ) {',
            '                Notify.debug( text );',
            '            },',
            '            setStatus: function ( text ) {',
            '                Notify.debug( text );',
            '            },',
            '            totalDependencies: 0,',
            '            monitorRunDependencies: function ( left ) {',
            '                this.totalDependencies = Math.max( this.totalDependencies, left );',
            '                Module.setStatus( left ? "GLSL optimizer preparing... (" + ( this.totalDependencies - left ) + "/" + this.totalDependencies + ")" : "All downloads complete." );',
            '            },',
            '            memoryInitializerPrefixURL: "https://raw.githubusercontent.com/zz85/glsl-optimizer/gh-pages/"',
            '        };'
        ].join('\n');

        Notify.log('try to load glsl optimizer');
        var url =
            'https://raw.githubusercontent.com/zz85/glsl-optimizer/gh-pages/glsl-optimizer.js';
        var promise = requestFile(url);
        promise
            .then(function(script) {
                /*jshint evil: true */
                eval(mod + script);
                /*jshint evil: false */
            })
            .catch(function() {
                reject();
            });
    });
};

var Viewer = function(canvas, userOptions, error) {
    View.call(this);

    this._startTick = Timer.instance().tick();
    this._stats = undefined;
    this._done = false;
    this._runPromise = P.resolve();

    var options = this.initOptions(userOptions);
    var gl = this.initWebGLContext(canvas, options, error);

    if (!gl) throw 'No WebGL implementation found';

    // this MACROUTILS.init(); should be removed and replace by something
    // more natural
    MACROUTILS.init();

    this.initDeviceEvents(options, canvas);
    this.initRun(options);
    this._updateVisitor = new UpdateVisitor();

    this.setUpView(gl.canvas, options);
    this.initStats(options, canvas);

    this._hmd = null;
    this._requestAnimationFrame = window.requestAnimationFrame.bind(window);

    this._contextLost = false;
};

MACROUTILS.createPrototypeObject(
    Viewer,
    MACROUTILS.objectInherit(View.prototype, {
        initDeviceEvents: function(options, canvas) {
            // default argument for mouse binding
            var defaultMouseEventNode = options.mouseEventNode || canvas;

            var eventsBackend = options.EventBackend || {};
            if (!options.EventBackend) options.EventBackend = eventsBackend;
            eventsBackend.StandardMouseKeyboard = options.EventBackend.StandardMouseKeyboard || {};
            var mouseEventNode =
                eventsBackend.StandardMouseKeyboard.mouseEventNode || defaultMouseEventNode;
            eventsBackend.StandardMouseKeyboard.mouseEventNode = mouseEventNode;
            eventsBackend.StandardMouseKeyboard.keyboardEventNode =
                eventsBackend.StandardMouseKeyboard.keyboardEventNode || document;

            // hammer, Only activate it if we have a touch device in order to fix problems with IE11
            if ('ontouchstart' in window) {
                eventsBackend.Hammer = eventsBackend.Hammer || {};
                eventsBackend.Hammer.eventNode =
                    eventsBackend.Hammer.eventNode || defaultMouseEventNode;
            }
            // gamepad
            eventsBackend.GamePad = eventsBackend.GamePad || {};

            this._eventProxy = this.initEventProxy(options);
        },

        initOptions: function(userOptions) {
            // use default options
            var options = new Options();

            if (userOptions) {
                // user options override by user options
                options.extend(userOptions);
            }

            // if url options override url options
            options.extendWithOptionsURL();

            // Activate global trace on log call
            if (options.getBoolean('traceLogCall') === true) Notify.traceLogCall = true;

            // Check if Frustum culling is enabled to calculate the clip planes
            if (options.getBoolean('enableFrustumCulling') === true)
                this.getCamera().getRenderer().getCullVisitor().setEnableFrustumCulling(true);

            return options;
        },

        initWebGLContext: function(canvas, options, error) {
            // #FIXME see tojiro's blog for webgl lost context stuffs
            if (options.get('SimulateWebGLLostContext')) {
                canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(canvas);
                canvas.loseContextInNCalls(options.get('SimulateWebGLLostContext'));
            }

            var gl = WebGLUtils.setupWebGL(canvas, options, error);

            canvas.addEventListener(
                'webglcontextlost',
                function(event) {
                    this.contextLost();
                    event.preventDefault();
                }.bind(this),
                false
            );

            canvas.addEventListener(
                'webglcontextrestored',
                function() {
                    this.contextRestored();
                }.bind(this),
                false
            );

            if (Notify.reportWebGLError || options.get('reportWebGLError')) {
                gl = WebGLDebugUtils.makeDebugContext(gl);
            }

            this.initWebGLCaps(gl);
            this.setGraphicContext(gl);

            return gl;
        },

        initRun: function(options) {
            if (options.getBoolean('GLSLOptimizer') === true) {
                var Shader = require('osg/Shader');
                Shader.enableGLSLOptimizer = true;

                this._runPromise = getGLSLOptimizer();
                this._runPromise
                    .then(function(glslOptimizer) {
                        Shader.glslOptimizer = glslOptimizer;
                        if (Shader.glslOptimizer)
                            Notify.log('uses glsl optimizer, use ?log=info to see shader output');
                        else Notify.error('failed to load glsl optimizer');
                    })
                    .catch(function(error) {
                        Notify.error(error);
                    });
            }
        },

        setContextLostCallback: function(cb) {
            this._contextLostCallback = cb;
            // just in case callback registration
            // happens after the context lost
            if (this._contextLost) {
                cb();
            }
        },

        contextLost: function() {
            Notify.log('webgl context lost');
            if (this._contextLostCallback) {
                this._contextLostCallback();
            }
            this._contextLost = true;
            window.cancelAnimationFrame(this._requestID);
        },

        contextRestored: function() {
            Notify.log('webgl context restored, but not supported - reload the page');
            // Supporting it implies to have
            // reloaded all your resources:
            // textures, vertex/index buffers, shaders, frame buffers
            // so only set it back if you happen to have restored the context
            // this._contextLost = false;
        },

        init: function() {
            //this._done = false;
        },

        getUpdateVisitor: function() {
            return this._updateVisitor;
        },

        getState: function() {
            return this.getCamera().getRenderer().getState();
        },

        initStats: function(options) {
            var timerGPU = TimerGPU.instance(this.getGraphicContext());

            if (!options.getBoolean('stats')) {
                timerGPU.disable();
                return;
            }

            this._stats = new Stats(this.getCamera().getViewport(), options);
            this._stats.addConfig(defaultStats);
            this._stats.addConfig(glStats);
            this._stats.addConfig(browserStats);

            this.getCamera().addChild(this._stats.getNode());

            timerGPU.setCallback(this.callbackTimerGPU.bind(this));
        },

        callbackTimerGPU: function(average, queryID) {
            if (this._stats) this._stats.getCounter(queryID).set(average / 1e6);
        },

        getViewerStats: function() {
            return this._stats;
        },

        renderingTraversal: function() {
            this.getState()._frameStamp = this._frameStamp;

            if (this.getScene().getSceneData()) this.getScene().getSceneData().getBound();

            if (this.getCamera()) {
                var stats = this._stats;
                var timerGPU = TimerGPU.instance(this.getGraphicContext());

                var renderer = this.getCamera().getRenderer();

                if (stats) stats.getCounter('cull').start();

                renderer.cull();

                if (stats) stats.getCounter('cull').end();

                timerGPU.pollQueries();
                timerGPU.start('glframe');

                if (stats) {
                    stats.getCounter('render').start();
                }

                renderer.draw();

                if (stats) {
                    stats.getCounter('render').end();
                }

                timerGPU.end('glframe');

                if (stats) {
                    var cullVisitor = renderer.getCullVisitor();
                    stats.getCounter('cullcamera').set(cullVisitor._numCamera);
                    stats.getCounter('cullmatrixtransform').set(cullVisitor._numMatrixTransform);
                    stats.getCounter('cullprojection').set(cullVisitor._numProjection);
                    stats.getCounter('cullnode').set(cullVisitor._numNode);
                    stats.getCounter('culllightsource').set(cullVisitor._numLightSource);
                    stats.getCounter('cullgeometry').set(cullVisitor._numGeometry);

                    stats.getCounter('pushstateset').set(renderer.getState()._numPushStateSet);

                    stats.getCounter('applyStateSet').set(renderer.getState()._numApply);
                }
            }
        },

        updateTraversal: function() {
            var stats = this._stats;

            if (stats) stats.getCounter('update').start();

            // update the scene
            this._updateVisitor.resetStats();
            this.getScene().updateSceneGraph(this._updateVisitor);

            if (stats)
                stats.getCounter('updatecallback').set(this._updateVisitor._numUpdateCallback);

            // Remove ExpiredSubgraphs from DatabasePager
            this.getDatabasePager().releaseGLExpiredSubgraphs(0.005);
            // In OSG this.is deferred until the draw traversal, to handle multiple contexts
            this.flushDeletedGLObjects(0.005);

            if (stats) stats.getCounter('update').end();
        },

        advance: function(simulationTime) {
            var sTime = simulationTime;

            if (sTime === undefined) sTime = Number.MAX_VALUE;

            var frameStamp = this._frameStamp;
            var previousFrameNumber = frameStamp.getFrameNumber();

            frameStamp.setFrameNumber(previousFrameNumber + 1);

            var deltaS = Timer.instance().deltaS(this._startTick, Timer.instance().tick());
            frameStamp.setReferenceTime(deltaS);

            var lastSimulationTime = frameStamp.getSimulationTime();
            frameStamp.setSimulationTime(sTime === Number.MAX_VALUE ? deltaS : sTime); // set simul time
            frameStamp.setDeltaTime(frameStamp.getSimulationTime() - lastSimulationTime); // compute delta since last tick
        },

        beginFrame: function() {
            var stats = this._stats;

            if (stats) {
                stats.getCounter('frame').start();

                stats.getCounter('raf').tick();
                stats.getCounter('fps').frame();
            }
        },

        endFrame: function() {
            var frameNumber = this.getFrameStamp().getFrameNumber();

            // update texture stats
            if (this._stats) {
                Texture.getTextureManager(this.getGraphicContext()).updateStats(
                    frameNumber,
                    this._stats
                );

                this._stats.getCounter('stats').start();
                this._stats.update();
                this._stats.getCounter('stats').end();

                this._stats.getCounter('frame').end();
            }
        },

        checkNeedToDoFrame: function() {
            return this._requestContinousUpdate || this._requestRedraw;
        },

        frame: function() {
            // _contextLost check for code calling viewer::frame directly
            // (likely force preload gl resource or direct render control )
            if (this._contextLost) return;

            this.beginFrame();

            this.advance();

            // update viewport if a resize occured
            var canvasSizeChanged = this.updateViewport();

            // update inputs devices
            this.updateEventProxy(this._eventProxy, this.getFrameStamp());

            // setup framestamp
            this._updateVisitor.setFrameStamp(this.getFrameStamp());
            // Update Manipulator/Event
            if (this.getManipulator()) {
                this.getManipulator().update(this._updateVisitor);
                mat4.copy(
                    this.getCamera().getViewMatrix(),
                    this.getManipulator().getInverseMatrix()
                );
            }

            if (this.checkNeedToDoFrame() || canvasSizeChanged) {
                this._requestRedraw = false;
                this.updateTraversal();
                this.renderingTraversal();
            }

            this.endFrame();

            // submit frame to vr headset
            if (this._hmd && this._hmd.isPresenting) this._hmd.submitFrame();
        },

        setDone: function(bool) {
            this._done = bool;
        },

        done: function() {
            return this._done;
        },

        _runImplementation: function() {
            var self = this;
            var render = function() {
                if (!self.done()) {
                    self._requestID = self._requestAnimationFrame(
                        render,
                        self.getGraphicContext().canvas
                    );
                    self.frame();
                }
            };
            render();
        },

        run: function() {
            var self = this;
            this._runPromise
                .then(function() {
                    self._runImplementation();
                })
                .catch(function() {
                    self._runImplementation();
                });
        },

        setVRDisplay: function(hmd) {
            this._hmd = hmd;
        },

        getVRDisplay: function() {
            return this._hmd;
        },

        setPresentVR: function(doPresentVR) {
            if (!this._hmd) {
                Notify.warn('no hmd device provided to the viewer!');
                return P.reject();
            }

            if (!this._hmd.capabilities.canPresent) return P.reject();

            if (doPresentVR) {
                // spec is not clear if it should be done after the requestPresent promise or before
                this._requestAnimationFrame = this._hmd.requestAnimationFrame.bind(this._hmd);

                var layers = [
                    {
                        source: this.getGraphicContext().canvas
                    }
                ];
                return this._hmd.requestPresent(layers);
            } else {
                this._requestAnimationFrame = window.requestAnimationFrame.bind(window);
                return this._hmd.exitPresent();
            }
        },

        setupManipulator: function(manipulator /*, dontBindDefaultEvent */) {
            if (manipulator === undefined) {
                manipulator = new OrbitManipulator();
            }

            if (manipulator.setNode !== undefined) {
                manipulator.setNode(this.getSceneData());
            } else {
                // for backward compatibility
                manipulator.view = this;
            }

            manipulator.setCamera(this.getCamera());
            this.setManipulator(manipulator);
        },

        // updateViewport
        updateViewport: function() {
            var gl = this.getGraphicContext();
            var canvas = gl.canvas;

            var hasChanged = this.computeCanvasSize(canvas);
            if (!hasChanged) return false;

            var camera = this.getCamera();
            var vp = camera.getViewport();

            var prevWidth = vp.width();
            var prevHeight = vp.height();

            var widthChangeRatio = canvas.width / prevWidth;
            var heightChangeRatio = canvas.height / prevHeight;
            var aspectRatioChange = widthChangeRatio / heightChangeRatio;
            vp.setViewport(
                Math.round(vp.x() * widthChangeRatio),
                Math.round(vp.y() * heightChangeRatio),
                Math.round(vp.width() * widthChangeRatio),
                Math.round(vp.height() * heightChangeRatio)
            );

            if (aspectRatioChange !== 1.0) {
                mat4.mul(
                    camera.getProjectionMatrix(),
                    camera.getProjectionMatrix(),
                    mat4.fromScaling(mat4.create(), [1.0 / aspectRatioChange, 1.0, 1.0])
                );
            }

            return true;
        },

        // intialize all input devices
        initEventProxy: function(argsObject) {
            var args = argsObject || {};
            var deviceEnabled = {};

            var lists = EventProxy;
            var argumentEventBackend = args.EventBackend;

            // loop on each devices and try to initialize it
            for (var device in lists) {
                // check if the config has a require
                var initialize = true;
                var argDevice = {};
                if (argumentEventBackend && argumentEventBackend[device] !== undefined) {
                    var bool = argumentEventBackend[device].enable;
                    initialize = bool !== undefined ? bool : true;
                    argDevice = argumentEventBackend[device];
                }

                // extend argDevice with regular options eg:
                // var options = {
                //     EventBackend: {
                //         Hammer: {
                //             drag_max_touches: 4,
                //             transform_min_scale: 0.08,
                //             transform_min_rotation: 180,
                //             transform_always_block: true
                //         }
                //     },
                //     zoomscroll: false
                // };

                // to options merged:
                // var options = {
                //     drag_max_touches: 4,
                //     transform_min_scale: 0.08,
                //     transform_min_rotation: 180,
                //     transform_always_block: true,
                //     zoomscroll: false
                // };
                //
                var options = new Options();
                options.extend(argDevice).extend(argsObject);
                delete options.EventBackend;

                if (initialize) {
                    var inputDevice = new lists[device](this);
                    inputDevice.init(options);
                    deviceEnabled[device] = inputDevice;
                }
            }
            return deviceEnabled;
        },
        updateEventProxy: function(list, frameStamp) {
            for (var key in list) {
                var device = list[key];
                if (device.update) device.update(frameStamp);
            }
        },

        setManipulator: function(manipulator) {
            if (this._manipulator) this.removeEventProxy();

            if (!manipulator.getCamera()) manipulator.setCamera(this.getCamera());

            View.prototype.setManipulator.call(this, manipulator);
        },

        removeEventProxy: function() {
            var list = this._eventProxy;
            for (var key in list) {
                var device = list[key];
                if (device.remove) device.remove();
            }
        },

        getEventProxy: function() {
            return this._eventProxy;
        }
    }),
    'osgViewer',
    'Viewer'
);

module.exports = Viewer;
