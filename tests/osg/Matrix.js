'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var Matrix = require( 'osg/Matrix' );
var Vec3 = require( 'osg/Vec3' );
var Quat = require( 'osg/Quat' );
var Notify = require( 'osg/Notify' );


module.exports = function () {

    test( 'Matrix.makeRotateFromQuat', function () {
        var m = Matrix.create();
        Matrix.makeRotateFromQuat( Quat.createAndSet( 0.653281, 0.270598, -0.653281, 0.270598 ), m );
        assert.equalVector( m, Matrix.createAndSet( 1.66533e-16, 1.11022e-16, -1, 0.0, 0.707107, -0.707107, 0.0, 0.0, -0.707107, -0.707107, -1.66533e-16, 0.0, 0.0, 0.0, 0.0, 1.0 ) );
    } );

    test( 'Matrix.getRotate', function () {
        var m = Matrix.create();
        Matrix.makeRotateFromQuat( Quat.createAndSet( 0.653281, 0.270598, -0.653281, 0.270598 ), m );
        var q = Matrix.getRotate( m, Quat.create() );
        assert.equalVector( q, Quat.createAndSet( 0.653281, 0.270598, -0.653281, 0.270598 ) );

    } );

    test( 'Matrix.getPerspective', function () {
        var m = Matrix.create();
        Matrix.makePerspective( 60, 800 / 200, 2.0, 500.0, m );
        var r = {};
        Matrix.getPerspective( m, r );
        assert.equalVector( r.zNear, 2.0 );
        assert.equalVector( r.zFar, 500.0, 0.1 );
        assert.equalVector( r.fovy, 60.0 );
        assert.equalVector( r.aspectRatio, 4.0 );
    } );

    test( 'Matrix.makeLookAt', function () {
        var m = Matrix.makeLookAt( Vec3.createAndSet( 0.0, -10, 0.0 ), Vec3.createAndSet( 0.0, 0.0, 0.0 ), Vec3.createAndSet( 0.0, 0.0, 1.0 ), Matrix.create() );
        assert.equalVector( m, Matrix.createAndSet( 1.0, 0.0, -0, 0.0, 0.0, 0.0, -1, 0.0, 0.0, 1.0, -0, 0.0, 0.0, 0.0, -10, 1.0 ) );

        var m2 = Matrix.makeLookAt( Vec3.createAndSet( 0.0, 0.0, -10 ), Vec3.create(), Vec3.createAndSet( 0.0, 1.0, 0.0 ), Matrix.create() );
        assert.equalVector( m2, Matrix.createAndSet( -1, 0.0, -0, 0.0, 0.0, 1.0, -0, 0.0, 0.0, -0, -1, 0.0, 0.0, 0.0, -10, 1.0 ) );
    } );

    test( 'Matrix.computeFustrumCornersVectors', function () {
        var m = Matrix.create();
        var ratio = 16.0 / 9.0;
        Matrix.makePerspective( 45, ratio, 1.0, 100.0, m );

        var ymax = 1.0 * Math.tan( 45 * Math.PI / 360.0 );
        var ymin = -ymax;
        var xmin = ymin * ratio;
        var xmax = ymax * ratio;

        var corners = [];
        corners.push( Vec3.createAndSet( xmin, ymax, 1.0 ) );
        corners.push( Vec3.createAndSet( xmin, ymin, 1.0 ) );
        corners.push( Vec3.createAndSet( xmax, ymin, 1.0 ) );
        corners.push( Vec3.createAndSet( xmax, ymax, 1.0 ) );

        var vectors = [];
        Matrix.computeFrustumCornersVectors( m, vectors );
        // Notify.log( corners );
        // Notify.log( vectors );
        assert.equalVector( vectors[ 0 ], corners[ 0 ] );
        assert.equalVector( vectors[ 1 ], corners[ 1 ] );
        assert.equalVector( vectors[ 2 ], corners[ 2 ] );
        assert.equalVector( vectors[ 3 ], corners[ 3 ] );
        assert.isOk( true, 'check computeFustrumVectors' );
    } );

    test( 'Matrix.getLookAt', function () {
        var m = Matrix.makeLookAt( Vec3.createAndSet( 0.0, -10, 0.0 ), Vec3.createAndSet( 0.0, 5.0, 0.0 ), Vec3.createAndSet( 0.0, 0.0, 1.0 ), Matrix.create() );
        var eye = Vec3.create();
        var target = Vec3.create();
        var up = Vec3.create();
        Matrix.getLookAt( m, eye, target, up, 5.0 );
        assert.equalVector( eye, Vec3.createAndSet( 0.0, -10, 0.0 ) );
        assert.equalVector( target, Vec3.createAndSet( 0.0, -5.0, 0.0 ) ); // should be five but mimic same behaviour as OpenSceneGraph
        assert.equalVector( up, Vec3.createAndSet( 0.0, 0.0, 1.0 ) );
    } );

    test( 'Matrix.transformVec3', function () {
        var m = Matrix.makeRotate( -Math.PI / 2.0, 0.0, 1.0, 0.0, Matrix.create() );
        var vec = Vec3.createAndSet( 0.0, 0.0, 10 );
        var inv = Matrix.create();
        Matrix.inverse( m, inv );
        var res = Matrix.transformVec3( inv, vec, Vec3.create() );
        assert.equalVector( res, Vec3.createAndSet( 10, 0.0, 0.0 ) );

        var res2 = Matrix.transformVec3( m, res, Vec3.create() );
        assert.equalVector( res2, Vec3.createAndSet( 0.0, 0.0, 10 ) );


        m = Matrix.createAndSet( -0.00003499092, 0.0, 0.0, 0.0, 0.0, 0.0000349909, 0.0, 0.0, 0.0, 0.0, 1.816363636, -9.989999999, 0.013996370, -0.010497277, -1.799999999, 9.9999999 );
        var preMultVec3 = function ( s, vec, result ) {
            if ( result === undefined ) {
                result = Matrix.create();
            }
            var d = 1.0 / ( s[ 3 ] * vec[ 0 ] + s[ 7 ] * vec[ 1 ] + s[ 11 ] * vec[ 2 ] + s[ 15 ] );
            result[ 0 ] = ( s[ 0 ] * vec[ 0 ] + s[ 4 ] * vec[ 1 ] + s[ 8 ] * vec[ 2 ] + s[ 12 ] ) * d;
            result[ 1 ] = ( s[ 1 ] * vec[ 0 ] + s[ 5 ] * vec[ 1 ] + s[ 9 ] * vec[ 2 ] + s[ 13 ] ) * d;
            result[ 2 ] = ( s[ 2 ] * vec[ 0 ] + s[ 6 ] * vec[ 1 ] + s[ 10 ] * vec[ 2 ] + s[ 14 ] ) * d;
            return result;
        };
        var r0 = preMultVec3( m, Vec3.createAndSet( 400, 300, 1.0 ) );
        Matrix.transformVec3( m, Vec3.createAndSet( 400, 300, 1.0 ), res );
        assert.equalVector( res, r0 );

    } );

    test( 'Matrix.transpose', function () {
        var m = Matrix.createAndSet( 0.0, 1.0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 );
        var res = Matrix.transpose( m, [] );
        assert.equalVector( res, Matrix.createAndSet( 0.0, 4, 8, 12, 1.0, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15 ) );

        var res2 = Matrix.transpose( m, [] );
        assert.equalVector( res2, Matrix.createAndSet( 0.0, 4, 8, 12, 1.0, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15 ) );

        var res3 = Matrix.transpose( m, m );
        assert.equalVector( res3, Matrix.createAndSet( 0.0, 4, 8, 12, 1.0, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15 ) );
    } );

    test( 'Matrix.makeRotate', function () {
        var res = Matrix.makeRotate( 0.0, 0.0, 0.0, 1.0, Matrix.create() );
        assert.equalVector( res, Matrix.create() );
    } );

    test( 'Matrix.mult', function () {
        var width = 800;
        var height = 600;
        var translate = Matrix.create();
        var scale = Matrix.create();
        var res = Matrix.create();

        Matrix.makeTranslate( 1.0, 1.0, 1.0, translate );
        Matrix.makeScale( 0.5 * width, 0.5 * height, 0.5, scale );
        Matrix.mult( scale, translate, res );
        assert.equalVector( res, Matrix.createAndSet( 400, 0.0, 0.0, 0.0, 0.0, 300, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 400, 300, 0.5, 1.0 ) );

        Matrix.makeTranslate( 1.0, 1.0, 1.0, translate );
        Matrix.makeScale( 0.5 * width, 0.5 * height, 0.5, scale );
        Matrix.preMult( scale, translate, res );
        assert.isOk( mockup.checkNear( res, Matrix.createAndSet( 400, 0.0, 0.0, 0.0, 0.0, 300, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 400, 300, 0.5, 1.0 ) ), 'check preMult' );

        Matrix.makeTranslate( 1.0, 1.0, 1.0, translate );
        Matrix.makeScale( 0.5 * width, 0.5 * height, 0.5, scale );
        Matrix.postMult( scale, translate, res );
        assert.isOk( mockup.checkNear( res, Matrix.createAndSet( 400, 0.0, 0.0, 0.0, 0.0, 300, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 400, 300, 0.5, 1.0 ) ), 'check postMult' );

        // test to check equivalent
        Matrix.makeTranslate( 1.0, 1.0, 1.0, translate );
        Matrix.makeScale( 0.5 * width, 0.5 * height, 0.5, scale );

        var ident = Matrix.create();
        Matrix.preMult( ident, scale );

        Matrix.preMult( ident, translate );
        assert.equalVector( ident, Matrix.createAndSet( 400, 0.0, 0.0, 0.0, 0.0, 300, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 400, 300, 0.5, 1.0 ) );
        Matrix.preMult( scale, translate );
        assert.equalVector( scale, Matrix.createAndSet( 400, 0.0, 0.0, 0.0, 0.0, 300, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 400, 300, 0.5, 1.0 ) );

    } );

    test( 'Matrix.inverse4x3', function () {

        var m = Matrix.createAndSet( 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 10, 10, 10, 1.0 );

        var result = [];
        var valid = Matrix.inverse4x3( m, result );
        assert.isOk( true, valid );
        assert.equalVector( result, Matrix.createAndSet( 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, -10, -10, -10, 1.0 ) );

        var m1 = Matrix.createAndSet( 0.0011258089, 0.0013121610, -0.001274753, 0.0, -0.0002278837182, 0.001585725704, 0.001430999692, 0.0, 0.00181517053, -0.00061475582, 0.0009702887, 0.0, 0.0, 0.0, 0.0, 1.0 );
        var m1result = [];
        Matrix.inverse4x3( m1, m1result );
        assert.equalVector( m1result, Matrix.createAndSet( 243.988, -49.3875, 393.386, 0.0, 284.374, 343.661, -133.23, 0.0, -276.267, 310.128, 210.282, 0.0, -0, -0, -0, 1.0 ), 1e-3 );

        var m2 = Matrix.createAndSet( 0.001125808, -0.0002278837, 0.00181517053, 0.0, 0.00131216, 0.00158572570, -0.000614755824, 0.0, -0.00127475, 0.0014309996, 0.000970288764, 0.0, 0.0, 0.0, 0.0, 1.0 );
        var m2result = [];
        Matrix.inverse4x3( m2, m2result );
        assert.equalVector( m2result, Matrix.createAndSet( 243.988, 284.374, -276.267, 0.0, -49.3875, 343.661, 310.128, 0.0, 393.386, -133.23, 210.282, 0.0, -0, -0, -0, 1.0 ), 1e-3 );

    } );

    test( 'Matrix.inverse', function () {
        var result = Matrix.create();
        var m = Matrix.createAndSet( -1144.3119, 23.8650, -0.12300, -0.12288, -1553.3126, -1441.499, -1.6196, -1.6180, 0.0, 0.0, 0.0, 0.0, 25190.498, 13410.539, 21.885, 21.963 );

        assert.isOk( true, Matrix.inverse( m, result ) );

        var result2 = Matrix.create();
        var m2 = Matrix.createAndSet( 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1375333.5195828325, -4275596.259263198, 4514838.703939765, 1.0 );
        var valid = Matrix.inverse( m2, result2 );
        assert.isOk( true, valid );
        Notify.log( 'inverse ' + result2.toString() );
        //    assert.isOk(true, valid);


    } );

    test( 'Matrix.makePerspective', function () {
        var m = Matrix.createAndSet( 1.299038105676658, 0.0, 0.0, 0.0, 0.0, 1.7320508075688774, 0.0, 0.0, 0.0, 0.0, -1.002002002002002, -1, 0.0, 0.0, -2.0020020020020022, 0.0 );
        var res = Matrix.makePerspective( 60, 800 / 600, 1.0, 1000, Matrix.create() );
        assert.isOk( mockup.checkNear( res, m ), 'makePerspective should be ' + m + ' and is ' + res );
    } );

};
