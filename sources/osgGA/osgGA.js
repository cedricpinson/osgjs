'use strict';
var Hammer = require( 'hammer' );
var FirstPersonManipulator = require( 'osgGA/FirstPersonManipulator' );
var FirstPersonManipulatorDeviceOrientationController = require( 'osgGA/FirstPersonManipulatorDeviceOrientationController' );
var FirstPersonManipulatorHammerController = require( 'osgGA/FirstPersonManipulatorHammerController' );
var FirstPersonManipulatorStandardMouseKeyboardController = require( 'osgGA/FirstPersonManipulatorOculusController' );
var FirstPersonManipulatorOculusController = require( 'osgGA/FirstPersonManipulatorStandardMouseKeyboardController' );
var Manipulator = require( 'osgGA/Manipulator' );
var OrbitManipulator = require( 'osgGA/OrbitManipulator' );
var OrbitManipulatorDeviceOrientationController = require( 'osgGA/OrbitManipulatorDeviceOrientationController' );
var OrbitManipulatorGamePadController = require( 'osgGA/OrbitManipulatorGamePadController' );
var OrbitManipulatorHammerController = require( 'osgGA/OrbitManipulatorHammerController' );
var OrbitManipulatorLeapMotionController = require( 'osgGA/OrbitManipulatorLeapMotionController' );
var OrbitManipulatorStandardMouseKeyboardController = require( 'osgGA/OrbitManipulatorOculusController' );
var OrbitManipulatorOculusController = require( 'osgGA/OrbitManipulatorStandardMouseKeyboardController' );
var SwitchManipulator = require( 'osgGA/SwitchManipulator' );
var OrbitManipulatorEnums = require( 'osgGA/OrbitManipulatorEnums' );


var osgGA = {};

Hammer.NO_MOUSEEVENTS = true; // disable hammer js mouse events

osgGA.FirstPersonManipulator = FirstPersonManipulator;
osgGA.getFirstPersonDeviceOrientationController = function () {
    return FirstPersonManipulatorDeviceOrientationController;
};
osgGA.getFirstPersonManipulatorHammerController = function () {
    return FirstPersonManipulatorHammerController;
};
osgGA.getFirstPersonStandardMouseKeyboardControllerClass = function () {
    return FirstPersonManipulatorStandardMouseKeyboardController;
};
osgGA.getFirstPersonOculusControllerClass = function () {
    return FirstPersonManipulatorOculusController;
};
osgGA.Manipulator = Manipulator;
osgGA.OrbitManipulator = OrbitManipulator;
osgGA.getOrbitManipulatorDeviceOrientationController = function () {
    return OrbitManipulatorDeviceOrientationController;
};
osgGA.getOrbitManipulatorGamePadController = function () {
    return OrbitManipulatorGamePadController;
};
osgGA.getOrbitManipulatorHammerController = function () {
    return OrbitManipulatorHammerController;
};
osgGA.getOrbitManipulatorLeapMotionController = function () {
    return OrbitManipulatorLeapMotionController;
};
osgGA.getOrbitManipulatorStandardMouseKeyboardController = function () {
    return OrbitManipulatorStandardMouseKeyboardController;
};
osgGA.getOrbitManipulatorOculusController = function () {
    return OrbitManipulatorOculusController;
};

osgGA.SwitchManipulator = SwitchManipulator;

osgGA.OrbitManipulator.Rotate = OrbitManipulatorEnums.ROTATE;
osgGA.OrbitManipulator.Pan = OrbitManipulatorEnums.PAN;
osgGA.OrbitManipulator.Zoom = OrbitManipulatorEnums.ZOOM;

module.exports = osgGA;
