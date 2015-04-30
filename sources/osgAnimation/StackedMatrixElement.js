define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osg/MatrixTarget'
], function ( MACROUTILS, Object, Matrix, MatrixTarget ) {

    'use strict';

    /**
     *  StackedMatrixElement
     *  @class StackedMatrixElement
     */

    var StackedMatrixElement = function ( name, matrix ) {
        Object.call( this );
        if ( !matrix ) {
            this._matrix = Matrix.makeIdentity();
        }
        this._matrix = matrix;
        this._target = undefined;
        this.setName( name );
    };

    StackedMatrixElement.prototype = MACROUTILS.objectInherit( Object.prototype, {
        applyToMatrix: function ( matrix ) {
            Matrix.postMult( this._matrix, matrix );
        },
        getMatrix: function () {
            return this._matrix;
        },
        setMatrix: function ( matrix ) {
            Matrix.copy( matrix, this._matrix );
        },
        isIdentity: function () {
            return Matrix.isIdentity( this._matrix );
        },
        update: function () {
            if ( this._target ) {
                Matrix.copy( this._target, this._matrix );
            }
        },
        getOrCreateTarget: function () {
            if ( !this._target ) {
                this._target = new MatrixTarget( this._matrix );
            }
            return this._target;
        },
        getTarget: function () {
            return this._target;
        }
    } );

    return StackedMatrixElement;
} );
