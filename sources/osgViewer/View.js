import BufferArray from 'osg/BufferArray';
import Camera from 'osg/Camera';
import FrameStamp from 'osg/FrameStamp';
import FrameBufferObject from 'osg/FrameBufferObject';
import Light from 'osg/Light';
import { mat4 } from 'osg/glMatrix';
import Texture from 'osg/Texture';
import Program from 'osg/Program';
import Shader from 'osg/Shader';
import Scissor from 'osg/Scissor';
import { vec3 } from 'osg/glMatrix';
import Viewport from 'osg/Viewport';
import VertexArrayObject from 'osg/VertexArrayObject';
import WebGLCaps from 'osg/WebGLCaps';
import IntersectionVisitor from 'osgUtil/IntersectionVisitor';
import LineSegmentIntersector from 'osgUtil/LineSegmentIntersector';
import Renderer from 'osgViewer/Renderer';
import Scene from 'osgViewer/Scene';
import DisplayGraph from 'osgUtil/DisplayGraph';
import notify from 'osg/notify';

// View is normally inherited from osg/View. In osgjs we dont need it yet
// this split, so everything is in osgViewer/View

var View = function() {
    this._camera = new Camera();
    this._camera.setName('OSGJS camera');

    this._scene = new Scene();
    this._camera.setName('OSGJS Scene');

    this._frameStamp = new FrameStamp();
    this._lightingMode = undefined;
    this._manipulator = undefined;
    this._canvasWidth = 0;
    this._canvasHeight = 0;

    this._requestContinousUpdate = true;
    this._requestRedraw = true;

    this.setLightingMode(View.LightingMode.HEADLIGHT);
    // assign a renderer to the camera
    var renderer = this.createRenderer(this.getCamera());
    renderer.setFrameStamp(this._frameStamp);
    this.getCamera().setRenderer(renderer);
    this.getCamera().setView(this);
};

View.LightingMode = {
    NO_LIGHT: 0,
    HEADLIGHT: 1,
    SKY_LIGHT: 2
};

View.prototype = {
    requestRedraw: function() {
        this._requestRedraw = true;
    },
    requestContinuousUpdate: function(bool) {
        this._requestContinousUpdate = bool;
    },
    createRenderer: function(camera) {
        var render = new Renderer(camera);
        //camera->setStats(new osg::Stats("Camera"));
        return render;
    },

    setGraphicContext: function(gc) {
        this.getCamera()
            .getRenderer()
            .getState()
            .setGraphicContext(gc);
    },

    getGraphicContext: function() {
        return this.getCamera()
            .getRenderer()
            .getState()
            .getGraphicContext();
    },

    initWebGLCaps: function(gl, force) {
        WebGLCaps.instance(gl, force);
    },

    // check Each frame because HTML standard inconsistencies
    // - mobile full-screen, device orientation, etc
    // peculiarity of webgl canvas resizing here some details
    // http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    // screen size
    // http://tripleodeon.com/2011/12/first-understand-your-screen/
    // touchy is touchy: many things to know
    // http://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html
    computeCanvasSize: (function() {
        return function(canvas) {
            var clientWidth, clientHeight;
            clientWidth = canvas.clientWidth;
            clientHeight = canvas.clientHeight;

            if (clientWidth < 1) clientWidth = 1;
            if (clientHeight < 1) clientHeight = 1;

            var devicePixelRatio = this._devicePixelRatio;

            var widthPixel = Math.floor(clientWidth * devicePixelRatio);
            var heightPixel = Math.floor(clientHeight * devicePixelRatio);

            var hasChanged = false;
            if (this._canvasWidth !== widthPixel) {
                canvas.width = widthPixel;
                this._canvasWidth = widthPixel;
                hasChanged = true;
            }

            if (this._canvasHeight !== heightPixel) {
                canvas.height = heightPixel;
                this._canvasHeight = heightPixel;
                hasChanged = true;
            }
            return hasChanged;
        };
    })(),

    getCanvasWidth: function() {
        return this._canvasWidth;
    },

    getCanvasHeight: function() {
        return this._canvasHeight;
    },

    getCanvasClientWidth: function() {
        return Math.ceil(this._canvasWidth / this._devicePixelRatio);
    },

    getCanvasClientHeight: function() {
        return Math.ceil(this._canvasHeight / this._devicePixelRatio);
    },

    getCanvasPixelRatio: function() {
        // in case of VR headset, it's probably not relevant anymore
        return this._devicePixelRatio;
    },

    setUpView: function(canvas, options) {
        var devicePixelRatio = window.devicePixelRatio || 1;
        var overrideDevicePixelRatio = options.getNumber('overrideDevicePixelRatio');
        var maxDevicePixelRatio = options.getNumber('maxDevicePixelRatio') || -1;

        // override the pixel ratio, used to save pixel on mobile
        if (typeof overrideDevicePixelRatio === 'number') {
            devicePixelRatio = overrideDevicePixelRatio;
        } else if (maxDevicePixelRatio !== -1) {
            devicePixelRatio = Math.min(devicePixelRatio, maxDevicePixelRatio);
        }
        this._devicePixelRatio = devicePixelRatio;

        this.computeCanvasSize(canvas);

        var width = canvas.width;
        var height = canvas.height;
        var ratio = width / height;

        this._camera.setViewport(new Viewport(0, 0, width, height));
        this._camera.setScissor(new Scissor());

        this._camera.setGraphicContext(this.getGraphicContext());
        mat4.lookAt(
            this._camera.getViewMatrix(),
            vec3.fromValues(0.0, 0.0, -10.0),
            vec3.create(),
            vec3.fromValues(0.0, 1.0, 0.0)
        );
        mat4.perspective(
            this._camera.getProjectionMatrix(),
            Math.PI / 180 * 55,
            ratio,
            1.0,
            1000.0
        );

        if (options && options.enableFrustumCulling)
            this.getCamera()
                .getRenderer()
                .getCullVisitor()
                .setEnableFrustumCulling(true);

        // add a function to refresh the graph from the console
        if (options && options.debugGraph) {
            var camera = this.getCamera();
            DisplayGraph.instance().refreshGraph = function() {
                var displayGraph = DisplayGraph.instance();
                displayGraph.setDisplayGraphRenderer(true);
                displayGraph.createGraph(camera);
            };

            notify.log(
                'to refresh the graphs type in the console:\nOSG.osgUtil.DisplayGraph.instance().refreshGraph()'
            );
        }
    },

    /**
     * X = 0 at the left
     * Y = 0 at the BOTTOM
     */
    computeIntersections: function(x, y, traversalMask) {
        /*jshint bitwise: false */
        if (traversalMask === undefined) {
            traversalMask = ~0;
        }
        /*jshint bitwise: true */

        if (!this._lsi) {
            this._lsi = new LineSegmentIntersector();
        } else {
            this._lsi.reset();
        }

        if (!this._origIntersect) {
            this._origIntersect = vec3.create();
            this._dstIntersect = vec3.create();
        }

        this._lsi.set(
            vec3.set(this._origIntersect, x, y, 0.0),
            vec3.set(this._dstIntersect, x, y, 1.0)
        );

        if (!this._iv) {
            this._iv = new IntersectionVisitor();
            this._iv.setIntersector(this._lsi);
        } else {
            this._iv.reset();
        }
        this._iv.setTraversalMask(traversalMask);
        this._camera.accept(this._iv);

        return this._lsi.getIntersections();
    },

    setFrameStamp: function(frameStamp) {
        this._frameStamp = frameStamp;
    },

    getFrameStamp: function() {
        return this._frameStamp;
    },

    setCamera: function(camera) {
        this._camera = camera;
    },

    getCamera: function() {
        return this._camera;
    },

    setSceneData: function(node) {
        var previousNode = this._scene.getSceneData();
        if (node === previousNode) return;

        this._scene.setSceneData(node);

        var children = this._camera.getChildren();
        var statsNode = undefined;
        for (var i = 0, l = children.length; i < l; i++) {
            if (children[i].getName() === 'osgStats') {
                statsNode = children[i];
                break;
            }
        }
        this._camera.removeChildren();
        this._camera.addChild(node);
        if (statsNode) this._camera.addChild(statsNode);
    },

    getSceneData: function() {
        return this._scene.getSceneData();
    },

    setDatabasePager: function(dbpager) {
        this._scene.setDatabasePager(dbpager);
    },

    getDatabasePager: function() {
        return this._scene.getDatabasePager();
    },

    getScene: function() {
        return this._scene;
    },

    getManipulator: function() {
        return this._manipulator;
    },

    setManipulator: function(manipulator) {
        this._manipulator = manipulator;
    },

    getLight: function() {
        return this._light;
    },

    setLight: function(light) {
        this._light = light;
        if (this._lightingMode !== View.LightingMode.NO_LIGHT) {
            this._scene.getOrCreateStateSet().setAttributeAndModes(this._light);
        }
    },

    getLightingMode: function() {
        return this._lightingMode;
    },

    setLightingMode: function(lightingMode) {
        if (this._lightingMode !== lightingMode) {
            this._lightingMode = lightingMode;

            if (this._lightingMode !== View.LightingMode.NO_LIGHT) {
                if (!this._light) this._light = new Light();
            } else {
                this._light = undefined;
            }
        }
    },

    // In OSG this call is done in SceneView
    flushDeletedGLObjects: function(availableTimeBudget) {
        // Flush all deleted OpenGL objects within the specified availableTime
        var gl = this.getGraphicContext();
        var availableTime = availableTimeBudget;
        availableTime = BufferArray.flushDeletedGLBufferArrays(gl, availableTime);
        availableTime = VertexArrayObject.flushDeletedGLVertexArrayObjects(gl, availableTime);
        availableTime = Texture.getTextureManager(gl).flushDeletedTextureObjects(gl, availableTime);
        availableTime = Program.flushDeletedGLPrograms(gl, availableTime);
        availableTime = Shader.flushDeletedGLShaders(gl, availableTime);
        availableTime = FrameBufferObject.flushDeletedGLFrameBuffers(gl, availableTime);
        FrameBufferObject.flushDeletedGLRenderBuffers(gl, availableTime);
    },

    flushAllDeletedGLObjects: function() {
        // Flush all deleted OpenGL objects
        var gl = this.getGraphicContext();
        VertexArrayObject.flushAllDeletedGLVertexArrayObjects(gl);
        BufferArray.flushAllDeletedGLBufferArrays(gl);
        Texture.getTextureManager(gl).flushAllDeletedTextureObjects(gl);
        Program.flushAllDeletedGLPrograms(gl);
        Shader.flushAllDeletedGLShaders(gl);
        FrameBufferObject.flushAllDeletedGLFrameBuffers(gl);
        FrameBufferObject.flushAllDeletedGLRenderBuffers(gl);
    }
};

export default View;
