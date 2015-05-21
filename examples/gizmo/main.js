( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;

    var createScene = function ( viewer ) {
        var root = new osg.Node();
        osgDB.readNodeURL( '../media/models/material-test/file.osgjs' ).then( function ( node ) {
            root.addChild( node );
            var gizmo = new osgUtil.NodeGizmo( viewer );
            gizmo._autoInsertMT = true;
            root.addChild( gizmo );
            viewer.getManipulator().computeHomePosition();
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
} )();
