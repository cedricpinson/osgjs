define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osg/Vec3',
    'osgAnimation/Target'
], function ( MACROUTILS, Object, Matrix, Vec3, Target ) {

    'use strict';

    /**
     *  StackedTranslate
     */
    var StackedTranslate = function ( name, translate ) {
        Object.call( this );
        this._target = Target.createVec3Target( translate || Vec3.zero );
        if ( name ) this.setName( name );
    };


    StackedTranslate.prototype = MACROUTILS.objectInherit( Object.prototype, {

        init: function ( translate ) {
            this.setTranslate( translate );
            Vec3.copy( translate, this._target.defaultValue );
        },

        setTranslate: function ( translate ) {
            Vec3.copy( translate, this._target.value );
        },

        getTarget: function () {
            return this._target;
        },

        resetToDefaultValue: function () {
            this.setTranslate( this._target.defaultValue );
        },

        applyToMatrix: function ( m ) {
            Matrix.preMultTranslate( m, this._target.value );
        }
    } );

    return StackedTranslate;
} );
