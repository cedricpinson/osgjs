define( [], function () {

    'use strict';

    var DeviceOrientation = function ( viewer ) {
        this._viewer = viewer;
        this._type = 'DeviceOrientation';
        this._enable = false;

        // Landscape mobile orientation testing defaults
        this._deviceOrientation = {
            alpha: 90, // angle of rotation around Z axis
            beta: 0, // angle of rotation around X axis
            gamma: -90 // angle of rotation around Y axis
        };
        this._screenOrientation = window.orientation || 90;
    };

    DeviceOrientation.prototype = {

        init: function () {

            var self = this;

            window.addEventListener( 'orientationchange', function ( rawEvtData ) {
                self._deviceOrientation = rawEvtData;
            }, false );

            window.addEventListener( 'deviceorientation', function () {
                self._screenOrientation = window.orientation;
            };, false );

        },

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
            var manipulatorAdapter = this.getManipulatorController();
            if ( manipulatorAdapter.update ) {
                manipulatorAdapter.update( this._deviceOrientation, this._screenOrientation );
            }
        }

    };

    return DeviceOrientation;
} );
