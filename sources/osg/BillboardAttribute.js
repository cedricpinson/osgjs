import utils from 'osg/utils';
import StateAttribute from 'osg/StateAttribute';

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

export default BillboardAttribute;
