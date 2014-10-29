( function () {
    'use strict';

    var OSG = window.OSG;
    OSG.globalify();
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var $ = window.$;

    var Example = function () {};

    Example.prototype = {

        // This function will create a basic scene with some cubes
        createScene: function () {
            var root = new osg.Node();

            var group1 = new osg.MatrixTransform();
            var group21 = new osg.MatrixTransform();
            var group22 = new osg.MatrixTransform();
            var group3 = new osg.MatrixTransform();
            var group31 = new osg.MatrixTransform();
            var group32 = new osg.MatrixTransform();
            var group4 = new osg.MatrixTransform();

            group1.setMatrix( osg.Matrix.makeTranslate( +5, 10, -5 ) );
            group21.setMatrix( osg.Matrix.makeTranslate( 0, 10, 0 ) );
            group22.setMatrix( osg.Matrix.makeTranslate( 10, 0, 0 ) );
            group3.setMatrix( osg.Matrix.makeTranslate( 0, 0, -5 ) );
            group31.setMatrix( osg.Matrix.makeTranslate( 0, -5, 0 ) );
            group32.setMatrix( osg.Matrix.makeTranslate( -5, 0, 0 ) );

            var ground1 = osg.createTexturedBox( 0, 0, 0, 6, 5, 4 );
            var ground2 = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );
            var ground3 = osg.createTexturedBox( 0, 0, 0, 1, 1, 1 );
            var ground31 = osg.createTexturedBox( 0, 0, 0, 1, 1, 1 );
            var ground32 = osg.createTexturedBox( 0, 0, 0, 1, 1, 1 );
            var ground4 = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );

            var material2 = new osg.Material();
            var material3 = new osg.Material();
            var material4 = new osg.Material();
            material2.setDiffuse( [ 0, 0, 1, 1 ] );
            material3.setDiffuse( [ 0, 1, 0, 1 ] );
            material4.setDiffuse( [ 1, 0, 0, 1 ] );
            ground2.getOrCreateStateSet().setAttributeAndMode( material2 );
            group3.getOrCreateStateSet().setAttributeAndMode( material3 );
            group4.getOrCreateStateSet().setAttributeAndMode( material4 );

            group1.addChild( ground1 );
            group21.addChild( ground2 );
            group22.addChild( ground2 );
            group3.addChild( ground3 );
            group3.addChild( group31 );
            group3.addChild( group32 );
            group31.addChild( ground31 );
            group32.addChild( ground32 );
            group4.addChild( ground4 );

            root.addChild( group1 );
            root.addChild( group21 );
            root.addChild( group22 );
            root.addChild( group3 );
            root.addChild( group4 );

            return root;
        },

        run: function ( canvas ) {

            var viewer;
            viewer = new osgViewer.Viewer( canvas, {
                antialias: true,
                alpha: true
            } );
            viewer.init();

            var rotate = new osg.MatrixTransform();
            var root = this.createScene();

            var visitor = new DebugVisitor;
            root.accept( visitor );

            visitor.createGraph();

            rotate.addChild( root );

            viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
            viewer.setSceneData( rotate );
            viewer.setupManipulator();
            viewer.getManipulator().computeHomePosition();

            viewer.run();
        }

    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas = $( '#View' )[ 0 ];
        example.run( canvas );
    }, true );

} )();
