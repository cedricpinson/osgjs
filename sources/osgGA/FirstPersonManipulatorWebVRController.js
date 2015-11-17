'use strict';

var FirstPersonManipulatorWebVRController = function ( manipulator ) {
    this._manipulator = manipulator;
    this.init();
};

FirstPersonManipulatorWebVRController.prototype = {
    init: function () {},
    update: function ( quaternion ) {

        this._manipulator.setRotationBaseFromQuat( quaternion );
    }
};

module.exports = FirstPersonManipulatorWebVRController;
