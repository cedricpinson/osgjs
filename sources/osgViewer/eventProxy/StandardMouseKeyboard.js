import { vec2 } from 'osg/glMatrix';

var StandardMouseKeyboard = function(viewer) {
    this._enable = true;
    this._viewer = viewer;
    this._type = 'StandardMouseKeyboard';

    this._mouseEventNode = undefined;
    this._wheelEventNode = undefined;
    this._keyboardEventNode = undefined;
    this._eventList = ['mousedown', 'mouseup', 'mouseout', 'mousemove', 'dblclick'];
    this._mousePosition = vec2.create();
    this._eventBinded = false;
};

StandardMouseKeyboard.prototype = {
    setEnable: function(bool) {
        this._enable = bool;
    },

    getEnable: function() {
        return this._enable;
    },

    init: function(options) {
        var mouse = options.mouseEventNode;

        var mousewheel = options.wheelEventNode || mouse;
        var keyboard = options.keyboardEventNode || mouse;

        if (options.getBoolean('scrollwheel') === false) {
            mousewheel = null;
        }

        this._mouseEventNode = mouse;
        this._wheelEventNode = mousewheel;
        this._keyboardEventNode = keyboard;

        // to remove listeners, you need the exact same callback
        this._callbacks = {
            mousedown: this.mousedown.bind(this),
            mouseup: this.mouseup.bind(this),
            mouseout: this.mouseout.bind(this),
            mousemove: this.mousemove.bind(this),
            dblclick: this.dblclick.bind(this),
            mousewheel: this.mousewheel.bind(this),
            preventDefault: this.preventDefault.bind(this),
            keydown: this.keydown.bind(this),
            keyup: this.keyup.bind(this)
        };
    },

    _addOrRemoveEventListeners: function(remove) {
        var callbacks = this._callbacks;
        var cb = remove ? 'removeEventListener' : 'addEventListener';
        var cbMouse = this._mouseEventNode && this._mouseEventNode[cb].bind(this._mouseEventNode);
        var cbMousewheel =
            this._wheelEventNode && this._wheelEventNode[cb].bind(this._wheelEventNode);
        var cbKeyboard =
            this._keyboardEventNode && this._keyboardEventNode[cb].bind(this._keyboardEventNode);

        if (cbMouse) {
            for (var i = 0, l = this._eventList.length; i < l; i++) {
                var ev = this._eventList[i];
                cbMouse(ev, callbacks[ev], false);
            }
        }

        if (cbMousewheel) {
            cbMousewheel('DOMMouseScroll', callbacks.mousewheel, false);
            cbMousewheel('mousewheel', callbacks.mousewheel, false);
            cbMousewheel('MozMousePixelScroll', callbacks.preventDefault, false);
        }

        if (cbKeyboard) {
            cbKeyboard('keydown', callbacks.keydown, false);
            cbKeyboard('keyup', callbacks.keyup, false);
        }
        this._eventBinded = !remove;
    },

    addEventListeners: function() {
        return this._addOrRemoveEventListeners(false);
    },

    removeEventListeners: function() {
        return this._addOrRemoveEventListeners(true);
    },

    isValid: function() {
        if (!this._enable) return false;

        var manipulator = this._viewer.getManipulator();
        if (!manipulator) return false;

        var controller = manipulator.getControllerList()[this._type];
        if (!controller || !controller.isEnabled()) return false;

        return true;
    },

    getManipulatorController: function() {
        return this._viewer.getManipulator().getControllerList()[this._type];
    },

    keyup: function(ev) {
        if (this.isValid() && this.getManipulatorController().keyup) {
            return this.getManipulatorController().keyup(ev);
        }

        return undefined;
    },

    keydown: function(ev) {
        if (this.isValid() && this.getManipulatorController().keydown) {
            return this.getManipulatorController().keydown(ev);
        }

        return undefined;
    },

    mousedown: function(ev) {
        if (this.isValid() && this.getManipulatorController().mousedown) {
            // prevent browser to enter in scroll mode
            if (ev.button === 1) ev.preventDefault();

            return this.getManipulatorController().mousedown(ev);
        }

        return undefined;
    },

    mouseup: function(ev) {
        if (this.isValid() && this.getManipulatorController().mouseup) {
            return this.getManipulatorController().mouseup(ev);
        }

        return undefined;
    },

    mouseout: function(ev) {
        if (this.isValid() && this.getManipulatorController().mouseout) {
            return this.getManipulatorController().mouseout(ev);
        }

        return undefined;
    },

    mousemove: function(ev) {
        if (this.isValid() && this.getManipulatorController().mousemove) {
            return this.getManipulatorController().mousemove(ev);
        }

        return undefined;
    },

    dblclick: function(ev) {
        if (this.isValid() && this.getManipulatorController().dblclick) {
            return this.getManipulatorController().dblclick(ev);
        }

        return undefined;
    },

    mousewheel: function(event) {
        if (!this.isValid()) {
            return undefined;
        }

        var manipulatorAdapter = this.getManipulatorController();

        if (!manipulatorAdapter.mousewheel) {
            return undefined;
        }

        event.preventDefault();

        // from jquery
        var orgEvent = event || window.event;
        var delta = 0;
        var deltaX = 0;
        var deltaY = 0;

        // Old school scrollwheel delta
        if (event.detail) delta = -event.detail / 3;
        else if (event.wheelDelta) delta = event.wheelDelta / 120;

        // New school multidimensional scroll (touchpads) deltas
        deltaY = delta;

        // Gecko
        if (orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
            deltaY = 0;
            deltaX = -1 * delta;
        }

        // Webkit
        if (orgEvent.wheelDeltaY !== undefined) deltaY = orgEvent.wheelDeltaY / 120;
        if (orgEvent.wheelDeltaX !== undefined) deltaX = -1 * orgEvent.wheelDeltaX / 120;

        return manipulatorAdapter.mousewheel(event, delta, deltaX, deltaY);
    },

    preventDefault: function(event) {
        event.preventDefault();
    },

    getPositionRelativeToCanvas: function(e, result) {
        result = result || this._mousePosition;
        result[0] = e.offsetX === undefined ? e.layerX : e.offsetX;
        result[1] = e.target.clientHeight - (e.offsetY === undefined ? e.layerY : e.offsetY);
        return result;
    },

    // use the update to set the input device to mouse controller
    // it's needed to compute size
    update: function() {
        if (!this.isValid()) {
            return;
        }

        this.getManipulatorController().setEventProxy(this);
        if (!this._eventBinded) this.addEventListeners();
    }
};
export default StandardMouseKeyboard;
