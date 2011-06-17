/** -*- compile-command: "jslint-cli Transform.js" -*- */

/** 
 * Transform - base class for Transform type node ( Camera, MatrixTransform )
 * @class Transform
 * @inherits osg.Node
 */
osg.Transform = function() {
    osg.Node.call(this);
    this.referenceFrame = osg.Transform.RELATIVE_RF;
};
osg.Transform.RELATIVE_RF = 0;
osg.Transform.ABSOLUTE_RF = 1;

/** @lends osg.Transform.prototype */
osg.Transform.prototype = osg.objectInehrit(osg.Node.prototype, {
    setReferenceFrame: function(value) { this.referenceFrame = value; },
    getReferenceFrame: function() { return this.referenceFrame; },

    computeBound: function(bsphere) {
        osg.Node.prototype.computeBound.call(this, bsphere);
        if (!bsphere.valid()) {
            return bsphere;
        }
        var matrix = osg.Matrix.makeIdentity();
        this.computeLocalToWorldMatrix(matrix);

        var xdash = osg.Vec3.copy(bsphere._center, []);
        xdash[0] += bsphere._radius;
        osg.Matrix.transformVec3(matrix, xdash, xdash);

        var ydash = osg.Vec3.copy(bsphere._center, []);
        ydash[1] += bsphere._radius;
        osg.Matrix.transformVec3(matrix, ydash, ydash);

        var zdash = osg.Vec3.copy(bsphere._center, []);
        zdash[2] += bsphere._radius;
        osg.Matrix.transformVec3(matrix, zdash, zdash);

        osg.Matrix.transformVec3(matrix, bsphere._center, bsphere._center);

        osg.Vec3.sub(xdash,
                     bsphere._center, 
                     xdash);
        var len_xdash = osg.Vec3.length(xdash);

        osg.Vec3.sub(ydash, 
                     bsphere._center, 
                     ydash);
        var len_ydash = osg.Vec3.length(ydash);

        osg.Vec3.sub(zdash, 
                     bsphere._center, 
                     zdash);
        var len_zdash = osg.Vec3.length(zdash);

        bsphere._radius = len_xdash;
        if (bsphere._radius<len_ydash) {
            bsphere._radius = len_ydash;
        }
        if (bsphere._radius<len_zdash) {
            bsphere._radius = len_zdash;
        }
        return bsphere;
    }
});

osg.computeLocalToWorld = function (nodePath, ignoreCameras) {
    var ignoreCamera = ignoreCameras;
    if (ignoreCamera === undefined) {
        ignoreCamera = true;
    }
    var matrix = osg.Matrix.makeIdentity();

    var j = 0;
    if (ignoreCamera) {
        for (j = nodePath.length-1; j > 0; j--) {
            var camera = nodePath[j];
            if (camera.objectType === osg.Camera.prototype.objectType &&
                (camera.getReferenceFrame !== osg.Transform.RELATIVE_RF || camera.getParents().length === 0 )) {
                break;
            }
        }
    }

    for (var i = j, l = nodePath.length; i < l; i++) {
        var node = nodePath[i];
        if (node.computeLocalToWorldMatrix) {
            node.computeLocalToWorldMatrix(matrix);
        }
    }
    return matrix;
};
