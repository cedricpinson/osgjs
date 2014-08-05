'use strict';

var viewer;

var OSG = window.OSG;
OSG.globalify();

var osg = window.osg;
var osgGA = window.osgGA;
var osgUtil = window.osgUtil;
var osgDB = window.osgDB;
var osgViewer = window.osgViewer;

var viewer;

function setupScene( viewer, sceneData ) {
    // load scene... as usual
    viewer.setSceneData( sceneData );

    // setup manipulator
    viewer.setupManipulator( new osgGA.OrbitManipulator() );
    viewer.getManipulator().setNode( viewer.getSceneData() );
    viewer.getManipulator().computeHomePosition();
    viewer.getManipulator().setEyePosition( [ 0, -10, 5 ] );

    viewer.run();
}

function onSceneLoaded( viewer, data ) {

    new Q( osgDB.parseSceneGraph( data ) ).then( function ( sceneData ) {
        setupScene( viewer, sceneData );
    } );
}


function onURLloaded( url, viewer ) {
    osg.log( 'loading ' + url );
    var req = new XMLHttpRequest();
    req.open( 'GET', url, true );
    req.onload = function () {
        onSceneLoaded( viewer, JSON.parse( req.responseText ) );
        osg.log( 'success ' + url );
    };
    req.onerror = function () {
        osg.log( 'error ' + url );
    };
    req.send( null );
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
                vrNode = osgUtil.Oculus.createScene( viewer, modelNode );
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
    viewer.setLightingMode( osgViewer.View.LightingMode.SKYLIGHT );

    // onSceneLoaded( viewer, getPokerScene() );
    // setupScene( viewer, getSimpleScene() );
    onURLloaded( 'models/ogre.osgjs', viewer );

    var button = document.getElementById( 'button' );
    button.addEventListener( 'click', requestVRFullscreen, false );

    window.addEventListener( 'keypress',
        function ( event ) {
            if ( event.charCode === 'f'.charCodeAt( 0 ) )
                requestVRFullscreen();
        }, true );

}

window.addEventListener( 'load', init, true );
