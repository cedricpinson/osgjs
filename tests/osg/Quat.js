define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/Quat',
    'osg/Matrix'
], function ( QUnit, mockup, Quat, Matrix ) {

    'use strict';

    return function () {

        QUnit.module( 'osg' );


        // shared const
        var id = Quat.create(); // inited with identity
        var sqrt2 = Math.sqrt( 0.5 );

        // remarquable quaternion list
        var Y90Rot = [ sqrt2, 0.0, sqrt2, 0.0 ];
        var Y90RotNeg = [ -sqrt2, 0.0, -sqrt2, 0.0 ];
        var Y90RotNegX180Rot = [ 0.0, sqrt2, 0.0, sqrt2 ];
        var Y180Rot = [ 0.0, 0.0, 1.0, 0.0 ];
        var Y180X90NegRot = [ 0.0, 0.0, sqrt2, sqrt2 ];
        var Y45Rot = [ 0.5, 0, 0.5, 0.7071067811865475 ];
        var Y45RotNeg = [ -0.5, 0, -0.5, 0.7071067811865475 ];
        //[ 0, 0.38, 0, 0.92 ];


        QUnit.test( 'Quat.init', function () {
            var q = [];
            Quat.init( q );
            deepEqual( q, [ 0, 0, 0, 1 ] );
        } );

        QUnit.test( 'Quat.makeRotate', function () {
            var q0 = Quat.makeRotate( Math.PI, 1, 0, 0, [] );
            mockup.near( q0, [ 1, 0, 0, 6.12303e-17 ], 1e-5 );

            var q1 = Quat.makeRotate( Math.PI / 2, 0, 1, 0, [] );
            mockup.near( q1, [ 0, 0.707107, 0, 0.707107 ] );

            var q2 = Quat.makeRotate( Math.PI / 4, 0, 0, 1, [] );
            mockup.near( q2, [ 0, 0, 0.382683, 0.92388 ] );
        } );

        QUnit.test( 'Quat.makeRotateFromTo', function () {
            var q1 = Quat.makeRotateFromTo( [ 1, 0, 0 ], [ 0, 1, 0 ], [] );
            mockup.near( q1, [ 0, 0, 0.707107, 0.707107 ], 1e-5 );

            // it test both makeRotate and makeRotateFromTo
            var qyrot = Quat.makeRotate( Math.PI / 2, 0, 1, 0, [] );
            var q2 = Quat.makeRotateFromTo( [ 0, 0, 1 ], [ 1, 0, 0 ], [] );
            mockup.near( q2, qyrot, 1e-5 );
        } );

        // QUnit.test('Quat.rotateVec3', function() {
        //     var q0 = Quat.makeRotate(Math.PI, 1, 0, 0);
        //     var result = Quat.rotateVec3(q0, [10, 0,0], []);
        //     near(result , [-10.0, 0, 0]);
        // });

        QUnit.test( 'Quat.mult', function () {
            var q0 = Quat.makeRotate( Math.PI, 1, 0, 0, [] );
            var q1 = Quat.makeRotate( Math.PI / 2, 0, 1, 0, [] );
            var q2 = Quat.makeRotate( Math.PI / 4, 0, 0, 1, [] );

            var qr = [];
            Quat.mult( q1, q0, qr );
            mockup.near( qr, [ 0.707107, 4.32964e-17, -0.707107, 4.32964e-17 ] );

            // check consistency with quaternion and matrix multiplication order
            var m1 = [],
                m0 = [],
                mr = [];
            Matrix.makeRotateFromQuat( q1, m1 );
            Matrix.makeRotateFromQuat( q0, m0 );
            Matrix.mult( m1, m0, mr );

            var qr2 = [];
            Matrix.getRotate( mr, qr2 );
            mockup.near( qr, qr2 );
            // consistency

            mockup.near( Quat.mult( q2, Quat.mult( q1, q0, [] ), [] ), [ 0.653281, 0.270598, -0.653281, 0.270598 ] );
        } );

        QUnit.test( 'Quat.slerp', function () {

            var res = [ 0.0, 0.0, 0.0, 0.0 ];

            // t = 0.5, half the angle between Y90RotNegX180Rot and ?Z90Rot?
            Quat.slerp( 0.5, Y90RotNegX180Rot, [ 0, 0, 0.382683, 0.92388 ], res );
            mockup.near( res, [ 0, 0.388863, 0.210451, 0.896937 ] );

            Quat.slerp( 0.0, id, Y90Rot, res );
            mockup.near( res, id, 1e-5, 't = 0' );

            Quat.slerp( 1.0, id, Y90Rot, res );
            mockup.near( res, Y90Rot, 1e-5, 't = 1' );

            Quat.slerp( 0.5, id, Y90Rot, res );
            mockup.near( res, Y45Rot, 1e-5, '0 -> 90; t:0.5' );

            Quat.slerp( 0.5, Y90Rot, id, res );
            mockup.near( res, Y45Rot, 1e-5, '90 -> 0 t:0.5' );

            Quat.slerp( 0.5, id, Y90RotNeg, res );
            mockup.near( res, Y45RotNeg, 1e-5, 'shortest path t:0.5' );

            Quat.slerp( 0.5, Y90RotNeg, id, res );
            mockup.near( res, Y45RotNeg, 1e-5, 'shortest path inverted t:0.5' );

            Quat.slerp( 0.5, Y90Rot, Y90Rot, res );
            mockup.near( res, Y90Rot, 1e-5, 'same input t:0.5' );

            Quat.slerp( 0.5, id, Y180Rot, res );
            mockup.near( res, Y180X90NegRot, 1e-5, '0 to 180 t:0.5' );

            Quat.slerp( 0.5, id, [ 0.0, 0.0, 0.0, 0.999 ], res );
            mockup.near( res, id, 1e4, 'a~n, t:0.5' ); // less prec than nlerp

            Quat.slerp( 0.5, id, [ 0.0, 0.0, 0.0, -1.0 ], res );
            mockup.near( res, id, 1e-5, 'opposite sign, t:0.5' );
        } );

        QUnit.test( 'Quat.nlerp', function () {

            var res = [ 0.0, 0.0, 0.0, 0.0 ];

            // t = 0.5, half the angle between Y90RotNegX180Rot and ?Z90Rot?
            Quat.nlerp( 0.5, Y90RotNegX180Rot, [ 0, 0, 0.382683, 0.92388 ], res );
            mockup.near( res, [ 0, 0.388863, 0.210451, 0.896937 ] );

            Quat.nlerp( 0.0, id, Y90Rot, res );
            mockup.near( res, id, 1e-5, 't = 0' );

            Quat.nlerp( 1.0, id, Y90Rot, res );
            mockup.near( res, Y90Rot, 1e-5, 't = 1' );

            Quat.nlerp( 0.5, id, Y90Rot, res );
            mockup.near( res, Y45Rot, 1e-5, '0 -> 90; t:0.5' );

            Quat.nlerp( 0.5, Y90Rot, id, res );
            mockup.near( res, Y45Rot, 1e-5, '90 -> 0 t:0.5' );

            Quat.nlerp( 0.5, id, Y90RotNeg, res );
            mockup.near( res, Y45RotNeg, 1e-5, 'shortest path t:0.5' );

            Quat.nlerp( 0.5, Y90RotNeg, id, res );
            mockup.near( res, Y45RotNeg, 1e-5, 'shortest path inverted t:0.5' );

            Quat.nlerp( 0.5, Y90Rot, Y90Rot, res );
            mockup.near( res, Y90Rot, 1e-5, 'same input t:0.5' );

            Quat.nlerp( 0.5, id, Y180Rot, res );
            mockup.near( res, Y180X90NegRot, 1e-5, '0 to 180 t:0.5' );

            Quat.nlerp( 0.5, id, [ 0.0, 0.0, 0.0, 0.999 ], res );
            mockup.near( res, id, 1e-5, 'a~n, t:0.5' );

            Quat.nlerp( 0.5, id, [ 0.0, 0.0, 0.0, -1.0 ], res );
            mockup.near( res, id, 1e-5, 'opposite sign, t:0.5' );

        } );

        QUnit.test( 'Quat.transformVec3', function () {
            var v = [ 1.0, 2.0, 3.0 ];
            Quat.transformVec3( [ 0, 0.707107, 0, 0.707107 ], v, v );
            mockup.near( v, [ 3.0, 2.0, -1.0 ] );
        } );
    };
} );
