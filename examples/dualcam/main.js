'use strict';

function onSceneLoaded( viewer, data, HMDconfig ) {
    Q.when( osgDB.parseSceneGraph( data ) ).then( function ( child ) {
        // load scene... as usual
        var nodeSingleCamera = new osg.Node();
        viewer.getScene().addChild( nodeSingleCamera );
        nodeSingleCamera.addChild( child );

        // append 2 rtt camera to the viewer (with child as the rtt scene)
        var nodeDoubleCamera = osgUtil.Oculus.createScene( viewer, child );
        viewer.getScene().addChild( nodeDoubleCamera );
        // we disable the single camera path
        nodeSingleCamera.setNodeMask( 0x0 );

        // setup manipulator
        viewer.setupManipulator( new osgGA.FirstPersonManipulator() );
        viewer.getManipulator().setNode( viewer.getScene() );
        viewer.getManipulator().computeHomePosition();

        viewer.run();
    } );
};

function onURLloaded( url, viewer, HMDconfig ) {
    osg.log( 'loading ' + url );
    var req = new XMLHttpRequest();
    req.open( 'GET', url, true );
    req.onload = function ( aEvt ) {
        onSceneLoaded( viewer, JSON.parse( req.responseText ), HMDconfig );
        osg.log( 'success ' + url );
    };
    req.onerror = function ( aEvt ) {
        osg.log( 'error ' + url );
    };
    req.send( null );
};

function init() {
    OSG.globalify();

    try {
        var canvas = document.getElementById( '3DView' );
        canvas.style.width = canvas.width = window.innerWidth;
        canvas.style.height = canvas.height = window.innerHeight;

        var viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        onSceneLoaded( viewer, getPokerScene() );
        // onURLloaded( 'models/ogre.osgjs', viewer, HMDconfig );
    } catch ( e ) {
        console.log( e );
    }
};

window.addEventListener( 'load', init, true );
