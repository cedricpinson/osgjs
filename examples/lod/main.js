/**
 * @author Jordi Torres
 */

'use strict';

var OSG = window.OSG;
OSG.globalify();
var osg = window.osg;
var osgDB = window.osgDB;
var osgViewer = window.osgViewer;

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
        Q.when( osgDB.parseSceneGraph( getModelB() ) ).then( function ( o ) {
            lodNode.addChild( o, 0, 50 );
        } );

        Q.when( osgDB.parseSceneGraph( getModel() ) ).then( function ( data ) {
            lodNode.addChild( data, 50, Infinity );
        } );
        return lodNode;
    }

    viewer.setSceneData( createScene() );
    viewer.setupManipulator();
    viewer.run();
};

window.addEventListener( 'load', main, true );
