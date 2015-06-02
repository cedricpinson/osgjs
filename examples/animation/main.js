'use strict';

var Q = window.Q;
var OSG = window.OSG;
var osg = OSG.osg;
//var osgAnimation = OSG.osgAnimation;
//var osgUtil = OSG.osgUtil;
var osgViewer = OSG.osgViewer;
var osgDB = OSG.osgDB;

var createScene = function ( viewer ) {

    var root = new osg.Node();

    var request = osgDB.readNodeURL( '../media/models/animation/4x4_anim.osgjs' );

    request.then( function ( node ) {
        root.addChild( node );

        viewer.getManipulator().computeHomePosition();

        osg.setNotifyLevel( osg.ERROR );
    } );
    return root;
};


var onLoad = function () {
    var canvas = document.getElementById( 'View' );

    var viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    viewer.setSceneData( createScene( viewer ) );
    viewer.setupManipulator();
    viewer.run();
};

window.addEventListener( 'load', onLoad, true );
