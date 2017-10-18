import utils from 'osg/utils';
import Object from 'osg/Object';
import { vec3 } from 'osg/glMatrix';
import { mat4 } from 'osg/glMatrix';
import Target from 'osgAnimation/target';

/**
 *  StackedTranslate
 */
var StackedTranslate = function(name, translate) {
    Object.call(this);
    this._target = Target.createVec3Target(translate || vec3.ZERO);
    if (name) this.setName(name);
};

utils.createPrototypeObject(
    StackedTranslate,
    utils.objectInherit(Object.prototype, {
        init: function(translate) {
            this.setTranslate(translate);
            vec3.copy(this._target.defaultValue, translate);
        },

        setTranslate: function(translate) {
            vec3.copy(this._target.value, translate);
        },

        getTarget: function() {
            return this._target;
        },

        resetToDefaultValue: function() {
            this.setTranslate(this._target.defaultValue);
        },

        applyToMatrix: function(m) {
            mat4.translate(m, m, this._target.value);
        }
    }),
    'osgAnimation',
    'StackedTranslate'
);

export default StackedTranslate;
