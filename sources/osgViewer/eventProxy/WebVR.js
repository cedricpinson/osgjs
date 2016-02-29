'use strict';
var Notify = require( 'osg/Notify' );
var Quat = require( 'osg/Quat' );


var WebVR = function ( viewer ) {
    this._viewer = viewer;

    this._type = 'WebVR';
    this._enable = false;
    this._hmd = undefined;
    this._sensor = undefined;

    this._quat = Quat.create();
    this._lastPose = undefined; // so that we can pass it to the submitFrame call
};

WebVR.prototype = {

    setEnable: function ( bool ) {
        this._enable = bool;
    },

    getEnable: function () {
        return this._enable;
    },

    init: function () {

        if ( !navigator.getVRDisplays )
            return;

        var self = this;
        navigator.getVRDisplays().then( function ( displays ) {
            if ( displays.length > 0 ) {
                self._hmd = displays[ 0 ];
                Notify.log( 'Found a VR display' );
                // currently it's the event proxy webvr that has the responsability of detecting vr devices
                self._viewer.setVRDisplay( self._hmd );
            }
        } );
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

        if ( !this._hmd )
            return false;

        return true;
    },

    update: function () {

        if ( !this.isValid() )
            return;

        var manipulatorAdapter = this.getManipulatorController();

        // update the manipulator with the rotation of the device
        if ( !manipulatorAdapter.update )
            return;

        if ( !this._hmd.capabilities.hasOrientation )
            return;

        this._lastPose = this._hmd.getPose(); // if no prediction, call this._hmd.getImmediatePose()

        var quat = this._lastPose.orientation;
        if ( !quat ) return;

        // On oculus the up vector is [0,1,0]
        // On osgjs the up vector is [0,0,1]
        this._quat[ 0 ] = quat[ 0 ];
        this._quat[ 1 ] = -quat[ 2 ];
        this._quat[ 2 ] = quat[ 1 ];
        this._quat[ 3 ] = quat[ 3 ];

        manipulatorAdapter.update( this._quat );
    },

    getHmd: function () {
        return this._hmd;
    }
};
module.exports = WebVR;
