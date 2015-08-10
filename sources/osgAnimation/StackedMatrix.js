define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix'
], function ( MACROUTILS, Object, Matrix ) {

    'use strict';

    /**
     *  StackedMatrix
     *  @class StackedMatrix
     */

    var StackedMatrix = function ( name, matrix ) {
        Object.call( this );

        var value = Matrix.create();

        if ( matrix ) Matrix.copy( matrix, value );

        this._target = {
            value: value
        };
        this._defaultValue = Matrix.create();

        this.setName( name );
    };

    StackedMatrix.prototype = MACROUTILS.objectInherit( Object.prototype, {

        init: function ( matrix ) {
            this.setMatrix( matrix );
            Matrix.copy( matrix, this._defaultValue );
        },

        setTarget: function ( target ) {
            this._target = target;
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
            this.setMatrix( this._defaultValue );
        },

        applyToMatrix: function ( m ) {
            Matrix.preMult( m, this._target.value );
        }

    } );

    return StackedMatrix;
} );
