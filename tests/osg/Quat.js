'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var Quat = require( 'osg/Quat' );
var Vec3 = require( 'osg/Vec3' );
var Matrix = require( 'osg/Matrix' );


module.exports = function () {

    // shared const
    var id = Quat.create(); // inited with identity
    var sqrt2 = Math.sqrt( 0.5 );

    // remarquable quaternion list
    var Y90Rot = Quat.createAndSet( sqrt2, 0.0, sqrt2, 0.0 );
    var Y90RotNeg = Quat.createAndSet( -sqrt2, 0.0, -sqrt2, 0.0 );
    var Y90RotNegX180Rot = Quat.createAndSet( 0.0, sqrt2, 0.0, sqrt2 );
    var Y180Rot = Quat.createAndSet( 0.0, 0.0, 1.0, 0.0 );
    var Y180X90NegRot = Quat.createAndSet( 0.0, 0.0, sqrt2, sqrt2 );
    var Y45Rot = Quat.createAndSet( 0.5, 0.0, 0.5, 0.7071067811865475 );
    var Y45RotNeg = Quat.createAndSet( -0.5, 0.0, -0.5, 0.7071067811865475 );
    //Quat.createAndSet(0.0, 0.38, 0.0, 0.92 );


    test( 'Quat.init', function () {
        var q = Quat.create();
        Quat.init( q );
        assert.equalVector( q, Quat.createAndSet( 0.0, 0.0, 0.0, 1.0 ) );
    } );

    test( 'Quat.makeRotate', function () {
        var q0 = Quat.makeRotate( Math.PI, 1.0, 0.0, 0.0, Quat.create() );
        assert.equalVector( q0, Quat.createAndSet( 1.0, 0.0, 0.0, 6.12303e-17 ), 1e-5 );

        var q1 = Quat.makeRotate( Math.PI / 2, 0.0, 1.0, 0.0, Quat.create() );
        assert.equalVector( q1, Quat.createAndSet( 0.0, 0.707107, 0.0, 0.707107 ) );

        var q2 = Quat.makeRotate( Math.PI / 4, 0.0, 0.0, 1.0, Quat.create() );
        assert.equalVector( q2, Quat.createAndSet( 0.0, 0.0, 0.382683, 0.92388 ) );
    } );

    test( 'Quat.makeRotateFromTo', function () {
        var q1 = Quat.makeRotateFromTo( Vec3.createAndSet( 1.0, 0.0, 0.0 ), Vec3.createAndSet( 0.0, 1.0, 0.0 ), Quat.create() );
        assert.equalVector( q1, Quat.createAndSet( 0.0, 0.0, 0.707107, 0.707107 ), 1e-5 );

        // it test both makeRotate and makeRotateFromTo
        var qyrot = Quat.makeRotate( Math.PI / 2.0, 0.0, 1.0, 0.0, Quat.create() );
        var q2 = Quat.makeRotateFromTo( Vec3.createAndSet( 0.0, 0.0, 1.0 ), Vec3.createAndSet( 1.0, 0.0, 0.0 ), Quat.create() );
        assert.equalVector( q2, qyrot, 1e-5 );
    } );

    // test('Quat.rotateVec3', function() {
    //     var q0 = Quat.makeRotate(Math.PI, 1.0, 0.0, 0);
    //     var result = Quat.rotateVec3(q0, [10, 0.0,0), Quat.create());
    //     near(result , [-10.0, 0.0, 0]);
    // });

    test( 'Quat.mult', function () {
        var q0 = Quat.makeRotate( Math.PI, 1.0, 0.0, 0.0, Quat.create() );
        var q1 = Quat.makeRotate( Math.PI / 2, 0.0, 1.0, 0.0, Quat.create() );
        var q2 = Quat.makeRotate( Math.PI / 4, 0.0, 0.0, 1.0, Quat.create() );

        var qr = Quat.create();
        Quat.mult( q1, q0, qr );
        assert.equalVector( qr, Quat.createAndSet( 0.707107, 4.32964e-17, -0.707107, 4.32964e-17 ) );

        // check consistency with quaternion and matrix multiplication order
        var m1 = Matrix.create();
        var m0 = Matrix.create();
        var mr = Matrix.create();
        Matrix.makeRotateFromQuat( q1, m1 );
        Matrix.makeRotateFromQuat( q0, m0 );
        Matrix.mult( m1, m0, mr );

        var qr2 = Quat.create();
        Matrix.getRotate( mr, qr2 );
        assert.equalVector( qr, qr2 );
        // consistency

        assert.equalVector( Quat.mult( q2, Quat.mult( q1, q0, Quat.create() ), Quat.create() ), Quat.createAndSet( 0.653281, 0.270598, -0.653281, 0.270598 ) );
    } );

    test( 'Quat.slerp', function () {

        var res = Quat.createAndSet( 0.0, 0.0, 0.0, 0.0 );

        // t = 0.5, half the angle between Y90RotNegX180Rot and ?Z90Rot?
        Quat.slerp( 0.5, Y90RotNegX180Rot, Quat.createAndSet( 0.0, 0.0, 0.382683, 0.92388 ), res );
        assert.equalVector( res, Quat.createAndSet( 0.0, 0.388863, 0.210451, 0.896937 ) );

        Quat.slerp( 0.0, id, Y90Rot, res );
        assert.equalVector( res, id, 1e-5, 't = 0' );

        Quat.slerp( 1.0, id, Y90Rot, res );
        assert.equalVector( res, Y90Rot, 1e-5, 't = 1' );

        Quat.slerp( 0.5, id, Y90Rot, res );
        assert.equalVector( res, Y45Rot, 1e-5, '0 -> 90; t:0.5' );

        Quat.slerp( 0.5, Y90Rot, id, res );
        assert.equalVector( res, Y45Rot, 1e-5, '90 -> 0 t:0.5' );

        Quat.slerp( 0.5, id, Y90RotNeg, res );
        assert.equalVector( res, Y45RotNeg, 1e-5, 'shortest path t:0.5' );

        Quat.slerp( 0.5, Y90RotNeg, id, res );
        assert.equalVector( res, Y45RotNeg, 1e-5, 'shortest path inverted t:0.5' );

        Quat.slerp( 0.5, Y90Rot, Y90Rot, res );
        assert.equalVector( res, Y90Rot, 1e-5, 'same input t:0.5' );

        Quat.slerp( 0.5, id, Y180Rot, res );
        assert.equalVector( res, Y180X90NegRot, 1e-5, '0 to 180 t:0.5' );

        Quat.slerp( 0.5, id, Quat.createAndSet( 0.0, 0.0, 0.0, 0.999 ), res );
        assert.equalVector( res, id, 1e4, 'a~n, t:0.5' ); // less prec than nlerp

        Quat.slerp( 0.5, id, Quat.createAndSet( 0.0, 0.0, 0.0, -1.0 ), res );
        assert.equalVector( res, id, 1e-5, 'opposite sign, t:0.5' );
    } );

    test( 'Quat.nlerp', function () {

        var res = Quat.createAndSet( 0.0, 0.0, 0.0, 0.0 );

        // t = 0.5, half the angle between Y90RotNegX180Rot and ?Z90Rot?
        Quat.nlerp( 0.5, Y90RotNegX180Rot, Quat.createAndSet( 0.0, 0.0, 0.382683, 0.92388 ), res );
        assert.equalVector( res, Quat.createAndSet( 0.0, 0.388863, 0.210451, 0.896937 ) );

        Quat.nlerp( 0.0, id, Y90Rot, res );
        assert.equalVector( res, id, 1e-5, 't = 0' );

        Quat.nlerp( 1.0, id, Y90Rot, res );
        assert.equalVector( res, Y90Rot, 1e-5, 't = 1' );

        Quat.nlerp( 0.5, id, Y90Rot, res );
        assert.equalVector( res, Y45Rot, 1e-5, '0 -> 90; t:0.5' );

        Quat.nlerp( 0.5, Y90Rot, id, res );
        assert.equalVector( res, Y45Rot, 1e-5, '90 -> 0 t:0.5' );

        Quat.nlerp( 0.5, id, Y90RotNeg, res );
        assert.equalVector( res, Y45RotNeg, 1e-5, 'shortest path t:0.5' );

        Quat.nlerp( 0.5, Y90RotNeg, id, res );
        assert.equalVector( res, Y45RotNeg, 1e-5, 'shortest path inverted t:0.5' );

        Quat.nlerp( 0.5, Y90Rot, Y90Rot, res );
        assert.equalVector( res, Y90Rot, 1e-5, 'same input t:0.5' );

        Quat.nlerp( 0.5, id, Y180Rot, res );
        assert.equalVector( res, Y180X90NegRot, 1e-5, '0 to 180 t:0.5' );

        Quat.nlerp( 0.5, id, Quat.createAndSet( 0.0, 0.0, 0.0, 0.999 ), res );
        assert.equalVector( res, id, 1e-5, 'a~n, t:0.5' );

        Quat.nlerp( 0.5, id, Quat.createAndSet( 0.0, 0.0, 0.0, -1.0 ), res );
        assert.equalVector( res, id, 1e-5, 'opposite sign, t:0.5' );

    } );

    test( 'Quat.transformVec3', function () {
        var v = Vec3.createAndSet( 1.0, 2.0, 3.0 );
        Quat.transformVec3( Quat.createAndSet( 0.0, 0.707107, 0.0, 0.707107 ), v, v );
        assert.equalVector( v, Vec3.createAndSet( 3.0, 2.0, -1.0 ) );
    } );


};
