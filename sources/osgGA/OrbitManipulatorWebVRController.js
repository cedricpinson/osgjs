'use strict';

var OrbitManipulatorWebVRController = function ( manipulator ) {
    this._manipulator = manipulator;
    this.init();
};

OrbitManipulatorWebVRController.prototype = {
    init: function () {},
    update: function ( quaternion ) {

        this._manipulator.setRotationBaseFromQuat( quaternion );
    }

};

module.exports = OrbitManipulatorWebVRController;
