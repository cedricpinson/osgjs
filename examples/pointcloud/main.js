( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var getModel = window.getModel;

    window.addEventListener( 'load', function () {

        var canvas = document.getElementById( 'View' );

        var viewer;
        viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        viewer.setupManipulator();
        var rotate = new osg.MatrixTransform();
        osg.Matrix.makeRotate( Math.PI * 0.5, 1, 0, 0, rotate.getMatrix() );
        P.resolve( osgDB.parseSceneGraph( getModel() ) ).then( function ( data ) {
            rotate.addChild( data );
        } );
        viewer.setSceneData( rotate );
        viewer.run();
    }, true );

} )();
