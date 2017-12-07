import notify from 'osg/notify';
import Texture from 'osg/Texture';
import ShadowTexture from 'osgShadow/ShadowTexture';
import Uniform from 'osg/Uniform';
import utils from 'osg/utils';
import { vec2 } from 'osg/glMatrix';

/**
 * ShadowTexture Attribute encapsulate Texture webgl object
 * with Shadow specificities (no need of texcoord,fragtexcoord)
 * trigger hash change when changing texture precision from float to byt
 * shadowSettings.js header for param explanations
 * @class ShadowTextureAtlas
 * @inherits TextureAttribute
 */
var ShadowTextureAtlas = function() {
    Texture.call(this);

    this._uniforms = {};
    this._lightNumberArray = []; // default for a valid cloneType

    this._viewMatrices = [];
    this._projection = [];
    this._depthRanges = [];
    this._mapSizes = [];
    this._renderSize = vec2.create();
    this._dirtyHash = true;
    this._hash = '';
};

ShadowTextureAtlas.uniforms = {};
/** @lends Texture.prototype */

utils.createPrototypeStateAttribute(
    ShadowTextureAtlas,
    utils.objectInherit(Texture.prototype, {
        cloneType: function() {
            return new ShadowTextureAtlas();
        },

        getLightNumberArray: function() {
            return this._lightNumberArray;
        },

        hasLightNumber: function(lightNum) {
            return this._lightNumberArray.indexOf(lightNum) !== -1;
        },

        setLightNumberArray: function(lightNumberArray) {
            this._lightNumberArray = lightNumberArray;
            this._dirtyHash = true;
        },

        getUniformName: function(lightNumber, name) {
            var prefix = 'Shadow_' + this.getType() + lightNumber.toString();
            return 'u' + prefix + '_' + name;
        },

        setInternalFormatType: function(value) {
            Texture.prototype.setInternalFormatType.call(this, value);
            this._dirtyHash = true;
        },

        createUniforms: function(lightNumber, uniforms) {

            uniforms['ViewRight_' + lightNumber] = Uniform.createFloat4(
                this.getUniformName(lightNumber, 'ViewRight')
            );
            uniforms['ViewUp_' + lightNumber] = Uniform.createFloat4(
                this.getUniformName(lightNumber, 'ViewUp')
            );
            uniforms['ViewLook_' + lightNumber] = Uniform.createFloat4(
                this.getUniformName(lightNumber, 'ViewLook')
            );

            uniforms['Projection_' + lightNumber] = Uniform.createFloat3(
                this.getUniformName(lightNumber, 'projection')
            );
            uniforms['DepthRange_' + lightNumber] = Uniform.createFloat2(
                this.getUniformName(lightNumber, 'depthRange')
            );
            uniforms['MapSize_' + lightNumber] = Uniform.createFloat4(
                this.getUniformName(lightNumber, 'mapSize')
            );
            uniforms['RenderSize_' + lightNumber] = uniforms['RenderSize'];
        },

        getOrCreateUniforms: function(unit) {

            // uniform are once per CLASS attribute, not per instance
            var obj = ShadowTextureAtlas;
            notify.assert(unit !== undefined || this._lightNumberArray.length !== 0);

            if (obj.uniforms[unit] !== undefined) {
                return obj.uniforms[unit];
            }

            var uniforms = (obj.uniforms[unit] = {});

            // shadowmap texture size used for texel space which is viewport independant
            var renderSizeUniform = Uniform.createFloat2(this.getUniformName(0, 'renderSize'));
            uniforms['RenderSize'] = renderSizeUniform;

            for (var i = 0, l = this._lightNumberArray.length; i < l; i++) {
                this.createUniforms(this._lightNumberArray[i], uniforms);
            }

            // Dual Uniform of texture, needs:
            // - Sampler (type of texture)
            // - Int (texture unit)
            // tells Shader Program where to find it
            var name = 'Texture' + unit;
            var uniform = Uniform.createInt1(unit, name);
            uniforms[name] = uniform;

            return obj.uniforms[unit];
        },

        setViewMatrix: function(lightNumber, viewMatrix) {
            this._viewMatrices[lightNumber] = viewMatrix;
        },


        setProjection: function(lightNumber, projection) {
            this._projection[lightNumber] = projection;
        },

        setDepthRange: function(lighNumber, depthRange) {
            this._depthRanges[lighNumber] = depthRange;
        },

        setLightShadowMapSize: function(lightNumber, dimension) {
            this._mapSizes[lightNumber] = dimension;
        },

        apply: function(state, texUnit) {
            // Texture stuff: call parent class method
            Texture.prototype.apply.call(this, state, texUnit);

            if (this._lightNumberArray.length === 0) {
                return;
            }

            // update Uniforms
            var uniformMap = this.getOrCreateUniforms(texUnit);

            for (var i = 0, l = this._lightNumberArray.length; i < l; i++) {
                var lightNumber = this._lightNumberArray[i];

                if (!uniformMap['ViewRight_' + lightNumber]) {
                    // enable disable uniforms and yet using getOrCreate
                    this.createUniforms(lightNumber, uniformMap);
                }

                ShadowTexture.prototype._updateViewMatrixUniforms.call(this,
                    this._viewMatrices[lightNumber],
                    uniformMap['ViewRight_' + lightNumber],
                    uniformMap['ViewUp_' + lightNumber],
                    uniformMap['ViewLook_' + lightNumber]
                );

                uniformMap['Projection_' + lightNumber].setFloat3(
                    this._projection[lightNumber]
                );
                uniformMap['DepthRange_' + lightNumber].setFloat2(this._depthRanges[lightNumber]);
                uniformMap['MapSize_' + lightNumber].setFloat4(this._mapSizes[lightNumber]);
            }

            uniformMap['RenderSize'].setFloat2(this._renderSize);
        },

        setTextureSize: function(w, h) {
            this._renderSize[0] = 1.0 / w;
            this._renderSize[1] = 1.0 / h;
            Texture.prototype.setTextureSize.call(this, w, h);
            this.dirty();
        },

        _computeInternalHash: function() {
            var hash = this.getTypeMember();
            for (var i = 0, l = this._lightNumberArray.length; i < l; i++) {
                hash += '_' + this._lightNumberArray[i];
            }
            hash += '_' + this._type;
            return hash;
        },

        getHash: function() {
            if (!this._dirtyHash) return this._hash;

            this._hash = this._computeInternalHash();
            this._dirtyHash = false;
            return this._hash;
        }
    }),
    'osgShadow',
    'ShadowTextureAtlas'
);

export default ShadowTextureAtlas;
