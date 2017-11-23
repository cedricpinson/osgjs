import utils from 'osg/utils';
import Node from 'osg/Node';
import TransformEnums from 'osg/transformEnums';
import { vec3 } from 'osg/glMatrix';

/**
 *  LightSource is a positioned node to use with StateAttribute Light
 *  @class LightSource
 */
var LightSource = function() {
    Node.call(this);
    this.setCullingActive(false);
    this._light = undefined;
    this._referenceFrame = TransformEnums.RELATIVE_RF;
};

/** @lends LightSource.prototype */
utils.createPrototypeNode(
    LightSource,
    utils.objectInherit(Node.prototype, {
        getLight: function() {
            return this._light;
        },
        setLight: function(light) {
            this._light = light;
        },
        setReferenceFrame: function(value) {
            this._referenceFrame = value;
        },
        getReferenceFrame: function() {
            return this._referenceFrame;
        },
        computeBoundingSphere: (function() {
            var tmp = vec3.create();

            return function(bsphere) {
                Node.prototype.computeBoundingSphere.call(this, bsphere);

                if (
                    this._light !== undefined &&
                    this._referenceFrame === TransformEnums.RELATIVE_RF
                ) {
                    var position = this._light.getPosition();

                    if (position[3] !== 0.0) {
                        bsphere.expandByVec3(vec3.scale(tmp, position, 1.0 / position[3]));
                    }
                }

                return bsphere;
            };
        })()
    }),
    'osg',
    'LightSource'
);

export default LightSource;
