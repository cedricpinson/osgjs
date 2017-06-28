'use strict';
var assert = require( 'chai' ).assert;
require( 'tests/mockup/mockup' );
var Camera = require( 'osg/Camera' );
var mat4 = require( 'osg/glMatrix' ).mat4;
var TransformEnums = require( 'osg/transformEnums' );


module.exports = function () {

    test( 'Camera', function () {

        var matrix = mat4.ortho( mat4.create(), -1, 1, -1, 1, -2, 2 );
        var camera = new Camera();
        camera.setProjectionMatrixAsOrtho( -1, 1, -1, 1, -2, 2 );
        assert.equalVector( matrix, camera.getProjectionMatrix(), 'check Camera.setProjectionMatrixAsOrtho' );
    } );

    test( 'Camera absolute vs relative', function () {

        var rotation = mat4.fromRotation( mat4.create(), -Math.PI * 0.5, [ 1.0, 0.0, 0.0 ] );
        var translate = mat4.fromTranslation( mat4.create(), [ 1, 0, 0 ] );
        var invRotation = mat4.create();
        mat4.invert( invRotation, rotation );


        var camera = new Camera();
        mat4.copy( camera.getViewMatrix(), rotation );

        var test = mat4.create();

        mat4.copy( test, translate );
        camera.computeLocalToWorldMatrix( test );
        assert.equalVector( test, mat4.mul( mat4.create(), translate, rotation ), 'Should expect Translation * Rotation' );

        mat4.copy( test, translate );
        camera.computeWorldToLocalMatrix( test );
        assert.equalVector( test, mat4.mul( mat4.create(), translate, invRotation ), 'Should expect Translation * invRotation' );

        camera.setReferenceFrame( TransformEnums.ABSOLUTE_RF );

        mat4.copy( test, translate );
        camera.computeLocalToWorldMatrix( test );
        assert.equalVector( test, rotation, 'Should expect Rotation' );

        mat4.copy( test, translate );
        camera.computeWorldToLocalMatrix( test );
        assert.equalVector( test, invRotation, 'Should expect invRotation' );


    } );
};
