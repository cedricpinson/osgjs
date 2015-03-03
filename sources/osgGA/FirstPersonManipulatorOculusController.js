define( [], function () {

    'use strict';

    var FirstPersonManipulatorOculusController = function ( manipulator ) {
        this._manipulator = manipulator;
        this.init();
    };

    FirstPersonManipulatorOculusController.prototype = {
        init: function () {},
        update: function ( quaternion ) {

            this._manipulator.setRotationBaseFromQuat( quaternion );
        },

    };

    return FirstPersonManipulatorOculusController;
} );
