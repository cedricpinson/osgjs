import utils from 'osg/utils';
import Object from 'osg/Object';
import { mat4 } from 'osg/glMatrix';
import { quat } from 'osg/glMatrix';
import Target from 'osgAnimation/target';

var qIdentity = quat.create();

var StackedQuaternion = function(name, q) {
    Object.call(this);
    this._target = Target.createQuatTarget(q || qIdentity);
    if (name) this.setName(name);
};

utils.createPrototypeObject(
    StackedQuaternion,
    utils.objectInherit(Object.prototype, {
        init: function(q) {
            this.setQuaternion(q);
            quat.copy(this._target.defaultValue, q);
        },

        setQuaternion: function(q) {
            quat.copy(this._target.value, q);
        },

        getTarget: function() {
            return this._target;
        },

        resetToDefaultValue: function() {
            this.setQuaternion(this._target.defaultValue);
        },

        applyToMatrix: (function() {
            var matrixTmp = mat4.create();

            return function applyToMatrix(m) {
                var mtmp = matrixTmp;
                mat4.fromQuat(mtmp, this._target.value);
                mat4.mul(m, m, mtmp);
            };
        })()
    }),
    'osgAnimation',
    'StackedQuaternion'
);

export default StackedQuaternion;
