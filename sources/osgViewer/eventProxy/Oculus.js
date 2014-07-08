define( [], function () {

    'use strict';

    var Oculus = function ( viewer ) {
        this._viewer = viewer;
        this._type = 'Oculus';
        this._enable = true;
        this._hmd = undefined;
        this._sensor = undefined;
    };

    Oculus.prototype = {

        init: function () {

            var self = this;

            if ( navigator.getVRDevices ) {
                navigator.getVRDevices().then( vrDeviceCallback );
            } else if ( navigator.mozGetVRDevices ) {
                navigator.mozGetVRDevices( vrDeviceCallback );
            }

            function vrDeviceCallback( vrDevices ) {

                // First, find a HMD -- just use the first one we find
                for ( var i = 0; i < vrDevices.length; ++i ) {
                    if ( vrDevices[ i ] instanceof HMDVRDevice ) {
                        self._hmd = vrDevices[ i ];
                        break;
                    }
                }

                // Then, find a sensor corresponding to the same hardwareUnitId
                for ( var i = 0; i < vrDevices.length; ++i ) {
                    if ( vrDevices[ i ] instanceof PositionSensorVRDevice && vrDevices[ i ].hardwareUnitId === self._hmd.hardwareUnitId ) {
                        self._sensor = vrDevices[ i ];
                        break;
                    }
                }

                if ( self._hmd && self._sensor )
                    console.log( 'Found a HMD and Sensor' );
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

            if ( !this._hmd || !this._sensor )
                return false;

            return true;
        },

        update: function () {

            if ( !this.isValid() )
                return;
            
            var manipulatorAdapter = this.getManipulatorController();

            // update the manipulator with the rotation of the device
            if ( manipulatorAdapter.update ) {

                var state = this._sensor.getState();

                // On oculus the up vector is [0,1,0]
                // On osgjs the up vector is [0,0,1]
                var quat = state.orientation;
                manipulatorAdapter.update( [quat.x, -quat.z, quat.y, quat.w] );
            }
        }
    };
    return Oculus;
} );
