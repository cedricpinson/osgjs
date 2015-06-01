( function () {
    /**
     * @author Jordi Torres
     */

    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgViewer = OSG.osgViewer;

    var main = function () {
        osg.ReportWebGLError = true;
        var canvas = document.getElementById( 'View' );

        var viewer = new osgViewer.Viewer( canvas, {
            antialias: true,
            alpha: true
        } );
        viewer.init();
        viewer.setupManipulator();

        function createScene() {
            var lodNode = new osg.Lod();
            P.resolve( osgDB.parseSceneGraph( window.getModelB() ) ).then( function ( o ) {
                lodNode.addChild( o, 0, 50 );
            } );

            P.resolve( osgDB.parseSceneGraph( window.getModel() ) ).then( function ( data ) {
                lodNode.addChild( data, 50, Infinity );
            } );
            return lodNode;
        }

        viewer.setSceneData( createScene() );
        viewer.setupManipulator();
        viewer.run();
    };

    window.addEventListener( 'load', main, true );
} )();
