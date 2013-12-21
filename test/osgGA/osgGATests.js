define( [
    'test/osgGA/FirstPersonManipulator',
    'test/osgGA/OrbitManipulator'
], function ( FirstPersonManipulator, OrbitManipulator ) {

    return function () {
        FirstPersonManipulator();
        OrbitManipulator();
    };
} );