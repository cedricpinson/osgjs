define( [
    'tests/mockup/mockup',
    'osg/Quat',
    'osg/Matrix'
], function ( mockup, Quat, Matrix ) {

    return function () {

        module( 'osg' );

        test( 'Quat.init', function () {
            var q = [];
            Quat.init( q );
            deepEqual( q, [ 0, 0, 0, 1 ] );
        } );

        test( 'Quat.makeRotate', function () {
            var q0 = Quat.makeRotate( Math.PI, 1, 0, 0, [] );
            mockup.near( q0, [ 1, 0, 0, 6.12303e-17 ], 1e-5 );

            var q1 = Quat.makeRotate( Math.PI / 2, 0, 1, 0, [] );
            mockup.near( q1, [ 0, 0.707107, 0, 0.707107 ] );

            var q2 = Quat.makeRotate( Math.PI / 4, 0, 0, 1, [] );
            mockup.near( q2, [ 0, 0, 0.382683, 0.92388 ] );
        } );

        // test('Quat.rotateVec3', function() {
        //     var q0 = Quat.makeRotate(Math.PI, 1, 0, 0);
        //     var result = Quat.rotateVec3(q0, [10, 0,0], []);
        //     near(result , [-10.0, 0, 0]);
        // });

        test( 'Quat.mult', function () {
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
            // consistenty

            mockup.near( Quat.mult( q2, Quat.mult( q1, q0, [] ), [] ), [ 0.653281, 0.270598, -0.653281, 0.270598 ] );
        } );

        test( 'Quat.slerp', function () {
            var q = [];
            Quat.slerp( 0.5, [ 0, 0.707107, 0, 0.707107 ], [ 0, 0, 0.382683, 0.92388 ], q );
            mockup.near( q, [ 0, 0.388863, 0.210451, 0.896937 ] );
        } );
    };
} );
