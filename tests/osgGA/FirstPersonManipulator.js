define( [
    'qunit',
    'osgGA/FirstPersonManipulator'
], function ( QUnit, FirstPersonManipulator ) {

    'use strict';

    return function () {

        QUnit.module( 'osgGA' );

        QUnit.test( 'FirstPersonManipulator', function () {
            var manipulator = new FirstPersonManipulator();
            var matrix = manipulator.getInverseMatrix();
            ok( matrix !== undefined, 'check getInverseMatrix method' );
        } );

        QUnit.test( 'FirstPersonManipulator check controllers', function () {
            var manipulator = new FirstPersonManipulator();
            var list = manipulator.getControllerList();
            ok( list.StandardMouseKeyboard !== undefined, 'check mouse support' );
        } );
    };
} );
