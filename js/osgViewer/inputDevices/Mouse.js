osgViewer.inputDevices = osgViewer.inputDevices || {};

osgViewer.inputDevices.Mouse = function(viewer) {
    this._enable = true;
    this._viewer = viewer;
    this._type = 'Mouse';

    this._eventNode = undefined;
    this._wheelEventNode = undefined;
    this._eventList = [ 'mousedown', 'mouseup', 'mousemove', 'dblclick'];
    this._mousePosition = [ 0, 0];
};

osgViewer.inputDevices.Mouse.prototype = {
    init: function(args) {

        this.removeEventListeners(this._eventNode, this._wheelEventNode);

        var eventNode = args.eventNode;
        var eventMouseWheelNode = args.wheelEventNode || args.eventNode;

        this.addEventListeners(eventNode, eventMouseWheelNode);
        this._eventNode = eventNode;
        this._wheelEventNode = eventMouseWheelNode;
    },

    addEventListeners: function(node, mousewheelNode) {
        if (node) {
            for (var i = 0, l = this._eventList.length; i < l; i++) {
                var ev = this._eventList[i];
                if (this[ev]) {
                    node.addEventListener(ev, this[ev].bind(this), false);
                }
            }
        }
        if (mousewheelNode) {
            mousewheelNode.addEventListener("DOMMouseScroll", this.mousewheel.bind(this), false);
            mousewheelNode.addEventListener("mousewheel", this.mousewheel.bind(this), false);
        }
    },

    removeEventListeners: function(node, mousewheelNode) {
        if (node) {
            for (var i = 0, l = this._eventList.length; i < l; i++) {
                var ev = this._eventList[i];
                if (this[ev]) {
                    node.removeEventListener(ev, this[ev]);
                }
            }
        }
        if (mousewheelNode) {
            mousewheelNode.removeEventListener("DOMMouseScroll", this.mousewheel);
            mousewheelNode.removeEventListener("mousewheel", this.mousewheel);
        }
    },

    isValid: function() {
        if (this._enable && this._viewer.getManipulator() && this._viewer.getManipulator().getInputDeviceSupported()[this._type])
            return true;
        return false;
    },
    getManipulatorDevice: function() {
        return this._viewer.getManipulator().getInputDeviceSupported()[this._type];
    },
    mousedown: function(ev) {
        if (!this.isValid())
            return;
        if (this.getManipulatorDevice().mousedown)
            return this.getManipulatorDevice().mousedown(ev);
    },

    mouseup: function(ev) {
        if (!this.isValid())
            return;
        if (this.getManipulatorDevice().mouseup)
            return this.getManipulatorDevice().mouseup(ev);
    },

    mousemove: function(ev) {
        if (!this.isValid())
            return;
        if (this.getManipulatorDevice().mousemove)
            return this.getManipulatorDevice().mousemove(ev);
    },

    dblclick: function(ev) {
        if (!this.isValid())
            return;
        if (this.getManipulatorDevice().dblclick)
            return this.getManipulatorDevice().dblclick(ev);
    },

    mousewheel: function (event) {
        if (!this.isValid())
            return;

        var manipulatorAdapter = this.getManipulatorDevice();
        if (!manipulatorAdapter.mousewheel)
            return;

        // from jquery
        var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
        //event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if ( event.wheelDelta ) { delta = event.wheelDelta/120; }
        if ( event.detail     ) { delta = -event.detail/3; }

        // New school multidimensional scroll (touchpads) deltas
        deltaY = delta;

        // Gecko
        if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaY = 0;
            deltaX = -1*delta;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return this.getManipulatorDevice().mousewheel.apply(manipulatorAdapter, args);
    },

    divGlobalOffset: function(obj) {
        var x=0, y=0;
        x = obj.offsetLeft;
        y = obj.offsetTop;
        var body = document.getElementsByTagName('body')[0];
        while (obj.offsetParent && obj!=body){
            x += obj.offsetParent.offsetLeft;
            y += obj.offsetParent.offsetTop;
            obj = obj.offsetParent;
        }
        this._mousePosition[0] = x;
        this._mousePosition[1] = y;
        return this._mousePosition;
    },

    getPositionRelativeToCanvas: function(e, result) {
        var myObject = e.target;
        var posx,posy;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}

	// posx and posy contain the mouse position relative to the document
	// Do something with this information
        var globalOffset = this.divGlobalOffset(myObject);
        posx = posx - globalOffset[0];
        posy = myObject.height-(posy - globalOffset[1]);

        // NaN in camera check here
        if (isNaN(posx) || isNaN(posy) ){
            //debugger;
        }

        // copy data to result if need to keep result
        // else we use a tmp variable inside manipulator
        // that we override at each call
        if (result === undefined) {
            result = this._mousePosition;
        }
        result[0] = posx;
        result[1] = posy;
        return result;
    },

    // use the update to set the input device to mouse controller
    // it's needed to compute size
    update: function() {
        if (!this.isValid())
            return;

        this.getManipulatorDevice().setInputDevice(this);
    }
    
};
