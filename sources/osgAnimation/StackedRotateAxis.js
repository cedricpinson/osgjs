define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osg/Vec3',
    'osg/Quat'
], function ( MACROUTILS, Object, Matrix, Vec3, Quat ) {

    'use strict';

    /**
     *  StackedRotateAxis
     */
    var StackedRotateAxis = function ( name, axis, angle ) {
        Object.call( this );

        this._axis = Vec3.set( 0.0, 0.0, 1.0, Vec3.create() );

        if ( axis )
            this._axis = Vec3.copy( axis, this._axis );

        this._target = {
            value: angle || 0.0
        };
        this.setName( name );
        this._defaultValue = this._target.value;

    };

    StackedRotateAxis.prototype = MACROUTILS.objectInherit( Object.prototype, {

        init: function ( axis, angle ) {
            this.setAxis( axis );
            this._defaultValue = angle;
            this.setAngle( angle );
        },

        setAxis: function ( axis ) {
            Vec3.copy( axis, this._axis );
        },

        setAngle: function ( angle ) {
            this._target.value = angle;
        },

        setTarget: function ( target ) {
            this._target = target;
        },

        getTarget: function () {
            return this._target;
        },

        resetToDefaultValue: function () {
            this.setAngle( this._defaultValue );
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

    return StackedRotateAxis;
} );
