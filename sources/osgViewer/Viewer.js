import notify from 'osg/notify';
import { mat4 } from 'osg/glMatrix';
import Options from 'osg/Options';
import P from 'bluebird';
import Timer from 'osg/Timer';
import TimerGPU from 'osg/TimerGPU';
import UpdateVisitor from 'osg/UpdateVisitor';
import utils from 'osg/utils';
import GLObject from 'osg/GLObject';
import FrameBufferObject from 'osg/FrameBufferObject';
import BufferArray from 'osg/BufferArray';
import VertexArrayObject from 'osg/VertexArrayObject';
import Shader from 'osg/Shader';
import Program from 'osg/Program';
import Texture from 'osg/Texture';
import OrbitManipulator from 'osgGA/OrbitManipulator';
import View from 'osgViewer/View';
import WebGLUtils from 'osgViewer/webgl-utils';
import WebGLDebugUtils from 'osgViewer/webgl-debug';
import Stats from 'osgStats/Stats';
import defaultStats from 'osgStats/defaultStats';
import glStats from 'osgStats/glStats';
import browserStats from 'osgStats/browserStats';
import InputManager from 'osgViewer/input/InputManager';
import InputSourceMouse from 'osgViewer/input/source/InputSourceMouse';
import InputSourceKeyboard from 'osgViewer/input/source/InputSourceKeyboard';
import InputSourceWebVR from 'osgViewer/input/source/InputSourceWebVR';
import InputSourceGamePad from 'osgViewer/input/source/InputSourceGamePad';
import InputSourceDeviceOrientation from 'osgViewer/input/source/InputSourceDeviceOrientation';
import InputSourceTouchScreen from 'osgViewer/input/source/InputSourceTouchScreen';
import RenderBin from 'osg/RenderBin';
import RenderStage from 'osg/RenderStage';
import StateGraph from 'osg/StateGraph';

var Viewer = function(canvas, userOptions, error) {
    View.call(this);

    this._startTick = Timer.instance().tick();
    this._stats = undefined;
    this._done = false;

    // keep reference so that you still have it
    // when gl context is lost
    this._canvas = canvas;

    var options = this.initOptions(userOptions);
    var gl = this.initWebGLContext(canvas, options, error);

    if (!gl) throw 'No WebGL implementation found';

    this._updateVisitor = new UpdateVisitor();

    this.setUpView(gl.canvas, options);
    this.initInputManager(options, canvas);
    this.initStats(options, canvas);

    this._hmd = null;
    this._requestAnimationFrame = window.requestAnimationFrame.bind(window);
    this._options = options;
    this._contextLost = false;
    this._forceRestoreContext = true;
    this.renderBinded = this.render.bind(this);
};

utils.createPrototypeObject(
    Viewer,
    utils.objectInherit(View.prototype, {
        initInputManager: function(options, canvas) {
            var inputManager = new InputManager();
            this._inputManager = inputManager;

            //Default mouse and keyboard
            this._initInputSource(InputSourceMouse, 'Mouse', canvas, options);
            this._initInputSource(InputSourceKeyboard, 'Keyboard', document, options);

            // touch inputs, Only activate them if we have a touch device in order to fix problems with IE11
            if ('ontouchstart' in window) {
                this._initInputSource(InputSourceTouchScreen, 'TouchScreen', canvas, options);
            }

            this._initInputSource(InputSourceWebVR, 'WebVR', undefined, options);
            this._initInputSource(
                InputSourceDeviceOrientation,
                'DeviceOrientation',
                undefined,
                options
            );

            if (navigator.getGamepads) {
                this._initInputSource(InputSourceGamePad, 'GamePad', undefined, options);
            }

            inputManager.addMappings(
                { 'viewer.internals:hmdConnect': 'vrdisplayconnected' },
                function(ev) {
                    this.setVRDisplay(ev.vrDisplay);
                }.bind(this)
            );

            inputManager.setParam('pixelRatio', [this._devicePixelRatio, this._devicePixelRatio]);
        },

        _initInputSource: function(sourceClass, optionName, defaultSrcElem, options) {
            var opt = options.InputSources ? options.InputSources[optionName] : undefined;
            if (opt) {
                if (opt.enable !== false) {
                    var elem = opt.sourceElement || defaultSrcElem;
                    this._inputManager.registerInputSource(new sourceClass(elem));
                }
            } else {
                this._inputManager.registerInputSource(new sourceClass(defaultSrcElem));
            }
        },

        getInputManager: function() {
            return this._inputManager;
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
            if (options.getBoolean('traceLogCall') === true) notify.traceLogCall = true;

            // Check if Frustum culling is enabled to calculate the clip planes
            if (options.getBoolean('enableFrustumCulling') === true)
                this.getCamera()
                    .getRenderer()
                    .getCullVisitor()
                    .setEnableFrustumCulling(true);

            return options;
        },

        initWebGLContext: function(canvas, options, error) {
            // #FIXME see tojiro's blog for webgl lost context stuffs
            if (options.get('SimulateWebGLLostContext')) {
                canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(canvas);
                canvas.loseContextInNCalls(options.get('SimulateWebGLLostContext'));
                this._canvas = canvas;
            }

            var gl = WebGLUtils.setupWebGL(canvas, options, error);

            //www.khronos.org/registry/webgl/specs/latest/1.0/#WEBGLCONTEXTEVENT
            canvas.addEventListener(
                'webglcontextlost',
                function(event) {
                    this.contextLost();
                    if (this._forceRestoreContext !== false) {
                        event.preventDefault();
                    }
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

            if (notify.reportWebGLError || options.get('reportWebGLError')) {
                gl = WebGLDebugUtils.makeDebugContext(gl);
            }

            this.initWebGLCaps(gl);
            this.setGraphicContext(gl);

            return gl;
        },

        // allow user to acknowledge the context lost
        // (display a message, etc.)
        // - callback return false: no attempt to restore
        setContextLostCallback: function(callback) {
            this._contextLostCallback = callback;
            // just in case callback registration
            // happens after the context lost
            if (this._contextLost) {
                this._forceRestoreContext = callback();
            }
        },

        setContextRestoreCallback: function(callback) {
            this._contextRestoreCallback = callback;
        },

        contextLost: function() {
            notify.log('webgl context lost');
            if (this._contextLostCallback) {
                this._forceRestoreContext = this._contextLostCallback();
            }
            this._contextLost = true;
            window.cancelAnimationFrame(this._requestID);
        },

        contextRestored: function() {
            if (this._forceRestoreContext === false) {
                notify.log('webgl context restore not supported - please reload the page - ');
                return;
            }
            // restore is already async
            // https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
            this.restoreContext();
            notify.log('webgl context restored');
        },

        restoreContext: function() {
            var gl = this.getGraphicContext();

            Shader.onLostContext(gl);
            Program.onLostContext(gl);
            BufferArray.onLostContext(gl);
            VertexArrayObject.onLostContext(gl);
            FrameBufferObject.onLostContext(gl);
            Texture.getTextureManager(gl).onLostContext(gl);

            GLObject.onLostContext(gl);

            this.getCamera()
                .getRenderer()
                .getState()
                .resetCaches();

            // if it's a different GPU, different webglcaps
            this.initWebGLCaps(gl, true);
            this.setGraphicContext(gl);

            // different GPU caps means different timer caps
            TimerGPU.instance(this.getGraphicContext(), true);
            if (this._stats) {
                // stats geometries needs special care
                this._stats.reset();
            }

            // ready to draw again
            this._contextLost = false;
            this._requestRedraw = true;

            // Warn users context has been restored
            if (this._contextRestoreCallback) {
                this._contextRestoreCallback(gl);
            }
            this._runImplementation();
        },

        init: function() {
            //this._done = false;
        },

        getUpdateVisitor: function() {
            return this._updateVisitor;
        },

        getState: function() {
            return this.getCamera()
                .getRenderer()
                .getState();
        },

        initStats: function(options) {
            var timerGPU = TimerGPU.instance(this.getGraphicContext());

            if (!options.getBoolean('stats')) {
                timerGPU.disable();
                return;
            }

            this._stats = new Stats(this, options);
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

            if (this.getScene().getSceneData())
                this.getScene()
                    .getSceneData()
                    .getBound();

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

            // update inputs
            this._inputManager.update();

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

        render: function() {
            if (!this.done()) {
                this._requestID = this._requestAnimationFrame(this.renderBinded, this._canvas);
                this.frame();
            }
        },

        _runImplementation: function() {
            this.render();
        },

        run: function() {
            this._runImplementation();
        },

        setVRDisplay: function(hmd) {
            this._hmd = hmd;
        },

        getVRDisplay: function() {
            return this._hmd;
        },

        setPresentVR: function(doPresentVR) {
            if (!this._hmd) {
                notify.warn('no hmd device provided to the viewer!');
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
                manipulator = new OrbitManipulator({ inputManager: this._inputManager });
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

        setManipulator: function(manipulator) {
            this.setEnableManipulator(false);

            if (!manipulator.getCamera()) manipulator.setCamera(this.getCamera());

            manipulator.setEnable(true);
            View.prototype.setManipulator.call(this, manipulator);
        },

        setEnableManipulator: function(bool) {
            if (!this._manipulator) return;
            this._manipulator.setEnable(bool);
        },

        dispose: function () {
            RenderBin.clean();
            RenderStage.clean();
            StateGraph.pooledStateGraph.clean();
        }
    }),
    'osgViewer',
    'Viewer'
);

export default Viewer;
