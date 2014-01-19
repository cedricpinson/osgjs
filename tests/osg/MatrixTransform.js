define( [
    'tests/mockup/mockup',
    'osg/MatrixTransform',
    'osg/Matrix',
    'osgDB/ReaderParser'
], function ( mockup, MatrixTransform, Matrix, ReaderParser ) {

    return function () {

        module( 'osg' );

        test( 'MatrixTransform', function () {

            var n = new MatrixTransform();
            var scene = ReaderParser.parseSceneGraph( mockup.getBoxScene() );
            n.setMatrix( Matrix.makeTranslate( 100, 0, 0 ) );
            n.addChild( scene );
            var bs = n.getBound();
            mockup.near( bs.center(), [ 100, 0, 0 ] );
            mockup.near( bs.radius(), 2.414213562373095 );
        } );
    };
} );
