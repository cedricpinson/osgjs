define( [
    'osg/Matrix'
], function ( Matrix ) {

    'use strict';

    // Base class for Camera / User manipulator
    // flags is a bitfield use to enable options
    var Manipulator = function ( flags ) {
        this._flags = flags;
        if ( this._flags === undefined )
            this._flags = Manipulator.DEFAULT_SETTINGS;

        this._controllerList = {};
        this._inverseMatrix = Matrix.create();
    };

    Manipulator.prototype = {

        // eg: var currentTime = nv.getFrameStamp().getSimulationTime();
        update: function ( /*nv*/) {},

        getInverseMatrix: function () {
            return this._inverseMatrix;
        },

        getControllerList: function () {
            return this._controllerList;
        }
    };

    Manipulator.COMPUTE_HOME_USING_BBOX = 0x02;
    Manipulator.DEFAULT_SETTINGS = 0;

    return Manipulator;
} );
