import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import { vec2 } from 'osg/glMatrix';
import InputGroups from 'osgViewer/input/InputConstants';

var OrbitManipulatorGamePadController = function(manipulator) {
    Controller.call(this, manipulator);
    this.init();
};

utils.createPrototypeObject(
    OrbitManipulatorGamePadController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._delay = 0.15;
            this._zoomFactor = 0.5;
            this._rotateFactor = 5.0;
            this._panFactor = 10.0;

            //var rotateTarget, panTarget;
            this._rotate = this._manipulator.getRotateInterpolator();
            this._zoom = this._manipulator.getZoomInterpolator();
            this._pan = this._manipulator.getPanInterpolator();

            this._rotate.setDelay(this._delay);
            this._zoom.setDelay(this._delay);
            this._pan.setDelay(this._delay);

            var manager = this._manipulator.getInputManager();
            manager.group(InputGroups.ORBIT_MANIPULATOR_GAMEPAD).addMappings(
                {
                    addZoom: 'axis 3',
                    addRotateX: 'axis 0',
                    addRotateY: 'axis 1'
                },
                this
            );

            manager.group(InputGroups.ORBIT_MANIPULATOR_GAMEPAD).addMappings(
                {
                    panUp: 'buttonvalue 12'
                },
                this.pan.bind(this, vec2.fromValues(0, 1))
            );

            manager.group(InputGroups.ORBIT_MANIPULATOR_GAMEPAD).addMappings(
                {
                    panDown: 'buttonvalue 13'
                },
                this.pan.bind(this, vec2.fromValues(0, -1))
            );

            manager.group(InputGroups.ORBIT_MANIPULATOR_GAMEPAD).addMappings(
                {
                    panLeft: 'buttonvalue 14'
                },
                this.pan.bind(this, vec2.fromValues(1, 0))
            );

            manager.group(InputGroups.ORBIT_MANIPULATOR_GAMEPAD).addMappings(
                {
                    panRight: 'buttonvalue 15'
                },
                this.pan.bind(this, vec2.fromValues(-1, 0))
            );

            // Keeping this for whenever we add the support for custom gamepad layout
            //    this._padFactor = 10.0;
            //    //SpaceNavigator & 6-axis controllers
            //         } else if (axes.length >= 5) {
            //     if (Math.abs(axes[0]) > AXIS_THRESHOLD || Math.abs(axes[1]) > AXIS_THRESHOLD) {
            //         this.addPan(pan, -axes[0], axes[1]);
            //     }
            //
            //     if (Math.abs(axes[2]) > AXIS_THRESHOLD) {
            //         this.addZoom(zoom, -axes[2]);
            //     }
            //
            //     if (Math.abs(axes[3]) > AXIS_THRESHOLD || Math.abs(axes[4]) > AXIS_THRESHOLD) {
            //         this.addRotate(rotate, axes[4], axes[3]);
            //     }
            // }
        },

        pan: function(delta) {
            var panTarget = this._pan.getTarget();
            this._pan.setTarget(
                panTarget[0] - delta[0] * this._panFactor,
                panTarget[1] + delta[1] * this._panFactor
            );
        },

        addZoom: function(ev) {
            this._zoom.addTarget(-ev.value * this._zoomFactor);
        },

        addRotateX: function(ev) {
            this._rotate.addTarget(-ev.value * this._rotateFactor);
        },

        addRotateY: function(ev) {
            this._rotate.addTarget(0, ev.value * this._rotateFactor);
        }
    })
);
export default OrbitManipulatorGamePadController;
