define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/Vec3',
    'osgAnimation/Keyframe',
    'osgAnimation/Interpolator',
    'osgAnimation/Channel'
], function ( QUnit, mockup, Vec3, Keyframe, Interpolator, Channel ) {

    'use strict';

    return function () {

        QUnit.module( 'osgAnimation' );

        QUnit.test( 'Vec3LerpInterpolator', function () {

            var keys = {
                keys: [
                    1, 1, 1,
                    0, 0, 0,
                    3, 3, 3
                ],
                times: [ 0, 1, 2 ]
            };

            var timeArray = [ -1,
                              3,
                              0.5,
                              1.5 ];

            var channels = [];

            var i;
            for ( i = 0; i < timeArray.length; i++) {
                var c = Channel.createActiveVec3Channel( keys );
                channels.push( c );
            }

            for ( i = 0; i < timeArray.length; i++)
                Interpolator.Vec3LerpInterpolator( timeArray[i], channels[i] );


            var result;
            result = channels[0];
            ok( mockup.checkNear( result.value, [ 1, 1, 1 ] ), 'Check value when time < first key' );
            ok( result.key === 0, 'Check key when time < first key' );

            result = channels[1];
            ok( mockup.checkNear( result.value, [ 3, 3, 3 ] ), 'Check value when time > last key' );
            ok( result.key === 0, 'Check key when time > last key' );

            result = channels[2];
            ok( mockup.checkNear( result.value, [ 0.5, 0.5, 0.5 ] ), 'Check value when time == 0.5' );
            ok( result.key === 0, 'Check key when time == 0.5' );

            result = channels[3];
            ok( mockup.checkNear( result.value, [ 1.5, 1.5, 1.5 ] ), 'Check value when time == 1.5' );
            ok( result.key === 1, 'Check key when time == 1.5' );


            var keys2 = {
                keys: [
                    1, 1, 1
                ],
                times: [ 0 ]
            };

            var channelOneKey = Channel.createActiveVec3Channel( keys2 );
            result = channelOneKey;

            Interpolator.Vec3LerpInterpolator( 1, channelOneKey );
            ok( mockup.checkNear( result.value, [ 1.0, 1.0, 1.0 ] ), 'Check value when time == 1.0 with 1 key' );
            ok( result.key === 0, 'Check key when time == 1.0 with 1 keyframes' );

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
    };
} );
