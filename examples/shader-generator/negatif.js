(function() {
    'use strict';

    var osg = window.OSG.osg;

    var NegatifAttribute = function() {
        osg.StateAttribute.call(this);
        this._attributeEnable = false;
    };

    window.NegatifAttribute = NegatifAttribute;

    osg.createPrototypeStateAttribute(
        NegatifAttribute,
        osg.objectInherit(osg.StateAttribute.prototype, {
            attributeType: 'Negatif',

            cloneType: function() {
                return new NegatifAttribute();
            },

            // uniforms list are per ClassType
            getOrCreateUniforms: function() {
                var obj = NegatifAttribute;
                if (obj.uniforms) return obj.uniforms;

                obj.uniforms = {
                    enable: osg.Uniform.createInt1(0, 'negatifEnable')
                };

                return obj.uniforms;
            },

            setAttributeEnable: function(state) {
                this._attributeEnable = state;
            },

            getAttributeEnable: function() {
                return this._attributeEnable;
            },

            apply: function() {
                var uniforms = this.getOrCreateUniforms();
                var value = this._attributeEnable ? 1 : 0;
                uniforms.enable.setFloat(value);
            }
        }),
        'osg',
        'Negatif'
    );
})();
