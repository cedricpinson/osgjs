( function () {

    var osg = window.OSG.osg;
    var osgViewer = window.OSG.osgViewer;
    var osgDB = window.OSG.osgDB;
    var getModel = window.getModel;

    window.addEventListener(
        'load',
        function () {

            var canvas = document.getElementById( 'View' );

            var viewer;
            viewer = new osgViewer.Viewer( canvas );
            viewer.init();
            viewer.setupManipulator();
            var rotate = new osg.MatrixTransform();
            osg.Matrix.makeRotate( -Math.PI * 0.5, 1, 0, 0, rotate.getMatrix() );
            Q.when( osgDB.parseSceneGraph( getModel() ) ).then( function ( data ) {
                rotate.addChild( data );
            } );
            viewer.setSceneData( rotate );
            viewer.run();
        }, true );

} )();
