var Controller = function(manipulator) {
    this._manipulator = manipulator;
    this._enable = true;
};

Controller.prototype = {

    // All eventProxy must check isEnabled before injecting
    // event into Controllers
    isEnabled: function() {
        return this._enable;
    },

    // called to enable/disable a Controller
    // it should be customized for controller that keeps states
    // on events
    setEnable: function(bool) {
        this._enable = bool;
    }

};

export default Controller;
