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
    };
} );
