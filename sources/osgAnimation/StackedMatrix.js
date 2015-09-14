define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osgAnimation/Target',
], function ( MACROUTILS, Object, Matrix, Target ) {

    'use strict';

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

    return StackedMatrix;
} );
