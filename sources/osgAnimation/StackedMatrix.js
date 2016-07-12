'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Object = require( 'osg/Object' );
var Matrix = require( 'osg/Matrix' );
var Target = require( 'osgAnimation/Target' );

/**
 *  @class
 *  @memberof osgAnimation
 */
var StackedMatrix = function ( name, matrix ) {
    Object.call( this );
    this._target = Target.createMatrixTarget( matrix || Matrix.identity );
    if ( name ) this.setName( name );
};

StackedMatrix.prototype = MACROUTILS.objectInherit( Object.prototype, {

    init: function ( matrix ) {
        this.setMatrix( matrix );
        Matrix.copy( matrix, this._target.defaultValue );
    },

    getTarget: function () {
        return this._target;
    },

    getMatrix: function () {
        return this._target.value;
    },

    setMatrix: function ( m ) {
        Matrix.copy( m, this._target.value );
    },

    resetToDefaultValue: function () {
        this.setMatrix( this._target.defaultValue );
    },

    applyToMatrix: function ( m ) {
        Matrix.preMult( m, this._target.value );
    }

} );

module.exports = StackedMatrix;
