'use strict';
var Hammer = require('hammer');

var HammerController = function(viewer) {
    this._enable = true;
    this._viewer = viewer;
    this._type = 'Hammer';

    this._eventNode = undefined;
};

HammerController.prototype = {
    setEnable: function(bool) {
        this._enable = bool;
    },

    getEnable: function() {
        return this._enable;
    },

    getHammer: function() {
        return this._hammer;
    },

    init: function(options) {
        this._eventNode = options.eventNode;
        if (this._eventNode) {
            this._hammer = new Hammer.Manager(this._eventNode);

            // defaults: { event: 'pan', pointers: 1, direction: Hammer.DIRECTION_HORIZONTAL, threshold: 10 }
            this._hammer.add(new Hammer.Pan());

            if (options.getBoolean('scrollwheel')) {
                //defaults: { event: 'pinch', pointers: 2, threshold: 0 }
                this._hammer.add(new Hammer.Pinch());
            }
        }
    },

    isValid: function() {
        if (this._enable && this.getManipulatorController()) {
            return true;
        }
        return false;
    },

    getManipulatorController: function() {
        var manip = this._viewer.getManipulator();
        return manip && manip.getControllerList()[this._type];
    },

    // use the update to set the input device to mouse controller
    // it's needed to compute size
    update: function() {
        var isValid = this.isValid();
        var manip = this.getManipulatorController();
        if (manip) manip.setValid(isValid);

        if (!isValid) return;

        // we pass directly hammer object
        this.getManipulatorController().setEventProxy(this._hammer);
    },
    remove: function() {
        if (!this.isValid()) return;
        this.getManipulatorController().removeEventProxy(this._hammer);
    }
};
module.exports = HammerController;
