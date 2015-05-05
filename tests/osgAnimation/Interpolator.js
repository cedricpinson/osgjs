define( [
    'qunit',
    'tests/mockup/mockup',
    'osgAnimation/Keyframe',
    'osgAnimation/Interpolator'
], function ( QUnit, mockup, Keyframe, Interpolator ) {

    'use strict';

    return function () {

        QUnit.module( 'osgAnimation' );

        QUnit.test( 'Vec3LerpInterpolator', function () {
            var keys = [];
            keys.push( Keyframe.createVec3Keyframe( 0, [ 1, 1, 1 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 1, [ 0, 0, 0 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 2, [ 3, 3, 3 ] ) );

            var result = {
                'value': 0,
                'key': 0
            };

            Interpolator.Vec3LerpInterpolator( keys, -1, result );
            ok( mockup.checkNear( result.value, [ 1, 1, 1 ] ), 'Check value when time < first key' );
            ok( result.key === 0, 'Check key when time < first key' );

            Interpolator.Vec3LerpInterpolator( keys, 3, result );
            ok( mockup.checkNear( result.value, [ 3, 3, 3 ] ), 'Check value when time > last key' );
            ok( result.key === 0, 'Check key when time > last key' );

            Interpolator.Vec3LerpInterpolator( keys, 0.5, result );
            ok( mockup.checkNear( result.value, [ 0.5, 0.5, 0.5 ] ), 'Check value when time == 0.5' );
            ok( result.key === 0, 'Check key when time == 0.5' );

            Interpolator.Vec3LerpInterpolator( keys, 1.5, result );
            ok( mockup.checkNear( result.value, [ 1.5, 1.5, 1.5 ] ), 'Check value when time == 1.5' );
            ok( result.key === 1, 'Check key when time == 1.5' );

            // with 2 keys only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.Vec3LerpInterpolator( keys, 1.5, result );
            ok( mockup.checkNear( result.value, [ 1.5, 1.5, 1.5 ] ), 'Check value when time == 1.5 with 2 keyframes' );
            ok( result.key === 0, 'Check key when time == 1.5 with 2 keyframes' );

            // with 1 key only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.Vec3LerpInterpolator( keys, 2.0, result );
            ok( mockup.checkNear( result.value, [ 3.0, 3.0, 3.0 ] ), 'Check value when time == 2.0 with 1 keyframe' );
            ok( result.key === 0, 'Check key when time == 2.0 with 1 keyframe' );

        } );

        QUnit.test( 'FloatLerpInterpolator', function () {
            var keys = [];
            keys.push( Keyframe.createFloatKeyframe( 0, 1 ) );
            keys.push( Keyframe.createFloatKeyframe( 1, 0 ) );
            keys.push( Keyframe.createFloatKeyframe( 2, 3 ) );

            var result = {
                'value': 0,
                'key': 0
            };

            Interpolator.FloatLerpInterpolator( keys, -1, result );
            ok( mockup.checkNear( result.value, 1 ), 'Check value when time < first key' );
            ok( result.key === 0, 'Check key when time < first key' );

            Interpolator.FloatLerpInterpolator( keys, 3, result );
            ok( mockup.checkNear( result.value, 3 ), 'Check value when time > last key' );
            ok( result.key === 0, 'Check key when time > last key' );

            Interpolator.FloatLerpInterpolator( keys, 0.5, result );
            ok( mockup.checkNear( result.value, 0.5 ), 'Check value when time == 0.5' );
            ok( result.key === 0, 'Check key when time == 0.5' );

            Interpolator.FloatLerpInterpolator( keys, 1.5, result );
            ok( mockup.checkNear( result.value, 1.5 ), 'Check value when time == 1.5' );
            ok( result.key === 1, 'Check key when time == 1.5' );

            // with 2 keys only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.FloatLerpInterpolator( keys, 1.5, result );
            ok( mockup.checkNear( result.value, 1.5 ), 'Check value when time == 1.5 with 2 keyframes' );
            ok( result.key === 0, 'Check key when time == 1.5 with 2 keyframes' );

            // with 1 key only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.FloatLerpInterpolator( keys, 2.0, result );
            ok( mockup.checkNear( result.value, 3.0 ), 'Check value when time == 2.0 with 1 keyframe' );
            ok( result.key === 0, 'Check key when time == 2.0 with 1 keyframe' );

        } );

        QUnit.test( 'FloatCubicBezierInterpolator', function () {
            var keys = [];
            keys.push( Keyframe.createFloatCubicKeyframe( 0, 1, 2, 3 ) );
            keys.push( Keyframe.createFloatCubicKeyframe( 1, 0, 1, 3 ) );
            keys.push( Keyframe.createFloatCubicKeyframe( 2, 3, 4, 5 ) );

            var result = {
                'value': 0,
                'key': 0
            };

            Interpolator.FloatCubicBezierInterpolator( keys, -1, result );
            ok( mockup.checkNear( result.value, 1 ), 'Check value when time < first key' );
            ok( result.key === 0, 'Check key when time < first key' );

            Interpolator.FloatCubicBezierInterpolator( keys, 3, result );
            ok( mockup.checkNear( result.value, 3 ), 'Check value when time > last key' );
            ok( result.key === 0, 'Check key when time > last key' );

            Interpolator.FloatCubicBezierInterpolator( keys, 0.5, result );
            ok( mockup.checkNear( result.value, 2 ), 'Check value when time == 0.5' );
            ok( result.key === 0, 'Check key when time == 0.5' );

            Interpolator.FloatCubicBezierInterpolator( keys, 1.5, result );
            ok( mockup.checkNear( result.value, 1.875 ), 'Check value when time == 1.5' );
            ok( result.key === 1, 'Check key when time == 1.5' );

            // with 2 keys only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.FloatCubicBezierInterpolator( keys, 1.5, result );
            ok( mockup.checkNear( result.value, 1.875 ), 'Check value when time == 1.5 with 2 keyframes' );
            ok( result.key === 0, 'Check key when time == 1.5 with 2 keyframes' );

            // with 1 key only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.FloatCubicBezierInterpolator( keys, 2.0, result );
            ok( mockup.checkNear( result.value, 3.0 ), 'Check value when time == 2.0 with 1 keyframe' );
            ok( result.key === 0, 'Check key when time == 2.0 with 1 keyframe' );

        } );

        QUnit.test( 'Vec3CubicBezierInterpolator', function () {
            var keys = [];
            keys.push( Keyframe.createVec3CubicKeyframe( 0, [ 1, 1, 1 ], [ 2, 2, 2 ], [ 5, 5, 5 ] ) );
            keys.push( Keyframe.createVec3CubicKeyframe( 1, [ 6, 6, 6 ], [ 9, 9, 9 ], [ 8, 8, 8 ] ) );
            keys.push( Keyframe.createVec3CubicKeyframe( 2, [ 6, 6, 6 ], [ 6, 6, 6 ], [ 6, 6, 6 ] ) );

            var result = {
                'value': [ 0, 0, 0 ],
                'key': 0
            };

            Interpolator.Vec3CubicBezierInterpolator( keys, -1, result );
            ok( mockup.checkNear( result.value, [ 1, 1, 1 ] ), 'Check value when time < first key' );
            ok( result.key === 0, 'Check key when time < first key' );

            Interpolator.Vec3CubicBezierInterpolator( keys, 3, result );
            ok( mockup.checkNear( result.value, [ 6, 6, 6 ] ), 'Check value when time > last key' );
            ok( result.key === 0, 'Check key when time > last key' );

            Interpolator.Vec3CubicBezierInterpolator( keys, 0.5, result );
            ok( mockup.checkNear( result.value, [ 3.5, 3.5, 3.5 ] ), 'Check value when time == 0.5' );
            ok( result.key === 0, 'Check key when time == 0.5' );

            Interpolator.Vec3CubicBezierInterpolator( keys, 1.5, result );
            ok( mockup.checkNear( result.value, [ 7.875, 7.875, 7.875 ] ), 'Check value when time == 1.5' );
            ok( result.key === 1, 'Check key when time == 1.5' );

            // with 2 keys only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.Vec3CubicBezierInterpolator( keys, 1.5, result );
            ok( mockup.checkNear( result.value, [ 7.875, 7.875, 7.875 ] ), 'Check value when time == 1.5 with 2 keyframes' );
            ok( result.key === 0, 'Check key when time == 1.5 with 2 keyframes' );

            // with 1 key only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.Vec3CubicBezierInterpolator( keys, 2.0, result );
            ok( mockup.checkNear( result.value, [ 6, 6, 6 ] ), 'Check value when time == 2.0 with 1 keyframe' );
            ok( result.key === 0, 'Check key when time == 2.0 with 1 keyframe' );
        } );
    };
} );
