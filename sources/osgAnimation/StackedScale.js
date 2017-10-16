import utils from 'osg/utils';
import Object from 'osg/Object';
import { mat4 } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';
import Target from 'osgAnimation/target';

var StackedScale = function(name, scale) {
    Object.call(this);
    this._target = Target.createVec3Target(scale || vec3.ONE);
    if (name) this.setName(name);
};

utils.createPrototypeObject(
    StackedScale,
    utils.objectInherit(Object.prototype, {
        init: function(scale) {
            this.setScale(scale);
            vec3.copy(this._target.defaultValue, scale);
        },

        setScale: function(scale) {
            vec3.copy(this._target.value, scale);
        },

        getTarget: function() {
            return this._target;
        },

        resetToDefaultValue: function() {
            this.setScale(this._target.defaultValue);
        },

        // must be optimized
        applyToMatrix: function(m) {
            var scale = this._target.value;
            mat4.scale(m, m, scale);
        }
    }),
    'osgAnimation',
    'StackedScale'
);

export default StackedScale;
