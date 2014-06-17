define( [
    'osg/Uniform'
], function ( Uniform ) {

    return function () {

        module( 'osg' );

        test( 'Uniform', function () {

            ( function () {
                var test_int = Uniform.createInt1(12, 'int_uniform');
                var test_float = Uniform.createFloat1(6.283, 'float_uniform');
                var test_vec3 = Uniform.createFloat3([3.14, 6.28, 1.44], 'vec3_uniform');
                var test_float_array = Uniform.createFloat1(new Float32Array([42.314]), 'float_array_uniform');
                var test_int_array = Uniform.createInt1(new Int32Array([1234]), 'int_array_uniform');

                ok( Uniform.isUniform(test_int) === true, 'is uniform' );
                ok( Uniform.isUniform(test_float) === true, 'is uniform' );
                ok( Uniform.isUniform(test_vec3) === true, 'is uniform' );
                ok( Uniform.isUniform(test_float_array) === true, 'is uniform' );
                ok( Uniform.isUniform(test_int_array) === true, 'is uniform' );
                ok( Uniform.isUniform('text') === false, 'is not uniform' );
                ok( Uniform.isUniform(65) === false, 'is not uniform' );
            } )();

        } );
    };
} );
