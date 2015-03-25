define( [
    'qunit',
    'osg/Uniform'
], function ( QUnit, Uniform ) {

    'use strict';

    return function () {

        QUnit.module( 'osg' );

        QUnit.test( 'Uniform', function () {

            ( function () {
                var testInt = Uniform.createInt1( 12, 'int_uniform' );
                var testFloat = Uniform.createFloat1( 6.283, 'float_uniform' );
                var testVec3 = Uniform.createFloat3( [ 3.14, 6.28, 1.44 ], 'vec3_uniform' );
                var testFloatArray = Uniform.createFloat1( new Float32Array( [ 42.314 ] ), 'float_array_uniform' );
                var testIntArray = Uniform.createInt1( new Int32Array( [ 1234 ] ), 'int_array_uniform' );

                ok( Uniform.isUniform( testInt ) === true, 'is uniform' );
                ok( Uniform.isUniform( testFloat ) === true, 'is uniform' );
                ok( Uniform.isUniform( testVec3 ) === true, 'is uniform' );
                ok( Uniform.isUniform( testFloatArray ) === true, 'is uniform' );
                ok( Uniform.isUniform( testIntArray ) === true, 'is uniform' );
                ok( Uniform.isUniform( 'text' ) === false, 'is not uniform' );
                ok( Uniform.isUniform( 65 ) === false, 'is not uniform' );
            } )();

        } );
    };
} );
