( function () {
    'use strict';

    var osg = window.OSG.osg;

    var TemporalAttribute = window.TemporalAttribute = function () {
        osg.StateAttribute.call( this );
        this._attributeEnable = false;
    };

    TemporalAttribute.prototype = osg.objectLibraryClass( osg.objectInherit( osg.StateAttribute.prototype, {
        attributeType: 'Temporal',

        cloneType: function () {
            return new TemporalAttribute();
        },

        // uniforms list are per ClassType
        getOrCreateUniforms: function () {
            var obj = TemporalAttribute;
            if ( obj.uniforms ) return obj.uniforms;

            obj.uniforms = {
                enable: osg.Uniform.createInt1( 0, 'temporalEnable' )
            };

            return obj.uniforms;
        },

        setAttributeEnable: function ( state ) {
            this._attributeEnable = state;
        },

        getAttributeEnable: function () {
            return this._attributeEnable;
        },

        apply: function ( /*state*/) {
            var uniforms = this.getOrCreateUniforms();
            var value = this._attributeEnable ? 1 : 0;
            uniforms.enable.setFloat( value );
        }

    } ), 'osg', 'Temporal' );

    window.TemporalAttribute = TemporalAttribute;

} )();
