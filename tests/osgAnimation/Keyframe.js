define( [
    'qunit',
    'osgAnimation/Keyframe'
], function ( QUnit, Keyframe ) {

    'use strict';

    return function () {

        QUnit.module( 'osgAnimation' );

        QUnit.test( 'Vec3Keyframe', function () {
            var k = new Keyframe.createVec3Keyframe( 0.2, [ 0, 1, 2 ] );
            ok( k.length === 3, 'Check size' );
            ok( k.t === 0.2, 'Check time' );
        } );

        QUnit.test( 'Vec3CubicBezierKeyframe', function () {
            var k = new Keyframe.createVec3CubicKeyframe( 0.2, [ 0, 1, 2 ], [ 0, 1, 2 ], [ 0, 1, 2 ] );
            ok( k.length === 3, 'Check size' );
            ok( k[ 0 ].length === 3 && k[ 1 ].length === 3 && k[ 2 ].length === 3, 'Ckeck vector size' );
            ok( k.t === 0.2, 'Check time' );
        } );
    };
} );
