import utils from 'osg/utils';
import StateAttribute from 'osg/StateAttribute';
import Uniform from 'osg/Uniform';

/**
 * ShadowReceiveAttribute encapsulate Shadow Main State object
 * @class ShadowReceiveAttribute
 * @inherits StateAttribute
 */
var ShadowReceiveAttribute = function(lightNum, disable) {
    StateAttribute.call(this);

    this._lightNumber = lightNum;

    // see shadowSettings.js header for shadow algo param explanations
    // hash change var

    // shadow depth bias as projected in shadow camera space texture
    // and viewer camera space projection introduce its bias
    this._bias = 0.001;

    // shadow normal bias from normal exploding offset technique
    this._normalBias = undefined;
    // shader compilation different upon texture precision
    this._precision = 'UNSIGNED_BYTE';
    // kernel size & type for pcf
    this._kernelSizePCF = undefined;

    this._fakePCF = true;

    this._jitterOffset = 'none';

    this._enable = !disable;
    this._isAtlasTexture = false;

    this._dirtyHash = true;
    this._hash = '';
};

ShadowReceiveAttribute.uniforms = {};
utils.createPrototypeStateAttribute(
    ShadowReceiveAttribute,
    utils.objectInherit(StateAttribute.prototype, {
        attributeType: 'ShadowReceive',

        cloneType: function() {
            return new ShadowReceiveAttribute(this._lightNumber, true);
        },

        getTypeMember: function() {
            return this.attributeType + this.getLightNumber();
        },

        getLightNumber: function() {
            return this._lightNumber;
        },

        getUniformName: function(name) {
            var prefix = this.getType() + this.getLightNumber().toString();
            return 'u' + prefix + '_' + name;
        },

        getAtlas: function() {
            return this._isAtlasTexture;
        },
        setAtlas: function(v) {
            this._isAtlasTexture = v;
        },

        setBias: function(bias) {
            this._bias = bias;
        },

        getBias: function() {
            return this._bias;
        },

        setNormalBias: function(bias) {
            this._normalBias = bias;
        },

        getNormalBias: function() {
            return this._normalBias;
        },

        setJitterOffset: function(jitter) {
            this._jitterOffset = jitter;
        },

        getJitterOffset: function() {
            return this._jitterOffset;
        },

        getKernelSizePCF: function() {
            return this._kernelSizePCF;
        },

        setKernelSizePCF: function(v) {
            this._kernelSizePCF = v;
            this._dirtyHash = true;
        },

        setPrecision: function(precision) {
            this._precision = precision;
            this._dirtyHash = true;
        },

        getPrecision: function() {
            return this._precision;
        },

        setLightNumber: function(lightNum) {
            this._lightNumber = lightNum;
            this._dirtyHash = true;
        },

        getOrCreateUniforms: function() {
            // uniform are once per CLASS attribute, not per instance
            var obj = ShadowReceiveAttribute;

            var typeMember = this.getTypeMember();

            if (obj.uniforms[typeMember]) return obj.uniforms[typeMember];

            obj.uniforms[typeMember] = {
                bias: Uniform.createFloat(this.getUniformName('bias')),
                normalBias: Uniform.createFloat(this.getUniformName('normalBias'))
            };

            return obj.uniforms[typeMember];
        },

        // Here to be common between  caster and receiver
        // (used by shadowMap and shadow node shader)
        getDefines: function() {
            var defines = [];

            var pcf = this.getKernelSizePCF();
            switch (pcf) {
                case '4Tap(16texFetch)':
                    defines.push('#define _PCFx4');
                    break;
                case '9Tap(36texFetch)':
                    defines.push('#define _PCFx9');
                    break;
                case '16Tap(64texFetch)':
                    defines.push('#define _PCFx25');
                    break;
                default:
                case '1Tap(4texFetch)':
                    defines.push('#define _PCFx1');
                    break;
            }

            if (this.getPrecision() !== 'UNSIGNED_BYTE') defines.push('#define _FLOATTEX');
            if (this.getAtlas()) defines.push('#define _ATLAS_SHADOW');
            if (this.getNormalBias()) defines.push('#define _NORMAL_OFFSET');
            if (this.getJitterOffset() !== 'none') defines.push('#define _JITTER_OFFSET');

            return defines;
        },

        apply: function() {
            if (!this._enable) return;

            var uniformMap = this.getOrCreateUniforms();

            uniformMap.normalBias.setFloat(this._normalBias);
            uniformMap.bias.setFloat(this._bias);
        },

        // need a isEnabled to let the ShaderGenerator to filter
        // StateAttribute from the shader compilation
        isEnabled: function() {
            return this._enable;
        },

        getHash: function() {
            if (!this._dirtyHash) return this._hash;

            this._hash = this._computeInternalHash();
            this._dirtyHash = false;
            return this._hash;
        },

        _computeInternalHash: function() {
            return this.getTypeMember() + '_' + this.getKernelSizePCF();
        }
    }),
    'osgShadow',
    'ShadowReceiveAttribute'
);

export default ShadowReceiveAttribute;
