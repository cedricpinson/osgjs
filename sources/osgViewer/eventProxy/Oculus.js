define( [], function () {

    'use strict';

    var Oculus = function ( viewer ) {
        this._viewer = viewer;
        this._type = 'Oculus';
        this._enable = true;
    };

    Oculus.prototype = {
        init: function () {},

        getManipulatorController: function () {
            return this._viewer.getManipulator().getControllerList()[ this._type ];
        },

        isValid: function () {
            if ( !this._enable )
                return false;

            var manipulator = this._viewer.getManipulator();
            if ( !manipulator )
                return false;

            if ( !manipulator.getControllerList()[ this._type ] )
                return false;

            return true;
        },

        update: function () {
            if ( !this.isValid() )
                return;

            // update the manipulator with the rotation of the device

            // var manipulatorAdapter = this.getManipulatorController();
            // if ( manipulatorAdapter.update ) {
            //     manipulatorAdapter.update( this.rotation );
            // }
        }
    };
    return Oculus;
} );
