import utils from 'osg/utils';
import Texture from 'osg/Texture';

var kernelSizeList = [
    '1Tap(4texFetch)',
    '4Tap(16texFetch)',
    '9Tap(36texFetch)',
    '16Tap(64texFetch)'
];

/**
 *  ShadowSettings provides the parameters that the ShadowTechnique should use as a guide for setting up shadowing
 *  @class ShadowSettings
 */
var ShadowSettings = function(options) {
    this.castsShadowDrawTraversalMask = 0xffffffff;
    this.castsShadowBoundsTraversalMask = 0xffffffff;

    this.textureSize = 1024;

    // important note:
    // comparison shadow is: DepthShadow > DephFragment => shadowed
    // which is d<z
    // and
    // Average( (d < z) ) != (Average( z ) < d)
    // so PCF/NONE technique cannot be prefiltered (bilinear, etc..) with HW filter
    // on gl/dx desktop there is a sampler2DShadow that allows that taking z in third param
    // we emulate that with texture2DShadowLerp
    // which is why some techniques have more texfetch than advertized.
    // http://http.developer.nvidia.com/GPUGems/gpugems_ch11.html

    // texture precision. (and bandwith implication)
    this.textureType = 'UNSIGNED_BYTE';

    this.textureFormat = Texture.RGBA;

    // either orthogonal (non-fov) or perpsective (fov)
    this.shadowProjection = 'fov';
    // fov size: can be infered from spotlight angle
    this.fov = 50;

    // PCF algo and kernel size
    // Band kernelsize gives nxn texFetch
    // others a n*n*4 (emulating the HW shadowSampler)
    // ['4Tap(16texFetch)', '9Tap(36texFetch)', '16Tap(64texFetch)']
    this.kernelSizePCF = '4Tap(4texFetch)';

    // depth offset (shadow acne / peter panning)
    this.bias = 0.005;

    // normal exploding offset (shadow acne / peter panning)
    this.normalBias = undefined;

    // defaut shader generator name for shadow casting
    this.shadowCastShaderGeneratorName = 'ShadowCast';

    // if url options override url options
    utils.objectMix(this, options);
};

ShadowSettings.kernelSizeList = kernelSizeList;

ShadowSettings.prototype = {
    setCastsShadowDrawTraversalMask: function(mask) {
        this.castsShadowDrawTraversalMask = mask;
    },
    getCastsShadowDrawTraversalMask: function() {
        return this.castsDrawShadowTraversalMask;
    },

    setCastsShadowBoundsTraversalMask: function(mask) {
        this.castsShadowBoundsTraversalMask = mask;
    },
    getCastsShadowBoundsTraversalMask: function() {
        return this.castsShadowBoundsTraversalMask;
    },

    setLight: function(light) {
        this.light = light;
    },
    getLight: function() {
        return this.light;
    },

    setTextureSize: function(textureSize) {
        this.textureSize = textureSize;
    },
    getTextureSize: function() {
        return this.textureSize;
    },
    setTextureType: function(tt) {
        this.textureType = tt;
    },
    getTextureType: function() {
        return this.textureType;
    },
    setTextureFormat: function(tf) {
        this.textureFormat = tf;
    },
    getTextureFormat: function() {
        return this.textureFormat;
    },
    setShadowCastShaderGeneratorName: function(n) {
        this.shadowCastShaderGeneratorName = n;
    },
    getShadowCastShaderGeneratorName: function() {
        return this.shadowCastShaderGeneratorName;
    }
};

export default ShadowSettings;
