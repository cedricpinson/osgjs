'use strict';

var MACROUTILS = require( 'osg/Utils' );
var StateAttribute = require( 'osg/StateAttribute' );
var Uniform = require( 'osg/Uniform' );


var PointSizeAttribute = function ( disable ) {
    StateAttribute.call( this );

    this._enable = !disable;
    this._pointSize = 1.0;
    // careful with this option if there is lines/triangles under the stateset
    this._circleShape = false;
};

PointSizeAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

    attributeType: 'PointSize',

    cloneType: function () {
        return new PointSizeAttribute( true );
    },

    setCircleShape: function ( bool ) {
        this._circleShape = bool;
    },

    isCircleShape: function () {
        return this._circleShape;
    },

    setEnabled: function ( state ) {
        this._enable = state;
    },

    isEnabled: function () {
        return this._enable;
    },

    setPointSize: function ( size ) {
        this._pointSize = size;
    },

    getOrCreateUniforms: function () {
        var obj = PointSizeAttribute;
        if ( obj.uniforms ) return obj.uniforms;

        obj.uniforms = {
            pointSize: Uniform.createFloat( 1.0, 'uPointSize' )
        };

        return obj.uniforms;
    },

    getHash: function () {
        return this.getTypeMember() + ( this.isEnabled() ? '1' : '0' ) + ( this._circleShape ? '1' : '0' );
    },

    apply: function () {

        if ( !this._enable ) return;

        var uniforms = this.getOrCreateUniforms();
        uniforms.pointSize.setFloat( this._pointSize );

    }

} ), 'osg', 'PointSizeAttribute' );

MACROUTILS.setTypeID( PointSizeAttribute );

module.exports = PointSizeAttribute;
