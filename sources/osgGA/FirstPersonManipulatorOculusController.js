define( [], function () {

    var FirstPersonManipulatorOculusController = function ( manipulator ) {
        this._manipulator = manipulator;
        this.init();
    };

    FirstPersonManipulatorOculusController.prototype = {
        init: function () {
            this._stepFactor = 1.0; // meaning radius*stepFactor to move
        },
        update: function ( rot ) {
            // On oculus the up vector is [0,1,0]
            // On osgjs the up vector is [0,0,1]
            this._manipulator.setRotationBaseFromQuat( [ rot[ 0 ], -rot[ 2 ], rot[ 1 ], rot[ 3 ] ] );
        },

    };

    return FirstPersonManipulatorOculusController;
} );