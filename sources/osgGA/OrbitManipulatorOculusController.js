define( [], function () {

    'use strict';

    var OrbitManipulatorOculusController = function ( manipulator ) {
        this._manipulator = manipulator;
        this.init();
    };

    OrbitManipulatorOculusController.prototype = {
        init: function () {},
        update: function ( quaternion ) {

            this._manipulator.setRotationBaseFromQuat( quaternion );
        },

    };

    return OrbitManipulatorOculusController;
} );
