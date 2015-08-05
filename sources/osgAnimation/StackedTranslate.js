define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osg/Vec3'
], function ( MACROUTILS, Object, Matrix, Vec3 ) {

    'use strict';

    /**
     *  StackedTranslate
     */
    var StackedTranslate = function ( name, translate ) {
        Object.call( this );

        var value = Vec3.create();
        if ( translate ) Vec3.copy( translate, value );

        this._target = {
            value: value
        };
        this._defaultValue = Vec3.create();
        if ( name ) this.setName( name );
    };


    StackedTranslate.prototype = MACROUTILS.objectInherit( Object.prototype, {

        init: function ( translate ) {
            this.setTranslate( translate );
            Vec3.copy( translate, this._defaultValue );
        },

        setTranslate: function ( translate ) {
            Vec3.copy( translate, this._target.value );
        },

        setTarget: function ( target ) {
            this._target = target;
        },

        getTarget: function () {
            return this._target;
        },

        resetToDefaultValue: function () {
            this.setTranslate( this._defaultValue );
        },

        applyToMatrix: function ( m ) {
            Matrix.preMultTranslate( m, this._target.value );
        }
    } );

    return StackedTranslate;
} );
