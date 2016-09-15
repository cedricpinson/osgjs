'use strict';
var Camera = require( 'osg/Camera' );
var FrameBufferObject = require( 'osg/FrameBufferObject' );
var mat4 = require( 'osg/glMatrix' ).mat4;
var Node = require( 'osg/Node' );
var Program = require( 'osg/Program' );
var Shader = require( 'osg/Shader' );
var Shape = require( 'osg/Shape' );
var Texture = require( 'osg/Texture' );
var Transform = require( 'osg/Transform' );
var Uniform = require( 'osg/Uniform' );
var vec3 = require( 'osg/glMatrix' ).vec3;
var vec4 = require( 'osg/glMatrix' ).vec4;
var Viewport = require( 'osg/Viewport' );
var Composer = require( 'osgUtil/Composer' );


var UpdateRttCameraCallback = function ( rootView, offsetView ) {
    this._rootView = rootView;
    this._offsetView = offsetView;
};

UpdateRttCameraCallback.prototype = {
    update: function ( node /*, nv */ ) {
        var nodeView = node.getViewMatrix();
        mat4.mul( nodeView, this._offsetView, this._rootView );
        return true;
    }
};

var perspectiveMatrixFromVRFieldOfView = function ( fov, zNear, zFar ) {

    var matrix = mat4.create();

    var degToRad = Math.PI / 180.0;
    var upTan = Math.tan( fov.upDegrees * degToRad );
    var downTan = Math.tan( fov.downDegrees * degToRad );
    var leftTan = Math.tan( fov.leftDegrees * degToRad );
    var rightTan = Math.tan( fov.rightDegrees * degToRad );

    var xScale = 2.0 / ( leftTan + rightTan );
    var yScale = 2.0 / ( upTan + downTan );

    // http://mozvr.github.io/webvr-spec/webvr.html
    // (with ndc normalized)
    matrix[ 0 ] = xScale;
    matrix[ 1 ] = 0.0;
    matrix[ 2 ] = 0.0;
    matrix[ 3 ] = 0.0;

    matrix[ 4 ] = 0.0;
    matrix[ 5 ] = yScale;
    matrix[ 6 ] = 0.0;
    matrix[ 7 ] = 0.0;

    matrix[ 8 ] = -( ( leftTan - rightTan ) * xScale * 0.5 );
    matrix[ 9 ] = ( ( upTan - downTan ) * yScale * 0.5 );
    matrix[ 10 ] = -( zNear + zFar ) / ( zFar - zNear );
    matrix[ 11 ] = -1.0;

    matrix[ 12 ] = 0.0;
    matrix[ 13 ] = 0.0;
    matrix[ 14 ] = -( 2.0 * zFar * zNear ) / ( zFar - zNear );
    matrix[ 15 ] = 0.0;

    return matrix;
};

var createTexture = function ( size ) {
    var texture = new Texture();
    texture.setTextureSize( size.width, size.height );
    texture.setMinFilter( 'LINEAR' );
    texture.setMagFilter( 'LINEAR' );
    return texture;
};

var getAssembleShader = function () {

    var fragmentShader = [
        '#ifdef GL_ES',
        '   precision highp float;',
        '#endif',
        'varying vec2 FragTexCoord0;',
        'uniform sampler2D TextureLeft;',
        'uniform sampler2D TextureRight;',

        'void main() {',
        '   if (FragTexCoord0.x < 0.5)',
        '       gl_FragColor = texture2D(TextureLeft, vec2(FragTexCoord0.x * 2.0, FragTexCoord0.y));',
        '   else',
        '       gl_FragColor = texture2D(TextureRight, vec2(FragTexCoord0.x * 2.0 - 1.0, FragTexCoord0.y));',
        '}',
    ].join( '\n' );

    return new Program(
        new Shader( Shader.VERTEX_SHADER, Composer.Filter.defaultVertexShader ),
        new Shader( Shader.FRAGMENT_SHADER, fragmentShader )
    );
};

// This camera will render both textures on the canvas in a single pass
var createCameraCanvas = function ( leftEyeTexture, rightEyeTexture, viewport ) {

    var orthoCamera = new Camera();
    orthoCamera.setViewport( viewport );
    orthoCamera.setRenderOrder( Camera.NESTED_RENDER, 0 );
    orthoCamera.setReferenceFrame( Transform.ABSOLUTE_RF );
    mat4.ortho( orthoCamera.getProjectionMatrix(), 0.0, 1.0, 0.0, 1.0, -5.0, 5.0 );

    var stateSet = orthoCamera.getOrCreateStateSet();
    stateSet.addUniform( Uniform.createInt( 0, 'TextureLeft' ) );
    stateSet.addUniform( Uniform.createInt( 1, 'TextureRight' ) );
    stateSet.setTextureAttributeAndModes( 0, leftEyeTexture );
    stateSet.setTextureAttributeAndModes( 1, rightEyeTexture );
    stateSet.setAttributeAndModes( getAssembleShader() );

    orthoCamera.addChild( Shape.createTexturedFullScreenFakeQuadGeometry() );

    return orthoCamera;
};

// This camera will render the scene on a texture for an eye
var createCameraRtt = function ( texture, projection ) {
    var camera = new Camera();
    camera.setName( 'rtt camera' );
    camera.setViewport( new Viewport( 0.0, 0.0, texture.getWidth(), texture.getHeight() ) );
    camera.setProjectionMatrix( projection );
    camera.setClearColor( vec4.fromValues( 0.3, 0.3, 0.3, 0.0 ) );
    camera.setRenderOrder( Camera.POST_RENDER, 0 );
    camera.attachTexture( FrameBufferObject.COLOR_ATTACHMENT0, texture );
    camera.attachRenderBuffer( FrameBufferObject.DEPTH_ATTACHMENT, FrameBufferObject.DEPTH_COMPONENT16 );
    camera.setReferenceFrame( Transform.ABSOLUTE_RF );
    return camera;
};

var WebVR = {};

WebVR.createScene = function ( viewer, rttScene, HMDdevice, rootOverride, worldFactorOverride ) {

    var root = rootOverride || new Node();
    var worldFactor = worldFactorOverride !== undefined ? worldFactorOverride : 1.0;

    var left = HMDdevice.getEyeParameters( 'left' );
    var right = HMDdevice.getEyeParameters( 'right' );

    // Compute projections and view matrices for both eyes
    var projectionLeft = perspectiveMatrixFromVRFieldOfView( left.fieldOfView, 0.1, 1000.0 );
    var projectionRight = perspectiveMatrixFromVRFieldOfView( right.fieldOfView, 0.1, 1000.0 );
    var viewLeft = mat4.fromTranslation( mat4.create(), vec3.fromValues( -worldFactor * left.offset[ 0 ], left.offset[ 1 ], left.offset[ 2 ] ) );
    var viewRight = mat4.fromTranslation( mat4.create(), vec3.fromValues( -worldFactor * right.offset[ 0 ], right.offset[ 1 ], right.offset[ 2 ] ) );

    // Each eye is rendered on a texture whose width is half of the final combined texture
    var eyeTextureSize = {
        width: Math.max( left.renderWidth, right.renderWidth ),
        height: Math.max( left.renderHeight, right.renderHeight )
    };

    var leftEyeTexture = createTexture( eyeTextureSize );
    var rightEyeTexture = createTexture( eyeTextureSize );

    // Setup the render cameras for both eyes
    var camRttLeft = createCameraRtt( leftEyeTexture, projectionLeft );
    var camRttRight = createCameraRtt( rightEyeTexture, projectionRight );

    // The viewMatrix of each eye is updated with the current viewer's camera viewMatrix
    var rootViewMatrix = viewer.getCamera().getViewMatrix();
    camRttLeft.addUpdateCallback( new UpdateRttCameraCallback( rootViewMatrix, viewLeft ) );
    camRttRight.addUpdateCallback( new UpdateRttCameraCallback( rootViewMatrix, viewRight ) );

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
