import BlendFunc from 'osg/BlendFunc';
import Camera from 'osg/Camera';
import Depth from 'osg/Depth';
import Light from 'osg/Light';
import LightSource from 'osg/LightSource';
import NodeVisitor from 'osg/NodeVisitor';
import utils from 'osg/utils';

/*
 * Remove nodes that shouldn't not be culled when casting
 * like lights, camera with render texture targets,
 * transparent (alphablended) geometries
 * (otherwise it might break things)
 * visits whole underlying scene recursively
 */
var ShadowCasterVisitor = function(mask) {
    NodeVisitor.call(this);
    // mask setting to avoid casting shadows
    this._noCastMask = mask;
    this._nodeList = [];
};

utils.createPrototypeObject(
    ShadowCasterVisitor,
    utils.objectInherit(NodeVisitor.prototype, {
        reset: function() {
            this._nodeList = [];
        },
        removeNodeFromCasting: function(node) {
            /*jshint bitwise: false */

            var nm = node.getNodeMask();
            // ~0x0 as not to be processed

            if (nm === ~0x0) {
                // set to avoid casting shadow
                nm = this._noCastMask;
                node.setNodeMask(nm);
                this._nodeList.push(node);
            } else if ((nm & ~this._noCastMask) !== 0) {
                // set to avoid casting shadow
                node.setNodeMask(nm | this._noCastMask);
                this._nodeList.push(node);
            }
            /*jshint bitwise: true */
        },
        // Visiting whole casting scene recursively
        apply: function(node) {
            // check that and other things ?
            // TODO: should check whole hierarchy to check for override/protected/etc
            // Depth, BlendFunc Attributes...
            var st = node.getStateSet();
            if (st) {
                // check for transparency not casting shadows
                // as no alpha blending transparency shadow (no transmittance support)
                var blend = st.getAttribute('BlendFunc');
                if (blend !== undefined && blend.getSource() !== BlendFunc.DISABLE) {
                    var depth = st.getAttribute('Depth');
                    if (
                        depth &&
                        (depth.getFunc() === Depth.DISABLE || depth.getWriteMask() === false)
                    ) {
                        this.removeNodeFromCasting(node);
                        return;
                    }
                }
            }

            // check for lights, as lights are positionned attributes
            if (node.getTypeID() === Light.typeID || node.getTypeID() === LightSource.typeID) {
                this.removeNodeFromCasting(node);
                return;
            } else if (node.getTypeID() === Camera.typeID && node.isRenderToTextureCamera()) {
                // no "Subrender" when rendering the shadow map as from light point of view
                this.removeNodeFromCasting(node);
                return;
            }
            this.traverse(node);
        },

        setNoCastMask: function(mask) {
            this._noCastMask = mask;
        },

        // restore to any previous mask avoiding any breaks
        // in other application mask usage.
        restore: function() {
            for (var i = 0, l = this._nodeList.length; i < l; i++) {
                var node = this._nodeList[i];
                var nm = node.getNodeMask();

                if (nm === this._noCastMask) {
                    node.setNodeMask(~0x0);
                } else {
                    node.setNodeMask(nm & ~this._noCastMask);
                }
            }
        }
    }),
    'osgShadow',
    'ShadowCasterVisitor'
);

export default ShadowCasterVisitor;
