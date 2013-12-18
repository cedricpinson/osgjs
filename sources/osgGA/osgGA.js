/*global define */

// #FIXME load hammer
define( [
    'osgGA/FirstPersonManipulator',
    'osgGA/FirstPersonManipulatorMouseKeyboardController',
    'osgGA/Manipulator',
    'osgGA/OrbitManipulator',
    'osgGA/OrbitManipulatorGamePadController',
    'osgGA/OrbitManipulatorHammerController',
    'osgGA/OrbitManipulatorLeapMotionController',
    'osgGA/OrbitManipulatorMouseKeyboardController',
    'osgGA/SwitchManipulator',
    'osgGA/OrbitManipulatorEnums'
], function ( FirstPersonManipulator, FirstPersonManipulatorMouseKeyboardController, Manipulator, OrbitManipulator, OrbitManipulatorGamePadController, OrbitManipulatorHammerController, OrbitManipulatorLeapMotionController, OrbitManipulatorMouseKeyboardController, SwitchManipulator, OrbitManipulatorEnums ) {

    /** -*- compile-command: "jslint-cli osgGA.js" -*-
     * Authors:
     *  Cedric Pinson <cedric.pinson@plopbyte.com>
     */

    var osgGA = {};

    // #FIXME uncomment?
    // Hammer.NO_MOUSEEVENTS = true; // disable hammer js mouse events

    osgGA.FirstPersonManipulator = FirstPersonManipulator;
    osgGA.getFirstPersonStandardMouseKeyboardControllerClass = function () {
        return FirstPersonManipulatorMouseKeyboardController;
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
    osgGA.SwitchManipulator = SwitchManipulator;

    osgGA.OrbitManipulator.Rotate = OrbitManipulatorEnums.ROTATE;
    osgGA.OrbitManipulator.Pan = OrbitManipulatorEnums.PAN;
    osgGA.OrbitManipulator.Zoom = OrbitManipulatorEnums.ZOOM;

    return osgGA;
} );