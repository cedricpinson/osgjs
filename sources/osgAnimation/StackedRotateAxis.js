'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Object = require( 'osg/Object' );
var Matrix = require( 'osg/Matrix' );
var Vec3 = require( 'osg/Vec3' );
var Quat = require( 'osg/Quat' );
var Target = require( 'osgAnimation/Target' );

/**
 *  @class
 *  @memberof osgAnimation
 */
var StackedRotateAxis = function ( name, axis, angle ) {
    Object.call( this );
    this._axis = Vec3.set( 0, 0, 1, Vec3.create() );
    if ( axis ) Vec3.copy( axis, this._axis );
    this._target = Target.createFloatTarget( typeof angle === 'number' ? angle : 0.0 );
    if ( name ) this.setName( name );
};

StackedRotateAxis.prototype = MACROUTILS.objectInherit( Object.prototype, {

    init: function ( axis, angle ) {
        this.setAxis( axis );
        this.setAngle( angle );
        this._target.defaultValue = angle;
    },

    setAxis: function ( axis ) {
        Vec3.copy( axis, this._axis );
    },

    setAngle: function ( angle ) {
        this._target.value = angle;
    },

    getTarget: function () {
        return this._target;
    },

    resetToDefaultValue: function () {
        this.setAngle( this._target.defaultValue );
    },

    applyToMatrix: ( function () {
        var matrixTmp = Matrix.create();
        var quatTmp = Quat.create();

        return function ( m ) {
            var axis = this._axis;
            var qtmp = quatTmp;
            var mtmp = matrixTmp;
            var angle = this._target.value;

            Quat.makeRotate( angle, axis[ 0 ], axis[ 1 ], axis[ 2 ], qtmp );
            Matrix.setRotateFromQuat( mtmp, qtmp );
            Matrix.preMult( m, mtmp );
        };
    } )()

} );

module.exports = StackedRotateAxis;
