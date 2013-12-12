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
    'osgGA/SwitchManipulator'
], function ( FirstPersonManipulator, FirstPersonManipulatorMouseKeyboardController, Manipulator, OrbitManipulator, OrbitManipulatorGamePadController, OrbitManipulatorHammerController, OrbitManipulatorLeapMotionController, OrbitManipulatorMouseKeyboardController, SwitchManipulator ) {

    /** -*- compile-command: "jslint-cli osgGA.js" -*-
     * Authors:
     *  Cedric Pinson <cedric.pinson@plopbyte.com>
     */

    var osgGA = {};

    // #FIXME uncomment?
    // Hammer.NO_MOUSEEVENTS = true; // disable hammer js mouse events

    osgGA.FirstPersonManipulator = FirstPersonManipulator;
    osgGA.FirstPersonManipulatorMouseKeyboardController = FirstPersonManipulatorMouseKeyboardController;
    osgGA.Manipulator = Manipulator;
    osgGA.OrbitManipulator = OrbitManipulator;
    osgGA.OrbitManipulatorGamePadController = OrbitManipulatorGamePadController;
    osgGA.OrbitManipulatorHammerController = OrbitManipulatorHammerController;
    osgGA.OrbitManipulatorLeapMotionController = OrbitManipulatorLeapMotionController;
    osgGA.OrbitManipulatorMouseKeyboardController = OrbitManipulatorMouseKeyboardController;
    osgGA.SwitchManipulator = SwitchManipulator;

    return osgGA;
} );