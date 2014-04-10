define( [
    'tests/mockup/mockup',
    'osg/BoundingSphere',
    'osg/Node',
    'osg/Camera',
    'osg/TransformEnums',
    'osg/Shape',
    'osg/MatrixTransform',
    'osg/Matrix'
], function ( mockup, BoundingSphere, Node, Camera, TransformEnums, Shape, MatrixTransform, Matrix ) {

    return function () {

        module( 'osg' );

        test( 'BoundingSphere', function () {

            var simpleBoundingSphere = new BoundingSphere();
            ok( simpleBoundingSphere.valid() !== 1, 'BoundingSphere is invalid' );

            var bs_0 = new BoundingSphere();
            bs_0.expandByVec3( [ 1.0, 4.0, 0.0 ] );
            bs_0.expandByVec3( [ 2.0, 3.0, 0.0 ] );
            bs_0.expandByVec3( [ 3.0, 2.0, 0.0 ] );
            bs_0.expandByVec3( [ 4.0, 1.0, 0.0 ] );

            c_bs_0 = [ 2.5, 2.5, 0 ];
            r_bs_0 = 2.12132;
            var center_is_equal_bs_0 = mockup.check_near( c_bs_0, bs_0._center, 0.0001 ) & mockup.check_near( r_bs_0, bs_0._radius, 0.0001 );
            ok( center_is_equal_bs_0, 'Expanding by vec3 -> bounding sphere test 1' );
            var bs_1 = new BoundingSphere();
            bs_1.expandByVec3( [ -1.0, 0.0, 0.0 ] );
            bs_1.expandByVec3( [ 2.0, -3.0, 2.0 ] );
            bs_1.expandByVec3( [ 3.0, 3.0, 1.0 ] );
            bs_1.expandByVec3( [ 5.0, 5.0, 0.0 ] );

            c_bs_1 = [ 2.00438, 0.862774, 0.784302 ];
            r_bs_1 = 5.16774;
            var center_is_equal_bs_1 = mockup.check_near( c_bs_1, bs_1._center, 0.0001 ) & mockup.check_near( r_bs_1, bs_1._radius, 0.0001 );
            ok( center_is_equal_bs_1, 'Expanding by vec3 ->  bounding sphere test 2' );

            var bs_01 = new BoundingSphere();
            bs_01.expandBy( bs_0 );

            c_bs_01_0 = [ 2.5, 2.5, 0 ];
            r_bs_01_0 = 2.12132;
            var center_is_equal_bs_01_0 = mockup.check_near( c_bs_01_0, bs_01._center, 0.0001 ) & mockup.check_near( r_bs_01_0, bs_01._radius, 0.0001 );
            ok( center_is_equal_bs_01_0, 'Expanding by BoundingSphere ->  bounding sphere test 1' );

            bs_01.expandBy( bs_1 );
            c_bs_01_1 = [ 2.00438, 0.862774, 0.784302 ];
            r_bs_01_1 = 5.16774;
            var center_is_equal_bs_01_1 = mockup.check_near( c_bs_01_1, bs_01._center, 0.0001 ) & mockup.check_near( r_bs_01_1, bs_01._radius, 0.0001 );
            ok( center_is_equal_bs_01_1, 'Expanding by BoundingSphere ->  bounding sphere test 2' );


            // test case with camera and absolute transform
            var main = new Node();
            var cam = new Camera();
            cam.setReferenceFrame( TransformEnums.ABSOLUTE_RF );
            var q = Shape.createTexturedQuadGeometry( -25, -25, 0,
                50, 0, 0,
                0, 50, 0 );
            main.addChild( q );
            var q2 = Shape.createTexturedQuadGeometry( -250, 0, 0,
                50, 0, 0,
                0, 50, 0 );
            cam.addChild( q2 );
            main.addChild( cam );
            var bscam = main.getBound();
            mockup.near( bscam.center(), [ 0, 0, 0 ] );


            // test case with invalid bounding sphere
            var main2 = new Node();
            var q3 = Shape.createTexturedQuadGeometry( -25, -25, 0,
                50, 0, 0,
                0, 50, 0 );
            var mt3 = new MatrixTransform();
            Matrix.makeTranslate( -1000, 0, 0, mt3.getMatrix() );
            main2.addChild( q3 );
            main2.addChild( mt3 );
            mockup.near( main2.getBound().center(), [ 0, 0, 0 ] );
        } );
    };
} );
