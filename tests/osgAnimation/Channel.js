define( [
    'qunit',
    'tests/mockup/mockup',
    'osgAnimation/Keyframe',
    'osgAnimation/Vec3LerpChannel',
    'osgAnimation/FloatLerpChannel'
], function ( QUnit, mockup, Keyframe, Vec3LerpChannel, FloatLerpChannel ) {

    'use strict';

    return function () {

        QUnit.module( 'osgAnimation' );

        QUnit.test( 'Channel', function () {
            var keys = mockup.createVec3Keyframes();

            ok( true, 'no tests' );
        } );
    };
} );
