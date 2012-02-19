/** -*- compile-command: "jslint-cli Node.js" -*- */

/** 
 *  MatrixTransform is a Transform Node that can be customized with user matrix
 *  @class MatrixTransform
 */
osg.MatrixTransform = function() {
    osg.Transform.call(this);
    this.matrix = osg.Matrix.makeIdentity([]);
};

/** @lends osg.MatrixTransform.prototype */
osg.MatrixTransform.prototype = osg.objectInehrit(osg.Transform.prototype, {
    getMatrix: function() { return this.matrix; },
    setMatrix: function(m) { this.matrix = m; },
    computeLocalToWorldMatrix: function(matrix,nodeVisitor) {
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.preMult(matrix, this.matrix);
        } else {
            matrix = this.matrix;
        }
        return true;
    },
    computeWorldToLocalMatrix: function(matrix,nodeVisitor) {
        var minverse = [];
        osg.Matrix.inverse(this.matrix, minverse);
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.postMult(minverse, matrix);
        } else {// absolute
            matrix = inverse;
        }
        return true;
    }
});
osg.MatrixTransform.prototype.objectType = osg.objectType.generate("MatrixTransform");
