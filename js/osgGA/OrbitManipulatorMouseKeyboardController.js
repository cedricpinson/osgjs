// #FIXME fix it with define

osgGA.getOrbitStandardMouseKeyboardControllerClass = function() {

    var Mode = {
        Rotate: 0,
        Pan: 1,
        Zoom: 2
    };

    var Controller = function(manipulator) {
        this._manipulator = manipulator;
        this.init();
    };

    Controller.prototype = {
        init: function() {
            this.releaseButton();
            this._rotateKey = 65; // a
            this._zoomKey = 83; // s
            this._panKey = 68; // d

            this._mode = undefined;
            this._delay = 0.15;
        },
        getMode: function() { return this._mode; },
        setMode: function(mode) { this._mode = mode; },
        setEventProxy: function(proxy) {
            this._eventProxy = proxy;
        },
        setManipulator: function(manipulator) {
            this._manipulator = manipulator;
        },
        mousemove: function(ev) {
            if (this._buttonup === true) {
                return;
            }
            var pos = this._eventProxy.getPositionRelativeToCanvas(ev);
            var manipulator = this._manipulator;
            if (isNaN(pos[0]) === false && isNaN(pos[1]) === false) {
                var x,y;

                var mode = this.getMode();
                if (mode === Mode.Rotate) {
                    manipulator.getRotateInterpolator().setDelay(this._delay);
                    manipulator.getRotateInterpolator().setTarget(pos[0], pos[1]);

                } else if (mode === Mode.Pan) {
                    manipulator.getPanInterpolator().setTarget(pos[0], pos[1]);

                } else if (mode === Mode.Zoom) {
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
            var mode = this.getMode();
            if (mode === undefined) {
                if (ev.button === 0) {
                    if (ev.shiftKey) {
                        this.setMode(Mode.Pan);
                    } else if (ev.ctrlKey) {
                        this.setMode(Mode.Zoom);
                    } else {
                        this.setMode(Mode.Rotate);
                    }
                } else {
                    this.setMode(Mode.Pan);
                }
            }

            this.pushButton();

            var pos = this._eventProxy.getPositionRelativeToCanvas(ev);
            mode = this.getMode();
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
            this.releaseButton();
            this.setMode(undefined);
        },
        mousewheel: function(ev, intDelta, deltaX, deltaY) {
            var manipulator = this._manipulator;
            ev.preventDefault();
            var zoomTarget = manipulator.getZoomInterpolator().getTarget()[0]- intDelta;
            manipulator.getZoomInterpolator().setTarget(zoomTarget);
        },

        pushButton: function() {
            this._buttonup = false;
        },
        releaseButton: function() {
            this._buttonup = true;
        },

        keydown: function(ev) {
            if (ev.keyCode === 32) {
                this._manipulator.computeHomePosition();

            } else if (ev.keyCode === this._panKey && 
                       this.getMode() !== Mode.Pan) {
                this.setMode(Mode.Pan);
                this._manipulator.getPanInterpolator().reset();
                this.pushButton();
                ev.preventDefault();
            } else if ( ev.keyCode === this._zoomKey &&
                        this.getMode() !== Mode.Zoom) {
                this.setMode(Mode.Zoom);
                this._manipulator.getZoomInterpolator().reset();
                this.pushButton();
                ev.preventDefault();
            } else if ( ev.keyCode === this._rotateKey &&
                        this.getMode() !== Mode.Rotate) {
                this.setMode(Mode.Rotate);
                this._manipulator.getRotateInterpolator().reset();
                this.pushButton();
                ev.preventDefault();
            }
            
        },

        keyup: function(ev) {
            if (ev.keyCode === this._panKey) {
                this.mouseup(ev);
            } else if ( ev.keyCode === this._rotateKey) {
                this.mouseup(ev);
            } else if ( ev.keyCode === this._rotateKey) {
                this.mouseup(ev);
            }
            this.setMode(undefined);
        }

    };
    return Controller;
};
