define( [
    'tests/mockup/mockup',
    'osg/Matrix',
    'osg/Notify'
], function ( mockup, Matrix, Notify ) {

    return function () {

        module( 'osg' );

        test( 'Matrix.makeRotateFromQuat', function () {
            var m = [];
            Matrix.makeRotateFromQuat( [ 0.653281, 0.270598, -0.653281, 0.270598 ], m );
            mockup.near( m, [ 1.66533e-16, 1.11022e-16, -1, 0,
                0.707107, -0.707107, 0, 0, -0.707107, -0.707107, -1.66533e-16, 0,
                0, 0, 0, 1
            ] );
        } );

        test( 'Matrix.getRotate', function () {
            var m = [];
            Matrix.makeRotateFromQuat( [ 0.653281, 0.270598, -0.653281, 0.270598 ], m );
            var q = Matrix.getRotate( m );
            mockup.near( q, [ 0.653281, 0.270598, -0.653281, 0.270598 ] );

        } );

        test( 'Matrix.getPerspective', function () {
            var m = [];
            Matrix.makePerspective( 60, 800 / 200, 2.0, 500.0, m );
            var r = {};
            Matrix.getPerspective( m, r );
            mockup.near( r.zNear, 2.0 );
            mockup.near( r.zFar, 500.0 );
            mockup.near( r.fovy, 60.0 );
            mockup.near( r.aspectRatio, 4.0 );
        } );

        test( 'Matrix.makeLookAt', function () {
            var m = Matrix.makeLookAt( [ 0, -10, 0 ], [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 1.0 ] );
            mockup.near( m, [ 1, 0, -0, 0,
                0, 0, -1, 0,
                0, 1, -0, 0,
                0, 0, -10, 1
            ] );


            var m2 = Matrix.makeLookAt( [ 0, 0, -10 ], [ 0.0, 0.0, 0.0 ], [ 0.0, 1.0, 0.0 ] );
            mockup.near( m2, [ -1, 0, -0, 0,
                0, 1, -0, 0,
                0, -0, -1, 0,
                0, 0, -10, 1
            ] );

        } );

        test( 'Matrix.computeFrustrumCornersVectors', function () {
            var m = [];
            var ratio = 16.0 / 9.0;
            Matrix.makePerspective( 45, ratio, 1.0, 100.0, m );

            var ymax = 1.0 * Math.tan( 45 * Math.PI / 360.0 );
            var ymin = -ymax;
            var xmin = ymin * ratio;
            var xmax = ymax * ratio;

            var corners = [];
            corners.push( [ xmin, ymax, 1.0 ] );
            corners.push( [ xmin, ymin, 1.0 ] );
            corners.push( [ xmax, ymin, 1.0 ] );
            corners.push( [ xmax, ymax, 1.0 ] );

            var vectors = [];
            Matrix.computeFrustrumCornersVectors( m, vectors );
            // Notify.log( corners );
            // Notify.log( vectors );
            mockup.near( vectors[ 0 ], corners[ 0 ] );
            mockup.near( vectors[ 1 ], corners[ 1 ] );
            mockup.near( vectors[ 2 ], corners[ 2 ] );
            mockup.near( vectors[ 3 ], corners[ 3 ] );
            ok( true, 'check computeFrustrumVectors' );
        } );

        test( 'Matrix.getLookAt', function () {
            var m = Matrix.makeLookAt( [ 0, -10, 0 ], [ 0.0, 5.0, 0.0 ], [ 0.0, 0.0, 1.0 ] );
            var eye = [];
            var target = [];
            var up = [];
            Matrix.getLookAt( m,
                eye,
                target,
                up, 5.0 );
            mockup.near( eye, [ 0, -10, 0 ] );
            mockup.near( target, [ 0, -5.0, 0 ] ); // should be five but mimic same behaviour as OpenSceneGraph
            mockup.near( up, [ 0, 0, 1 ] );
        } );

        test( 'Matrix.transformVec3', function () {
            var m = Matrix.makeRotate( Math.PI / 2.0, 0, 1, 0, [] );
            var vec = [ 0, 0, 10 ];
            var inv = [];
            Matrix.inverse( m, inv );
            var res = Matrix.transformVec3( inv, vec, [] );
            mockup.near( res, [ 10, 0, 0 ] );

            var res2 = Matrix.transformVec3( m, res, [] );
            mockup.near( res2, [ 0, 0, 10 ] );


            m = [ -0.00003499092540543186, 0, 0, 0, 0, 0.00003499092540543186, 0, 0, 0, 0, 1.8163636363636322, -9.989999999999977, 0.013996370162172783, -0.010497277621629587, -1.7999999999999958, 9.999999999999977 ];
            var preMultVec3 = function ( s, vec, result ) {
                if ( result === undefined ) {
                    result = [];
                }
                var d = 1.0 / ( s[ 3 ] * vec[ 0 ] + s[ 7 ] * vec[ 1 ] + s[ 11 ] * vec[ 2 ] + s[ 15 ] );
                result[ 0 ] = ( s[ 0 ] * vec[ 0 ] + s[ 4 ] * vec[ 1 ] + s[ 8 ] * vec[ 2 ] + s[ 12 ] ) * d;
                result[ 1 ] = ( s[ 1 ] * vec[ 0 ] + s[ 5 ] * vec[ 1 ] + s[ 9 ] * vec[ 2 ] + s[ 13 ] ) * d;
                result[ 2 ] = ( s[ 2 ] * vec[ 0 ] + s[ 6 ] * vec[ 1 ] + s[ 10 ] * vec[ 2 ] + s[ 14 ] ) * d;
                return result;
            };
            var r0 = preMultVec3( m, [ 400, 300, 1 ] );
            Matrix.transformVec3( m, [ 400, 300, 1 ], res );
            mockup.near( res, r0 );

        } );

        test( 'Matrix.transpose', function () {
            var m = [ 0, 1, 2, 3,
                4, 5, 6, 7,
                8, 9, 10, 11,
                12, 13, 14, 15
            ];
            var res = Matrix.transpose( m, [] );
            mockup.near( res, [ 0, 4, 8, 12,
                1, 5, 9, 13,
                2, 6, 10, 14,
                3, 7, 11, 15
            ] );

            var res2 = Matrix.transpose( m, [] );
            mockup.near( res2, [ 0, 4, 8, 12,
                1, 5, 9, 13,
                2, 6, 10, 14,
                3, 7, 11, 15
            ] );

            var res3 = Matrix.transpose( m, m );
            mockup.near( res3, [ 0, 4, 8, 12,
                1, 5, 9, 13,
                2, 6, 10, 14,
                3, 7, 11, 15
            ] );
        } );

        test( 'Matrix.makeRotate', function () {
            var res = Matrix.makeRotate( 0, 0, 0, 1, [] );
            mockup.near( res, [ 1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ] );
        } );

        test( 'Matrix.mult', function () {
            var width = 800;
            var height = 600;
            var translate;
            var scale;

            translate = Matrix.makeTranslate( 1.0, 1.0, 1.0 );
            scale = Matrix.makeScale( 0.5 * width, 0.5 * height, 0.5 );
            var res = Matrix.mult( scale, translate, [] );
            mockup.near( res, [ 400, 0, 0, 0,
                0, 300, 0, 0,
                0, 0, 0.5, 0,
                400, 300, 0.5, 1
            ] );

            translate = Matrix.makeTranslate( 1.0, 1.0, 1.0 );
            scale = Matrix.makeScale( 0.5 * width, 0.5 * height, 0.5 );
            res = Matrix.preMult( scale, translate );
            ok( mockup.check_near( res, [ 400, 0, 0, 0,
                0, 300, 0, 0,
                0, 0, 0.5, 0,
                400, 300, 0.5, 1
            ] ), 'check preMult' );

            translate = Matrix.makeTranslate( 1.0, 1.0, 1.0 );
            scale = Matrix.makeScale( 0.5 * width, 0.5 * height, 0.5 );
            res = Matrix.postMult( scale, translate );
            ok( mockup.check_near( res, [ 400, 0, 0, 0,
                0, 300, 0, 0,
                0, 0, 0.5, 0,
                400, 300, 0.5, 1
            ] ), 'check postMult' );

            // test to check equivalent
            translate = Matrix.makeTranslate( 1.0, 1.0, 1.0 );
            scale = Matrix.makeScale( 0.5 * width, 0.5 * height, 0.5 );

            var ident = Matrix.makeIdentity( [] );
            Matrix.preMult( ident, scale );

            Matrix.preMult( ident, translate );
            mockup.near( ident, [ 400, 0, 0, 0,
                0, 300, 0, 0,
                0, 0, 0.5, 0,
                400, 300, 0.5, 1
            ] );
            Matrix.preMult( scale, translate );
            mockup.near( scale, [ 400, 0, 0, 0,
                0, 300, 0, 0,
                0, 0, 0.5, 0,
                400, 300, 0.5, 1
            ] );

        } );

        test( 'Matrix.inverse4x3', function () {

            var m = [ 1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                10,
                10,
                10,
                1
            ];

            var result = [];
            var valid = Matrix.inverse4x3( m, result );
            ok( true, valid );
            mockup.near( result, [ 1.0, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0, -10, -10, -10, 1
            ] );


            var m1 = [ 0.0011258089383161401, 0.00131216109033401, -0.0012747534698732, 0, -0.0002278837182292197, 0.0015857257043203033, 0.0014309996929286388, 0,
                0.0018151705324519383, -0.0006147558241282602, 0.0009702887644753271, 0,
                0, 0, 0, 1
            ];
            var m1result = [];
            var ok1 = Matrix.inverse4x3( m1, m1result );
            mockup.near( m1result, [ 243.988, -49.3875, 393.386, 0,
                284.374, 343.661, -133.23, 0, -276.267, 310.128, 210.282, 0, -0, -0, -0, 1
            ], 1e-3 );

            var m2 = [ 0.0011258089383161401, -0.0002278837182292197, 0.0018151705324519383, 0,
                0.00131216109033401, 0.0015857257043203033, -0.0006147558241282602, 0, -0.0012747534698732, 0.0014309996929286388, 0.0009702887644753271, 0,
                0, 0, 0, 1
            ];
            var m2result = [];
            var ok2 = Matrix.inverse4x3( m2, m2result );
            mockup.near( m2result, [ 243.988, 284.374, -276.267, 0, -49.3875, 343.661, 310.128, 0,
                393.386, -133.23, 210.282, 0, -0, -0, -0, 1
            ], 1e-3 );

        } );

        test( 'Matrix.inverse', function () {
            var result = [];
            var m = [ -1144.3119511948212,
                23.865014474735936, -0.12300358188893337, -0.12288057830704444, -1553.3126291998985, -1441.499918560778, -1.619653642392287, -1.6180339887498945,
                0.0,
                0.0,
                0.0,
                0.0,
                25190.498321578874,
                13410.539616344166,
                21.885543812039796,
                21.963658268227753
            ];

            ok( true, Matrix.inverse( m, result ) );

            var result2 = [];
            var m2 = [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1375333.5195828325, -4275596.259263198, 4514838.703939765, 1.0 ];
            var valid = Matrix.inverse( m2, result2 );
            ok( true, valid );
            Notify.log( 'inverse ' + result2.toString() );
            //    ok(true, valid);


        } );

        test( 'Matrix.makePerspective', function () {
            var result = [];
            var m = [ 1.299038105676658, 0, 0, 0, 0, 1.7320508075688774, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -2.0020020020020022, 0 ];
            var res = Matrix.makePerspective( 60, 800 / 600, 1.0, 1000 );
            ok( mockup.check_near( res, m ), 'makePerspective should be ' + m + ' and is ' + res );
        } );
    };
} );
