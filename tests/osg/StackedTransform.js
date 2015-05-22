define( [
    'qunit',
    'tests/mockup/mockup',
    'osgAnimation/StackedTranslate',
    'osgAnimation/StackedRotateAxis',
    'osgAnimation/StackedMatrixElement',
    'osg/Matrix'
], function ( QUnit, mockup, StackedTranslate, StackedRotateAxis, StackedMatrixElement, Matrix ) {

    'use strict';

    return function () {

        QUnit.module( 'osg' );

        QUnit.test( 'StackedTransform', function () {

            // Test stack #1
            var st1 = new StackedTranslate( 'Translate01', [ 0.532384, 8.14555, 3.56053e-7 ] );

            var sra1 = new StackedRotateAxis( 'rotateZ', [ 0.0, 0.0, 1.0 ], 0.0 );
            var sra2 = new StackedRotateAxis( 'rotateY', [ 0.0, 1.0, 0.0 ], -1.5708 );
            var sra3 = new StackedRotateAxis( 'rotateX', [ 1.0, 0.0, 0.0 ], 1.5708 );

            var sme1 = new StackedMatrixElement( 'matrix', [ 1, 0, 0, 0,
                0, 2.22045e-16, -1, 0,
                0, 1, 2.22045e-16, 0,
                0, 0, 0, 1
            ] );

            var sme2 = new StackedMatrixElement( 'matrix', [ 0.1, 0, 0, 0,
                0, 0.1, 0, 0,
                0, 0, 0.1, 0,
                0, 0, 0, 1
            ] );

            var stack = [];

            stack.push( st1 );
            stack.push( sme1 );
            stack.push( sra1 );
            stack.push( sra2 );
            stack.push( sra3 );
            stack.push( sme2 );

            var matrix = new Matrix.create();

            var transforms = stack;
            for ( var i = 0, l = transforms.length; i < l; i++ ) {
                var transform = transforms[ i ];
                //transform.update();
                transform.applyToMatrix( matrix );
            }

            mockup.near( matrix, [ 3.13916e-08, 0.1, 2.22045e-17, 0, -0.1, 3.13916e-08, 2.8213e-08, 0, 2.8213e-08, -8.87873e-15, 0.1, 0, 0.532384, 8.14555, 3.56053e-07, 1 ], 'Check matrix stack 1' );

            // Test stack #2
            stack.length = 0;

            stack.push( new StackedMatrixElement( 'matrix', [ 1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                49.6894, -9.53674e-06, 2.17196e-06, 1
            ] ) );
            stack.push( new StackedRotateAxis( 'rotateZ', [ 0.0, 0.0, 1.0 ], 0.0141833 ) );
            stack.push( new StackedRotateAxis( 'rotateY', [ 0.0, 1.0, 0.0 ], -1.5396e-16 ) );
            stack.push( new StackedRotateAxis( 'rotateX', [ 1.0, 0.0, 0.0 ], 7.25343e-16 ) );

            matrix = Matrix.makeIdentity( matrix );

            transforms = stack;
            for ( var i = 0, l = transforms.length; i < l; i++ ) {
                var transform = transforms[ i ];
                //transform.update();
                transform.applyToMatrix( matrix );
            }

            mockup.near( matrix, [ 0.999899, 0.0141828, 1.5396e-16, 0, -0.0141828, 0.999899, 7.25343e-16, 0, -1.43657e-16, -7.27453e-16, 1, 0, 49.6894, -9.53674e-06, 2.17196e-06, 1 ], 'Check matrix stack 2' );
            //console.log( matrix );

            // Test stack #3
            stack.length = 0;

            stack.push( new StackedMatrixElement( 'matrix', [ 1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                50.0481, -5.24521e-06, 2.10004e-06, 1
            ] ) );
            stack.push( new StackedRotateAxis( 'rotateZ', [ 0.0, 0.0, 1.0 ], -0.0141826 ) );
            stack.push( new StackedRotateAxis( 'rotateY', [ 0.0, 1.0, 0.0 ], 5.60668e-17 ) );
            stack.push( new StackedRotateAxis( 'rotateX', [ 1.0, 0.0, 0.0 ], 7.25343e-16 ) );

            matrix = Matrix.makeIdentity( matrix );

            transforms = stack;
            for ( var i = 0, l = transforms.length; i < l; i++ ) {
                var transform = transforms[ i ];
                //transform.update();
                transform.applyToMatrix( matrix );
            }


            mockup.near( matrix, [ 0.999899, -0.0141821, -5.60668e-17, 0, 0.0141821, 0.999899, -1.42108e-14, 0, 2.57601e-16, 1.42086e-14, 1, 0, 50.0481, -5.24521e-06, 2.10004e-06, 1 ], 'Check matrix stack 3' );
            console.log( matrix );


            //transformFromSkeletonToGeometry * resultBoneMatrix * invTransformFromSkeletonToGeometry;

            var m1 = [ 0.1, 4.24127e-24, 0, 0, -4.24127e-24, 0.1, 1.62921e-08, 0, 6.90991e-31, -1.62921e-08, 0.1, 0, 0.5, 10.5, 4.5897e-07, 1 ];
            var m2 = [ 1, -1.50996e-07, -9.93411e-08, 0, 1.50996e-07, 1, -2.30412e-15, 0, 9.93411e-08, -1.2696e-14, 1, 0, 1.07659, 1.03406e-06, -1.86682e-07, 1 ];
            var m3 = [ 10, -4.24127e-22, 6.90991e-29, 0, 4.24127e-22, 10, -1.62921e-06, 0, 1.12104e-44, 1.62921e-06, 10, 0, -5, -105, 1.2517e-05, 1 ];

            var res = [ 1, -1.50996e-07, -9.93411e-08, 0, 1.50996e-07, 1, -2.30412e-15, 0, 9.93411e-08, -1.2696e-14, 1, 0, 10.766, 9.58564e-06, -2.36353e-06, 1 ];

            var result = Matrix.create();

            Matrix.mult( m3, m2, result );
            Matrix.preMult( result, m1 );


            mockup.near( result, res );



        } );
    };
} );
