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
    'osgUtil/IntersectVisitor'
], function ( Camera, Node, FrameStamp, Material, Depth, BlendFunc, CullFace, Viewport, Matrix, Light, IntersectVisitor ) {

    var View = function () {
        this._graphicContext = undefined;
        this._camera = new Camera();
        this._scene = new Node();
        this._sceneData = undefined;
        this._frameStamp = new FrameStamp();
        this._lightingMode = undefined;
        this._manipulator = undefined;

        this._webGLExtensions = {};
        this._webGLParameters = {};
        this._webGLShaderMaxInt = 'NONE';
        this._webGLShaderMaxFloat = 'NONE';

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
        getWebGLParameter: function ( str ) {
            return this._webGLParameters[ str ];
        },
        getWebGLParameters: function () {
            return this._webGLParameters;
        },
        getShaderMaxPrecisionFloat: function () {
            return this._webGLParameters.MAX_SHADER_PRECISION_FLOAT;
        },
        getShaderMaxPrecisionInt: function () {
            return this._webGLParameters.MAX_SHADER_PRECISION_INT;
        },
        initWebGLParameters: function () {
            var gl = this.getGraphicContext();
            if ( gl === undefined )
                return;
            var limits = [
                'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
                'MAX_CUBE_MAP_TEXTURE_SIZE',
                'MAX_FRAGMENT_UNIFORM_VECTORS',
                'MAX_RENDERBUFFER_SIZE',
                'MAX_TEXTURE_IMAGE_UNITS',
                'MAX_TEXTURE_SIZE',
                'MAX_VARYING_VECTORS',
                'MAX_VERTEX_ATTRIBS',
                'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
                'MAX_VERTEX_UNIFORM_VECTORS',
                'MAX_VIEWPORT_DIMS',
                'SHADING_LANGUAGE_VERSION',
                'VERSION',
                'VENDOR',
                'RENDERER',
                'ALIASED_LINE_WIDTH_RANGE',
                'ALIASED_POINT_SIZE_RANGE',
                'RED_BITS',
                'GREEN_BITS',
                'BLUE_BITS',
                'ALPHA_BITS',
                'DEPTH_BITS',
                'STENCIL_BITS'
            ];
            var params = this._webGLParameters;
            for ( var i = 0, len = limits.length; i < len; ++i ) {
                var par = limits[ i ];
                params[ par ] = gl.getParameter( gl[ par ] );
            }

            //shader precisions for float
            if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.HIGH_FLOAT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_FLOAT = 'high';
            } else if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_FLOAT = 'medium';
            } else if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.LOW_FLOAT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_FLOAT = 'low';
            } else {
                params.MAX_SHADER_PRECISION_FLOAT = 'none';
            }

            //shader precisions for float
            if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.HIGH_INT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_INT = 'high';
            } else if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.MEDIUM_INT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_INT = 'medium';
            } else if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.LOW_INT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_INT = 'low';
            } else {
                params.MAX_SHADER_PRECISION_INT = 'none';
            }

            // TODO ?
            // try to compile a small shader to test the spec is respected
        },
        getWebGLExtension: function ( str ) {
            return this._webGLExtensions[ str ];
        },
        getWebGLExtensions: function () {
            return this._webGLExtensions;
        },
        initWebGLExtensions: function () {
            var gl = this.getGraphicContext();
            if ( gl === undefined )
                return;
            var supported = gl.getSupportedExtensions();
            var ext = this._webGLExtensions;
            // we load all the extensions
            for ( var i = 0, len = supported.length; i < len; ++i ) {
                var sup = supported[ i ];
                ext[ sup ] = gl.getExtension( sup );
            }
            // TODO ?
            // check if the extensions are REALLY supported ?
            // cf http://codeflow.org/entries/2013/feb/22/how-to-write-portable-webgl/#how-can-i-detect-if-i-can-render-to-floating-point-textures
        },
        setUpView: function ( canvas ) {

            var width = canvas.clientWidth !== 0 ? canvas.clientWidth : 800;
            var height = canvas.clientHeight !== 0 ? canvas.clientHeight : 600;

            var devicePixelRatio = window.devicePixelRatio || 1;
            width *= devicePixelRatio;
            height *= devicePixelRatio;

            canvas.width = width;
            canvas.height = height;

            var ratio = width / height;
            this._camera.setViewport( new Viewport( 0, 0, width, height ) );
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
