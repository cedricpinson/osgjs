define( [
    'osg/BlendFunc',
    'osg/BufferArray',
    'osg/Camera',
    'osg/CullFace',
    'osg/Depth',
    'osg/FrameStamp',
    'osg/FrameBufferObject',
    'osg/Light',
    'osg/Material',
    'osg/Matrix',
    'osg/Node',
    'osg/Options',
    'osg/Texture',
    'osg/Program',
    'osg/Shader',
    'osg/Viewport',
    'osg/WebGLCaps',

    'osgUtil/IntersectionVisitor',
    'osgUtil/LineSegmentIntersector',

    'osgViewer/Renderer',
    'osgViewer/Scene'

], function (
    BlendFunc,
    BufferArray,
    Camera,
    CullFace,
    Depth,
    FrameStamp,
    FrameBufferObject,
    Light,
    Material,
    Matrix,
    Node,
    Options,
    Texture,
    Program,
    Shader,
    Viewport,
    WebGLCaps,

    IntersectionVisitor,
    LineSegmentIntersector,

    Renderer,
    Scene ) {

    'use strict';


    // View is normally inherited from osg/View. In osgjs we dont need it yet
    // this split, so everything is in osgViewer/View

    var View = function () {

        this._camera = new Camera();
        this._scene = new Scene();
        this._frameStamp = new FrameStamp();
        this._lightingMode = undefined;
        this._manipulator = undefined;
        this._webGLCaps = undefined;
        this._canvasWidth = 0;
        this._canvasHeight = 0;

        this._requestContinousUpdate = true;
        this._requestRedraw = true;

        this.setLightingMode( View.LightingMode.HEADLIGHT );
        // assign a renderer to the camera
        var renderer = this.createRenderer( this.getCamera() );
        renderer.setFrameStamp( this._frameStamp );
        this.getCamera().setRenderer( renderer );
        this.getCamera().setView( this );

    };

    View.LightingMode = {
        NO_LIGHT: 0,
        HEADLIGHT: 1,
        SKY_LIGHT: 2
    };

    View.prototype = {
        requestRedraw: function () {
            this._requestRedraw = true;
        },
        requestContinuousUpdate: function ( bool ) {
            this._requestContinousUpdate = bool;
        },
        createRenderer: function ( camera ) {
            var render = new Renderer( camera );
            //camera->setStats(new osg::Stats("Camera"));
            return render;
        },

        setGraphicContext: function ( gc ) {
            this.getCamera().getRenderer().getState().setGraphicContext( gc );
        },

        getGraphicContext: function () {
            return this.getCamera().getRenderer().getState().getGraphicContext();
        },

        getWebGLCaps: function () {
            return this._webGLCaps;
        },

        initWebGLCaps: function ( gl ) {
            this._webGLCaps = new WebGLCaps( gl );
            this._webGLCaps.init();
        },

        computeCanvasSize: ( function () {
            return function ( canvas ) {

                var clientWidth, clientHeight;
                clientWidth = canvas.clientWidth;
                clientHeight = canvas.clientHeight;

                if ( clientWidth < 1 ) clientWidth = 1;
                if ( clientHeight < 1 ) clientHeight = 1;

                var devicePixelRatio = this._devicePixelRatio;

                var widthPixel = Math.floor( clientWidth * devicePixelRatio );
                var heightPixel = Math.floor( clientHeight * devicePixelRatio );

                var hasChanged = false;
                if ( this._canvasWidth !== widthPixel ) {
                    canvas.width = widthPixel;
                    this._canvasWidth = widthPixel;
                    hasChanged = true;
                }

                if ( this._canvasHeight !== heightPixel ) {
                    canvas.height = heightPixel;
                    this._canvasHeight = heightPixel;
                    hasChanged = true;
                }
                return hasChanged;
            };
        } )(),

        setUpView: function ( canvas, options ) {


            var devicePixelRatio = window.devicePixelRatio || 1;
            var overrideDevicePixelRatio = options.getNumber( 'overrideDevicePixelRatio' );
            var maxDevicePixelRatio = options.getNumber( 'maxDevicePixelRatio' ) || -1;

            // override the pixel ratio, used to save pixel on mobile
            if ( typeof overrideDevicePixelRatio === 'number' ) {
                devicePixelRatio = overrideDevicePixelRatio;
            } else if ( maxDevicePixelRatio !== -1 ) {
                devicePixelRatio = maxDevicePixelRatio;
            }
            this._devicePixelRatio = devicePixelRatio;

            this.computeCanvasSize( canvas );

            var ratio = canvas.clientWidth / canvas.clientHeight;

            var width = canvas.width;
            var height = canvas.height;

            this._camera.setViewport( new Viewport( 0, 0, width, height ) );

            this._camera.setGraphicContext( this.getGraphicContext() );
            Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], this._camera.getViewMatrix() );
            Matrix.makePerspective( 55, ratio, 1.0, 1000.0, this._camera.getProjectionMatrix() );


            if ( options && options.enableFrustumCulling )
                this.getCamera().getRenderer().getCullVisitor().setEnableFrustumCulling( true );

        },

        /**
         * X = 0 at the left
         * Y = 0 at the BOTTOM
         */
        computeIntersections: function ( x, y, traversalMask ) {
            /*jshint bitwise: false */
            if ( traversalMask === undefined ) {
                traversalMask = ~0;
            }
            /*jshint bitwise: true */
            var lsi = new LineSegmentIntersector();
            lsi.set( [ x, y, 0.0 ], [ x, y, 1.0 ] );
            var iv = new IntersectionVisitor();
            iv.setTraversalMask( traversalMask );
            iv.setIntersector( lsi );
            this._camera.accept( iv );
            return lsi.getIntersections();
        },

        setFrameStamp: function ( frameStamp ) {
            this._frameStamp = frameStamp;
        },

        getFrameStamp: function () {
            return this._frameStamp;
        },

        setCamera: function ( camera ) {
            this._camera = camera;
        },

        getCamera: function () {
            return this._camera;
        },

        setSceneData: function ( node ) {

            if ( node === this._scene.getSceneData() )
                return;

            this._scene.setSceneData( node );

            this._camera.removeChildren();
            this._camera.addChild( node );

        },

        getSceneData: function () {
            return this._scene.getSceneData();
        },

        setDatabasePager: function ( dbpager ) {
            this._scene.setDatabasePager( dbpager );
        },

        getDatabasePager: function () {
            return this._scene.getDatabasePager();
        },

        getScene: function () {
            return this._scene;
        },

        getManipulator: function () {
            return this._manipulator;
        },

        setManipulator: function ( manipulator ) {
            this._manipulator = manipulator;
        },

        getLight: function () {
            return this._light;
        },

        setLight: function ( light ) {
            this._light = light;
            if ( this._lightingMode !== View.LightingMode.NO_LIGHT ) {
                this._scene.getOrCreateStateSet().setAttributeAndModes( this._light );
            }
        },

        getLightingMode: function () {
            return this._lightingMode;
        },

        setLightingMode: function ( lightingMode ) {

            if ( this._lightingMode !== lightingMode ) {
                this._lightingMode = lightingMode;

                if ( this._lightingMode !== View.LightingMode.NO_LIGHT ) {

                    if ( !this._light ) this._light = new Light();

                } else {
                    this._light = undefined;
                }
            }
        },

        // In OSG this call is done in SceneView
        flushDeletedGLObjects: function ( /*currentTime,*/ availableTime ) {
            // Flush all deleted OpenGL objects within the specified availableTime
            var gl = this.getGraphicContext();
            availableTime = BufferArray.flushDeletedGLBufferArrays( gl, availableTime );
            availableTime = Texture.getTextureManager( gl ).flushDeletedTextureObjects( gl, availableTime );
            availableTime = Program.flushDeletedGLPrograms( gl, availableTime );
            availableTime = Shader.flushDeletedGLShaders( gl, availableTime );
            availableTime = FrameBufferObject.flushDeletedGLFrameBuffers( gl, availableTime );
        },

        flushAllDeletedGLObjects: function ( ) {
            // Flush all deleted OpenGL objects
            var gl = this.getGraphicContext();
            BufferArray.flushAllDeletedGLBufferArrays( gl );
            Texture.getTextureManager( gl ).flushAllDeletedTextureObjects( gl );
            Program.flushAllDeletedGLPrograms( gl );
            Shader.flushAllDeletedGLShaders( gl );
            FrameBufferObject.flushAllDeletedGLFrameBuffers( gl );
        }
    };

    return View;
} );
