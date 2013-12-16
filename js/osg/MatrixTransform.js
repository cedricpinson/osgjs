/*global define */

define( [
    'osg/Utils',
    'osg/Matrix',
    'osg/Transform',
    'osg/Enums'
], function ( MACROUTILS, Matrix, Transform, Enums ) {

    /** -*- compile-command: 'jslint-cli Node.js' -*- */

    /** 
     *  MatrixTransform is a Transform Node that can be customized with user matrix
     *  @class MatrixTransform
     */
    var MatrixTransform = function () {
        Transform.call( this );
        this.matrix = Matrix.makeIdentity( [] );
    };

    /** @lends MatrixTransform.prototype */
    MatrixTransform.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Transform.prototype, {
        getMatrix: function () {
            return this.matrix;
        },
        setMatrix: function ( m ) {
            this.matrix = m;
        },
        computeLocalToWorldMatrix: function ( matrix, nodeVisitor ) {
            if ( this.referenceFrame === Enums.TRANSFORM_RELATIVE_RF ) {
                Matrix.preMult( matrix, this.matrix );
            } else {
                matrix = this.matrix;
            }
            return true;
        },
        computeWorldToLocalMatrix: function ( matrix, nodeVisitor ) {
            var minverse = [];
            Matrix.inverse( this.matrix, minverse );
            if ( this.referenceFrame === Enums.TRANSFORM_RELATIVE_RF ) {
                Matrix.postMult( minverse, matrix );
            } else { // absolute
                matrix = inverse;
            }
            return true;
        }
    } ), 'osg', 'MatrixTransform' );
    MatrixTransform.prototype.objectType = MACROUTILS.objectType.generate( 'MatrixTransform' );

    return MatrixTransform;
} );