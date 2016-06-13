'use strict';
var assert = require( 'chai' ).assert;
var Uniform = require( 'osg/Uniform' );


module.exports = function () {

    test( 'Uniform', function () {

        ( function () {
            var testInt = Uniform.createInt1( 12, 'int_uniform' );
            var testFloat = Uniform.createFloat1( 6.283, 'float_uniform' );
            var testVec3 = Uniform.createFloat3( [ 3.14, 6.28, 1.44 ], 'vec3_uniform' );
            var testFloatArray = Uniform.createFloat1( new Float32Array( [ 42.314 ] ), 'float_array_uniform' );
            var testIntArray = Uniform.createInt1( new Int32Array( [ 1234 ] ), 'int_array_uniform' );

            assert.isOk( Uniform.isUniform( testInt ) === true, 'is uniform' );
            assert.isOk( Uniform.isUniform( testFloat ) === true, 'is uniform' );
            assert.isOk( Uniform.isUniform( testVec3 ) === true, 'is uniform' );
            assert.isOk( Uniform.isUniform( testFloatArray ) === true, 'is uniform' );
            assert.isOk( Uniform.isUniform( testIntArray ) === true, 'is uniform' );
            assert.isOk( Uniform.isUniform( 'text' ) === false, 'is not uniform' );
            assert.isOk( Uniform.isUniform( 65 ) === false, 'is not uniform' );
        } )();

    } );
};
