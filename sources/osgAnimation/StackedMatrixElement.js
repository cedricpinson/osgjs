define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osgAnimation/MatrixTarget'
], function ( MACROUTILS, Object, Matrix, MatrixTarget ) {

    'use strict';

    /**
     *  StackedMatrixElement
     *  @class StackedMatrixElement
     */

    var StackedMatrixElement = function ( name, matrix ) {
        Object.call( this );
        this._matrix = Matrix.create();
        if ( matrix !== undefined ) {
            this._matrix = Matrix.copy( matrix, this._matrix );
        }
        this._target = undefined;
        this.setName( name );
    };

    StackedMatrixElement.prototype = MACROUTILS.objectInherit( Object.prototype, {
        applyToMatrix: function ( m ) {
            Matrix.preMult( m, this._matrix );
        },
        getMatrix: function () {
            return this._matrix;
        },
        setMatrix: function ( m ) {
            Matrix.copy( m, this._matrix );
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
