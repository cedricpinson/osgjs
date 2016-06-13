'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var Matrix = require( 'osg/Matrix' );
var Quat = require( 'osg/Quat' );
var StackedRotateAxis = require( 'osgAnimation/StackedRotateAxis' );
var StackedTranslate = require( 'osgAnimation/StackedTranslate' );
var StackedScale = require( 'osgAnimation/StackedScale' );
var StackedMatrix = require( 'osgAnimation/StackedMatrix' );
var StackedQuaternion = require( 'osgAnimation/StackedQuaternion' );


module.exports = function () {

    test( 'StackedRotateAxis', function () {

        var st = new StackedRotateAxis( 'rotateX' );
        assert.isOk( st.getName() === 'rotateX', 'Check name' );
        assert.equalVector( st._axis, [ 0.0, 0.0, 1.0 ], 'Check default axis' );
        assert.isOk( st._target.value === 0.0, 'Check default angle' );

        st.init( [ 1.0, 0.0, 0.0 ], 2.88 );
        assert.equalVector( st._axis, [ 1.0, 0.0, 0.0 ], 'Check axis after init' );
        assert.isOk( st._target.value === 2.88, 'Check angle after init' );

    } );

    test( 'StackedTranslate', function () {

        var st = new StackedTranslate( 'translate' );
        assert.isOk( st.getName() === 'translate', 'Ckeck Name' );
        assert.equalVector( st._target.value, [ 0.0, 0.0, 0.0 ], 'Ckeck default translate' );

        st.init( [ 23, 78, 9.78 ] );
        assert.equalVector( st._target.value, [ 23, 78, 9.78 ], 'Check translate after init' );


    } );
    test( 'StackedScale', function () {

        var st = new StackedScale( 'scale' );
        assert.isOk( st.getName() === 'scale', 'Ckeck Name' );
        assert.equalVector( st._target.value, [ 1.0, 1.0, 1.0 ], 'Check scale default value' );

        st.init( [ 1.0, 2.0, 3.0 ] );
        assert.equalVector( st._target.value, [ 1.0, 2.0, 3.0 ], 'Check scale value after init' );

    } );

    test( 'StackedMatrix', function () {

        var st = new StackedMatrix( 'matrix' );
        assert.isOk( st.getName() === 'matrix', 'Check Name' );
        assert.isOk( Matrix.isIdentity( st._target.value ), 'Check default matrix' );

        var m = Matrix.makeTranslate( 4, 0, 0, Matrix.create() );
        st.init( m );
        assert.equalVector( m, st._target.value, 'Check matrix value after init' );

    } );

    test( 'StackedQuaternion', function () {

        var st = new StackedQuaternion( 'quat' );
        var q = Quat.create();
        assert.isOk( st.getName() === 'quat', 'Check Name' );
        assert.equalVector( st._target.value, q, 'Check default quat value' );

        Quat.makeRotate( 0.45, 0, 0, 1, q );
        st.init( q );
        assert.equalVector( q, st._target.value, 'Check quat value after init' );

    } );

};
