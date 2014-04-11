define( [
    'osg/Utils',
    'osg/Matrix',
    'osg/Transform',
    'osg/TransformEnums'
], function ( MACROUTILS, Matrix, Transform, TransformEnums ) {

    /**
     *  MatrixTransform is a Transform Node that can be customized with user matrix
     *  @class MatrixTransform
     */
    var MatrixTransform = function () {
        Transform.call( this );
        this.matrix = Matrix.create();
    };

    /** @lends MatrixTransform.prototype */
    MatrixTransform.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Transform.prototype, {
        getMatrix: function () {
            return this.matrix;
        },
        setMatrix: function ( m ) {
            this.matrix = m;
        },
        computeLocalToWorldMatrix: function ( matrix /*, nodeVisitor */) {
            if ( this.referenceFrame === TransformEnums.RELATIVE_RF ) {
                Matrix.preMult( matrix, this.matrix );
            } else {
                matrix = this.matrix;
            }
            return true;
        },
        computeWorldToLocalMatrix: function ( matrix /*, nodeVisitor */ ) {
            var minverse = Matrix.create();
            Matrix.inverse( this.matrix, minverse );

            if ( this.referenceFrame === TransformEnums.RELATIVE_RF ) {
                Matrix.postMult( minverse, matrix );
            } else { // absolute
                matrix = minverse;
            }
            return true;
        }
    } ), 'osg', 'MatrixTransform' );
    MACROUTILS.setTypeID( MatrixTransform );

    return MatrixTransform;
} );
