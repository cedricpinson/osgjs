import utils from 'osg/utils';
import { mat4 } from 'osg/glMatrix';
import AnimationUpdateCallback from 'osgAnimation/AnimationUpdateCallback';

/**
 *  UpdateMatrixTransform
 */
var UpdateMatrixTransform = function() {
    AnimationUpdateCallback.call(this);

    // maybe could have a more generic name and used by all AnimationUpdateCallback
    this._stackedTransforms = [];

    this._matrix = mat4.create();

    this._dirty = false;
};

utils.createPrototypeObject(
    UpdateMatrixTransform,
    utils.objectInherit(AnimationUpdateCallback.prototype, {
        getStackedTransforms: function() {
            return this._stackedTransforms;
        },

        setMatrix: function(matrix) {
            mat4.copy(this._matrix, matrix);
            this._dirty = true;
        },

        getMatrix: function() {
            return this._matrix;
        },

        computeChannels: function() {
            this._dirty = true;
            var matrix = this._matrix;
            mat4.identity(matrix);
            var transforms = this._stackedTransforms;

            for (var i = 0, l = transforms.length; i < l; i++) {
                var transform = transforms[i];
                transform.applyToMatrix(matrix);
            }
        },

        reset: function() {
            var stacked = this._stackedTransforms;
            for (var i = 0, nbStacked = stacked.length; i < nbStacked; i++) {
                stacked[i].resetToDefaultValue();
            }

            // computeChannels is not mandatory here as the following frame will call
            // this function anyway
            this.computeChannels();
        },

        update: function(node /*, nv */) {
            mat4.copy(node.getMatrix(), this._matrix);
            if (this._dirty) {
                node.dirtyBound();
                this._dirty = false;
            }
            return true;
        }
    }),
    'osgAnimation',
    'UpdateMatrixTransform'
);

export default UpdateMatrixTransform;
