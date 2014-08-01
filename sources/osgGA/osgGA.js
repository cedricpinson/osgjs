define( [
    'Hammer',
    'osgGA/FirstPersonManipulator',
    'osgGA/FirstPersonManipulatorMouseKeyboardController',
    'osgGA/FirstPersonManipulatorOculusController',
    'osgGA/FirstPersonManipulatorDeviceOrientationController',
    'osgGA/Manipulator',
    'osgGA/OrbitManipulator',
    'osgGA/OrbitManipulatorGamePadController',
    'osgGA/OrbitManipulatorHammerController',
    'osgGA/OrbitManipulatorLeapMotionController',
    'osgGA/OrbitManipulatorMouseKeyboardController',
    'osgGA/OrbitManipulatorDeviceOrientationController',
    'osgGA/OrbitManipulatorOculusController',
    'osgGA/SwitchManipulator',
    'osgGA/OrbitManipulatorEnums'
], function ( Hammer, FirstPersonManipulator, FirstPersonManipulatorMouseKeyboardController, FirstPersonManipulatorOculusController, FirstPersonManipulatorDeviceOrientationController, Manipulator, OrbitManipulator, OrbitManipulatorGamePadController, OrbitManipulatorHammerController, OrbitManipulatorLeapMotionController, OrbitManipulatorMouseKeyboardController, OrbitManipulatorDeviceOrientationController, OrbitManipulatorOculusController, SwitchManipulator, OrbitManipulatorEnums ) {

    'use strict';

    var osgGA = {};

    Hammer.NO_MOUSEEVENTS = true; // disable hammer js mouse events

    osgGA.FirstPersonManipulator = FirstPersonManipulator;
    osgGA.getFirstPersonStandardMouseKeyboardControllerClass = function () {
        return FirstPersonManipulatorMouseKeyboardController;
    };
    osgGA.getFirstPersonOculusControllerClass = function () {
        return FirstPersonManipulatorOculusController;
    };
    osgGA.getFirstPersonDeviceOrientationController = function () {
        return FirstPersonManipulatorDeviceOrientationController;
    };
    osgGA.Manipulator = Manipulator;
    osgGA.OrbitManipulator = OrbitManipulator;
    osgGA.getOrbitManipulatorGamePadController = function () {
        return OrbitManipulatorGamePadController;
    };
    osgGA.getOrbitManipulatorHammerController = function () {
        return OrbitManipulatorHammerController;
    };
    osgGA.getOrbitManipulatorLeapMotionController = function () {
        return OrbitManipulatorLeapMotionController;
    };
    osgGA.getOrbitManipulatorMouseKeyboardController = function () {
        return OrbitManipulatorMouseKeyboardController;
    };
    osgGA.getOrbitManipulatorDeviceOrientationController = function () {
        return OrbitManipulatorDeviceOrientationController;
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
