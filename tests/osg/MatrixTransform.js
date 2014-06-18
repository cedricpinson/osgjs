define( [
    'tests/mockup/mockup',
    'osg/MatrixTransform',
    'osg/Matrix',
    'osgDB/ReaderParser'
], function ( mockup, MatrixTransform, Matrix, ReaderParser ) {

    'use strict';

    return function () {

        module( 'osg' );

        test( 'MatrixTransform', function () {

            var n = new MatrixTransform();
            var scene = ReaderParser.parseSceneGraph( mockup.getBoxScene() );
            Matrix.makeTranslate( 100, 0, 0, n.getMatrix() );
            n.addChild( scene );
            var bs = n.getBound();
            mockup.near( bs.center(), [ 100, 0, 0 ] );
            mockup.near( bs.radius(), 2.414213562373095 );
        } );

        test( 'Transform', function () {

            var n = new MatrixTransform();
            var scene = ReaderParser.parseSceneGraph( mockup.getBoxScene() );
            Matrix.makeScale( 2, 3, 4, n.getMatrix() );
            n.addChild( scene );
            var bs = n.getBound();
            mockup.near( bs.center(), [ 0, 0, 0 ] );
            mockup.near( bs.radius(), 9.65685424949238 );
        } );
    };
} );
