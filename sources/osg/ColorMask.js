'use strict';
var utils = require('osg/utils');
var StateAttribute = require('osg/StateAttribute');

var ColorMask = function(red, green, blue, alpha) {
    StateAttribute.call(this);
    this._red = true;
    this._green = true;
    this._blue = true;
    this._alpha = true;

    if (red !== undefined && green !== undefined && blue !== undefined)
        this.setMask(red, green, blue, alpha);
};

utils.createPrototypeStateAttribute(
    ColorMask,
    utils.objectInherit(StateAttribute.prototype, {
        attributeType: 'ColorMask',
        cloneType: function() {
            return new ColorMask();
        },
        setMask: function(red, green, blue, alpha) {
            this._red = !!red;
            this._green = !!green;
            this._blue = !!blue;
            this._alpha = !!alpha;
        },
        apply: function(state) {
            state.applyColorMask(this);
        }
    }),
    'osg',
    'ColorMask'
);

module.exports = ColorMask;
