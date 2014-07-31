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
        // On desktop, no screen orientation so set it to 90 to test landscape mode
        this._screenOrientation = window.orientation || 90;
        this._debugDiv = document.getElementById( 'debug' ) || null;
    };

    DeviceOrientation.prototype = {

        init: function () {

            var self = this;

            var onDeviceOrientationChangeEvent = function ( rawEvtData ) {
                self._deviceOrientation = rawEvtData;
                self._enable = true;
                self.printState();
            };

            var onScreenOrientationChangeEvent = function () {
                self._screenOrientation = window.orientation;
                self.printState();
            };

            window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
            window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
            self.printState();
        },

        printState: function () {
            if ( this._debugDiv ) {
                this._debugDiv.innerHTML = 'Alpha (Around Z): ' + Math.floor( this._deviceOrientation.alpha ) + '</br>' +
                    'Beta (Around X): ' + Math.floor( this._deviceOrientation.beta ) + '</br>' +
                    'Gamma (Around Y) :' + Math.floor( this._deviceOrientation.gamma ) + '</br>' +
                    'ScreenOrientation: ' + this._screenOrientation;
            }
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
