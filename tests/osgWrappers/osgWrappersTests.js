define( [
    'tests/osgWrappers/osgAnimation',
    'osgWrappers/serializers/osgAnimation',
    'osgDB/Input',
    'qunit',
    'tests/mockup/mockup'
], function ( osgAnimation, osgAnimationWrapper, Input, QUnit, mockup ) {

    'use strict';

    return function () {

        QUnit.module( 'osgWrapper' );

        QUnit.asyncTest( 'osgWrapperTest', function () {
            ok(true , 'No tests');
            start();
        } );

    };

} );
