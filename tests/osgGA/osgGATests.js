'use strict';
var FirstPersonManipulator = require( 'tests/osgGA/FirstPersonManipulator' );
var OrbitManipulator = require( 'tests/osgGA/OrbitManipulator' );


module.exports = function () {
    FirstPersonManipulator();
    OrbitManipulator();
};
