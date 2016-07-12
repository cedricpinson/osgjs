'use strict';
var MACROUTILS = require( 'osg/Utils' );
var StateAttribute = require( 'osg/StateAttribute' );
var Vec4 = require( 'osg/Vec4' );

/**
 *  Manage BlendColor attribute
 *  @class
 *  @memberof osg
 *  @extends StateAttribute
 */
var BlendColor = function ( color ) {
    StateAttribute.call( this );
    this._constantColor = Vec4.create();
    Vec4.set( 1.0, 1.0, 1.0, 1.0, this._constantColor );
    if ( color !== undefined ) {
        this.setConstantColor( color );
    }
};


BlendColor.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {
    attributeType: 'BlendColor',
    cloneType: function () {
        return new BlendColor();
    },

    /**
     * @param {Vec4} [color] sets the constant color
     * @memberof osg.BlendColor
     */
    setConstantColor: function ( color ) {
        Vec4.copy( color, this._constantColor );
    },
    /**
     * @return { constantColor }
     * @memberof osg.BlendColor
     */
    getConstantColor: function () {
        return this._constantColor;
    },
    apply: function ( state ) {
        var gl = state.getGraphicContext();
        gl.blendColor( this._constantColor[ 0 ],
            this._constantColor[ 1 ],
            this._constantColor[ 2 ],
            this._constantColor[ 3 ] );
    }
} ), 'osg', 'BlendColor' );

module.exports = BlendColor;
