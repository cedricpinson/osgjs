'use strict';

var Example = function () {};

Example.prototype = {

    run: function () {


        var OSG = window.OSG;
        var osgViewer = OSG.osgViewer;
        var osg = OSG.osg;


        var canvas = document.getElementById( 'View' );

        var viewer;
        viewer = new osgViewer.Viewer( canvas );
        viewer.init();

        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );


        // the root node
        var scene = new osg.Node();

        // instanciate a node that contains matrix to transform the subgraph
        var matrixTransform = new osg.MatrixTransform();

        // create the model
        var model = this.createModel();

        // the scene is a child of the transform so everything that
        // change the transform will affect its children
        matrixTransform.addChild( model );


        // config to let data gui change the scale
        var config = {
            scale: 1.0
        };
        var gui = new window.dat.GUI();
        var controller = gui.add( config, 'scale', 0.1, 2.0 );
        controller.onChange( function ( value ) {
            // change the matrix
            osg.Matrix.makeScale( value, value, value, matrixTransform.getMatrix() );
            matrixTransform.dirtyBound();
        });


        scene.addChild( matrixTransform );

        viewer.setSceneData( scene );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        viewer.run();
    },

    createModel: function () {
        var osg = window.OSG.osg;
        return osg.createTexturedBoxGeometry();
    }
};



window.addEventListener( 'load', function () {
    var example = new Example();
    example.run();
}, true );
