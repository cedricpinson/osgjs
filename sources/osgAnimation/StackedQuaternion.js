define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osg/Quat',
    'osgAnimation/Target'
], function ( MACROUTILS, Object, Matrix, Quat, Target ) {

    'use strict';

    var StackedQuaternion = function ( name, quat ) {
        Object.call( this );
        this._target = Target.createQuatTarget( quat || Quat.identity );
        if ( name ) this.setName( name );
    };

    StackedQuaternion.prototype = MACROUTILS.objectInherit( Object.prototype, {

        init: function ( q ) {
            this.setQuaternion( q );
            Quat.copy( q, this._target.defaultValue );
        },

        setQuaternion: function ( q ) {
            Quat.copy( q, this._target.value );
        },

        getTarget: function () {
            return this._target;
        },

        resetToDefaultValue: function () {
            this.setQuaternion( this._target.defaultValue );
        },

        applyToMatrix: ( function () {
            var matrixTmp = Matrix.create();

            return function applyToMatrix( m ) {
                var mtmp = matrixTmp;
                Matrix.setRotateFromQuat( mtmp, this._target.value );
                Matrix.preMult( m, mtmp );
            };
        } )()

    } );

    return StackedQuaternion;
} );
