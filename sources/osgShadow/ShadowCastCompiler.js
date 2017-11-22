import utils from 'osg/utils';
import Compiler from 'osgShader/Compiler';

var CompilerShadowCast = function() {
    Compiler.apply(this, arguments);
};

var config = Compiler.cloneStateAttributeConfig(Compiler);
config.attribute = ['ShadowCast', 'Morph', 'Skinning', 'PointSize'];

Compiler.setStateAttributeConfig(CompilerShadowCast, config);

utils.createPrototypeObject(
    CompilerShadowCast,
    utils.objectInherit(Compiler.prototype, {
        getCompilerName: function() {
            return 'ShadowCast';
        },

        initAttributes: function() {
            var attributes = this._attributes;

            for (var i = 0, l = attributes.length; i < l; i++) {
                var type = attributes[i].className();

                if (type === 'ShadowCastAttribute') {
                    this._shadowCastAttribute = attributes[i];
                } else if (type === 'Billboard') {
                    this._isBillboard = !!attributes[i];
                } else if (type === 'SkinningAttribute') {
                    this._skinningAttribute = attributes[i];
                } else if (type === 'MorphAttribute') {
                    this._morphAttribute = attributes[i];
                } else if (type === 'PointSizeAttribute') {
                    this._pointSizeAttribute = attributes[i];
                }
            }
        },

        registerTextureAttributes: function() {},

        // Depth Shadow Map Casted from Light POV Depth encoded in color buffer
        createShadowCastDepth: function(out) {
            var defines = this._shadowCastAttribute.getDefines();

            var node = this.getNode('ShadowCast')
                .inputs({
                    shadowDepthRange: this.getOrCreateUniform('vec4', 'uShadowDepthRange'),
                    fragEye: this.getOrCreateViewVertex()
                })
                .outputs({ result: out });

            node.getDefines = function() {
                return defines;
            };

            return out;
        },

        // encapsulate for easier overwrite by user defined compiler
        // that would inherint from this compiler Do not merge with above method
        createFragmentShaderGraph: function() {
            var frag = this.getNode('glFragColor');
            return [this.createShadowCastDepth(frag)];
        }
    }),
    'osgShader',
    'CompilerShadowCast'
);

export default CompilerShadowCast;
