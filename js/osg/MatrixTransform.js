/*global define */

define( [
    'osg/osg',
    'osg/Matrix',
    'osg/Transform'
], function ( osg, Matrix, Transform ) {

    /** -*- compile-command: 'jslint-cli Node.js' -*- */

    /** 
     *  MatrixTransform is a Transform Node that can be customized with user matrix
     *  @class MatrixTransform
     */
    MatrixTransform = function () {
        Transform.call( this );
        this.matrix = Matrix.makeIdentity( [] );
    };

    /** @lends MatrixTransform.prototype */
    MatrixTransform.prototype = osg.objectLibraryClass( osg.objectInehrit( Transform.prototype, {
        getMatrix: function () {
            return this.matrix;
        },
        setMatrix: function ( m ) {
            this.matrix = m;
        },
        computeLocalToWorldMatrix: function ( matrix, nodeVisitor ) {
            if ( this.referenceFrame === Transform.RELATIVE_RF ) {
                Matrix.preMult( matrix, this.matrix );
            } else {
                matrix = this.matrix;
            }
            return true;
        },
        computeWorldToLocalMatrix: function ( matrix, nodeVisitor ) {
            var minverse = [];
            Matrix.inverse( this.matrix, minverse );
            if ( this.referenceFrame === Transform.RELATIVE_RF ) {
                Matrix.postMult( minverse, matrix );
            } else { // absolute
                matrix = inverse;
            }
            return true;
        }
    } ), 'osg', 'MatrixTransform' );
    MatrixTransform.prototype.objectType = osg.objectType.generate( 'MatrixTransform' );

    return MatrixTransform;
} );