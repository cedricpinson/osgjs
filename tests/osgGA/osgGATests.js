define( [
    'tests/osgGA/FirstPersonManipulator',
    'tests/osgGA/OrbitManipulator'
], function ( FirstPersonManipulator, OrbitManipulator ) {

    'use strict';

    return function () {
        FirstPersonManipulator();
        OrbitManipulator();
    };
} );
