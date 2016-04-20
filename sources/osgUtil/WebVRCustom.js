'use strict';
var Camera = require( 'osg/Camera' );
var FrameBufferObject = require( 'osg/FrameBufferObject' );
var Matrix = require( 'osg/Matrix' );
var Node = require( 'osg/Node' );
var Program = require( 'osg/Program' );
var Shader = require( 'osg/Shader' );
var Shape = require( 'osg/Shape' );
var Texture = require( 'osg/Texture' );
var Transform = require( 'osg/Transform' );
var Uniform = require( 'osg/Uniform' );
var Vec2 = require( 'osg/Vec2' );
var Vec4 = require( 'osg/Vec4' );
var Viewport = require( 'osg/Viewport' );
var Composer = require( 'osgUtil/Composer' );


var WebVRCustom = {};

// no smart resize, we just recreate everything
var UpdateRecreateOnResize = function ( viewer, rttScene, hmdConfig, root, canvas ) {
    this._viewer = viewer;
    this._rttScene = rttScene;
    this._hmdConfig = hmdConfig;
    this._root = root;
    this._canvas = canvas;
    this._width = canvas.width;
    this._height = canvas.height;
};

UpdateRecreateOnResize.prototype = {
    update: function () {
        var canvas = this._canvas;
        var width = canvas.width;
        var height = canvas.height;

        if ( width !== this._width || height !== this._height ) {
            this._root.removeChildren();

            var hmdConfig = this._hmdConfig;
            if ( hmdConfig && hmdConfig.isCardboard ) {
                hmdConfig.hResolution = width;
                hmdConfig.vResolution = height;
            }
            this._width = width;
            this._height = height;

            WebVRCustom.createScene( this._viewer, this._rttScene, hmdConfig, this._root );
        }
        return true;
    }
};

var UpdateOffsetCamera = function ( rootView, offsetView ) {
    this._rootView = rootView;
    this._offsetView = offsetView;
};

UpdateOffsetCamera.prototype = {
    update: function ( node ) {
        var nodeView = node.getViewMatrix();
        Matrix.mult( this._offsetView, this._rootView, nodeView );
        return true;
    }
};

var setupWebVR = function ( worldFactor, HMD, webVRUniforms, webVRMatrices ) {

    var aspect = HMD.hResolution / ( 2.0 * HMD.vResolution );
    var r = -1.0 - ( 4.0 * ( HMD.hScreenSize * 0.25 - HMD.lensSeparationDistance * 0.5 ) / HMD.hScreenSize );
    var distScale = ( HMD.distortionK[ 0 ] + HMD.distortionK[ 1 ] * Math.pow( r, 2 ) + HMD.distortionK[ 2 ] * Math.pow( r, 4 ) + HMD.distortionK[ 3 ] * Math.pow( r, 6 ) );
    var fov = ( 180.0 / Math.PI ) * 2.0 * Math.atan2( HMD.vScreenSize * distScale, 2.0 * HMD.eyeToScreenDistance );

    var proj = Matrix.makePerspective( fov, aspect, 0.3, 10000.0, Matrix.create() );
    var hOffset = 4.0 * ( HMD.hScreenSize * 0.25 - HMD.interpupillaryDistance * 0.5 ) / HMD.hScreenSize;
    var lensShift = 4.0 * ( HMD.hScreenSize * 0.25 - HMD.lensSeparationDistance * 0.5 ) / HMD.hScreenSize;

    webVRMatrices.projectionLeft = Matrix.preMult( Matrix.makeTranslate( hOffset, 0.0, 0.0, Matrix.create() ), proj );
    webVRMatrices.projectionRight = Matrix.preMult( Matrix.makeTranslate( -hOffset, 0.0, 0.0, Matrix.create() ), proj );
    webVRMatrices.viewLeft = Matrix.makeTranslate( worldFactor * HMD.interpupillaryDistance * 0.5, 0.0, 0.0, Matrix.create() );
    webVRMatrices.viewRight = Matrix.makeTranslate( -worldFactor * HMD.interpupillaryDistance * 0.5, 0.0, 0.0, Matrix.create() );

    webVRUniforms.lensCenterLeft = Vec2.createAndSet( lensShift, 0.0 );
    webVRUniforms.lensCenterRight = Vec2.createAndSet( -lensShift, 0.0 );
    webVRUniforms.hmdWarpParam = HMD.distortionK;
    webVRUniforms.chromAbParam = HMD.chromaAbParameter;
    webVRUniforms.scaleIn = Vec2.createAndSet( 1.0, 1.0 / aspect );
    webVRUniforms.scale = Vec2.createAndSet( 1.0 / distScale, 1.0 * aspect / distScale );
};

var getWebVRShader = function () {

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

        'varying vec2 FragTexCoord0;',

        // from http://paradise.untergrund.net/tmp/demoshit/examples/js/effects/OculusRiftEffect.js
        'void main(void) {',
        '  vec2 uv = (FragTexCoord0 * 2.0) - 1.0;', // range from [0,1] to [-1,1]
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

    return new Program(
        new Shader( Shader.VERTEX_SHADER, Composer.Filter.defaultVertexShader ),
        new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );
};

var createTextureRtt = function ( rttSize ) {
    var rttTexture = new Texture();
    rttTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
    rttTexture.setMinFilter( 'LINEAR' );
    rttTexture.setMagFilter( 'LINEAR' );
    return rttTexture;
};

var createOrthoRtt = function ( left, viewportSize, canvasSize, cardboard, texture, webVRUniforms ) {
    var orthoCamera = new Camera();
    var vw = viewportSize[ 0 ];
    var vh = viewportSize[ 1 ];
    var cw = canvasSize[ 0 ];
    var ch = canvasSize[ 1 ];
    if ( cardboard === true ) {
        if ( left )
            orthoCamera.setViewport( new Viewport( 0.0, 0.0, cw / 2.0, ch ) );
        else
            orthoCamera.setViewport( new Viewport( cw / 2.0, 0.0, cw / 2.0, ch ) );
    } else {
        if ( left )
            orthoCamera.setViewport( new Viewport( 0.5 * cw - vw, 0.5 * ( ch - vh ), vw, vh ) );
        else
            orthoCamera.setViewport( new Viewport( 0.5 * cw, 0.5 * ( ch - vh ), vw, vh ) );
    }
    Matrix.makeOrtho( -0.5, 0.5, -0.5, 0.5, -5, 5, orthoCamera.getProjectionMatrix() );
    orthoCamera.setRenderOrder( Camera.NESTED_RENDER, 0 );
    orthoCamera.setReferenceFrame( Transform.ABSOLUTE_RF );

    var stateSet = orthoCamera.getOrCreateStateSet();
    stateSet.setTextureAttributeAndModes( 0, texture );
    stateSet.setAttributeAndModes( getWebVRShader() );
    stateSet.addUniform( Uniform.createFloat2( webVRUniforms.scale, 'uScale' ) );
    stateSet.addUniform( Uniform.createFloat2( webVRUniforms.scaleIn, 'uScaleIn' ) );
    stateSet.addUniform( Uniform.createFloat2( left ? webVRUniforms.lensCenterLeft : webVRUniforms.lensCenterRight, 'uLensCenter' ) );
    stateSet.addUniform( Uniform.createFloat4( webVRUniforms.hmdWarpParam, 'uHmdWarpParam' ) );
    stateSet.addUniform( Uniform.createFloat4( webVRUniforms.chromAbParam, 'uChromAbParam' ) );

    return orthoCamera;
};

var createCameraRtt = function ( texture, projMatrix ) {
    var camera = new Camera();
    camera.setName( 'rtt camera' );
    camera.setViewport( new Viewport( 0, 0, texture.getWidth(), texture.getHeight() ) );
    camera.setProjectionMatrix( projMatrix );
    camera.setClearColor( Vec4.createAndSet( 0.3, 0.3, 0.3, 0.0 ) );
    camera.setRenderOrder( Camera.POST_RENDER, 0 );
    camera.attachTexture( FrameBufferObject.COLOR_ATTACHMENT0, texture );
    camera.attachRenderBuffer( FrameBufferObject.DEPTH_ATTACHMENT, FrameBufferObject.DEPTH_COMPONENT16 );
    camera.setReferenceFrame( Transform.ABSOLUTE_RF );
    return camera;
};

WebVRCustom.createScene = function ( viewer, rttScene, HMDconfig, rootOverride, worldFactorOverride ) {
    var HMD = WebVRCustom.getDefaultConfig( HMDconfig );
    var rttSize = Vec2.createAndSet( HMD.hResolution * 0.5, HMD.vResolution );
    var viewportSize = Vec2.createAndSet( HMD.hResolution * 0.5, HMD.vResolution );
    var vp = viewer.getCamera().getViewport();
    var canvasSize = Vec2.createAndSet( vp.width(), vp.height() );

    var canvas = viewer.getGraphicContext().canvas;
    if ( HMD.isCardboard ) {
        canvasSize[ 0 ] = canvas.width;
        canvasSize[ 1 ] = canvas.height;
    }

    var worldFactor = worldFactorOverride !== undefined ? worldFactorOverride : 1.0;
    var webVRUniforms = {};
    var webVRMatrices = {};
    setupWebVR( worldFactor, HMD, webVRUniforms, webVRMatrices );

    var rootViewMatrix = viewer.getCamera().getViewMatrix();

    var root = rootOverride || new Node();
    root.setUpdateCallback( new UpdateRecreateOnResize( viewer, rttScene, HMDconfig, root, canvas ) );

    var rttTextureLeft = createTextureRtt( rttSize );
    var rttCamLeft = createCameraRtt( rttTextureLeft, webVRMatrices.projectionLeft );
    var orthoCameraLeft = createOrthoRtt( true, viewportSize, canvasSize, HMD.isCardboard, rttTextureLeft, webVRUniforms );
    rttCamLeft.setUpdateCallback( new UpdateOffsetCamera( rootViewMatrix, webVRMatrices.viewLeft ) );

    var rttTextureRight = createTextureRtt( rttSize );
    var rttCamRight = createCameraRtt( rttTextureRight, webVRMatrices.projectionRight );
    var orthoCameraRight = createOrthoRtt( false, viewportSize, canvasSize, HMD.isCardboard, rttTextureRight, webVRUniforms );
    rttCamRight.setUpdateCallback( new UpdateOffsetCamera( rootViewMatrix, webVRMatrices.viewRight ) );

    rttCamLeft.addChild( rttScene );
    rttCamRight.addChild( rttScene );

    orthoCameraLeft.addChild( Shape.createTexturedFullScreenFakeQuadGeometry() );
    orthoCameraRight.addChild( Shape.createTexturedFullScreenFakeQuadGeometry() );

    root.addChild( rttCamLeft );
    root.addChild( rttCamRight );


    root.addChild( orthoCameraLeft );
    root.addChild( orthoCameraRight );

    return root;
};

WebVRCustom.getDefaultConfig = function ( hmdConfig ) {
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
        distortionK: Vec4.createAndSet( 1.0, 0.22, 0.13, 0.02 ),
        chromaAbParameter: Vec4.createAndSet( 0.996, -0.004, 1.014, 0.0 ),
        isCardboard: false
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
        hmd.distortionK = Vec4.createAndSet( 1.0, 0.22, 0.24, 0.0 );
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
    if ( hmdConfig.isCardboard !== undefined ) hmd.isCardboard = hmdConfig.isCardboard;

    return hmd;
};

module.exports = WebVRCustom;
