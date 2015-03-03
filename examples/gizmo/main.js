'use strict';

var Q = window.Q;
var OSG = window.OSG;
var osg = window.osg;
var osgUtil = window.osgUtil;
var osgViewer = window.osgViewer;
var osgDB = window.osgDB;

var createScene = function ( viewer ) {
    var root = new osg.Node();

    var request = osgDB.readNodeURL( '../media/models/material-test/file.osgjs' );
    Q( request ).then( function ( node ) {
        root.addChild( node );
        var gizmo = new osgUtil.NodeGizmo( viewer );
        gizmo._autoInsertMT = true;
        root.addChild( gizmo );
        viewer.getManipulator().computeHomePosition();
    } );

    return root;
};

var onLoad = function () {
    OSG.globalify();

    var canvas = document.getElementById( 'View' );

    var viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    viewer.setSceneData( createScene( viewer ) );
    viewer.setupManipulator();
    viewer.run();
};

window.addEventListener( 'load', onLoad, true );
