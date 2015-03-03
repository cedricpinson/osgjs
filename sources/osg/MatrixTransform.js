define( [
    'osg/Utils',
    'osg/Matrix',
    'osg/Transform',
    'osg/TransformEnums'
], function ( MACROUTILS, Matrix, Transform, TransformEnums ) {

    'use strict';

    /**
     *  MatrixTransform is a Transform Node that can be customized with user matrix
     *  @class MatrixTransform
     */
    var MatrixTransform = function () {
        Transform.call( this );
        this.matrix = Matrix.create();
    };

    /** @lends MatrixTransform.prototype */
    MatrixTransform.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Transform.prototype, {

        getMatrix: function () {
            return this.matrix;
        },

        setMatrix: function ( m ) {
            this.matrix = m;
            this.dirtyBound();
        },

        // local to "local world" (not Global World)
        computeLocalToWorldMatrix: function ( matrix /*, nodeVisitor */ ) {

            if ( this.referenceFrame === TransformEnums.RELATIVE_RF ) {
                Matrix.preMult( matrix, this.matrix );
            } else {
                Matrix.copy( this.matrix, matrix );
            }
            return true;
        },

        computeWorldToLocalMatrix: ( function () {
            var minverse = Matrix.create();
            return function ( matrix /*, nodeVisitor */ ) {

                Matrix.inverse( this.matrix, minverse );
                if ( this.referenceFrame === TransformEnums.RELATIVE_RF ) {
                    Matrix.postMult( minverse, matrix );
                } else { // absolute
                    Matrix.copy( minverse, matrix );
                }
                return true;
            };
        } )()
    } ), 'osg', 'MatrixTransform' );
    MACROUTILS.setTypeID( MatrixTransform );

    return MatrixTransform;
} );
