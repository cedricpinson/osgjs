define( [], function () {

    var FirstPersonManipulatorOculusController = function ( manipulator ) {
        this._manipulator = manipulator;
        this.init();
    };

    FirstPersonManipulatorOculusController.prototype = {
        init: function () {
            this._stepFactor = 1.0; // meaning radius*stepFactor to move
        },
        update: function ( quaternion ) {

            this._manipulator.setRotationBaseFromQuat( quaternion );
        },

    };

    return FirstPersonManipulatorOculusController;
} );