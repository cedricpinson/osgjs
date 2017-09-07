'use strict';

var MACROUTILS = require('osg/Utils');
var StateAttribute = require('osg/StateAttribute');
var Uniform = require('osg/Uniform');

/**
 * SkinningAttribute encapsulate Animation State
 * @class SkinningAttribute
 * @inherits StateAttribute
 */
var SkinningAttribute = function(disable, boneUniformSize) {
    StateAttribute.call(this);
    this._enable = !disable;
    // optional, if it's not provided, it will fall back to the maximum bone uniform size
    // boneUniformSize represents the number of vec4 (uniform) used in the shader for all the bones
    this._boneUniformSize = boneUniformSize;

    this._dirtyHash = true;
    this._hash = '';
};

SkinningAttribute.uniforms = {};
SkinningAttribute.maxBoneUniformSize = 1;
SkinningAttribute.maxBoneUniformAllowed = Infinity; // can be overriden by application specific limit on startup (typically gl limit)

MACROUTILS.createPrototypeStateAttribute(
    SkinningAttribute,
    MACROUTILS.objectInherit(StateAttribute.prototype, {
        attributeType: 'Skinning',

        cloneType: function() {
            return new SkinningAttribute(true);
        },

        getBoneUniformSize: function() {
            return this._boneUniformSize !== undefined
                ? this._boneUniformSize
                : SkinningAttribute.maxBoneUniformSize;
        },

        getOrCreateUniforms: function() {
            var obj = SkinningAttribute;
            var boneSize = this.getBoneUniformSize();

            if (obj.uniforms[boneSize]) return obj.uniforms[boneSize];

            obj.uniforms[boneSize] = {
                uBones: Uniform.createFloat4Array('uBones', boneSize)
            };

            return obj.uniforms[boneSize];
        },

        setMatrixPalette: function(matrixPalette) {
            this._matrixPalette = matrixPalette;
            // update max bone size
            if (this._boneUniformSize === undefined) {
                SkinningAttribute.maxBoneUniformSize = Math.max(
                    SkinningAttribute.maxBoneUniformSize,
                    matrixPalette.length / 4
                );
                SkinningAttribute.maxBoneUniformSize = Math.min(
                    SkinningAttribute.maxBoneUniformAllowed,
                    SkinningAttribute.maxBoneUniformSize
                );
            }
        },

        getMatrixPalette: function() {
            return this._matrixPalette;
        },

        // need a isEnabled to let the ShaderGenerator to filter
        // StateAttribute from the shader compilation
        isEnabled: function() {
            return this._enable;
        },

        getHash: function() {
            if (!this._dirtyHash) return this._hash;

            this._hash = this._computeInternalHash();
            this._dirtyHash = true;
            return this._hash;
        },

        _computeInternalHash: function() {
            // bone uniform size is hashed because the size of uniform is statically declared in the shader
            return this.getTypeMember() + this.getBoneUniformSize() + this.isEnabled();
        },

        apply: function() {
            if (!this._enable) return;

            this.getOrCreateUniforms().uBones.getInternalArray().set(this._matrixPalette);
        }
    }),
    'osgAnimation',
    'SkinningAttribute'
);

module.exports = SkinningAttribute;
