define( [
    'osg/MatrixTransform',
    'osg/Matrix',
    'osgDB/ReaderParser'
], function ( MatrixTransform, Matrix, ReaderParser ) {

    return function () {

        module( 'MatrixTransform' );

        test( 'Test MatrixTransform', function () {

            var n = new MatrixTransform();
            var scene = ReaderParser.parseSceneGraph( getBoxScene() );
            n.setMatrix( Matrix.makeTranslate( 100, 0, 0 ) );
            n.addChild( scene );
            var bs = n.getBound();
            near( bs.center(), [ 100, 0, 0 ] );
            near( bs.radius(), 2.414213562373095 );
        } );
    };
} );