define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix'
], function ( MACROUTILS, Object, Matrix ) {

    'use strict';

    /**
     *  StackedMatrixElement
     *  @class StackedMatrixElement
     */

    var StackedMatrixElement = function ( name, matrix ) {
        Object.call( this );

        var value = Matrix.create();

        if ( matrix ) Matrix.copy( matrix, value );

        this._target = {
            value: value
        };
        this._bindTransform = value;

        this.setName( name );
    };

    StackedMatrixElement.prototype = MACROUTILS.objectInherit( Object.prototype, {

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

        applyToMatrix: function ( m ) {
            Matrix.preMult( m, this._target.value );
        }


    } );

    return StackedMatrixElement;
} );
