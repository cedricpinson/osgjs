'use strict';

var Light = require('osg/Light');
var Notify = require('osg/notify');

var CompilerFragment = {
    _createFragmentShader: function() {
        // Call to specialised inhenrited shader Compiler
        var roots = this.createFragmentShaderGraph();
        var fname = this.getFragmentShaderName();
        if (fname) roots.push(this.getNode('Define', 'SHADER_NAME').setValue(fname));

        var shader = this.createShaderFromGraphs(roots);

        Notify.debug(this.getDebugIdentifier());
        Notify.debug(shader);

        this.cleanAfterFragment();

        return shader;
    },

    applyPointSizeCircle: function(color) {
        if (
            !this._pointSizeAttribute ||
            !this._pointSizeAttribute.isEnabled() ||
            !this._pointSizeAttribute.isCircleShape()
        ) {
            return color;
        }

        this.getNode('InlineCode')
            .code('if (length(2.0 * gl_PointCoord - 1.0) > %radius) discard;')
            .inputs({
                radius: this.getOrCreateConstantOne('float')
            })
            .outputs({
                output: color
            });

        return color;
    },

    cleanAfterFragment: function() {
        // reset for next
        this._variables = {};
        this._activeNodeList = {};

        // clean texture cache variable (for vertex shader re-usage)
        for (var keyTexture in this._texturesByName) {
            this._texturesByName[keyTexture].variable = undefined;
        }

        for (var keyVarying in this._varyings) {
            var varying = this._varyings[keyVarying];
            varying.reset();
            this._activeNodeList[varying.getID()] = varying;
            this._variables[keyVarying] = varying;
        }
    },

    createDefaultFragmentShaderGraph: function() {
        var fofd = this.getOrCreateConstant('vec4', 'fofd').setValue('vec4(1.0, 0.0, 1.0, 0.7)');
        var fragCol = this.getNode('glFragColor');
        this.getNode('SetFromNode').inputs(fofd).outputs(fragCol);
        return fragCol;
    },

    createFragmentShaderGraph: function() {
        // shader graph can have multiple output (glPointsize, varyings)
        // here named roots all outputs must be pushed inside
        var roots = [];

        // no material then return a default shader
        if (!this._material) {
            roots.push(this.createDefaultFragmentShaderGraph());
            return roots;
        }

        var finalColor =
            this._lights.length > 0 ? this.getLighting() : this.getOrCreateMaterialDiffuseColor();

        var emission = this.getOrCreateMaterialEmission();
        if (emission) {
            var emit = this.createVariable('vec3');
            this.getNode('Add').inputs(finalColor, emission).outputs(emit);
            finalColor = emit;
        }

        var textureColor = this.getDiffuseColorFromTextures();
        if (textureColor) {
            var texColor = this.createVariable('vec3');
            this.getNode('Mult').inputs(finalColor, textureColor).outputs(texColor);
            finalColor = texColor;
        }

        var alpha = this.getAlpha();

        // premult alpha
        finalColor = this.getPremultAlpha(finalColor, alpha);

        var fragColor = this.getNode('glFragColor');

        this.applyPointSizeCircle(fragColor);

        // todo add gamma corrected color, but it would also mean to handle correctly srgb texture
        // so it should be done at the same time. see osg.Tetxure to implement srgb
        this.getNode('SetAlpha')
            .inputs({
                color: finalColor,
                alpha: alpha
            })
            .outputs({
                result: fragColor
            });

        roots.push(fragColor);

        return roots;
    },

    getAlpha: function() {
        // compute alpha
        var alpha = this.createVariable('float');
        var textureTexel = this.getFirstValidTexture();

        var inputs = {
            color: this.getOrCreateMaterialDiffuseColor()
        };
        if (textureTexel) inputs.texelAlpha = textureTexel;

        var str = textureTexel ? '%alpha = %color.a * %texelAlpha.a;' : '%alpha = %color.a;';

        // Discard fragments totally transparents when rendering billboards
        if (this._isBillboard) {
            str += 'if ( %alpha == 0.0) discard;';
        }

        this.getNode('InlineCode').code(str).inputs(inputs).outputs({
            alpha: alpha
        });

        return alpha;
    },

    getOrCreateFrontViewTangent: function() {
        var out = this._variables.frontViewTangent;
        if (out) return out;
        out = this.createVariable('vec4', 'frontViewTangent');

        this.getNode('FrontNormal')
            .inputs({
                normal: this.getOrCreateVarying('vec4', 'vViewTangent')
            })
            .outputs({
                result: out
            });

        return out;
    },

    getOrCreateFrontViewNormal: function() {
        var out = this._variables.frontViewNormal;
        if (out) return out;
        out = this.createVariable('vec3', 'frontViewNormal');

        this.getNode('FrontNormal')
            .inputs({
                normal: this.getOrCreateVarying('vec3', 'vViewNormal')
            })
            .outputs({
                result: out
            });

        return out;
    },

    getOrCreateNormalizedViewEyeDirection: function() {
        var out = this._variables.eyeVector;
        if (out) return out;
        out = this.createVariable('vec3', 'eyeVector');

        this.getNode('SetFromNode')
            .inputs(this.getOrCreateVarying('vec4', 'vViewVertex'))
            .outputs(out);

        this.getNode('Normalize')
            .inputs({
                vec: out
            })
            .outputs({
                result: out
            });

        this.getNode('Mult')
            .inputs(out, this.createVariable('float').setValue('-1.0'))
            .outputs(out);
        return out;
    },

    getOrCreateNormalizedFrontViewNormal: function() {
        var out = this._variables.nFrontViewNormal;
        if (out) return out;
        out = this.createVariable('vec3', 'nFrontViewNormal');

        this.getNode('Normalize')
            .inputs({
                vec: this.getOrCreateFrontViewNormal()
            })
            .outputs({
                result: out
            });

        return out;
    },

    getOrCreateFrontModelNormal: function() {
        var out = this._variables.frontModelNormal;
        if (out) return out;
        out = this.createVariable('vec3', 'frontModelNormal');

        this.getNode('FrontNormal')
            .inputs({
                normal: this.getOrCreateVarying('vec3', 'vModelNormal')
            })
            .outputs({
                result: out
            });

        return out;
    },

    getOrCreateNormalizedFrontModelNormal: function() {
        var out = this._variables.nFrontModelNormal;
        if (out) return out;
        out = this.createVariable('vec3', 'nFrontModelNormal');

        this.getNode('Normalize')
            .inputs({
                vec: this.getOrCreateFrontModelNormal()
            })
            .outputs({
                result: out
            });

        return out;
    },

    getPremultAlpha: function(finalColor, alpha) {
        if (alpha === undefined) return finalColor;

        var premultAlpha = this.createVariable('vec4');

        this.getNode('PreMultAlpha')
            .inputs({
                color: finalColor,
                alpha: alpha
            })
            .outputs({
                result: premultAlpha
            });

        return premultAlpha;
    },

    getColorsRGB: function(finalColor) {
        var finalSrgbColor = this.createVariable('vec3');
        this.getNode('LinearTosRGB')
            .inputs({
                color: finalColor
            })
            .outputs({
                color: finalSrgbColor
            });

        return finalSrgbColor;
    },

    multiplyDiffuseWithVertexColor: function(diffuseColor) {
        var vertexColor = this.getOrCreateVarying('vec4', 'vVertexColor');
        var vertexColorUniform = this.getOrCreateUniform('float', 'uArrayColorEnabled');
        var tmp = this.createVariable('vec4');

        var str = [
            '',
            '%color = %diffuse;',
            'if ( %hasVertexColor == 1.0)',
            '  %color *= %vertexColor;'
        ].join('\n');

        this.getNode('InlineCode')
            .code(str)
            .inputs({
                diffuse: diffuseColor,
                hasVertexColor: vertexColorUniform,
                vertexColor: vertexColor
            })
            .outputs({
                color: tmp
            })
            .comment('diffuse color = diffuse color * vertex color');

        return tmp;
    },

    getDiffuseColorFromTextures: function() {
        var texturesInput = [];
        var textures = this._texturesByName;

        for (var keyTexture in textures) {
            var texture = textures[keyTexture];

            if (texture.shadow) continue;

            texturesInput.push(this.getTextureByName(keyTexture).variable);
        }

        // if multi texture multiply them all with diffuse
        // but if only one, return the first
        if (texturesInput.length > 1) {
            var texAccum = this.createVariable('vec3', 'texDiffuseAccum');

            this.getNode('Mult').inputs(texturesInput).outputs(texAccum);
            return texAccum;
        } else if (texturesInput.length === 1) {
            return texturesInput[0];
        }

        return undefined;
    },

    getFirstValidTexture: function() {
        var textures = this._textures;
        for (var i = 0, nb = textures.length; i < nb; ++i) {
            var tex = textures[i];
            if (tex) return this.getTextureByName(tex.getName()).variable;
        }
        return undefined;
    },

    _getShadowReceiveAttributeFromLightNum: function(array, lightNum) {
        // array is shadow textures or shadow receive attributes
        for (var i = 0; i < array.length; i++) {
            var shadow = array[i];
            if (shadow && shadow.getLightNumber() === lightNum) {
                return shadow;
            }
        }
    },

    _getShadowTextureFromLightNum: function(array, lightNum) {
        // array is shadow textures or shadow receive attributes
        for (var i = 0; i < array.length; i++) {
            var shadow = array[i];
            if (shadow && shadow.hasLightNumber(lightNum)) {
                return shadow;
            }
        }
    },

    getInputsFromShadow: function(shadowReceive, shadowTexture, lighted, lightNum) {
        var shadowUniforms = shadowReceive.getOrCreateUniforms();
        var tUnit = this._shadowsTextures.indexOf(shadowTexture);
        var textureUniforms = shadowTexture.getOrCreateUniforms(tUnit);

        var suffix = shadowReceive.getAtlas() ? '_' + lightNum : '';
        var inputs = {
            lighted: lighted,
            normalWorld: this.getOrCreateNormalizedFrontModelNormal(),
            vertexWorld: this.getOrCreateVarying('vec3', 'vModelVertex'),
            shadowTexture: this.getOrCreateSampler('sampler2D', 'Texture' + tUnit),
            shadowSize: this.getOrCreateUniform(textureUniforms.RenderSize),
            shadowProjectionMatrix: this.getOrCreateUniform(textureUniforms.ProjectionMatrix),
            shadowViewMatrix: this.getOrCreateUniform(textureUniforms.ViewMatrix),
            shadowDepthRange: this.getOrCreateUniform(textureUniforms.DepthRange),
            shadowBias: this.getOrCreateUniform(shadowUniforms.bias)
        };

        if (shadowReceive.getAtlas())
            inputs.atlasSize = this.getOrCreateUniform(textureUniforms.MapSize);
        if (shadowReceive.getNormalBias())
            inputs.normalBias = this.getOrCreateUniform(shadowUniforms.normalBias);

        return inputs;
    },

    getOrCreateDistanceShadow: function(num) {
        if (!this._computeShadowOutDistance) return undefined;

        var varName = 'shadowDistance' + num;
        var distance = this.getVariable(varName);
        if (!distance) distance = this.createVariable('float', varName).setValue('0.0');
        return distance;
    },

    hasLightShadow: function(lightNum) {
        var shadowTexture = this._getShadowFromLightNum(this._shadowsTextures, lightNum);
        var shadowReceive = this._getShadowFromLightNum(this._shadows, lightNum);
        return !!shadowTexture && !!shadowReceive;
    },

    createShadowingLight: function(light, lighted) {
        var lightNum = light.getLightNumber();
        var shadowTexture = this._getShadowTextureFromLightNum(this._shadowsTextures, lightNum);
        var shadowReceive = this._getShadowReceiveAttributeFromLightNum(this._shadows, lightNum);
        if (!shadowTexture || !shadowReceive) return undefined;

        var inputs = this.getInputsFromShadow(shadowReceive, shadowTexture, lighted);

        var shadowedOutput = this.createVariable('float');
        var outputs = {
            result: shadowedOutput
        };

        var defines = shadowReceive.getDefines();

        var outDistance = this.getOrCreateDistanceShadow(lightNum);
        if (outDistance) {
            outputs.outDistance = outDistance;
            defines.push('#define _OUT_DISTANCE');
        }

        this.getNode('ShadowReceive').inputs(inputs).outputs(outputs).addDefines(defines);

        return shadowedOutput;
    },

    getOrCreateMaterialNormal: function() {
        return this.getOrCreateNormalizedFrontViewNormal();
    },

    getOrCreateMaterialDiffuseColor: function() {
        var matDiffuse = this.getVariable('materialDiffuseColor');
        if (matDiffuse) return matDiffuse;
        matDiffuse = this.createVariable('vec4', 'materialDiffuseColor');

        var diffuse = this.getOrCreateUniform(this._material.getOrCreateUniforms().diffuse);
        this.getNode('Mult')
            .inputs(this.multiplyDiffuseWithVertexColor(diffuse))
            .outputs(matDiffuse);

        return matDiffuse;
    },

    getOrCreateMaterialEmission: function() {
        return this.getOrCreateUniform(this._material.getOrCreateUniforms().emission);
    },

    getOrCreateMaterialSpecularColor: function() {
        return this.getOrCreateUniform(this._material.getOrCreateUniforms().specular);
    },

    getOrCreateMaterialSpecularHardness: function() {
        return this.getOrCreateUniform(this._material.getOrCreateUniforms().shininess);
    },

    getOrCreateMaterialAmbient: function() {
        return this.getOrCreateUniform(this._material.getOrCreateUniforms().ambient);
    },

    getLighting: function() {
        if (this._lights.length === 0) return undefined;

        var res = this.getLightingSeparate();
        var output = this.createVariable('vec3');
        this.getNode('Add').inputs(res.diffuse, res.specular).outputs(output);

        return output;
    },

    getLightingSeparate: function() {
        if (this._lights.length === 0) return undefined;

        // return contribution of diffuse and specular lights
        var diffuseSum = [];
        var specularSum = [];

        for (var i = 0; i < this._lights.length; i++) {
            var light = this._lights[i];
            var outputs = this.getLightSeparate(light);
            diffuseSum.push(outputs.diffuseOut);
            specularSum.push(outputs.specularOut);
        }

        var finalDiffuse;
        var finalSpecular;
        if (this._lights.length === 1) {
            finalDiffuse = diffuseSum[0];
            finalSpecular = specularSum[0];
        } else {
            finalDiffuse = this.createVariable('vec3');
            this.getNode('Add').inputs(diffuseSum).outputs(finalDiffuse);

            finalSpecular = this.createVariable('vec3');
            this.getNode('Add').inputs(specularSum).outputs(finalSpecular);
        }

        return {
            diffuse: finalDiffuse,
            specular: finalSpecular
        };
    },

    getLightSeparate: function(light) {
        var precompute = this.getPrecomputeLight(light);
        var outputs = this.getLightWithPrecompute(light, precompute);

        var shadowFactor = this.createShadowingLight(light, outputs.lighted);
        if (shadowFactor) {
            this.getNode('Mult')
                .inputs(outputs.diffuseOut, shadowFactor)
                .outputs(outputs.diffuseOut);
            this.getNode('Mult')
                .inputs(outputs.specularOut, shadowFactor)
                .outputs(outputs.specularOut);
        }

        var ambient = this.getAmbientLight(light);
        if (ambient)
            this.getNode('Add').inputs(outputs.diffuseOut, ambient).outputs(outputs.diffuseOut);

        return {
            diffuseOut: outputs.diffuseOut,
            specularOut: outputs.specularOut,
            // below can be used re-used if needed (sss, etc...)
            lighted: outputs.lighted,
            attenuation: precompute.attenuation,
            eyeLightDir: precompute.eyeLightDir,
            dotNL: precompute.dotNL
        };
    },

    getPrecomputeLight: function(light) {
        var lightUniforms = light.getOrCreateUniforms();

        var outputs = {
            attenuation: this.createVariable('float'),
            eyeLightDir: this.createVariable('vec3'),
            dotNL: this.createVariable('float')
        };

        var inputs = {
            normal: this.getOrCreateMaterialNormal()
        };

        var nodeName;

        var lightType = light.getLightType();
        if (lightType === Light.POINT) {
            nodeName = 'PrecomputePoint';

            inputs.viewVertex = this.getOrCreateVarying('vec4', 'vViewVertex');
            inputs.lightAttenuation = this.getOrCreateUniform(lightUniforms.attenuation);
            inputs.lightViewPosition = this.getOrCreateUniform(lightUniforms.viewPosition);
        } else if (lightType === Light.SPOT) {
            nodeName = 'PrecomputeSpot';

            inputs.viewVertex = this.getOrCreateVarying('vec4', 'vViewVertex');
            inputs.lightViewDirection = this.getOrCreateUniform(lightUniforms.viewDirection);
            inputs.lightAttenuation = this.getOrCreateUniform(lightUniforms.attenuation);
            inputs.lightSpotCutOff = this.getOrCreateUniform(lightUniforms.spotCutOff);
            inputs.lightSpotBlend = this.getOrCreateUniform(lightUniforms.spotBlend);
            inputs.lightViewPosition = this.getOrCreateUniform(lightUniforms.viewPosition);
        } else {
            nodeName = 'PrecomputeSun';
            inputs.lightViewDirection = this.getOrCreateUniform(lightUniforms.viewDirection);
        }

        this.getNode(nodeName).inputs(inputs).outputs(outputs);
        return outputs;
    },

    getLightWithPrecompute: function(light, precompute) {
        var lightUniforms = light.getOrCreateUniforms();

        var inputs = {
            normal: this.getOrCreateMaterialNormal(),
            eyeVector: this.getOrCreateNormalizedViewEyeDirection(),
            dotNL: precompute.dotNL,
            attenuation: precompute.attenuation,

            materialDiffuse: this.getOrCreateMaterialDiffuseColor(),
            materialSpecular: this.getOrCreateMaterialSpecularColor(),
            materialShininess: this.getOrCreateMaterialSpecularHardness(),

            lightDiffuse: this.getOrCreateUniform(lightUniforms.diffuse),
            lightSpecular: this.getOrCreateUniform(lightUniforms.specular),
            eyeLightDir: precompute.eyeLightDir
        };

        var nodeName = 'ComputeLightLambertCookTorrance';
        if (light.getLightType() === Light.HEMI) {
            inputs.lightGround = this.getOrCreateUniform(lightUniforms.ground);
            nodeName = 'HemiLight';
        }

        var outputs = this.getOutputsFromLight();
        this.getNode(nodeName).inputs(inputs).outputs(outputs);
        return outputs;
    },

    getAmbientLight: function(light) {
        var ambient = this.createVariable('vec3');
        var lightAmbient = this.getOrCreateUniform(light.getOrCreateUniforms().ambient);
        var materialAmbient = this.getOrCreateMaterialAmbient();
        this.getNode('Mult').inputs(materialAmbient, lightAmbient).outputs(ambient);
        return ambient;
    },

    getOutputsFromLight: function() {
        var outputs = {
            diffuseOut: this.createVariable('vec3'),
            specularOut: this.createVariable('vec3'),
            lighted: this.createVariable('bool')
        };

        return outputs;
    },

    createTextureRGBA: function(texture, textureSampler, texCoord) {
        // but we could later implement srgb inside and read differents flag
        // as read only in the texture

        var texel = this.createVariable('vec4');
        this.getNode('TextureRGBA')
            .inputs({
                tex: textureSampler,
                uv: texCoord
            })
            .outputs({
                result: texel
            });

        return texel;
    }
};

var wrapperFragmentOnly = function(fn, name) {
    return function() {
        if (!this._fragmentShaderMode) {
            this.logError('This function should not be called from vertex shader : ' + name);
        }
        return fn.apply(this, arguments);
    };
};

for (var fnName in CompilerFragment) {
    CompilerFragment[fnName] = wrapperFragmentOnly(CompilerFragment[fnName], fnName);
}

module.exports = CompilerFragment;
