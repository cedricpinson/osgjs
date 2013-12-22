define( [
    'tests/osgGA/FirstPersonManipulator',
    'tests/osgGA/OrbitManipulator'
], function ( FirstPersonManipulator, OrbitManipulator ) {

    return function () {
        FirstPersonManipulator();
        OrbitManipulator();
    };
} );
