define( [
    'osg/Camera',
    'osg/Node',
    'osg/FrameStamp',
    'osg/Material',
    'osg/Depth',
    'osg/BlendFunc',
    'osg/CullFace',
    'osg/Viewport',
    'osg/Matrix',
    'osg/Light',
    'osg/WebGLCaps',
    'osgUtil/IntersectVisitor'
], function ( Camera, Node, FrameStamp, Material, Depth, BlendFunc, CullFace, Viewport, Matrix, Light, WebGLCaps, IntersectVisitor ) {

    'use strict';

    var View = function () {
        this._graphicContext = undefined;
        this._camera = new Camera();
        this._scene = new Node();
        this._sceneData = undefined;
        this._frameStamp = new FrameStamp();
        this._lightingMode = undefined;
        this._manipulator = undefined;
        this._webGLCaps = undefined;


        this.setLightingMode( View.LightingMode.HEADLIGHT );

        this._scene.getOrCreateStateSet().setAttributeAndMode( new Material() );
        this._scene.getOrCreateStateSet().setAttributeAndMode( new Depth() );
        this._scene.getOrCreateStateSet().setAttributeAndMode( new BlendFunc() );
        this._scene.getOrCreateStateSet().setAttributeAndMode( new CullFace() );
    };

    View.LightingMode = {
        NO_LIGHT: 0,
        HEADLIGHT: 1,
        SKY_LIGHT: 2
    };

    View.prototype = {
        setGraphicContext: function ( gc ) {
            this._graphicContext = gc;
        },
        getGraphicContext: function () {
            return this._graphicContext;
        },
        getWebGLCaps: function () {
            return this._webGLCaps;
        },
        initWebGLCaps: function ( gl ) {
            this._webGLCaps = new WebGLCaps();
            this._webGLCaps.init( gl );
        },

        computeCanvasSize: ( function() {
            var canvasWidth = 0;
            var canvasHeight = 0;

            return function ( canvas ) {

                var clientWidth, clientHeight;
                clientWidth = canvas.clientWidth;
                clientHeight = canvas.clientHeight;

                if ( clientWidth < 1 ) clientWidth = 1;
                if ( clientHeight < 1 ) clientHeight = 1;

                var devicePixelRatio = 1;
                if ( this._options.getBoolean( 'useDevicePixelRatio' ) ) {
                    devicePixelRatio = window.devicePixelRatio || 1;
                }

                var widthPixel = clientWidth * devicePixelRatio;
                var heightPixel = clientHeight * devicePixelRatio;

                if ( canvasWidth !== widthPixel ) {
                    canvas.width = widthPixel;
                    canvasWidth = widthPixel;
                }

                if ( canvasHeight !== heightPixel ) {
                    canvas.height = heightPixel;
                    canvasHeight = heightPixel;
                }

            }; })(),

        setUpView: function ( canvas ) {
            this.computeCanvasSize( canvas );

            var ratio = canvas.clientWidth / canvas.clientHeight;

            var width  = canvas.width;
            var height = canvas.height;

            this._camera.setViewport( new Viewport( 0, 0, width, height ) );

            this._camera.setGraphicContext( this._graphicContext );
            Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], this._camera.getViewMatrix() );
            Matrix.makePerspective( 55, ratio, 1.0, 1000.0, this._camera.getProjectionMatrix() );
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

            var iv = new IntersectVisitor();
            iv.setTraversalMask( traversalMask );
            iv.addLineSegment( [ x, y, 0.0 ], [ x, y, 1.0 ] );
            iv.pushCamera( this._camera );
            this._sceneData.accept( iv );
            return iv.hits;
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
            this._scene.removeChildren();
            this._scene.addChild( node );
            this._sceneData = node;
        },
        getSceneData: function () {
            return this._sceneData;
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
                this._scene.getOrCreateStateSet().setAttributeAndMode( this._light );
            }
        },
        getLightingMode: function () {
            return this._lightingMode;
        },
        setLightingMode: function ( lightingMode ) {
            if ( this._lightingMode !== lightingMode ) {
                this._lightingMode = lightingMode;
                if ( this._lightingMode !== View.LightingMode.NO_LIGHT ) {
                    if ( !this._light ) {
                        this._light = new Light();
                        this._light.setAmbient( [ 0.2, 0.2, 0.2, 1.0 ] );
                        this._light.setDiffuse( [ 0.8, 0.8, 0.8, 1.0 ] );
                        this._light.setSpecular( [ 0.5, 0.5, 0.5, 1.0 ] );
                    }
                } else {
                    this._light = undefined;
                }
            }
        }

    };

    return View;
} );
