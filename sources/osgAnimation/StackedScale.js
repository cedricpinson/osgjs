'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Object = require( 'osg/Object' );
var Matrix = require( 'osg/Matrix' );
var Vec3 = require( 'osg/Vec3' );
var Target = require( 'osgAnimation/Target' );


var StackedScale = function ( name, scale ) {
    Object.call( this );
    this._target = Target.createVec3Target( scale || Vec3.one );
    if ( name ) this.setName( name );
};


StackedScale.prototype = MACROUTILS.objectInherit( Object.prototype, {

    init: function ( scale ) {
        this.setScale( scale );
        Vec3.copy( scale, this._target.defaultValue );
    },

    setScale: function ( scale ) {
        Vec3.copy( scale, this._target.value );
    },

    getTarget: function () {
        return this._target;
    },

    resetToDefaultValue: function () {
        this.setScale( this._target.defaultValue );
    },

    // must be optimized
    applyToMatrix: function ( m ) {

        var scale = this._target.value;

        Matrix.preMultScale( m, scale );

    }

} );

module.exports = StackedScale;
