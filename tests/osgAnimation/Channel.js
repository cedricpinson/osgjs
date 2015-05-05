define( [
    'qunit',
    'tests/mockup/mockup',
    'osgAnimation/Keyframe',
    'osgAnimation/Vec3LerpChannel',
    'osgAnimation/FloatLerpChannel',
    'osgAnimation/FloatCubicBezierChannel',
    'osgAnimation/Vec3CubicBezierChannel'
], function ( QUnit, mockup, Keyframe, Vec3LerpChannel, FloatLerpChannel, FloatCubicBezierChannel, Vec3CubicBezierChannel ) {

    'use strict';

    return function () {

        QUnit.module( 'osgAnimation' );

        QUnit.test( 'Channel', function () {
            var keys = [];
            keys.push( Keyframe.createVec3Keyframe( 0, [ 1, 1, 1 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 1, [ 0, 0, 0 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 2, [ 3, 3, 3 ] ) );

            var channel = new Vec3LerpChannel( keys );
            channel.update( 1.0 );
            ok( mockup.checkNear( channel.getTarget().getValue(), [ 0.0, 0.0, 0.0 ] ), 'Check vec3 channel update' );

            keys.length = 0;
            keys.push( Keyframe.createFloatKeyframe( 0, 1 ) );
            keys.push( Keyframe.createFloatKeyframe( 1, 0 ) );
            keys.push( Keyframe.createFloatKeyframe( 2, 3 ) );

            channel = new FloatLerpChannel( keys );
            channel.update( 1.0 );
            ok( mockup.checkNear( channel.getTarget().getValue(), 0.0 ), 'Check float channel update' );

            keys.length = 0;
            keys.push( Keyframe.createFloatCubicKeyframe( 0, 1, 2, 3 ) );
            keys.push( Keyframe.createFloatCubicKeyframe( 1, 0, 1, 3 ) );
            keys.push( Keyframe.createFloatCubicKeyframe( 2, 3, 4, 5 ) );

            channel = new FloatCubicBezierChannel( keys );
            channel.update( 1.0 );
            ok( mockup.checkNear( channel.getTarget().getValue(), [ 0, 1, 3 ] ), 'Check float cubic bezier channel' );


            keys.length = 0;
            keys.push( Keyframe.createVec3CubicKeyframe( 0, [ 1, 1, 1 ], [ 2, 2, 2 ], [ 5, 5, 5 ] ) );
            keys.push( Keyframe.createVec3CubicKeyframe( 1, [ 6, 6, 6 ], [ 9, 9, 9 ], [ 8, 8, 8 ] ) );
            keys.push( Keyframe.createVec3CubicKeyframe( 2, [ 7, 7, 7 ], [ 8, 8, 8 ], [ 9, 9, 9 ] ) );

            channel = new Vec3CubicBezierChannel( keys );
            channel.update(1.0);
            ok( mockup.checkNear( channel.getTarget().getValue(), [ 6, 6, 6 ] ), 'Check vec3 cubic bezier channel' );

        } );
    };
} );
