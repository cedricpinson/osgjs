define( [
    'osgGA/OrbitManipulator'
], function ( OrbitManipulator ) {

    return function () {

        module( 'OrbitManipulator' );

        test( 'Test OrbitManipulator', function () {
            var manipulator = new OrbitManipulator();
            var matrix = manipulator.getInverseMatrix();
            ok( matrix !== undefined, 'check getInverseMatrix method' );
        } );

        test( 'Test OrbitManipulator check controllers', function () {
            var manipulator = new OrbitManipulator();
            var list = manipulator.getControllerList();
            ok( list.StandardMouseKeyboard !== undefined, 'check mouse support' );
            ok( list.Hammer !== undefined, 'check hammer support' );
            ok( list.LeapMotion !== undefined, 'check leap motion support' );
            ok( list.GamePad !== undefined, 'check game pad support' );
        } );
    };
} );