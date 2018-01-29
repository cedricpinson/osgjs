import OrbitManipulatorHammerController from 'osgGA/OrbitManipulatorHammerController';
import InputGroups from 'osgViewer/input/InputConstants';
import utils from 'osg/utils';

var CADManipulatorHammerController = function(manipulator) {
    OrbitManipulatorHammerController.call(this, manipulator);
    this._timer = false;
};

utils.createPrototypeObject(
    CADManipulatorHammerController,
    utils.objectInherit(OrbitManipulatorHammerController.prototype, {
        _initInputs: function() {
            OrbitManipulatorHammerController.prototype._initInputs.call(this, InputGroups.CAD_MANIPULATOR_TOUCH);
        },

        startMotion: function(interpolator, factor, ev) {
            OrbitManipulatorHammerController.prototype.startMotion.call(
                this,
                interpolator,
                factor,
                ev
            );
            this._manipulator.computeIntersections(ev.glX, ev.glY);
        }
    })
);

export default CADManipulatorHammerController;
