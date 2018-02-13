import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import { quat } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';
import { mat4 } from 'osg/glMatrix';
import InputGroups from 'osgViewer/input/InputConstants';

var tempQuat = quat.create();
var tempPos = vec3.create();

var FirstPersonManipulatorWebVRController = function(manipulator) {
    Controller.call(this, manipulator);
    this.init();
};

utils.createPrototypeObject(
    FirstPersonManipulatorWebVRController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._pos = vec3.create();
            this._quat = quat.create();

            var manager = this._manipulator.getInputManager();
            manager.group(InputGroups.FPS_MANIPULATOR_WEBVR).addMappings(
                {
                    update: 'vrdisplayposechanged'
                },
                this
            );

            // default to disabled
            manager.setEnable(InputGroups.FPS_MANIPULATOR_WEBVR, false);
        },
        update: function(ev) {
            var q = ev.pose.orientation;
            if (q) {
                if (ev.sitToStandMatrix) {
                    q = mat4.getRotation(tempQuat, ev.sitToStandMatrix);
                    quat.mul(q, q, ev.pose.orientation);
                }

                this._quat[0] = q[0];
                this._quat[1] = -q[2];
                this._quat[2] = q[1];
                this._quat[3] = q[3];
            }

            var pos = ev.pose.position;
            if (pos) {
                if (ev.sitToStandMatrix) {
                    pos = vec3.transformMat4(tempPos, pos, ev.sitToStandMatrix);
                }
                this._pos[0] = pos[0] * ev.worldScale;
                this._pos[1] = -pos[2] * ev.worldScale;
                this._pos[2] = pos[1] * ev.worldScale;
            }
            this._manipulator.setPoseVR(this._quat, this._pos);
        }
    })
);

export default FirstPersonManipulatorWebVRController;
