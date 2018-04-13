import OrbitManipulatorHammerController from 'osgGA/OrbitManipulatorHammerController';
import InputGroups from 'osgViewer/input/InputConstants';
import utils from 'osg/utils';

var FirstPersonManipulatorHammerController = function(manipulator) {
    OrbitManipulatorHammerController.call(this, manipulator);
    this._timer = false;
};

utils.createPrototypeObject(
    FirstPersonManipulatorHammerController,
    utils.objectInherit(OrbitManipulatorHammerController.prototype, {
        _initInputs: function() {
            OrbitManipulatorHammerController.prototype._initInputs.call(
                this,
                InputGroups.FPS_MANIPULATOR_TOUCH
            );
        }
    })
);

export default FirstPersonManipulatorHammerController;
