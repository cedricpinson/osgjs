(function() {
    'use strict';

    var osg = window.OSG.osg;

    var RampAttribute = function() {
        osg.StateAttribute.call(this);
        this._attributeEnable = false;
    };

    window.RampAttribute = RampAttribute;

    osg.createPrototypeStateAttribute(
        RampAttribute,
        osg.objectInherit(osg.StateAttribute.prototype, {
            attributeType: 'Ramp',

            cloneType: function() {
                return new RampAttribute();
            },

            setAttributeEnable: function(state) {
                this._attributeEnable = state;
            },

            getAttributeEnable: function() {
                return this._attributeEnable;
            },

            // getHash is used to know if an StateAttribute changed
            // if yes it will trigger a shader rebuild. You can for example
            // trigger a change if we enable or not the attribute. It's really
            // up to how you want to handle your shaders
            // if you dont want to trigger rebuild of shader then instead you an use a
            // uniform and keep always the same hash
            getHash: function() {
                return this.getType() + this._attributeEnable.toString();
            }
        }),
        'osg',
        'Ramp'
    );
})();
