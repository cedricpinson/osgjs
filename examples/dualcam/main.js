( function () {
    'use strict';

    var viewer;

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgGA = OSG.osgGA;
    var osgDB = OSG.osgDB;
    var osgUtil = OSG.osgUtil;
    var osgViewer = OSG.osgViewer;

    function loadScene( viewer ) {
        var root = new osg.MatrixTransform();
        osg.Matrix.makeRotate( Math.PI, 0, 0, 1, root.getMatrix() );
        viewer.setSceneData( root );

        osgDB.readNodeURL( '../media/models/material-test/file.osgjs' ).then( function ( model ) {
            root.addChild( model );

            // setup manipulator
            // viewer.setupManipulator( new osgGA.FirstPersonManipulator() );
            viewer.setupManipulator( new osgGA.OrbitManipulator() );
            viewer.getManipulator().setNode( viewer.getSceneData() );
            viewer.getManipulator().computeHomePosition();
        } );
    }

    // Find the right method, call on correct element
    function launchFullscreen( element, hmd ) {
        if ( element.requestFullscreen ) {
            element.requestFullscreen( hmd );
        } else if ( element.mozRequestFullScreen ) {
            element.mozRequestFullScreen( hmd );
        } else if ( element.webkitRequestFullscreen ) {
            element.webkitRequestFullscreen( hmd );
        } else if ( element.msRequestFullscreen ) {
            element.msRequestFullscreen( hmd );
        }
    }

    function exitFullscreen() {
        if ( document.exitFullscreen ) {
            document.exitFullscreen();
        } else if ( document.mozCancelFullScreen ) {
            document.mozCancelFullScreen();
        } else if ( document.webkitExitFullscreen ) {
            document.webkitExitFullscreen();
        }
    }

    var vrNode;
    var modelNode;
    var vrState = false;
    var fullscreen = false;

    function toggleVR() {

        var sceneData = viewer.getSceneData();

        // Enable VR
        if ( !vrState ) {

            // Detach the model from sceneData and cache it
            modelNode = sceneData.getChildren()[ 0 ];
            sceneData.removeChild( modelNode );

            // If no vrNode (first time vr is toggled), create one
            // The modelNode will be attached to it
            if ( !vrNode ) {
                if ( navigator.getVRDevices || navigator.mozGetVRDevices )
                    vrNode = osgUtil.WebVR.createScene( viewer, modelNode, viewer._eventProxy.Oculus.getHmd() );
                else
                    vrNode = osgUtil.Oculus.createScene( viewer, modelNode, {
                        isCardboard: true
                    } );
            }

            // Attach the vrNode to sceneData instead of the model
            sceneData.addChild( vrNode );
        }
        // Disable VR
        else {
            // Detach the vrNode and reattach the modelNode
            sceneData.removeChild( vrNode );
            sceneData.addChild( modelNode );
        }

        vrState = !vrState;
    }

    // On some platforms, (chrome * android), this event is fired too early
    // And the WebVR retrieve the canvas size before the canvas gets resized to fullscreen
    // So we could add a little delay via setTimeout to ensure we get the fullscreen size

    // Prefixed on Firefox up to v33
    document.addEventListener( 'mozfullscreenchange', function () {
        toggleVR();
        fullscreen = !fullscreen;
    } );
    // Prefixed on Chrome up to v38
    document.addEventListener( 'webkitfullscreenchange', function () {
        setTimeout( toggleVR, 500 );
        fullscreen = !fullscreen;
    } );
    document.addEventListener( 'msfullscreenchange', function () {
        toggleVR();
        fullscreen = !fullscreen;
    }, false );
    document.addEventListener( 'fullscreenchange', function () {
        toggleVR();
        fullscreen = !fullscreen;
    } );

    function requestVRFullscreen() {

        if ( !navigator.getVRDevices && !navigator.mozGetVRDevices ) {
            osg.log( 'WebVR Api is not supported by your navigator' );
        }

        var canvas = viewer.getGraphicContext().canvas;

        if ( fullscreen === false )
            launchFullscreen( canvas, {
                vrDisplay: viewer._eventProxy.Oculus.getHmd()
            } );
        else
            exitFullscreen();

        // var fullscreenRect = canvas.getBoundingClientRect();
        // console.log(fullscreenRect.width, fullscreenRect.height);
    }

    function init() {

        var canvas = document.getElementById( 'View' );

        viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        loadScene( viewer );
        viewer.run();

        var button = document.getElementById( 'button' );
        button.addEventListener( 'click', requestVRFullscreen, false );

        window.addEventListener( 'keypress', function ( event ) {
            if ( event.charCode === 'f'.charCodeAt( 0 ) )
                requestVRFullscreen();
        }, true );

    }

    window.addEventListener( 'load', init, true );
} )();
