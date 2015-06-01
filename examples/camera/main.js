( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;

    function createScene() {

        var canvas = document.getElementById( 'View' );

        // create a camera that will render to texture
        var rttSize = [ 512, 512 ];
        var rttCamera = new osg.Camera();
        rttCamera.setName( 'rttCamera' );
        osg.Matrix.makeOrtho( 0, rttSize[ 0 ], 0, rttSize[ 1 ], -5, 5, rttCamera.getProjectionMatrix() );
        rttCamera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
        rttCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        rttCamera.setViewport( new osg.Viewport( 0, 0, rttSize[ 0 ], rttSize[ 1 ] ) );

        // we will render a textured quad on the rtt target with a fixed texture without
        // motion
        var textureQuad = osg.createTexturedQuadGeometry( 0, 0, 0,
            rttSize[ 0 ], 0, 0,
            0, rttSize[ 1 ], 0 );
        textureQuad.getOrCreateStateSet().setTextureAttributeAndModes( 0, osg.Texture.createFromURL( 'textures/sol_trauma_periph.png' ) );
        rttCamera.addChild( textureQuad );

        // we attach the target texture to our camera
        var rttTargetTexture = new osg.Texture();
        rttTargetTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
        rttTargetTexture.setMinFilter( 'LINEAR' );
        rttTargetTexture.setMagFilter( 'LINEAR' );
        rttCamera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTargetTexture );



        // now we want to use the result of the previous rtt
        // for this we will create a textured quad that will use the rtt
        // target texture
        var texturedQuadUsingTargetTexture = osg.createTexturedQuadGeometry( -25, -25, 0,
            50, 0, 0,
            0, 50, 0 );
        texturedQuadUsingTargetTexture.getOrCreateStateSet().setTextureAttributeAndModes( 0, rttTargetTexture );

        var root = new osg.Node();

        // we add this quad to manipulate it with the mouse
        root.addChild( texturedQuadUsingTargetTexture );

        // we create a ortho camera to display the rtt in hud like
        var hudCamera = new osg.Camera();

        osg.Matrix.makeOrtho( 0, canvas.width, 0, canvas.height, -5, 5, hudCamera.getProjectionMatrix() );
        osg.Matrix.makeTranslate( 25, 25, 0, hudCamera.getViewMatrix() );
        hudCamera.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );
        hudCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );

        hudCamera.addChild( texturedQuadUsingTargetTexture );

        root.addChild( hudCamera );
        root.addChild( rttCamera );

        return root;
    }

    var main = function () {

        var viewer = new osgViewer.Viewer( document.getElementById( 'View' ) );
        viewer.init();
        viewer.setSceneData( createScene() );
        //var m = new osgGA.FirstPersonManipulator();
        viewer.setupManipulator();
        viewer.run();
    };

    window.addEventListener( 'load', main, true );
} )();
