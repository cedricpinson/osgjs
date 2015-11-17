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
var Vec4 = require( 'osg/Vec4' );
var Viewport = require( 'osg/Viewport' );
var Composer = require( 'osgUtil/Composer' );


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

function perspectiveMatrixFromVRFieldOfView( fov, zNear, zFar ) {

    var matrix = new Matrix.create();

    var degToRad = Math.PI / 180.0;
    var upTan = Math.tan( fov.upDegrees * degToRad );
    var downTan = Math.tan( fov.downDegrees * degToRad );
    var leftTan = Math.tan( fov.leftDegrees * degToRad );
    var rightTan = Math.tan( fov.rightDegrees * degToRad );

    var xScale = 2.0 / ( leftTan + rightTan );
    var yScale = 2.0 / ( upTan + downTan );

    // return Matrix.makeFrustum( xmin, xmax, ymin, ymax, znear, zfar, result );

    matrix[ 0 ] = xScale;
    matrix[ 4 ] = 0.0;
    matrix[ 8 ] = -( ( leftTan - rightTan ) * xScale * 0.5 );
    matrix[ 12 ] = 0.0;

    matrix[ 1 ] = 0.0;
    matrix[ 5 ] = yScale;
    matrix[ 9 ] = ( ( upTan - downTan ) * yScale * 0.5 );
    matrix[ 13 ] = 0.0;

    matrix[ 2 ] = 0.0;
    matrix[ 6 ] = 0.0;
    matrix[ 10 ] = zFar / ( zNear - zFar );
    matrix[ 14 ] = ( zFar * zNear ) / ( zNear - zFar );

    matrix[ 3 ] = 0.0;
    matrix[ 7 ] = 0.0;
    matrix[ 11 ] = -1.0;
    matrix[ 15 ] = 0.0;

    return matrix;
}


var createTexture = function ( size ) {
    var texture = new Texture();
    texture.setTextureSize( size.width, size.height );
    texture.setMinFilter( 'LINEAR' );
    texture.setMagFilter( 'LINEAR' );
    return texture;
};

function getAssembleShader() {

    var fragmentShader = [
        '#ifdef GL_ES',
        '   precision highp float;',
        '#endif',
        'varying vec2 FragTexCoord0;',
        'uniform sampler2D leftEyeTexture;',
        'uniform sampler2D rightEyeTexture;',

        'void main() {',
        '   if (FragTexCoord0.x < 0.5)',
        '       gl_FragColor = texture2D(leftEyeTexture, vec2(FragTexCoord0.x * 2.0, FragTexCoord0.y));',
        '   else',
        '       gl_FragColor = texture2D(rightEyeTexture, vec2(FragTexCoord0.x * 2.0 - 1.0, FragTexCoord0.y));',
        '}',
    ].join( '\n' );

    return new Program(
        new Shader( Shader.VERTEX_SHADER, Composer.Filter.defaultVertexShader ),
        new Shader( Shader.FRAGMENT_SHADER, fragmentShader )
    );
}

// This camera will render both textures on the canvas in a single pass
var createCameraCanvas = function ( leftEyeTexture, rightEyeTexture, viewport ) {

    var orthoCamera = new Camera();
    orthoCamera.setViewport( viewport );
    orthoCamera.setRenderOrder( Camera.POST_RENDER, 0 );
    orthoCamera.setReferenceFrame( Transform.ABSOLUTE_RF );
    Matrix.makeOrtho( -0.5, 0.5, -0.5, 0.5, -5.0, 5.0, orthoCamera.getProjectionMatrix() );

    var quad = Shape.createTexturedQuadGeometry( -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0 );
    var stateSet = quad.getOrCreateStateSet();
    var samplerLeft = Uniform.createInt1( 0, 'leftEyeTexture' );
    var samplerRight = Uniform.createInt1( 1, 'rightEyeTexture' );

    stateSet.setTextureAttributeAndModes( 0, leftEyeTexture );
    stateSet.setTextureAttributeAndModes( 1, rightEyeTexture );
    stateSet.setAttributeAndModes( getAssembleShader() );
    stateSet.addUniform( samplerLeft );
    stateSet.addUniform( samplerRight );

    orthoCamera.addChild( quad );

    return orthoCamera;
};

// This camera will render the scene on a texture for an eye
var createCameraRtt = function ( texture, projection ) {
    var camera = new Camera();
    camera.setName( 'rtt camera' );
    camera.setViewport( new Viewport( 0.0, 0.0, texture.getWidth(), texture.getHeight() ) );
    camera.setProjectionMatrix( projection );
    camera.setClearColor( Vec4.createAndSet( 0.3, 0.3, 0.3, 0.0 ) );
    camera.setRenderOrder( Camera.PRE_RENDER, 0 );
    camera.attachTexture( FrameBufferObject.COLOR_ATTACHMENT0, texture, 0 );
    camera.attachRenderBuffer( FrameBufferObject.DEPTH_ATTACHMENT, FrameBufferObject.DEPTH_COMPONENT16 );
    camera.setReferenceFrame( Transform.ABSOLUTE_RF );
    return camera;
};

var getHMDOptions = function ( hmdDevice ) {

    // http://mozvr.github.io/webvr-spec/webvr.html
    var left = hmdDevice.getEyeParameters( 'left' );
    var right = hmdDevice.getEyeParameters( 'right' );

    var hmd = {
        fovLeft: left.recommendedFieldOfView,
        fovRight: right.recommendedFieldOfView,
        eyeOffsetLeft: left.eyeTranslation,
        eyeOffsetRight: right.eyeTranslation,
        rttResolution: {
            width: left.renderRect.width,
            height: left.renderRect.height
        },
    };

    // On Mac (FF+Chromium), the Left and Right angles of both eyes are inverted
    // Left Eye must see more to the Left than to the Right (Left angle > Right angle)
    // Right Eye must see more to the Right than to the Left (Right angle > Left angle)
    // This is because of the nose blocking the view
    var swapLeftAndRight = function ( fov ) {
        var temp = fov.leftDegrees;
        fov.leftDegrees = fov.rightDegrees;
        fov.rightDegrees = temp;
    };

    if ( hmd.fovLeft.leftDegrees < hmd.fovLeft.rightDegrees ) {
        swapLeftAndRight( hmd.fovLeft );
    }
    if ( hmd.fovRight.rightDegrees < hmd.fovRight.leftDegrees ) {
        swapLeftAndRight( hmd.fovRight );
    }

    return hmd;
};

var WebVR = {};

WebVR.createScene = function ( viewer, rttScene, HMDdevice ) {

    var root = new Node();
    var worldFactor = 1.0;

    var hmd = getHMDOptions( HMDdevice );

    // Compute projections and view matrices for both eyes
    var projectionLeft = perspectiveMatrixFromVRFieldOfView( hmd.fovLeft, 0.1, 1000 );
    var projectionRight = perspectiveMatrixFromVRFieldOfView( hmd.fovRight, 0.1, 1000 );
    var viewLeft = Matrix.makeTranslate( worldFactor * hmd.eyeOffsetLeft.x, hmd.eyeOffsetLeft.y, hmd.eyeOffsetLeft.z, Matrix.create() );
    var viewRight = Matrix.makeTranslate( worldFactor * hmd.eyeOffsetRight.x, hmd.eyeOffsetRight.y, hmd.eyeOffsetRight.z, Matrix.create() );

    // Each eye is rendered on a texture whose width is half of the final combined texture
    var eyeTextureSize = {
        width: hmd.rttResolution.width,
        height: hmd.rttResolution.height
    };

    var leftEyeTexture = createTexture( eyeTextureSize );
    var rightEyeTexture = createTexture( eyeTextureSize );

    // Setup the render cameras for both eyes
    var camRttLeft = createCameraRtt( leftEyeTexture, projectionLeft );
    var camRttRight = createCameraRtt( rightEyeTexture, projectionRight );

    // The viewMatrix of each eye is updated with the current viewer's camera viewMatrix
    var rootViewMatrix = viewer.getCamera().getViewMatrix();
    camRttLeft.setUpdateCallback( new UpdateRttCameraCallback( rootViewMatrix, viewLeft ) );
    camRttRight.setUpdateCallback( new UpdateRttCameraCallback( rootViewMatrix, viewRight ) );

    // Render both textures on the canvas, using the viewer's camera viewport to render on the fullscreen canvas
    var camCanvas = createCameraCanvas( leftEyeTexture, rightEyeTexture, viewer.getCamera().getViewport() );

    camRttLeft.addChild( rttScene );
    camRttRight.addChild( rttScene );

    root.addChild( camRttLeft );
    root.addChild( camRttRight );
    root.addChild( camCanvas );

    return root;
};

module.exports = WebVR;
