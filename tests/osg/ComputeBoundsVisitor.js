define( [
    'tests/mockup/mockup',
    'osg/ComputeBoundsVisitor',
    'osg/Geometry',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osg/Shape',

], function ( mockup, ComputeBoundsVisitor, Geometry, Matrix, MatrixTransform, Shape ) {

    return function () {

        module( 'osg' );

        test( 'ComputeBoundsVisitor', function () {

            ( function () {


                var root = new MatrixTransform();

                var child1 = new MatrixTransform();
                Matrix.makeTranslate( 10, 0,0, child1.getMatrix());

                var child2 = new MatrixTransform();
                Matrix.makeTranslate( -10, 0,0, child2.getMatrix());

                root.addChild( child1 );
                root.addChild( child2 );

                var shape = Shape.createTexturedBoxGeometry( 0,0,0, 5,5,5 );

                child1.addChild( shape );
                child2.addChild( shape );

                child2.setNodeMask( 0 );

                var bs = root.getBound();

                mockup.near( bs.radius(), 14.330127018922195 , 'Check radius of the scene' );

                var visitor = new ComputeBoundsVisitor();
                root.accept( visitor );

                mockup.near( visitor.getBoundingBox().corner(0), [ 7.5, -2.5, -2.5 ] , 'Check Min of bounding box' );
                mockup.near( visitor.getBoundingBox().corner(7), [ 12.5, 2.5, 2.5 ] , 'Check Max of bounding box' );


            } )();

        } );


    };
} );
