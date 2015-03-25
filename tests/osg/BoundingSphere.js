define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/BoundingSphere',
    'osg/Node',
    'osg/Camera',
    'osg/TransformEnums',
    'osg/Shape',
    'osg/MatrixTransform',
    'osg/Matrix'
], function ( QUnit, mockup, BoundingSphere, Node, Camera, TransformEnums, Shape, MatrixTransform, Matrix ) {

    'use strict';

    return function () {

        QUnit.module( 'osg' );

        QUnit.test( 'BoundingSphere', function () {

            var simpleBoundingSphere = new BoundingSphere();
            ok( simpleBoundingSphere.valid() !== 1, 'BoundingSphere is invalid' );

            var bs0 = new BoundingSphere();
            bs0.expandByVec3( [ 1.0, 4.0, 0.0 ] );
            bs0.expandByVec3( [ 2.0, 3.0, 0.0 ] );
            bs0.expandByVec3( [ 3.0, 2.0, 0.0 ] );
            bs0.expandByVec3( [ 4.0, 1.0, 0.0 ] );

            var cbs0 = [ 2.5, 2.5, 0 ];
            var rbs0 = 2.12132;
            var centerisequalbs0 = mockup.checkNear( cbs0, bs0._center, 0.0001 ) & mockup.checkNear( rbs0, bs0._radius, 0.0001 );
            ok( centerisequalbs0, 'Expanding by vec3 -> bounding sphere test 1' );
            var bs1 = new BoundingSphere();
            bs1.expandByVec3( [ -1.0, 0.0, 0.0 ] );
            bs1.expandByVec3( [ 2.0, -3.0, 2.0 ] );
            bs1.expandByVec3( [ 3.0, 3.0, 1.0 ] );
            bs1.expandByVec3( [ 5.0, 5.0, 0.0 ] );

            var cbs1 = [ 2.00438, 0.862774, 0.784302 ];
            var rbs1 = 5.16774;
            var centerisequalbs1 = mockup.checkNear( cbs1, bs1._center, 0.0001 ) & mockup.checkNear( rbs1, bs1._radius, 0.0001 );
            ok( centerisequalbs1, 'Expanding by vec3 ->  bounding sphere test 2' );

            var bs01 = new BoundingSphere();
            bs01.expandByBoundingSphere( bs0 );

            var cbs010 = [ 2.5, 2.5, 0 ];
            var rbs010 = 2.12132;
            var centerisequalbs010 = mockup.checkNear( cbs010, bs01._center, 0.0001 ) & mockup.checkNear( rbs010, bs01._radius, 0.0001 );
            ok( centerisequalbs010, 'Expanding by BoundingSphere ->  bounding sphere test 1' );

            bs01.expandByBoundingSphere( bs1 );
            var cbs011 = [ 2.00438, 0.862774, 0.784302 ];
            var rbs011 = 5.16774;
            var centerisequalbs011 = mockup.checkNear( cbs011, bs01._center, 0.0001 ) & mockup.checkNear( rbs011, bs01._radius, 0.0001 );
            ok( centerisequalbs011, 'Expanding by BoundingSphere ->  bounding sphere test 2' );


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
