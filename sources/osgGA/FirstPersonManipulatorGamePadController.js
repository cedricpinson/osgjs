import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import InputGroups from 'osgViewer/input/InputConstants';

var FirstPersonManipulatorGamePadController = function(manipulator) {
    Controller.call(this, manipulator);
    this.init();
};

var LOOK_THR = 0.07;
var MOVE_THR = 0.05;

utils.createPrototypeObject(
    FirstPersonManipulatorGamePadController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._delay = 0.15;
            this._lookFactor = 8;
            this._moveFactor = 0.1;
            this._straffeFactor = 0.1;
            this._stepFactor = 1.0;

            //var rotateTarget, panTarget;
            this._look = this._manipulator.getLookPositionInterpolator();
            this._forward = this._manipulator.getForwardInterpolator();
            this._straffe = this._manipulator.getSideInterpolator();

            this._look.setDelay(this._delay);
            this._forward.setDelay(this._delay);
            this._straffe.setDelay(this._delay);

            var manager = this._manipulator.getInputManager();
            manager.group(InputGroups.FPS_MANIPULATOR_GAMEPAD).addMappings(
                {
                    verticalLook: 'axis 3',
                    horizontalLook: 'axis 2',
                    straffe: 'axis 0',
                    move: 'axis 1',
                    stepFactorUp: 'buttonup 5',
                    stepFactorDown: 'buttonup 7'
                },
                this
            );
        },

        _getValue: function(inVal, threshold) {
            var val = inVal;
            if (val < threshold && val > -threshold) {
                val = 0;
            }
            return val;
        },

        verticalLook: function(ev) {
            var val = this._getValue(ev.value, LOOK_THR);
            this._look.addTarget(0, val * this._lookFactor);
        },

        horizontalLook: function(ev) {
            var val = this._getValue(ev.value, LOOK_THR);
            this._look.addTarget(val * this._lookFactor);
        },

        straffe: function(ev) {
            var val = this._getValue(ev.value, MOVE_THR);
            this._straffe.setTarget(val * this._straffeFactor);
        },

        move: function(ev) {
            var val = this._getValue(ev.value, MOVE_THR);
            this._forward.setTarget(-val * this._moveFactor);
        },

        stepFactorUp: function() {
            this._stepFactor += 0.1;
            this._manipulator.setStepFactor(this._stepFactor);
        },

        stepFactorDown: function() {
            this._stepFactor -= 0.1;
            this._manipulator.setStepFactor(this._stepFactor);
        }
    })
);
export default FirstPersonManipulatorGamePadController;
