define( [
    'osg/Camera',
    'osg/FrameBufferObject',
    'osg/Matrix',
    'osg/Node',
    'osg/Program',
    'osg/Shader',
    'osg/Shape',
    'osg/Texture',
    'osg/Transform',
    'osg/Uniform',
    'osg/Viewport'
], function ( Camera, FrameBufferObject, Matrix, Node, Program, Shader, Shape, Texture, Transform, Uniform, Viewport ) {

    'use strict';

    var UpdateRttCameraCallback = function ( rootView, offsetView ) {
        this._rootView = rootView;
        this._offsetView = offsetView;
    };

    UpdateRttCameraCallback.prototype = {
        update: function ( node /*, nv */ ) {
            var nodeView = node.getViewMatrix();
            Matrix.mult( this._offsetView, this._rootView, nodeView );
            return true;
        }
    };

    var setupOculus = function ( worldFactor, HMD, oculusUniforms, oculusMatrices ) {
        var aspect = HMD.hResolution / ( 2.0 * HMD.vResolution );
        var r = -1.0 - ( 4.0 * ( HMD.hScreenSize * 0.25 - HMD.lensSeparationDistance * 0.5 ) / HMD.hScreenSize );
        var distScale = ( HMD.distortionK[ 0 ] + HMD.distortionK[ 1 ] * Math.pow( r, 2 ) + HMD.distortionK[ 2 ] * Math.pow( r, 4 ) + HMD.distortionK[ 3 ] * Math.pow( r, 6 ) );
        var fov = ( 180.0 / Math.PI ) * 2.0 * Math.atan2( HMD.vScreenSize * distScale, 2.0 * HMD.eyeToScreenDistance );

        var proj = Matrix.makePerspective( fov, aspect, 0.3, 10000.0, Matrix.create() );
        var hOffset = 4.0 * ( HMD.hScreenSize * 0.25 - HMD.interpupillaryDistance * 0.5 ) / HMD.hScreenSize;
        var lensShift = 4.0 * ( HMD.hScreenSize * 0.25 - HMD.lensSeparationDistance * 0.5 ) / HMD.hScreenSize;

        oculusMatrices.projectionLeft = Matrix.preMult( Matrix.makeTranslate( hOffset, 0.0, 0.0, Matrix.create() ), proj );
        oculusMatrices.projectionRight = Matrix.preMult( Matrix.makeTranslate( -hOffset, 0.0, 0.0, Matrix.create() ), proj );
        oculusMatrices.viewLeft = Matrix.makeTranslate( worldFactor * HMD.interpupillaryDistance * 0.5, 0.0, 0.0, Matrix.create() );
        oculusMatrices.viewRight = Matrix.makeTranslate( -worldFactor * HMD.interpupillaryDistance * 0.5, 0.0, 0.0, Matrix.create() );

        oculusUniforms.lensCenterLeft = [ lensShift, 0.0 ];
        oculusUniforms.lensCenterRight = [ -lensShift, 0.0 ];
        oculusUniforms.hmdWarpParam = HMD.distortionK;
        oculusUniforms.chromAbParam = HMD.chromaAbParameter;
        oculusUniforms.scaleIn = [ 1.0, 1.0 / aspect ];
        oculusUniforms.scale = [ 1.0 / distScale, 1.0 * aspect / distScale ];
    };

    var getOculusShader = function () {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'attribute vec2 TexCoord0;',

            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'uniform mat4 NormalMatrix;',

            'varying vec2 vTexCoord;',

            'void main(void) {',
            '  vTexCoord = TexCoord0;',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'uniform vec2 uScale;',
            'uniform vec2 uScaleIn;',
            'uniform vec2 uLensCenter;',
            'uniform vec4 uHmdWarpParam;',
            'uniform vec4 uChromAbParam;',
            'uniform sampler2D Texture0;',

            'varying vec2 vTexCoord;',

            // from http://paradise.untergrund.net/tmp/demoshit/examples/js/effects/OculusRiftEffect.js
            'void main(void) {',
            '  vec2 uv = (vTexCoord * 2.0) - 1.0;', // range from [0,1] to [-1,1]
            '  vec2 theta = (uv - uLensCenter) * uScaleIn;',
            '  float rSq = theta.x * theta.x + theta.y * theta.y;',
            '  vec2 rvector = theta * (uHmdWarpParam.x + uHmdWarpParam.y * rSq + uHmdWarpParam.z * rSq * rSq + uHmdWarpParam.w * rSq * rSq * rSq);',
            '  vec2 rBlue = rvector * (uChromAbParam.z + uChromAbParam.w * rSq);',
            '  vec2 tcBlue = (uLensCenter + uScale * rBlue);',
            '  tcBlue = (tcBlue + 1.0) * 0.5;', // range from [-1,1] to [0,1]
            '  if (any(bvec2(clamp(tcBlue, vec2(0.0, 0.0), vec2(1.0, 1.0)) - tcBlue))) {',
            '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',
            '    return;',
            '  }',
            '  vec2 tcGreen = uLensCenter + uScale * rvector;',
            '  tcGreen = (tcGreen + 1.0) * 0.5;', // range from [-1,1] to [0,1]
            '  vec2 rRed = rvector * (uChromAbParam.x + uChromAbParam.y * rSq);',
            '  vec2 tcRed = uLensCenter + uScale * rRed;',
            '  tcRed = (tcRed + 1.0) * 0.5;', // range from [-1,1] to [0,1]
            '  gl_FragColor = vec4(texture2D(Texture0, tcRed).r, texture2D(Texture0, tcGreen).g, texture2D(Texture0, tcBlue).b, 1);',
            '}',
            ''
        ].join( '\n' );

        var program = new Program(
            new Shader( Shader.VERTEX_SHADER, vertexshader ),
            new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );

        return program;
    };

    var createTextureRtt = function ( rttSize ) {
        var rttTexture = new Texture();
        rttTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
        rttTexture.setMinFilter( 'LINEAR' );
        rttTexture.setMagFilter( 'LINEAR' );
        return rttTexture;
    };

    var createQuadRtt = function ( isLeftCam, texture, ocUnifs ) {
        var quad = Shape.createTexturedQuadGeometry( -0.5, -0.5, 0, 1, 0, 0, 0, 1, 0 );
        var orStateSet = quad.getOrCreateStateSet();
        orStateSet.setTextureAttributeAndMode( 0, texture );
        orStateSet.setAttributeAndMode( getOculusShader() );
        orStateSet.addUniform( new Uniform.createFloat2( ocUnifs.scale, 'uScale' ) );
        orStateSet.addUniform( new Uniform.createFloat2( ocUnifs.scaleIn, 'uScaleIn' ) );
        orStateSet.addUniform( new Uniform.createFloat2( isLeftCam ? ocUnifs.lensCenterLeft : ocUnifs.lensCenterRight, 'uLensCenter' ) );
        orStateSet.addUniform( new Uniform.createFloat4( ocUnifs.hmdWarpParam, 'uHmdWarpParam' ) );
        orStateSet.addUniform( new Uniform.createFloat4( ocUnifs.chromAbParam, 'uChromAbParam' ) );
        return quad;
    };

    var createOrthoRtt = function ( left, viewportSize, canvasSize ) {
        var orthoCamera = new Camera();
        var vw = viewportSize[ 0 ];
        var vh = viewportSize[ 1 ];
        var cw = canvasSize[ 0 ];
        var ch = canvasSize[ 1 ];
        if ( left )
            orthoCamera.setViewport( new Viewport( 0.5 * cw - vw, 0.5 * ( ch - vh ), vw, vh ) );
        else
            orthoCamera.setViewport( new Viewport( 0.5 * cw, 0.5 * ( ch - vh ), vw, vh ) );
        Matrix.makeOrtho( -0.5, 0.5, -0.5, 0.5, -5, 5, orthoCamera.getProjectionMatrix() );
        orthoCamera.setRenderOrder( Camera.NESTED_RENDER, 0 );
        orthoCamera.setReferenceFrame( Transform.ABSOLUTE_RF );
        return orthoCamera;
    };

    var createCameraRtt = function ( texture, projMatrix ) {
        var camera = new Camera();
        camera.setName( 'rtt camera' );
        camera.setViewport( new Viewport( 0, 0, texture.getWidth(), texture.getHeight() ) );
        camera.setProjectionMatrix( projMatrix );
        camera.setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
        camera.setRenderOrder( Camera.POST_RENDER, 0 );
        camera.attachTexture( FrameBufferObject.COLOR_ATTACHMENT0, texture, 0 );
        camera.attachRenderBuffer( FrameBufferObject.DEPTH_ATTACHMENT, FrameBufferObject.DEPTH_COMPONENT16 );
        camera.setReferenceFrame( Transform.ABSOLUTE_RF );
        return camera;
    };

    var Oculus = {};

    Oculus.createScene = function ( viewer, rttScene, HMDconfig ) {
        var HMD = Oculus.getDefaultConfig( HMDconfig );
        var rttSize = [ HMD.hResolution, HMD.vResolution ];
        var viewportSize = [ HMD.hResolution * 0.5, HMD.vResolution ];
        var vp = viewer.getCamera().getViewport();
        var canvasSize = [ vp.width(), vp.height() ];

        var worldFactor = 1.0; //world unit
        var oculusUniforms = {};
        var oculusMatrices = {};
        setupOculus( worldFactor, HMD, oculusUniforms, oculusMatrices );

        var rootViewMatrix = viewer.getCamera().getViewMatrix();

        var root = new Node();

        var rttTextureLeft = createTextureRtt( rttSize );
        var rttCamLeft = createCameraRtt( rttTextureLeft, oculusMatrices.projectionLeft );
        var quadTextLeft = createQuadRtt( true, rttTextureLeft, oculusUniforms );
        var orthoCameraLeft = createOrthoRtt( true, viewportSize, canvasSize );
        rttCamLeft.setUpdateCallback( new UpdateRttCameraCallback( rootViewMatrix, oculusMatrices.viewLeft ) );

        var rttTextureRight = createTextureRtt( rttSize );
        var rttCamRight = createCameraRtt( rttTextureRight, oculusMatrices.projectionRight );
        var quadTextRight = createQuadRtt( false, rttTextureRight, oculusUniforms );
        var orthoCameraRight = createOrthoRtt( false, viewportSize, canvasSize );
        rttCamRight.setUpdateCallback( new UpdateRttCameraCallback( rootViewMatrix, oculusMatrices.viewRight ) );

        rttCamLeft.addChild( rttScene );
        rttCamRight.addChild( rttScene );

        orthoCameraLeft.addChild( quadTextLeft );
        orthoCameraRight.addChild( quadTextRight );

        root.addChild( rttCamLeft );
        root.addChild( rttCamRight );

        root.addChild( orthoCameraLeft );
        root.addChild( orthoCameraRight );

        return root;
    };

    Oculus.getDefaultConfig = function ( hmdConfig ) {
        // FOV: 103.506416
        // vScreenCenter: 0.03645

        // Oculus Rift DK2
        var hmd = {
            hResolution: 1920,
            vResolution: 1080,
            hScreenSize: 0.1296,
            vScreenSize: 0.0729,
            interpupillaryDistance: 0.064,
            lensSeparationDistance: 0.0635,
            eyeToScreenDistance: 0.04,
            distortionK: [ 1.0, 0.22, 0.13, 0.02 ],
            chromaAbParameter: [ 0.996, -0.004, 1.014, 0.0 ]
        };
        if ( hmdConfig === 2 || hmdConfig === undefined )
            return hmd;
        if ( hmdConfig === 1 ) {
            // Oculus Rift DK1
            hmd.hResolution = 1280;
            hmd.vResolution = 800;
            hmd.hScreenSize = 0.14976;
            hmd.vScreenSize = 0.0936;
            hmd.lensSeparationDistance = 0.064;
            hmd.eyeToScreenDistance = 0.041;
            hmd.distortionK = [ 1.0, 0.22, 0.24, 0.0 ];
            return hmd;
        }
        // custom param
        if ( hmdConfig.hResolution !== undefined ) hmd.hResolution = hmdConfig.hResolution;
        if ( hmdConfig.vResolution !== undefined ) hmd.vResolution = hmdConfig.vResolution;
        if ( hmdConfig.hScreenSize !== undefined ) hmd.hScreenSize = hmdConfig.hScreenSize;
        if ( hmdConfig.vScreenSize !== undefined ) hmd.vScreenSize = hmdConfig.vScreenSize;
        if ( hmdConfig.interpupillaryDistance !== undefined ) hmd.interpupillaryDistance = hmdConfig.interpupillaryDistance;
        if ( hmdConfig.lensSeparationDistance !== undefined ) hmd.lensSeparationDistance = hmdConfig.lensSeparationDistance;
        if ( hmdConfig.eyeToScreenDistance !== undefined ) hmd.eyeToScreenDistance = hmdConfig.eyeToScreenDistance;
        if ( hmdConfig.distortionK !== undefined ) hmd.distortionK = hmdConfig.distortionK;
        if ( hmdConfig.chromaAbParameter !== undefined ) hmd.chromaAbParameter = hmdConfig.chromaAbParameter;

        return hmd;
    };

    return Oculus;

} );
