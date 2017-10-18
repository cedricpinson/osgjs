import utils from 'osg/utils';
import StateAttribute from 'osg/StateAttribute';

var Scissor = function(x, y, w, h) {
    StateAttribute.call(this);

    this._x = x !== undefined ? x : -1;
    this._y = y !== undefined ? y : -1;
    this._width = w !== undefined ? w : -1;

    this._height = h !== undefined ? h : -1;
};

utils.createPrototypeStateAttribute(
    Scissor,
    utils.objectInherit(StateAttribute.prototype, {
        attributeType: 'Scissor',

        cloneType: function() {
            return new Scissor();
        },

        setScissor: function(x, y, width, height) {
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

        apply: function(state) {
            state.applyScissor(this);
        }
    }),
    'osg',
    'Scissor'
);

export default Scissor;
