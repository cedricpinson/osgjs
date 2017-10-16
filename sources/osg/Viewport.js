import utils from 'osg/utils';
import StateAttribute from 'osg/StateAttribute';
import { mat4 } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';

var Viewport = function(x, y, w, h) {
    StateAttribute.call(this);

    this._x = x !== undefined ? x : 0;
    this._y = y !== undefined ? y : 0;
    this._width = w !== undefined ? w : 800;
    this._height = h !== undefined ? h : 600;
};

utils.createPrototypeStateAttribute(
    Viewport,
    utils.objectInherit(StateAttribute.prototype, {
        attributeType: 'Viewport',

        cloneType: function() {
            return new Viewport();
        },

        setViewport: function(x, y, width, height) {
            this._x = x;
            this._y = y;
            this._width = width;
            this._height = height;
        },

        x: function() {
            return this._x;
        },

        y: function() {
            return this._y;
        },

        width: function() {
            return this._width;
        },

        height: function() {
            return this._height;
        },

        computeWindowMatrix: (function() {
            var translate = mat4.create();
            var scale = mat4.create();
            var tmpVec = vec3.create();

            return function(destination) {
                // res = Matrix offset * Matrix scale * Matrix translate
                mat4.fromTranslation(translate, vec3.ONE);
                mat4.fromScaling(scale, [0.5 * this._width, 0.5 * this._height, 0.5]);
                var offset = mat4.fromTranslation(
                    destination,
                    vec3.set(tmpVec, this._x, this._y, 0.0)
                );

                return mat4.mul(offset, offset, mat4.mul(scale, scale, translate));
            };
        })(),

        apply: function(state) {
            state.applyViewport(this);
        }
    }),
    'osg',
    'Viewport'
);

export default Viewport;
