/** -*- compile-command: "jslint-cli Manipulator.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

/** 
 *  Manipulator
 *  @class
 */
osgGA.Manipulator = function() {
    this._controllerList = {};
    this._inverseMatrix = new Array(16);
    osg.Matrix.makeIdentity(this._inverseMatrix);
};

/** @lends osgGA.Manipulator.prototype */
osgGA.Manipulator.prototype = {
    
    // No gamepad support by default
    gamepadaxes:false, // function(axes) {}
    gamepadbuttondown:false, // function(event, pressed) {}
    
    // eg: var currentTime = nv.getFrameStamp().getSimulationTime();
    update: function(nv) {
    },

    getInverseMatrix: function () { 
        return this._inverseMatrix;
    },

    getControllerList: function() { return this._controllerList; }


};
