import Hammer from 'hammer';
import CADManipulator from 'osgGA/CADManipulator';
import CADManipulatorStandardMouseKeyboardController from 'osgGA/CADManipulatorStandardMouseKeyboardController';
import CADManipulatorHammerController from 'osgGA/CADManipulatorHammerController';
import FirstPersonManipulator from 'osgGA/FirstPersonManipulator';
import FirstPersonManipulatorDeviceOrientationController from 'osgGA/FirstPersonManipulatorDeviceOrientationController';
import FirstPersonManipulatorHammerController from 'osgGA/FirstPersonManipulatorHammerController';
import FirstPersonManipulatorStandardMouseKeyboardController from 'osgGA/FirstPersonManipulatorStandardMouseKeyboardController';
import FirstPersonManipulatorWebVRController from 'osgGA/FirstPersonManipulatorWebVRController';
import Manipulator from 'osgGA/Manipulator';
import OrbitManipulator from 'osgGA/OrbitManipulator';
import OrbitManipulatorDeviceOrientationController from 'osgGA/OrbitManipulatorDeviceOrientationController';
import OrbitManipulatorGamePadController from 'osgGA/OrbitManipulatorGamePadController';
import OrbitManipulatorHammerController from 'osgGA/OrbitManipulatorHammerController';
import OrbitManipulatorStandardMouseKeyboardController from 'osgGA/OrbitManipulatorStandardMouseKeyboardController';
import OrbitManipulatorWebVRController from 'osgGA/OrbitManipulatorWebVRController';
import SwitchManipulator from 'osgGA/SwitchManipulator';
import OrbitManipulatorEnums from 'osgGA/orbitManipulatorEnums';
import Controller from 'osgGA/Controller';

var osgGA = {};

Hammer.NO_MOUSEEVENTS = true; // disable hammer js mouse events

osgGA.CADManipulator = CADManipulator;
osgGA.getCADManipulatorStandardMouseKeyboardController = function() {
    return CADManipulatorStandardMouseKeyboardController;
};
osgGA.getCADManipulatorHammerController = function() {
    return CADManipulatorHammerController;
};
osgGA.FirstPersonManipulator = FirstPersonManipulator;
osgGA.getFirstPersonDeviceOrientationController = function() {
    return FirstPersonManipulatorDeviceOrientationController;
};
osgGA.getFirstPersonManipulatorHammerController = function() {
    return FirstPersonManipulatorHammerController;
};
osgGA.getFirstPersonStandardMouseKeyboardControllerClass = function() {
    return FirstPersonManipulatorStandardMouseKeyboardController;
};
osgGA.getFirstPersonWebVRControllerClass = function() {
    return FirstPersonManipulatorWebVRController;
};
osgGA.Manipulator = Manipulator;
osgGA.OrbitManipulator = OrbitManipulator;
osgGA.getOrbitManipulatorDeviceOrientationController = function() {
    return OrbitManipulatorDeviceOrientationController;
};
osgGA.getOrbitManipulatorGamePadController = function() {
    return OrbitManipulatorGamePadController;
};
osgGA.getOrbitManipulatorHammerController = function() {
    return OrbitManipulatorHammerController;
};
osgGA.getOrbitManipulatorStandardMouseKeyboardController = function() {
    return OrbitManipulatorStandardMouseKeyboardController;
};
osgGA.getOrbitManipulatorWebVRController = function() {
    return OrbitManipulatorWebVRController;
};

osgGA.SwitchManipulator = SwitchManipulator;

osgGA.OrbitManipulator.Rotate = OrbitManipulatorEnums.ROTATE;
osgGA.OrbitManipulator.Pan = OrbitManipulatorEnums.PAN;
osgGA.OrbitManipulator.Zoom = OrbitManipulatorEnums.ZOOM;

osgGA.Controller = Controller;

export default osgGA;
