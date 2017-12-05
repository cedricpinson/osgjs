import Controller from 'osgGA/Controller';
import utils from 'osg/utils';

var CADManipulatorHammerController = function(manipulator) {
    Controller.call(this, manipulator);
    this._timer = false;
    this.init();
};

utils.createPrototypeObject(
    CADManipulatorHammerController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._panFactorX = 1.0;
            this._panFactorY = -this._panFactorX;

            this._rotateFactorX = 0.6;
            this._rotateFactorY = -this._rotateFactorX;
            this._zoomFactor = 5.0;

            this._lastScale = 0;
            this._nbPointerLast = 0; // to check if we the number of pointers has changed

            this._lastPos = undefined; // to set the pivot for rotation
            this._dragStarted = false;
            this._transformStarted = false;
            this._isValid = false;
        },

        // called to enable/disable controller
        setEnable: function(bool) {
            if (!bool) {
                // reset mode if we disable it
                this._dragStarted = false;
                this._lastPos = undefined;
                this._transformStarted = false;
                this._nbPointerLast = 0;
            }
            Controller.prototype.setEnable.call(this, bool);
        },

        setValid: function(valid) {
            this._isValid = valid;
        },

        setEventProxy: function(hammer) {
            if (!hammer || hammer === this._eventProxy) {
                return;
            }

            this._eventProxy = hammer;

            // Set a minimal thresold on pinch event, to be detected after pan
            hammer.get('pinch').set({
                threshold: 0.1
            });
            // Let the pan be detected with two fingers.
            hammer.get('pan').set({
                threshold: 0,
                pointers: 0
            });
            hammer.get('pinch').recognizeWith(hammer.get('pan'));

            hammer.get('tap').set({
                taps: 2,
                posThreshold: 300
            });

            this._cbPanStart = this.panStart.bind(this);
            this._cbPanMove = this.panMove.bind(this);
            this._cbPanEnd = this.panEnd.bind(this);
            this._cbPinchStart = this.pinchStart.bind(this);
            this._cbPinchEnd = this.pinchEnd.bind(this);
            this._cbPinchInOut = this.pinchInOut.bind(this);
            this._cbDoubleTap = this.doubleTap.bind(this);

            hammer.on('panstart ', this._cbPanStart);
            hammer.on('panmove', this._cbPanMove);
            hammer.on('panend', this._cbPanEnd);
            hammer.on('pinchstart', this._cbPinchStart);
            hammer.on('pinchend', this._cbPinchEnd);
            hammer.on('pinchin pinchout', this._cbPinchInOut);
            hammer.on('tap', this._cbDoubleTap);
        },

        _computeTouches: function(event) {
            if (event.pointers !== undefined) return event.pointers.length;
            return 1; // mouse
        },

        panStart: function(event) {
            if (!this._isValid) return;

            var manipulator = this._manipulator;
            if (!manipulator || this._transformStarted || event.pointerType === 'mouse') {
                return;
            }

            this._dragStarted = true;
            this._nbPointerLast = this._computeTouches(event);

            var pos;
            if (this._nbPointerLast === 2) {
                pos = manipulator.getPositionRelativeToCanvas(event.center.x, event.center.y);
                this._lastPos = pos;
            } else {
                if (this._lastPos === undefined) {
                    pos = manipulator.getCanvasCenter();
                } else {
                    pos = this._lastPos;
                }
            }

            manipulator.computeIntersections(pos);

            if (this._nbPointerLast === 2) {
                var panInterpolator = manipulator.getPanInterpolator();
                manipulator.getPanInterpolator().reset();
                var xPan = event.center.x * this._panFactorX;
                var yPan = event.center.y * this._panFactorY;
                panInterpolator.set(xPan, yPan);
            } else {
                manipulator.getRotateInterpolator().reset();
            }
        },

        panMove: function(event) {
            if (!this._isValid) return;

            var manipulator = this._manipulator;
            if (!manipulator || !this._dragStarted || event.pointerType === 'mouse') {
                return;
            }

            var nbPointers = this._computeTouches(event);

            // prevent sudden big changes in the event.center variables
            if (this._nbPointerLast !== nbPointers) {
                if (nbPointers === 2) manipulator.getPanInterpolator().reset();
                else manipulator.getRotateInterpolator().reset();
                this._nbPointerLast = nbPointers;
            }

            if (nbPointers === 2) {
                var panInterpolator = manipulator.getPanInterpolator();
                var xPan = event.center.x * this._panFactorX;
                var yPan = event.center.y * this._panFactorY;
                panInterpolator.setTarget(xPan, yPan);
            } else {
                var rotateInterpolator = manipulator.getRotateInterpolator();
                var xRot = event.center.x * this._rotateFactorX;
                var yRot = event.center.y * this._rotateFactorY;
                rotateInterpolator.setTarget(xRot, yRot);
            }
        },

        panEnd: function(event) {
            if (!this._isValid) return;

            var manipulator = this._manipulator;
            if (!manipulator || !this._dragStarted || event.pointerType === 'mouse') {
                return;
            }

            this._dragStarted = false;
        },

        pinchStart: function(event) {
            if (!this._isValid) return;

            var manipulator = this._manipulator;
            if (!manipulator || event.pointerType === 'mouse') {
                return;
            }

            this._transformStarted = true;

            this._lastScale = event.scale;
            manipulator.getZoomInterpolator().reset();
            manipulator.getZoomInterpolator().set(this._lastScale);
            event.preventDefault();
        },

        pinchEnd: function(event) {
            if (!this._isValid) return;

            if (event.pointerType === 'mouse') {
                return;
            }

            this._transformStarted = false;
        },

        pinchInOut: function(event) {
            if (!this._isValid) return;

            var manipulator = this._manipulator;
            if (!manipulator || !this._transformStarted || event.pointerType === 'mouse') {
                return;
            }

            // make the dezoom faster
            var isZoomIn = event.scale > this._lastScale;
            var zoomFactor = isZoomIn ? this._zoomFactor : this._zoomFactor * 4.0;
            var scale = (event.scale - this._lastScale) * zoomFactor;
            this._lastScale = event.scale;

            var zoomInterpolator = manipulator.getZoomInterpolator();
            zoomInterpolator.setTarget(zoomInterpolator.getTarget()[0] - scale);
        },

        doubleTap: function(event) {
            if (!this._isValid) return;

            var manipulator = this._manipulator;
            if (!manipulator || event.pointerType === 'mouse') {
                return;
            }

            var pos = manipulator.getPositionRelativeToCanvas(event.center.x, event.center.y);
            this._lastPos = pos;

            manipulator.getZoomInterpolator().set(0.0);
            var zoomInterpolator = manipulator.getZoomInterpolator();
            // Default interval 10
            zoomInterpolator.setTarget(zoomInterpolator.getTarget()[0] - 10);
        },

        removeEventProxy: function(proxy) {
            if (!proxy || !this._eventProxy) return;

            proxy.off('panstart ', this._cbPanStart);
            proxy.off('panmove', this._cbPanMove);
            proxy.off('panend', this._cbPanEnd);
            proxy.off('pinchstart', this._cbPinchStart);
            proxy.off('pinchend', this._cbPinchEnd);
            proxy.off('pinchin pinchout', this._cbPinchInOut);
            proxy.off('tap', this._cbDoubleTap);
        },

        setManipulator: function(manipulator) {
            this._manipulator = manipulator;
        }
    })
);

export default CADManipulatorHammerController;
