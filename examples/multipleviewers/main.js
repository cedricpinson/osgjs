( function () {
    'use strict';

    var $ = window.$;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgViewer = OSG.osgViewer;
    var Example = function () {
    };

    Example.prototype = {

        createScene1: function () {
            var size = 10;
            return osg.createTexturedQuadGeometry( -size / 2, 0, -size / 2,
                                                              size, 0, 0,
                                                              0, 0, size );
        },
        createScene2: function () {
            var size = 10;
            return osg.createTexturedQuadGeometry( -size / 2, 0, -size / 2,
                                                              size, 0, 0,
                                                              0, 0, size );
        },
        run: function ( canvas1, canvas2 ) {
            var viewer1 = new osgViewer.Viewer( canvas1 );
            var viewer2 = new osgViewer.Viewer( canvas2 );
            viewer1.init();
            viewer2.init();
            var scene1 = this.createScene1();
            var scene2 = this.createScene2();
            viewer1.setSceneData( scene1 );
            viewer1.setupManipulator();
            viewer1.getManipulator().computeHomePosition();
            viewer1.run();
            viewer2.setSceneData( scene2 );
            viewer2.setupManipulator();
            viewer2.getManipulator().computeHomePosition();
            viewer2.run();
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas1 = $( '#View1' )[ 0 ];
        var canvas2 = $( '#View2' )[ 0 ];
        example.run( canvas1, canvas2 );
    }, true );

} )();