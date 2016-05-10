'use strict';

var OrbitManipulatorWebVRController = function ( manipulator ) {
    this._manipulator = manipulator;
    this.init();
};

OrbitManipulatorWebVRController.prototype = {
    init: function () {},
    update: function ( quat, position ) {
        this._manipulator.setPoseVR( quat, position );
    }
};

module.exports = OrbitManipulatorWebVRController;
