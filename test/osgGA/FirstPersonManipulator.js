define( [
    'osgGA/FirstPersonManipulator'
], function ( FirstPersonManipulator ) {

    return function () {

        module( 'FirstPersonManipulator' );

        test( 'Test FirstPersonManipulator', function () {
            var manipulator = new FirstPersonManipulator();
            var matrix = manipulator.getInverseMatrix();
            ok( matrix !== undefined, 'check getInverseMatrix method' );
        } );

        test( 'Test FirstPersonManipulator check controllers', function () {
            var manipulator = new FirstPersonManipulator();
            var list = manipulator.getControllerList();
            ok( list.StandardMouseKeyboard !== undefined, 'check mouse support' );
        } );
    };
} );