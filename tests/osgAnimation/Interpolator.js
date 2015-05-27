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

            var keys = mockup.createVec3Keyframes();
            var timeArray = [ -1,
                              3,
                              0.5,
                              1.5,
                              5.0
                            ];

            var channels = [];

            var i;
            for ( i = 0; i < timeArray.length; i++) {
                var c = Channel.createInstanceVec3Channel( keys );
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

            result = channels[4];
            ok( mockup.checkNear( result.value, [ 3.0, 3.0, 3.0 ] ), 'Check value when time == 5.0' );
            ok( result.key === 0, 'Check key when time == 5.0' );

            var keys2 = {
                keys: [
                    1, 1, 1
                ],
                times: [ 0 ]
            };

            var channelOneKey = Channel.createInstanceVec3Channel( keys2 );
            result = channelOneKey;

            Interpolator.Vec3LerpInterpolator( 1, channelOneKey );
            ok( mockup.checkNear( result.value, [ 1.0, 1.0, 1.0 ] ), 'Check value when time == 1.0 with 1 key' );
            ok( result.key === 0, 'Check key when time == 1.0 with 1 keyframes' );

        } );

        QUnit.test( 'FloatLerpInterpolator', function () {

            var keys = mockup.createFloatKeyframes();

            var timeArray = [ -1,
                              3,
                              0.5,
                              1.5,
                              5 ];

            var channels = [];

            var i;
            for ( i = 0; i < timeArray.length; i++) {
                var c = Channel.createInstanceFloatChannel( keys );
                channels.push( c );
            }

            for ( i = 0; i < timeArray.length; i++)
                Interpolator.FloatLerpInterpolator( timeArray[i], channels[i] );

            var result;

            result = channels[0];
            ok( mockup.checkNear( result.value, 1 ), 'Check value when time < first key' );
            ok( result.key === 0, 'Check key when time < first key' );

            result = channels[1];
            ok( mockup.checkNear( result.value, 3 ), 'Check value when time > last key' );
            ok( result.key === 0, 'Check key when time > last key' );

            result = channels[2];
            ok( mockup.checkNear( result.value, 0.5 ), 'Check value when time == 0.5' );
            ok( result.key === 0, 'Check key when time == 0.5' );

            result = channels[3];
            ok( mockup.checkNear( result.value, 1.5 ), 'Check value when time == 1.5' );
            ok( result.key === 1, 'Check key when time == 1.5' );

            result = channels[4];
            ok( mockup.checkNear( result.value, 3.0 ), 'Check value when time == 3.0' );
            ok( result.key === 0, 'Check key when time == 3.0' );

        } );
    };
} );
