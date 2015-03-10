define( [
    'osgGA/FirstPersonManipulator'
], function ( FirstPersonManipulator ) {

    'use strict';

    return function () {

        module( 'osgGA' );

        test( 'FirstPersonManipulator', function () {
            var manipulator = new FirstPersonManipulator();
            var matrix = manipulator.getInverseMatrix();
            ok( matrix !== undefined, 'check getInverseMatrix method' );
        } );

        test( 'FirstPersonManipulator check controllers', function () {
            var manipulator = new FirstPersonManipulator();
            var list = manipulator.getControllerList();
            ok( list.StandardMouseKeyboard !== undefined, 'check mouse support' );
        } );
    };
} );
