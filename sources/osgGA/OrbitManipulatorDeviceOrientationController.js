import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import { quat } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';

import FirstPersonDeviceOrientation from 'osgGA/FirstPersonManipulatorDeviceOrientationController';
import Groups from 'osgViewer/input/InputConstants';

var OrbitManipulatorDeviceOrientationController = function(manipulator) {
    Controller.call(this, manipulator);
    this.init();
};

utils.createPrototypeObject(
    OrbitManipulatorDeviceOrientationController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._quat = quat.create();
            this._pos = vec3.create();

            this._deviceOrientation = undefined;
            this._screenOrientation = undefined;

            var manager = this._manipulator.getInputManager();
            manager.group(Groups.ORBIT_MANIPULATOR_DEVICEORIENTATION).addMappings(
                {
                    setDeviceOrientation: 'deviceorientation',
                    setScreenOrientation: 'orientationchange'
                },
                this
            );

            // default to disabled
            manager.setEnable(Groups.ORBIT_MANIPULATOR_DEVICEORIENTATION, false);
        },

        setDeviceOrientation: function(ev) {
            if (!this._deviceOrientation) {
                this._deviceOrientation = {};
            }
            this._deviceOrientation.alpha = ev.alpha;
            this._deviceOrientation.beta = ev.beta;
            this._deviceOrientation.gamma = ev.gamma;

            if (ev.screenOrientation) {
                this.setScreenOrientation(ev);
                return;
            }

            this._update();
        },

        setScreenOrientation: function(ev) {
            this._screenOrientation = ev.screenOrientation;
            this._update();
        },

        _update: function() {
            if (!this._deviceOrientation || !this._screenOrientation) {
                return;
            }

            FirstPersonDeviceOrientation.computeQuaternion(
                this._quat,
                this._deviceOrientation,
                this._screenOrientation
            );
            this._manipulator.setPoseVR(this._quat, this._pos);
        }
    })
);

export default OrbitManipulatorDeviceOrientationController;
