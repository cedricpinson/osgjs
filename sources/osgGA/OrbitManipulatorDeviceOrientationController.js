'use strict';
var Quat = require( 'osg/Quat' );
var Vec3 = require( 'osg/Vec3' );

var FirstPersonDeviceOrientation = require( 'osgGA/FirstPersonManipulatorDeviceOrientationController' );

/**
 * @class
 * @memberof osgGA
 */
var OrbitManipulatorDeviceOrientationController = function ( manipulator ) {
    this._manipulator = manipulator;
    this.init();
};

OrbitManipulatorDeviceOrientationController.prototype = {

    init: function () {
        this._stepFactor = 1.0; // meaning radius*stepFactor to move
        this._quat = Quat.create();
        this._pos = Vec3.create();
    },

    update: function ( deviceOrientation, screenOrientation ) {

        // for now we use the same code in first person and orbit to compute rotation
        FirstPersonDeviceOrientation.computeQuaternion( this._quat, deviceOrientation, screenOrientation );
        this._manipulator.setPoseVR( this._quat, this._pos );
    }

};

module.exports = OrbitManipulatorDeviceOrientationController;
