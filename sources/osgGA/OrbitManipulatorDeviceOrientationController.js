'use strict';
var Quat = require( 'osg/Quat' );

var FirstPersonDeviceOrientation = require( 'osgGA/FirstPersonManipulatorDeviceOrientationController' );


var OrbitManipulatorDeviceOrientationController = function ( manipulator ) {
    this._manipulator = manipulator;
    this.init();
};

OrbitManipulatorDeviceOrientationController.prototype = {

    init: function () {
        this._stepFactor = 1.0; // meaning radius*stepFactor to move
        this._quat = Quat.create();
    },

    update: function ( deviceOrientation, screenOrientation ) {

        // for now we use the same code in first person and orbit to compute rotation
        FirstPersonDeviceOrientation.computeQuaternion( this._quat, deviceOrientation, screenOrientation );
        this._manipulator.setRotationBaseFromQuat( this._quat );
    }

};

module.exports = OrbitManipulatorDeviceOrientationController;
