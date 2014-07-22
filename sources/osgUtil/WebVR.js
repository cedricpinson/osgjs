define( [
    'osg/Camera',
    'osg/FrameBufferObject',
    'osg/Matrix',
    'osg/Node',
    'osg/Program',
    'osg/Projection',
    'osg/Shader',
    'osg/Shape',
    'osg/Texture',
    'osg/Transform',
    'osg/Uniform',
    'osg/Viewport',
    'osgUtil/Composer'
], function ( Camera, FrameBufferObject, Matrix, Node, Program, Projection, Shader, Shape, Texture, Transform, Uniform, Viewport, Composer ) {

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

    function perspectiveMatrixFromVRFieldOfView( fov, zNear, zFar ) {

        var matrix = new Matrix.create();

        var upTan = Math.tan( fov.upDegrees * Math.PI / 180.0 );
        var downTan = Math.tan( fov.downDegrees * Math.PI / 180.0 );
        var leftTan = Math.tan( fov.leftDegrees * Math.PI / 180.0 );
        var rightTan = Math.tan( fov.rightDegrees * Math.PI / 180.0 );

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

        stateSet.setTextureAttributeAndMode( 0, leftEyeTexture );
        stateSet.setTextureAttributeAndMode( 1, rightEyeTexture );
        stateSet.setAttributeAndMode( getAssembleShader() );
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
        camera.setClearColor( [ 0.3, 0.3, 0.3, 0.0 ] );
        camera.setRenderOrder( Camera.PRE_RENDER, 0 );
        camera.attachTexture( FrameBufferObject.COLOR_ATTACHMENT0, texture, 0 );
        camera.attachRenderBuffer( FrameBufferObject.DEPTH_ATTACHMENT, FrameBufferObject.DEPTH_COMPONENT16 );
        camera.setReferenceFrame( Transform.ABSOLUTE_RF );
        return camera;
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
            width: hmd.rttResolution.width / 2.0,
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

    function getHMDOptions( hmdDevice ) {

        /* WebVR API state as of 22/07/2014
        Firefox { 
            getCurrentEyeFieldOfView()
            getMaximumEyeFieldOfView()
            getRecommendedEyeFieldOfView()
            getEyeTranslation()
        },
        Chrome {
            getCurrentEyeFieldOfView()
            getMaximumEyeFieldOfView()
            getRecommendedEyeFieldOfView()
            getEyeTranslation()
            getRecommendedRenderTargetSize()
        }*/

        var hmd = {

            fovLeft: hmdDevice.getRecommendedEyeFieldOfView( 'left' ),
            fovRight: hmdDevice.getRecommendedEyeFieldOfView( 'right' ),
            eyeOffsetLeft: hmdDevice.getEyeTranslation( 'left' ),
            eyeOffsetRight: hmdDevice.getEyeTranslation( 'right' ),
            rttResolution: {
                width: 1920,
                height: 1080
            },
        };
        if ( hmdDevice.getRecommendedRenderTargetSize )
            hmd.rttResolution = hmdDevice.getRecommendedRenderTargetSize();

        return hmd;
    }

    return WebVR;

} );
