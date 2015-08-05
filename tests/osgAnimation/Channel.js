define( [
    'qunit',
    'tests/mockup/mockup'
], function ( QUnit, mockup ) {

    'use strict';

    return function () {

        QUnit.module( 'osgAnimation' );

        QUnit.test( 'Channel', function () {
            var keys = mockup.createVec3Keyframes();

            ok( keys === keys, 'no tests' );
        } );
    };
} );
