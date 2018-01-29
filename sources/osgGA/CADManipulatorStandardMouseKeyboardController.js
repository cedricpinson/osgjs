import OrbitManipulatorStandardMouseKeyboardController from 'osgGA/OrbitManipulatorStandardMouseKeyboardController';
import InputGroups from 'osgViewer/input/InputConstants';
import utils from 'osg/utils';

var CADManipulatorStandardMouseKeyboardController = function(manipulator) {
    OrbitManipulatorStandardMouseKeyboardController.call(this, manipulator);
    this._timer = false;
};

var ZOOM_OFFSET = 10;
var PICK_INTERVAL = 200;

utils.createPrototypeObject(
    CADManipulatorStandardMouseKeyboardController,
    utils.objectInherit(OrbitManipulatorStandardMouseKeyboardController.prototype, {
        _initInputs: function() {
            OrbitManipulatorStandardMouseKeyboardController.prototype._initInputs.call(
                this,
                InputGroups.CAD_MANIPULATOR_MOUSEKEYBOARD,
                InputGroups.CAD_MANIPULATOR_RESETTOHOME
            );
            var manager = this._manipulator.getInputManager();

            manager.group(InputGroups.CAD_MANIPULATOR_MOUSEKEYBOARD).addMappings(
                {
                    savePosition: 'mousemove'
                },
                this
            );
        },

        zoom: function(ev) {
            var intDelta = -ev.deltaY / this._zoomFactor;
            var manipulator = this._manipulator;
            var zoomTarget = manipulator.getZoomInterpolator().getTarget()[0] - intDelta;
            manipulator.getZoomInterpolator().setTarget(zoomTarget);
            if (this._timer === false) {
                this._timer = true;
                var that = this;
                if (this._timerRef) {
                    clearTimeout(this._timerRef);
                }
                this._timerRef = setTimeout(function() {
                    that._timer = false;
                }, PICK_INTERVAL);
                manipulator.computeIntersections(ev.glX, ev.glY);
            }
        },

        savePosition: function(ev) {
            this._lastX = ev.glX;
            this._lastY = ev.glY;
        },

        setMode: function(mode, interpolator, ev) {
            if (!this._inMotion) {
                this._manipulator.computeIntersections(this._lastX, this._lastY);
            }
            OrbitManipulatorStandardMouseKeyboardController.prototype.setMode.call(
                this,
                mode,
                interpolator,
                ev
            );
        },

        center: function(ev) {
            var manipulator = this._manipulator;
            manipulator.getZoomInterpolator().set(0.0);
            var zoomTarget = manipulator.getZoomInterpolator().getTarget()[0] - ZOOM_OFFSET;
            manipulator.getZoomInterpolator().setTarget(zoomTarget);
            manipulator.computeIntersections(ev.glX, ev.glY);
        }
    })
);

export default CADManipulatorStandardMouseKeyboardController;
