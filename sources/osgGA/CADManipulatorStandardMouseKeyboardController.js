import OrbitManipulatorStandardMouseKeyboardController from 'osgGA/OrbitManipulatorStandardMouseKeyboardController';
import Groups from 'osgViewer/input/InputConstants';
import utils from 'osg/utils';

var CADManipulatorStandardMouseKeyboardController = function(manipulator) {
    OrbitManipulatorStandardMouseKeyboardController.call(this, manipulator);
    this._timer = false;
};

utils.createPrototypeObject(
    CADManipulatorStandardMouseKeyboardController,
    utils.objectInherit(OrbitManipulatorStandardMouseKeyboardController.prototype, {
        _initInputs: function() {
            OrbitManipulatorStandardMouseKeyboardController.prototype._initInputs.call(
                this,
                Groups.CAD_MANIPULATOR_MOUSEKEYBOARD,
                Groups.CAD_MANIPULATOR_RESETTOHOME
            );
            var manager = this._manipulator.getInputManager();

            manager.group(Groups.CAD_MANIPULATOR_MOUSEKEYBOARD).addMappings(
                {
                    savePosition: 'mousemove'
                },
                this
            );
        },

        zoom: function(ev) {
            var intDelta = -ev.deltaY / 40;
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
                }, 1000);
                manipulator.computeIntersections(ev.glX, ev.glY);
            }
        },

        savePosition: function(ev) {
            this._lastX = ev.glX;
            this._lastY = ev.glY;
        },

        changeMode: function(mode, interpolator, ev) {
            if (!this._inMotion) {
                this._manipulator.computeIntersections(this._lastX, this._lastY);
            }
            OrbitManipulatorStandardMouseKeyboardController.prototype.changeMode.call(
                this,
                mode,
                interpolator,
                ev
            );
        },

        center: function(ev) {
            var manipulator = this._manipulator;
            manipulator.getZoomInterpolator().set(0.0);
            var zoomTarget = manipulator.getZoomInterpolator().getTarget()[0] - 10; // Default interval 10
            manipulator.getZoomInterpolator().setTarget(zoomTarget);
            manipulator.computeIntersections(ev.glX, ev.glY);
        }
    })
);

export default CADManipulatorStandardMouseKeyboardController;
