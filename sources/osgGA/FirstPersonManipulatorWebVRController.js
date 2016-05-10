'use strict';

var FirstPersonManipulatorWebVRController = function ( manipulator ) {
    this._manipulator = manipulator;
    this.init();
};

FirstPersonManipulatorWebVRController.prototype = {
    init: function () {},
    update: function ( quat, position ) {
        this._manipulator.setPoseVR( quat, position );
    }
};

module.exports = FirstPersonManipulatorWebVRController;
