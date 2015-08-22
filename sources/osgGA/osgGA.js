define( [
    'hammer',
    'osgGA/FirstPersonManipulator',
    'osgGA/FirstPersonManipulatorDeviceOrientationController',
    'osgGA/FirstPersonManipulatorHammerController',
    'osgGA/FirstPersonManipulatorOculusController',
    'osgGA/FirstPersonManipulatorStandardMouseKeyboardController',
    'osgGA/Manipulator',
    'osgGA/OrbitManipulator',
    'osgGA/OrbitManipulatorDeviceOrientationController',
    'osgGA/OrbitManipulatorGamePadController',
    'osgGA/OrbitManipulatorHammerController',
    'osgGA/OrbitManipulatorLeapMotionController',
    'osgGA/OrbitManipulatorOculusController',
    'osgGA/OrbitManipulatorStandardMouseKeyboardController',
    'osgGA/SwitchManipulator',
    'osgGA/OrbitManipulatorEnums'
], function ( Hammer, FirstPersonManipulator, FirstPersonManipulatorDeviceOrientationController, FirstPersonManipulatorHammerController, FirstPersonManipulatorStandardMouseKeyboardController, FirstPersonManipulatorOculusController, Manipulator, OrbitManipulator, OrbitManipulatorDeviceOrientationController, OrbitManipulatorGamePadController, OrbitManipulatorHammerController, OrbitManipulatorLeapMotionController, OrbitManipulatorStandardMouseKeyboardController, OrbitManipulatorOculusController, SwitchManipulator, OrbitManipulatorEnums ) {

    'use strict';

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

    return osgGA;
} );
