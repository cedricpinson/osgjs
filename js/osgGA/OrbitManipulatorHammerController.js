osgGA.getOrbitHammerControllerClass = function() {

    var Controller = function(manipulator) {
        this._manipulator = manipulator;
        this.init();
    };

    Controller.prototype = {
        init: function() {
            this._panFactorX = 2.0;
            this._panFactorY = -2.0;

            this._rotateFactorX = 1.0;
            this._rotateFactorY = -1.0;
            this._zoomFactor = 5.0;

            this._pan = false;
        },
        setInputDevice: function(device) {
            this._inputDevice = device;
            var self = this;
            var hammer = device;

            var computeTouches = function(ev) {
                if (ev.originalEvent.changedTouches !== undefined)
                    return ev.originalEvent.changedTouches.length;
                return 1; // mouse
            };

            var dragCB = function(ev) {
                return "touches " + computeTouches(ev) + " distance " + ev.distance + " x " + ev.distanceX + " y " + ev.distanceY;
            };

            hammer.ondragstart = function(ev) {
                var manipulator = self._manipulator;
                if (!manipulator) {
                    return;
                }
                if (computeTouches(ev) === 2) {
                    self._pan = true;
                }

                if (self._pan) {
                    manipulator.getPanInterpolator().reset();
                    manipulator.getPanInterpolator().set(ev.position.x*self._panFactorX, ev.position.y*self._panFactorY);
                } else {
                    manipulator.getRotateInterpolator().reset();
                    manipulator.getRotateInterpolator().set(ev.position.x*self._rotateFactorX, ev.position.y*self._rotateFactorY);
                }
                osg.debug("drag start, " + dragCB(ev));
            };

            hammer.ondrag = function(ev) {
                var manipulator = self._manipulator;
                if (!manipulator) {
                    return;
                }
                
                if (self._pan) {
                    manipulator.getPanInterpolator().setTarget(ev.position.x*self._panFactorX, ev.position.y*self._panFactorY);
                    osg.debug("pad, " + dragCB(ev));
                } else {
                    manipulator.getRotateInterpolator().setTarget(ev.position.x*self._rotateFactorX, ev.position.y*self._rotateFactorY);
                    osg.debug("rotate, " + dragCB(ev));
                }
            };
            hammer.ondragend = function(ev) {
                var manipulator = self._manipulator;
                if (!manipulator) {
                    return;
                }
                self._pan = false;
                osg.debug("drag end, " + dragCB(ev));
            };

            var toucheScale;
            hammer.ontransformstart = function(ev) {
                var manipulator = self._manipulator;
                if (!manipulator) {
                    return;
                }

                toucheScale = ev.scale;
                var scale = ev.scale;
                manipulator.getZoomInterpolator().reset();
                manipulator.getZoomInterpolator().set(ev.scale);
                osg.debug("transform start " + ev.scale + " " +scale );
            };
            hammer.ontransformend = function(ev) {
                osg.debug("transform end " + ev.scale );
            };
            hammer.ontransform = function(ev) {
                var manipulator = self._manipulator;
                if (!manipulator) {
                    return;
                }

                var scale = (ev.scale - toucheScale)*self._zoomFactor;
                toucheScale = ev.scale;
                var target = manipulator.getZoomInterpolator().getTarget()[0];
                manipulator.getZoomInterpolator().setTarget(target-scale);
                osg.debug("transform " + ev.scale + " " + (target-scale) );
            };

        },
        setManipulator: function(manipulator) {
            this._manipulator = manipulator;
        }
        

    };
    return Controller;
};
