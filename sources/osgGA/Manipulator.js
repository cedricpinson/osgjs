define( [
    'osg/Matrix'
], function ( Matrix ) {

    /**
     *  Manipulator
     *  @class
     */
    var Manipulator = function () {
        this._controllerList = {};
        this._inverseMatrix = new Array( 16 );
        Matrix.makeIdentity( this._inverseMatrix );
    };

    /** @lends Manipulator.prototype */
    Manipulator.prototype = {

        // eg: var currentTime = nv.getFrameStamp().getSimulationTime();
        update: function ( /*nv*/ ) {},

        getInverseMatrix: function () {
            return this._inverseMatrix;
        },

        getControllerList: function () {
            return this._controllerList;
        }
    };

    return Manipulator;
} );
