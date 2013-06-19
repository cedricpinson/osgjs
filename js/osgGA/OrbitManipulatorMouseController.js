osgGA.getOrbitMouseControllerClass = function() {

    var Controller = function(manipulator) {
        this._manipulator = manipulator;
        this.init();
    };

    Controller.prototype = {
        init: function() {
            this._buttonup = false;
        },
        setInputDevice: function(device) {
            this._inputDevice = device;
        },
        setManipulator: function(manipulator) {
            this._manipulator = manipulator;
        },
        mousemove: function(ev) {
            if (this._buttonup === true) {
                return;
            }
            var pos = this._inputDevice.getPositionRelativeToCanvas(ev);
            var manipulator = this._manipulator;
            if (isNaN(pos[0]) === false && isNaN(pos[1]) === false) {
                var x,y;
                var mode = manipulator.getMode();

                if (mode === osgGA.OrbitManipulator.Rotate) {
                    manipulator.getRotateInterpolator().setTarget(pos[0], pos[1]);

                } else if (mode === osgGA.OrbitManipulator.Pan) {
                    manipulator.getPanInterpolator().setTarget(pos[0], pos[1]);

                } else if (mode === osgGA.OrbitManipulator.Zoom) {
                    var zoom = manipulator.getZoomInterpolator();
                    if (zoom.isReset()) {
                        zoom._start = pos[1];
                        zoom.set(0.0);
                    }
                    var dy = pos[1]-zoom._start;
                    zoom._start = pos[1];
                    var v = zoom.getTarget()[0];
                    zoom.setTarget(v-dy/20.0);
                }
            }

            ev.preventDefault();
        },
        mousedown: function(ev) {
            var manipulator = this._manipulator;
            var mode = manipulator.getMode();
            if (mode === undefined) {
                if (ev.button === 0) {
                    if (ev.shiftKey) {
                        manipulator.setMode(osgGA.OrbitManipulator.Pan);
                    } else if (ev.ctrlKey) {
                        manipulator.setMode(osgGA.OrbitManipulator.Zoom);
                    } else {
                        manipulator.setMode(osgGA.OrbitManipulator.Rotate);
                    }
                } else {
                    manipulator.setMode(osgGA.OrbitManipulator.Pan);
                }
            }

            this._buttonup = false;

            var pos = this._inputDevice.getPositionRelativeToCanvas(ev);
            mode = manipulator.getMode();
            if (mode === osgGA.OrbitManipulator.Rotate) {
                manipulator.getRotateInterpolator().reset();
                manipulator.getRotateInterpolator().set(pos[0], pos[1]);
            } else if (mode === osgGA.OrbitManipulator.Pan) {
                manipulator.getPanInterpolator().reset();
                manipulator.getPanInterpolator().set(pos[0], pos[1]);
            } else if (mode === osgGA.OrbitManipulator.Zoom) {
                manipulator.getZoomInterpolator()._start = pos[1];
                manipulator.getZoomInterpolator().set(0.0);
            }
            ev.preventDefault();
        },
        mouseup: function(ev) {
            this._buttonup = false;
            var manipulator = this._manipulator;
            manipulator.setMode(undefined);
        },
        mousewheel: function(ev, intDelta, deltaX, deltaY) {
            var manipulator = this._manipulator;
            ev.preventDefault();
            var zoomTarget = manipulator.getZoomInterpolator().getTarget()[0]- intDelta;
            manipulator.getZoomInterpolator().setTarget(zoomTarget);
        }
    };
    return Controller;
};
