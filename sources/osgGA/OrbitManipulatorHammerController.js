import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import osgMath from 'osg/math';
import Groups from 'osgViewer/input/InputConstants';

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

            this._initInputs(Groups.ORBIT_MANIPULATOR_TOUCH);
        },

        _initInputs: function(group) {
            var rotateInterpolator = this._manipulator.getRotateInterpolator();
            var panInterpolator = this._manipulator.getPanInterpolator();

            var manager = this._manipulator.getInputManager();

            manager.group(group).addMappings(
                {
                    pinchEnd: 'pinchend',
                    pinchStart: 'pinchstart',
                    pinchInOut: ['pinchin', 'pinchout']
                },
                this
            );

            manager.group(group).addMappings(
                {
                    startPan: 'panstart 2'
                },
                this.startMotion.bind(this, panInterpolator, this._panFactor)
            );

            manager.group(group).addMappings(
                {
                    startRotate: 'panstart 1'
                },
                this.startMotion.bind(this, rotateInterpolator, this._rotateFactor)
            );

            manager.group(group).addMappings(
                {
                    pan: 'panmove 2'
                },
                this.motion.bind(this, panInterpolator, this._panFactor)
            );

            manager.group(group).addMappings(
                {
                    rotate: 'panmove 1'
                },
                this.motion.bind(this, rotateInterpolator, this._rotateFactor)
            );

            manager.group(group).addMappings(
                {
                    endPan: ['touchend 2', 'touchcancel 2']
                },
                this.endMotion.bind(this, panInterpolator)
            );

            manager.group(group).addMappings(
                {
                    endRotate: ['touchend 1', 'touchcancel 1']
                },
                this.endMotion.bind(this, rotateInterpolator)
            );
        },

        startMotion: function(interpolator, factor, event) {
            if (this._zooming) {
                return;
            }
            this._dragStarted = true;
            interpolator.reset();
            var x = event.canvasX * factor[0];
            var y = event.canvasY * factor[1];
            interpolator.set(x, y);
        },

        motion: function(interpolator, factor, event) {
            if (!this._dragStarted) {
                return;
            }
            var x = event.canvasX * factor[0];
            var y = event.canvasY * factor[1];
            interpolator.setTarget(x, y);
        },

        endMotion: function(interpolator) {
            if (!this._dragStarted) return;
            this._dragStarted = false;
            interpolator.reset();
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
