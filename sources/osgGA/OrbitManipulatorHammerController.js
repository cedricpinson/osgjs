import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import osgMath from 'osg/math';

var OrbitManipulatorHammerController = function(manipulator) {
    Controller.call(this, manipulator);
    this.init();
};

utils.createPrototypeObject(
    OrbitManipulatorHammerController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._panFactorX = 1.0;
            this._panFactorY = -this._panFactorX;

            this._rotateFactorX = 0.6;
            this._rotateFactorY = -this._rotateFactorX;
            this._zoomFactor = 5.0;

            this._lastScale = 0;
            this._nbPointerLast = 0; // to check if we the number of pointers has changed
            this._delay = 0.15;

            this._transformStarted = false;
            this._dragStarted = false;

            this._cbPanStart = this.panStart.bind(this);
            this._cbPanMove = this.panMove.bind(this);
            this._cbPanEnd = this.panEnd.bind(this);

            this._cbPinchStart = this.pinchStart.bind(this);
            this._cbPinchEnd = this.pinchEnd.bind(this);
            this._cbPinchInOut = this.pinchInOut.bind(this);

            this._isValid = true;
        },

        setValid: function(valid) {
            if (valid === this._isValid) return;
            this._isValid = valid;
            // if validity change during a drag/transform
            this._transformStarted = false;
            this._dragStarted = false;
        },

        getPanStartBind: function() {
            return this._cbPanStart;
        },

        getPanMoveBind: function() {
            return this._cbPanMove;
        },

        getPanEndBind: function() {
            return this._cbPanEnd;
        },

        getPinchEndBind: function() {
            return this._cbPinchEnd;
        },

        _setListeners: function() {
            var hammer = this._eventProxy;

            // Let the pan be detected with two fingers.
            // 2 => pan, 1 -> rotate
            hammer.get('pan').set({
                threshold: 0,
                pointers: 0
            });

            var pinch = hammer.get('pinch');
            if (pinch) {
                // Set a minimal thresold on pinch event, to be detected after pan
                pinch.set({
                    threshold: 0.1
                });
                pinch.recognizeWith(hammer.get('pan'));
            }

            hammer.on('panstart ', this._cbPanStart);
            hammer.on('panmove', this._cbPanMove);
            hammer.on('panend', this._cbPanEnd);

            hammer.on('pinchend', this._cbPinchEnd);
            hammer.on('pinchstart', this._cbPinchStart);
            hammer.on('pinchin pinchout', this._cbPinchInOut);

            // if validity change during a drag/tranform
            this._transformStarted = false;
            this._dragStarted = false;
        },

        setEventProxy: function(hammer) {
            if (!hammer || hammer === this._eventProxy) {
                return;
            }

            this._eventProxy = hammer;
            if (this._manipulator) this._setListeners();
        },

        _computeTouches: function(event) {
            if (event.pointers !== undefined) return event.pointers.length;
            return 1; // mouse
        },

        panStart: function(event) {
            if (!this._isValid || this._transformStarted || event.pointerType === 'mouse') {
                return;
            }

            this._dragStarted = true;
            var manipulator = this._manipulator;
            this._nbPointerLast = this._computeTouches(event);
            if (this._nbPointerLast === 2) {
                var panInterpolator = manipulator.getPanInterpolator();
                panInterpolator.reset();
                var xPan = event.center.x * this._panFactorX;
                var yPan = event.center.y * this._panFactorY;
                panInterpolator.set(xPan, yPan);
            } else {
                var rotateInterpolator = manipulator.getRotateInterpolator();
                rotateInterpolator.reset();
                var xRot = event.center.x * this._rotateFactorX;
                var yRot = event.center.y * this._rotateFactorY;
                rotateInterpolator.set(xRot, yRot);
            }
        },

        panMove: function(event) {
            if (!this._isValid || !this._dragStarted || event.pointerType === 'mouse') {
                return;
            }

            var manipulator = this._manipulator;
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
                rotateInterpolator.setDelay(this._delay);
                var xRot = event.center.x * this._rotateFactorX;
                var yRot = event.center.y * this._rotateFactorY;
                rotateInterpolator.setTarget(xRot, yRot);
            }
        },

        panEnd: function(event) {
            if (!this._isValid || !this._dragStarted || event.pointerType === 'mouse') return;
            this._dragStarted = false;
        },

        pinchStart: function(event) {
            if (!this._isValid || event.pointerType === 'mouse') return;

            this._transformStarted = true;
            this._lastScale = event.scale;
            var zoomInterpolator = this._manipulator.getZoomInterpolator();
            zoomInterpolator.reset();
            zoomInterpolator.set(this._lastScale);
            event.preventDefault();
        },

        pinchEnd: function(event) {
            if (!this._isValid || event.pointerType === 'mouse') return;
            this._transformStarted = false;
        },

        pinchInOut: function(event) {
            if (!this._isValid || !this._transformStarted || event.pointerType === 'mouse') return;

            // make the dezoom faster (because the manipulator dezoom/dezoom distance speed is adaptive)
            var zoomFactor =
                event.scale > this._lastScale ? this._zoomFactor : this._zoomFactor * 3.0;
            // also detect pan (velocity) to reduce zoom force
            var minDezoom = 0.0;
            var maxDezoom = 0.5;
            var aSmooth = -Math.abs(event.velocity) + (minDezoom + maxDezoom);
            zoomFactor *= osgMath.smoothStep(minDezoom, maxDezoom, aSmooth);

            var scale = (event.scale - this._lastScale) * zoomFactor;
            this._lastScale = event.scale;

            var zoomInterpolator = this._manipulator.getZoomInterpolator();
            zoomInterpolator.setTarget(zoomInterpolator.getTarget()[0] - scale);
        },

        removeEventProxy: function(eventProxy) {
            var proxy = eventProxy || this._eventProxy;
            if (!proxy) return;

            proxy.off('panstart ', this._cbPanStart);
            proxy.off('panmove', this._cbPanMove);
            proxy.off('panend', this._cbPanEnd);
            proxy.off('pinchstart', this._cbPinchStart);
            proxy.off('pinchend', this._cbPinchEnd);
            proxy.off('pinchin pinchout', this._cbPinchInOut);
        },

        setManipulator: function(manipulator) {
            this._manipulator = manipulator;
            if (this._eventProxy) this._setListeners();
        }
    })
);
export default OrbitManipulatorHammerController;
