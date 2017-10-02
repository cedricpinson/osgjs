'use strict';
var utils = require('osg/utils');
var StateAttribute = require('osg/StateAttribute');

var BillboardAttribute = function() {
    StateAttribute.call(this);
    this._attributeEnable = false;
};

utils.createPrototypeStateAttribute(
    BillboardAttribute,
    utils.objectInherit(StateAttribute.prototype, {
        attributeType: 'Billboard',

        cloneType: function() {
            return new BillboardAttribute();
        },

        setEnabled: function(state) {
            this._attributeEnable = state;
        },

        isEnabled: function() {
            return this._attributeEnable;
        },

        apply: function() {}
    }),
    'osg',
    'Billboard'
);

module.exports = BillboardAttribute;
