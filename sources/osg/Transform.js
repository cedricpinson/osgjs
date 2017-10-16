import utils from 'osg/utils';
import Node from 'osg/Node';
import { mat4 } from 'osg/glMatrix';
import TransformEnums from 'osg/transformEnums';

/**
 * Transform - base class for Transform type node ( Camera, MatrixTransform )
 * @class Transform
 * @inherits Node
 */
var Transform = function() {
    Node.call(this);
    this.referenceFrame = TransformEnums.RELATIVE_RF;
};

/** @lends Transform.prototype */
utils.createPrototypeNode(
    Transform,
    utils.objectInherit(Node.prototype, {
        setReferenceFrame: function(value) {
            this.referenceFrame = value;
        },
        getReferenceFrame: function() {
            return this.referenceFrame;
        },

        computeBoundingSphere: (function() {
            var matrix = mat4.create();
            return function(bSphere) {
                Node.prototype.computeBoundingSphere.call(this, bSphere);
                if (!bSphere.valid()) {
                    return bSphere;
                }

                mat4.identity(matrix);
                // local to local world (not Global World)
                this.computeLocalToWorldMatrix(matrix);
                bSphere.transformMat4(bSphere, matrix);
                return bSphere;
            };
        })()
    }),
    'osg',
    'Transform'
);

export default Transform;
