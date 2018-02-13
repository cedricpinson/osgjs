import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import osgMath from 'osg/math';
import InputGroups from 'osgViewer/input/InputConstants';

var OrbitManipulatorHammerController = function(manipulator) {
    Controller.call(this, manipulator);
    this.init();
};

utils.createPrototypeObject(
    OrbitManipulatorHammerController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._panFactor = [];
            this._panFactor[0] = 1.0;
            this._panFactor[1] = -this._panFactor[0];

            this._rotateFactor = [];
            this._rotateFactor[0] = 0.6;
            this._rotateFactor[1] = -this._rotateFactor[0];
            this._zoomFactor = 5.0;

            this._lastScale = 0;

            this._zooming = false;
            this._dragStarted = false;

            this._initInputs(InputGroups.ORBIT_MANIPULATOR_TOUCH);
        },

        _initInputs: function(group) {
            var manager = this._manipulator.getInputManager();

            manager.group(group).addMappings(
                {
                    pinchEnd: 'pinchend',
                    pinchStart: 'pinchstart',
                    pinchInOut: ['pinchin', 'pinchout'],
                    startPan: ['panstart 2'],
                    startRotate: ['panstart 1'],
                    pan: ['panmove 2'],
                    rotate: ['panmove 1'],
                    endMotion: ['touchend 2', 'touchcancel 2', 'touchend 1', 'touchcancel 1']
                },
                this
            );
        },

        startPan: function(event) {
            this._panning = true;
            this.startMotion(this._manipulator.getPanInterpolator(), this._panFactor, event);
        },

        startRotate: function(event) {
            this._rotating = true;
            this.startMotion(this._manipulator.getRotateInterpolator(), this._rotateFactor, event);
        },

        pan: function(event) {
            if (!this._panning) {
                this.endMotion();
                this.startPan(event);
            }
            this.move(this._manipulator.getPanInterpolator(), this._panFactor, event);
        },

        rotate: function(event) {
            if (!this._rotating) {
                this.endMotion();
                this.startPan(event);
            }
            this.move(this._manipulator.getRotateInterpolator(), this._rotateFactor, event);
        },

        startMotion: function(interpolator, factor, event) {
            if (this._zooming) {
                return;
            }
            interpolator.reset();
            var x = event.canvasX * factor[0];
            var y = event.canvasY * factor[1];
            interpolator.set(x, y);
        },

        move: function(interpolator, factor, event) {
            var x = event.canvasX * factor[0];
            var y = event.canvasY * factor[1];
            interpolator.setTarget(x, y);
        },

        endMotion: function() {
            if (!this._panning && !this._rotating) return;
            this._panning = false;
            this._rotating = false;
        },

        pinchStart: function(event) {
            this._zooming = true;
            this._lastScale = event.scale;
            var zoomInterpolator = this._manipulator.getZoomInterpolator();
            zoomInterpolator.reset();
            zoomInterpolator.set(this._lastScale);
        },

        pinchEnd: function() {
            this._zooming = false;
        },

        pinchInOut: function(event) {
            if (!this._zooming) return;

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

        setManipulator: function(manipulator) {
            this._manipulator = manipulator;
        }
    })
);

export default OrbitManipulatorHammerController;
