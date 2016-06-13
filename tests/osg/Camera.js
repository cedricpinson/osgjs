'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var Camera = require( 'osg/Camera' );
var Matrix = require( 'osg/Matrix' );
var TransformEnums = require( 'osg/TransformEnums' );


module.exports = function () {

    test( 'Camera', function () {

        var matrix = Matrix.makeOrtho( -1, 1, -1, 1, -2, 2, Matrix.create() );
        var camera = new Camera();
        camera.setProjectionMatrixAsOrtho( -1, 1, -1, 1, -2, 2 );
        assert.equalVector( matrix, camera.getProjectionMatrix(), 'check Camera.setProjectionMatrixAsOrtho' );
    } );

    test( 'Camera absolute vs relative', function () {

        var rotation = Matrix.makeRotate( -Math.PI * 0.5, 1.0, 0.0, 0.0, Matrix.create() );
        var translate = Matrix.makeTranslate( 1, 0, 0, Matrix.create() );
        var invRotation = Matrix.create();
        Matrix.inverse( rotation, invRotation );


        var camera = new Camera();
        Matrix.copy( rotation, camera.getViewMatrix() );

        var test = Matrix.create();

        Matrix.copy( translate, test );
        camera.computeLocalToWorldMatrix( test );
        assert.equalVector( test, Matrix.mult( translate, rotation, Matrix.create() ), 'Should expect Translation * Rotation' );

        Matrix.copy( translate, test );
        camera.computeWorldToLocalMatrix( test );
        assert.equalVector( test, Matrix.mult( translate, invRotation, Matrix.create() ), 'Should expect Translation * invRotation' );

        camera.setReferenceFrame( TransformEnums.ABSOLUTE_RF );

        Matrix.copy( translate, test );
        camera.computeLocalToWorldMatrix( test );
        assert.equalVector( test, rotation, 'Should expect Rotation' );

        Matrix.copy( translate, test );
        camera.computeWorldToLocalMatrix( test );
        assert.equalVector( test, invRotation, 'Should expect invRotation' );


    } );
};
