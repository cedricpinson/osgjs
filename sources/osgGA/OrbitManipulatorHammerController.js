'use strict';

var osgMath = require('osg/math');

var OrbitManipulatorHammerController = function(manipulator) {
    this._manipulator = manipulator;
    this.init();
};

OrbitManipulatorHammerController.prototype = {
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

        this._isValid = true;
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

        this._cbPanStart = this.panStart.bind(this);
        this._cbPanMove = this.panMove.bind(this);
        this._cbPanEnd = this.panEnd.bind(this);
        this._cbPinchStart = this.pinchStart.bind(this);
        this._cbPinchEnd = this.pinchEnd.bind(this);
        this._cbPinchInOut = this.pinchInOut.bind(this);

        hammer.on('panstart ', this._cbPanStart);
        hammer.on('panmove', this._cbPanMove);
        hammer.on('panend', this._cbPanEnd);
        hammer.on('pinchstart', this._cbPinchStart);
        hammer.on('pinchend', this._cbPinchEnd);
        hammer.on('pinchin pinchout', this._cbPinchInOut);
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
            rotateInterpolator.setDelay(this._delay);
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

        // make the dezoom faster (because the manipulator dezoom/dezoom distance speed is adaptive)
        var zoomFactor = event.scale > this._lastScale ? this._zoomFactor : this._zoomFactor * 3.0;
        // also detect pan (velocity) to reduce zoom force
        var minDezoom = 0.0;
        var maxDezoom = 0.5;
        var aSmooth = -Math.abs(event.velocity) + (minDezoom + maxDezoom);
        zoomFactor *= osgMath.smoothStep(minDezoom, maxDezoom, aSmooth);

        var scale = (event.scale - this._lastScale) * zoomFactor;
        this._lastScale = event.scale;

        var zoomInterpolator = manipulator.getZoomInterpolator();
        zoomInterpolator.setTarget(zoomInterpolator.getTarget()[0] - scale);
    },

    removeEventProxy: function(proxy) {
        if (!proxy || !this._eventProxy) return;

        proxy.off('panstart ', this._cbPanStart);
        proxy.off('panmove', this._cbPanMove);
        proxy.off('panend', this._cbPanEnd);
        proxy.off('pinchstart', this._cbPinchStart);
        proxy.off('pinchend', this._cbPinchEnd);
        proxy.off('pinchin pinchout', this._cbPinchInOut);
    },

    setManipulator: function(manipulator) {
        this._manipulator = manipulator;
    }
};
module.exports = OrbitManipulatorHammerController;
