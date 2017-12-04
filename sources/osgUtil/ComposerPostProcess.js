import utils from 'osg/utils';
import Node from 'osg/Node';
import CullFace from 'osg/CullFace';
import Depth from 'osg/Depth';
import Texture from 'osg/Texture';
import Uniform from 'osg/Uniform';
import StateSet from 'osg/StateSet';
import Camera from 'osg/Camera';
import FrameBufferObject from 'osg/FrameBufferObject';
import Viewport from 'osg/Viewport';
import Program from 'osg/Program';
import Shader from 'osg/Shader';
import Shape from 'osg/shape';
import TransformEnums from 'osg/transformEnums';
import ShaderProcessor from 'osgShader/ShaderProcessor';

/*
This class creates a post-processing pipeline based on an user-defined list of passes and .glsl files.
The user can thus easily change the order or the passes without having to do the usual stuff: creating cameras, stateSets, bind textures, etc.

======================
=== simple example ===
======================

var composer = new ComposerPostProcess();
composer.setScreenSize( width, height );

composer.addInternalTexture({
    name: 'color',
    immuable: true // the texture object won't change and can be safely used with getInternalTexture
});

// the first %last will be an alias to this texture
composer.setInputTexture( 'color' );

var passes = [];
passes.push({
    func: { name: 'func', file: 'file.glsl' },

    // %last and %next can be seen as stack operators, each %next pushes a texture on the stack while %last takes the top of the stack
    // it allows more flexibility when the user want to change the order of the passes withoug having to change the inputs/outputs/filtering/colorspaces of the other passes
    // it is also better for performances in some cases because it allows the composer to collapse passes in one pass
    textures: [ '%last' ],
    uniforms: [ Uniform.createFloat( 3.8, 'factor' ) ],
    out: { name: '%next' }
});

composer.build( passes );

var color = composer.getInternalTexture( 'color' );

========================
=== advanced example ===
========================

var composer = new ComposerPostProcess();
composer.setScreenSize( width, height );

composer.addInternalTexture({
    name: 'color',
    immuable: true // immuable is used
});

composer.addInternalTexture({
    name: 'depth',
    reusable: false // besides beeing immuable, the texture won't be reused by other passes, can be useful when the texture is needed after post-processing
});

passes.push({
    func: 'func', // will deduce the file func.glsl'
    textures: [ { name: '%last', filter: 'linear' }, 'color' ], // for some reasons, we want to sample that texture in linear
    out: { name: 'pass1', divisor: 2.0 } // we want to render this pass into an half-res texture
    collapsible: false // we don't want this pass to be collapsed into the last pass
});

passes.push({
    func: 'func2',
    header: [ '#define NUM_SAMPLES 10', '#extension GL_EXTENSION_NAME : require' ],

    // %previous is a special predefined value, it will transform the pass into a feedback loop, all is needed now is to swap the textures every frames using:
    // composer.swapFeedbackLoopTextures( boolean )
    texture: [ 'color', '%previous' ],
    out: { name: '%next' }
})

passes.push({
    func: 'func3',
    texture: [ 'pass1', '%last', { name: 'pass2', uniformName: '', srgb: true, rgbm: false } ], // force srgb and rgbm, composer won't override this
    out: { name: %next', filter: 'linear' } // force the linear filter, composer won't override this
    // this pass should be collapsed into the last one, collapsible defaults to false
    collapsible: true
})

// these uniforms will be passed to every shaders created by the composer
composer.setGlobalUniforms( [ uniformTime ] );

var color = composer.getInternalTexture( 'color' );
var depth = composer.getInternalTexture( 'depth' );

*/

var ComposerPostProcess = function() {
    Node.call(this);

    // stuffs for syncing feedback texture uniforms
    this._feedbackSwapped = false; // called on feedack swap
    this._syncFeedbackUniforms = false; // called on resize
    this._syncOnNextFrame = false;
    this._lastXratio = 1;
    this._lastYratio = 1;

    // partial viewport and drs (dynamic resolution scaling)
    this._xViewportRatio = 1.0;
    this._yViewportRatio = 1.0;
    this._xTextureRatio = 1.0;
    this._yTextureRatio = 1.0;
    // in case of dynamic resolution scaling : true will do a final upsampling
    // to full viewport size
    this._finalPassUpScaleToScreen = true;
    // wrap uv stuffs
    this._methodWrapUV = 0;
    this._thresholdWrapUV = 1.0;
    this._texInfos = undefined;

    this._screenWidth = this._screenHeight = 0;

    this._shaderProcessor = ShaderProcessor();

    this._feedbackData = {};

    this._cameras = [];
    this._stateSets = [];
    this._textureUniforms = [];

    this._programs = {};

    this._externalTextures = {};
    this._internalPasses = [];
    this._textures = {};

    this._userTextures = {};

    this._currentPoolIndex = 0;
    this._texturePool = {};

    this._firstTexture = '';

    var stateSet = this.getOrCreateStateSet();
    stateSet.setAttributeAndModes(new Depth(Depth.DISABLE));
    stateSet.setAttributeAndModes(new CullFace(CullFace.BACK));

    this.setCullCallback(this);
};

ComposerPostProcess.VertexShader = [
    'attribute vec3 Vertex;',
    'void main(void) {',
    '  gl_Position = vec4(Vertex * 2.0 - 1.0, 1.0);',
    '}',
    '',
    '#define SHADER_NAME %name%',
    ''
].join('\n');

ComposerPostProcess.FragmentShader = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH\n precision highp float;\n#else\n precision mediump float;\n#endif',
    'uniform float uRGBMRange;',
    'vec2 gTexCoord;',
    '%uniforms%',
    '',
    '#pragma include "functions.glsl"',
    '',
    '%header%',
    '',
    '%texturesColorSpace%',
    '',
    '%functionBodies%',
    '',
    'void main() {',
    '\tgTexCoord = gl_FragCoord.xy / uTextureOutputSize.xy;',
    '\tvec4 color = %firstFunc%(%firstArg%);',
    '%optionalFuncs%',
    '%colorSpaces%',
    '\tgl_FragColor = color;',
    '}',
    '',
    '#define SHADER_NAME %name%',
    ''
].join('\n');

utils.createPrototypeObject(
    ComposerPostProcess,
    utils.objectInherit(Node.prototype, {
        clear: function() {
            this._textures = {};
            this._internalPasses.length = 0;

            this._firstTexture = '';

            for (var tex in this._texturePool) {
                this._texturePool[tex].usage = -1;
            }

            this._feedbackData = {};

            this._cameras.length = 0;
            this._stateSets.length = 0;
            this._textureUniforms.length = 0;

            this.removeChildren();
        },

        clearShaderCache: function() {
            this._programs = {};
        },

        getGlobalXRatio: function() {
            return this._xViewportRatio * this._xTextureRatio;
        },

        getGlobalYRatio: function() {
            return this._yViewportRatio * this._yTextureRatio;
        },

        setFinalPassUpScaleToScreen: function(bool) {
            this._finalPassUpScaleToScreen = bool;
        },

        _enforceFromInputParameter: function(paramName, inputTexture) {
            var texName = inputTexture.name;
            var prevTexture = this._textures[texName];
            var prevFeedbackTexture = this._textures[texName + 'FeedbackTexture'];

            var newParam = inputTexture[paramName];
            if (newParam === undefined) {
                return;
            }

            // check possible mismatch
            if (prevTexture[paramName] !== undefined) {
                if (prevTexture[paramName] !== newParam) {
                    console.error('Mismatch on parameter ' + paramName + ' : ' + texName);
                }
            }

            prevTexture[paramName] = newParam;
            if (prevFeedbackTexture) {
                prevFeedbackTexture[paramName] = newParam;
            }
        },

        _updatePassInfoFromInputs: function(pass, passName, lastPassInfo) {
            var outTexture = this._textures[passName];

            var lastPassSrgb = lastPassInfo.srgb;

            // reset
            lastPassInfo.srgb = undefined;

            for (var i = 0; i < pass.textures.length; i++) {
                var inputTexture = pass.textures[i];
                this._renameTextureAlias(inputTexture, passName, lastPassInfo.name);

                var texInfoName = inputTexture.name;
                if (this._externalTextures[texInfoName]) {
                    continue;
                }

                this._usages[texInfoName] = (this._usages[texInfoName] || 0) + 1;

                var requestSrgb = inputTexture.srgb;

                // copy user inputs
                this._enforceFromInputParameter('filter', inputTexture);
                this._enforceFromInputParameter('rgbm', inputTexture);
                this._enforceFromInputParameter('srgb', inputTexture);

                // notify a texture to be encoded in srgb if previous pass was in linear
                var texture = this._textures[texInfoName];
                if (!texture) {
                    var orig = texInfoName.substring(0, texInfoName.indexOf('FeedbackTexture'));
                    texture = this._textures[orig];
                }

                if (lastPassSrgb !== undefined && requestSrgb !== undefined) {
                    if (lastPassSrgb !== requestSrgb) {
                        texture.encodeSRGB = true;
                    }
                }

                this._setInferredParameter('rgbmInferred', 'rgbm', outTexture, texture);
                this._setInferredParameter('srgbInferred', 'srgb', outTexture, texture);
            }

            if (lastPassInfo.srgb === undefined) {
                lastPassInfo.srgb =
                    outTexture.srgb === undefined ? outTexture.srgbInferred : outTexture.srgb;
            }
        },

        _setInferredParameter: function(paramInfer, param, dest, src) {
            if (dest[paramInfer] === undefined) {
                dest[paramInfer] = src[param] === undefined ? src[paramInfer] : src[param];
            }
        },

        _createTextureOut: function(pass, passName, isLastPass) {
            var outTexture = {
                srgb: pass.out.srgb,
                rgbm: pass.out.rgbm,
                filter: pass.out.filter,
                type: pass.out.type
            };

            // enforce : not rgbm if we are in float
            var isFloat = pass.out.type !== Texture.UNSIGNED_BYTE;
            if (outTexture.rgbm === undefined && (isLastPass || isFloat)) {
                outTexture.rgbm = false;
            }

            // enforce : linear space if we have rgbm or float texture
            if (outTexture.srgb === undefined) {
                if (isLastPass) outTexture.srgb = true;
                else if (outTexture.rgbm || isFloat) outTexture.srgb = false;
            }

            return outTexture;
        },

        _processUserPasses: function(userPasses) {
            userPasses = this._internalPasses.concat(userPasses);
            var passes = this._preprocessUserPasses(userPasses);

            var numPasses = passes.length;

            var outPasses = [];

            var lastPassInfo = {
                name: this._firstTexture,
                srgb: undefined
            };

            var duplicateNames = {};

            for (var i = 0; i < numPasses; i++) {
                var pass = passes[i];

                var isLastPass = i === numPasses - 1;
                if (!isLastPass && this._collapsePasses(pass, passes[i + 1])) {
                    passes.splice(i + 1, 1);
                    numPasses--;
                    i--;

                    continue;
                }

                var passName = pass.out.name;
                var isNext = passName === '%next';

                if (isNext) {
                    passName = pass.funcs.join('_');

                    if (duplicateNames[passName]) {
                        passName += duplicateNames[passName]++;
                    } else {
                        duplicateNames[passName] = 1;
                    }
                }

                // create textures
                var outTexture = this._createTextureOut(pass, passName, isLastPass);
                this._textures[passName] = outTexture;

                this._updatePassInfoFromInputs(pass, passName, lastPassInfo);

                // feedback texture share same parameters
                if (pass.feedbackLoop) {
                    this._textures[passName + 'FeedbackTexture'] = {
                        srgb: outTexture.srgb,
                        rgbm: outTexture.rgbm,
                        srgbInferred: outTexture.srgbInferred,
                        rgbmInferred: outTexture.rgbmInferred,
                        filter: outTexture.filter
                    };
                }

                if (isNext) {
                    lastPassInfo.name = passName;
                    pass.out.name = passName;
                }

                outPasses.push(pass);
            }

            return outPasses;
        },

        // the number of textures needed by the post-processing stack can be deduced using the user data
        // each texture has an unique name from which an usage number is computed
        // each time a texture is sampled, the usage is decremented
        // when is reaches 0 it means that the texture won't be used anymore so it can be reused
        // besides the usage number, the divisor, internal type and the filtering of the texture are used to make sure it can safely be reused
        _hasFreeTexture: function(passName, filter, out) {
            // passName that directly matches a texture name
            if (passName === out.name && this._texturePool[passName]) {
                return passName;
            }

            if (out.immuable) {
                return;
            }

            for (var key in this._texturePool) {
                var poolTexture = this._texturePool[key];

                // not reusable (could be used after postprocess)
                if (!poolTexture.reusable) continue;

                // still required for a future postprocess pass
                if (poolTexture.usage > 0) continue;

                // different resolution
                if (poolTexture.texture.divisor !== out.divisor) continue;

                // different type (/!\ important, we could change type runtime, that way we cause lot of memory)
                if (poolTexture.texture.getInternalFormatType() !== out.type) continue;

                // first usage
                if (poolTexture.usage === -1) {
                    if (poolTexture.texture.getMinFilter() !== filter) {
                        poolTexture.texture.setMinFilter(filter);
                        poolTexture.texture.setMagFilter(filter);
                    }

                    return key;
                }

                // reuse
                if (poolTexture.texture.getMinFilter() === filter) {
                    return key;
                }
            }

            return;
        },

        _setOrCreateTextureKey: function(usage, passName, out) {
            var isLinear = this._textures[passName].filter === 'linear';
            var filterEnum = isLinear ? Texture.LINEAR : Texture.NEAREST;

            var poolKey = this._hasFreeTexture(passName, filterEnum, out);
            if (poolKey) {
                this._texturePool[poolKey].usage = usage;
                this._textures[passName].key = poolKey;
                return;
            }

            if (out.immuable) {
                poolKey = passName;
            } else {
                poolKey = 'key' + this._currentPoolIndex++;
            }

            this._texturePool[poolKey] = {
                usage: usage,
                texture: this._createTexture(passName, out.divisor, out.type, filterEnum),
                immuable: out.immuable,
                reusable: out.reusable
            };

            if (out.divisor === -1) {
                this._texturePool[poolKey].width = out.width;
                this._texturePool[poolKey].height = out.height;
            }

            this._textures[passName].key = poolKey;
        },

        _addStateSet: function(pass, stateSet) {
            for (var i = 0; i < pass.funcs.length; i++) {
                var passName = pass.funcs[i].name;

                this._stateSets[passName] = stateSet;
            }
        },

        _addTextureToStateSet: function(textureInfo, stateSet, unit, uniforms, isFeedback) {
            stateSet.addUniform(Uniform.createInt1(unit, textureInfo.uniformName));

            var name = textureInfo.name;
            var texture;

            if (this._textures[name] !== undefined) {
                var key = this._textures[name].key;
                texture = this._texturePool[key].texture;
            } else {
                texture = this._externalTextures[name];
            }

            this._addTextureUniforms(
                textureInfo.uniformName,
                texture,
                stateSet,
                uniforms,
                isFeedback
            );

            if (textureInfo.uniformName === 'TexturePrevious') {
                return unit;
            }

            stateSet.setTextureAttributeAndModes(unit, texture);

            return undefined;
        },

        _getUniformName: function(uniformName) {
            return 'u' + uniformName[0].toUpperCase() + uniformName.slice(1);
        },

        _addTextureUniforms: function(uniformName, texture, stateSet, uniforms, isFeedback) {
            var uName = this._getUniformName(uniformName);

            var uSize = Uniform.createFloat2(uName + 'Size');
            var uRatio = Uniform.createFloat2(uName + 'Ratio');

            stateSet.addUniform(uSize);
            stateSet.addUniform(uRatio);

            uniforms.push(uSize);
            uniforms.push(uRatio);

            this._textureUniforms.push({
                size: uSize,
                ratio: uRatio,
                texture: texture,
                isFeedback: !!isFeedback
            });
        },

        _checkInferredParameters: function() {
            for (var key in this._textures) {
                var tex = this._textures[key];
                if (tex.srgb === undefined) tex.srgb = tex.srgbInferred;
                if (tex.rgbm === undefined) tex.rgbm = tex.rgbmInferred;
            }
        },

        _buildPass: function(index, passes) {
            var pass = passes[index];
            var passName = pass.out.name;

            this._setOrCreateTextureKey(this._usages[passName], passName, pass.out);

            var feedbackName = pass.out.name + 'FeedbackTexture';

            if (pass.feedbackLoop) {
                this._setOrCreateTextureKey(this._usages[feedbackName], feedbackName, pass.out);
            }

            // internal pass (user texture)
            if (!pass.funcs.length) {
                var key = this._textures[passName].key;
                this._userTextures[passName] = this._texturePool[key].texture;
                return;
            }

            var stateSet = new StateSet();
            this._addStateSet(pass, stateSet);

            var i;
            for (i = 0; i < pass.uniforms.length; i++) {
                stateSet.addUniform(pass.uniforms[i]);
            }

            var uniforms = [];

            var previousTextureUnit = undefined;

            for (i = 0; i < pass.textures.length; i++) {
                var texInfo = pass.textures[i];

                var isFeedback = texInfo.name === feedbackName;
                if (!isFeedback && !this._externalTextures[texInfo.name]) {
                    var poolKey = this._textures[texInfo.name].key;
                    this._texturePool[poolKey].usage--;
                }

                var unit = this._addTextureToStateSet(texInfo, stateSet, i, uniforms, isFeedback);
                if (unit !== undefined) {
                    previousTextureUnit = unit;
                }

                if (this._feedbackData[texInfo.name] === undefined) {
                    continue;
                }

                var nextPass = {
                    stateSet: stateSet,
                    textureUnit: i
                };

                this._feedbackData[texInfo.name].nextPasses.push(nextPass);
            }

            var outputTexture = undefined;
            if (index !== passes.length - 1) {
                var outputKey = this._textures[passName].key;
                outputTexture = this._texturePool[outputKey].texture;
            }

            this._addTextureUniforms('TextureOutput', outputTexture, stateSet, uniforms);

            stateSet.setAttributeAndModes(this._createProgram(pass, uniforms));

            if (pass.feedbackLoop) {
                this._feedbackData[passName] = this._createFeedbackLoopCameras(
                    passName,
                    stateSet,
                    outputTexture,
                    previousTextureUnit
                );
            } else {
                this.addChild(this._createCamera(passName, stateSet, outputTexture));
            }
        },

        _buildGraphFromPasses: function(passes) {
            for (var i = 0; i < passes.length; i++) {
                this._buildPass(i, passes);
            }
        },

        build: function(userPasses) {
            this._usages = {};

            // process array of passes
            var passes = this._processUserPasses(userPasses);

            // fallback on inferred information for srgb/rgbm/filter
            this._checkInferredParameters(passes);

            // create textures, cameras and shader
            this._buildGraphFromPasses(passes);

            this.resize(this._screenWidth, this._screenHeight);
        },

        _createFeedbackLoopCameras: function(name, stateSet, outputTexture, previousTextureUnit) {
            var previousKey = this._textures[name + 'FeedbackTexture'].key;
            var previousTexture = this._texturePool[previousKey].texture;

            var common = new Node();
            common.setStateSet(stateSet);

            var camera1 = this._createFeedbackLoopCamera(
                name,
                outputTexture,
                previousTexture,
                previousTextureUnit
            );
            var camera2 = this._createFeedbackLoopCamera(
                name + 'FeedbackTexture',
                previousTexture,
                outputTexture,
                previousTextureUnit
            );

            camera2.setNodeMask(0x0);

            common.addChild(camera1);
            common.addChild(camera2);

            this.addChild(common);

            var feedbackLoopData = {};
            feedbackLoopData.camera1 = camera1;
            feedbackLoopData.camera2 = camera2;
            feedbackLoopData.texture1 = outputTexture;
            feedbackLoopData.texture2 = previousTexture;
            feedbackLoopData.nextPasses = [];

            return feedbackLoopData;
        },

        _createFeedbackLoopCamera: function(cameraName, dstTexture, srcTexture, srcUnit) {
            var stateSet = new StateSet();
            stateSet.setTextureAttributeAndModes(srcUnit, srcTexture);

            var camera = this._createCamera(cameraName, stateSet, dstTexture);
            camera.setStateSet(stateSet);

            return camera;
        },

        _createCamera: function(name, stateSet, outputTexture) {
            var camera = new Camera();
            camera.setName(name);
            camera.setStateSet(stateSet);
            camera.setClearMask(0x0);
            camera.setReferenceFrame(TransformEnums.ABSOLUTE_RF);

            if (outputTexture) {
                camera.setRenderOrder(Camera.PRE_RENDER, 0);
                camera.attachTexture(FrameBufferObject.COLOR_ATTACHMENT0, outputTexture);
            }

            camera.setViewport(new Viewport());

            var quad = Shape.createTexturedFullScreenFakeQuadGeometry();
            quad.setName('composer layer');
            camera.addChild(quad);

            this._cameras.push(camera);
            return camera;
        },

        swapFeedbackLoopTextures: function(frame0) {
            for (var key in this._feedbackData) {
                var data = this._feedbackData[key];

                data.camera1.setNodeMask(frame0 ? ~0x0 : 0x0);
                data.camera2.setNodeMask(frame0 ? 0x0 : ~0x0);

                var texture = frame0 ? data.texture1 : data.texture2;

                for (var j = 0; j < data.nextPasses.length; j++) {
                    var nextPass = data.nextPasses[j];
                    nextPass.stateSet.setTextureAttributeAndModes(nextPass.textureUnit, texture);
                }
            }

            this._feedbackSwapped = true;
        },

        _createFuncFromUserData: function(userFunc) {
            var func =
                typeof userFunc === 'string'
                    ? { name: userFunc, file: userFunc + '.glsl' }
                    : userFunc;

            // now funcs.join( '_' ) only join the name of the functions instead of every members of the object
            func.toString = function() {
                return this.name;
            };

            return func;
        },

        _createTextureInfoFromUserData: function(userData) {
            var texInfo = {
                name: '',
                uniformName: '',
                rgbm: undefined,
                srgb: undefined,
                filter: undefined
            };

            if (typeof userData === 'string') {
                texInfo.name = userData;
            } else {
                texInfo.name = userData.name;

                if (userData.uniformName) texInfo.uniformName = userData.uniformName;
                if (userData.rgbm !== undefined) texInfo.rgbm = userData.rgbm;
                if (userData.srgb !== undefined) texInfo.srgb = userData.srgb;
                if (userData.filter !== undefined) texInfo.filter = userData.filter;
            }

            return texInfo;
        },

        _preprocessUserPasses: function(userPasses) {
            var passes = [];

            for (var i = 0; i < userPasses.length; i++) {
                var userPass = userPasses[i];

                var pass = {};
                pass.funcs = [];

                if (userPass.func) {
                    pass.funcs.push(this._createFuncFromUserData(userPass.func));
                }

                pass.textures = [];

                pass.feedbackLoop = false;

                if (userPass.textures !== undefined) {
                    if (!Array.isArray(userPass.textures)) {
                        userPass.textures = [userPass.textures];
                    }

                    for (var j = 0; j < userPass.textures.length; j++) {
                        var tex = this._createTextureInfoFromUserData(userPass.textures[j]);

                        if (tex.name === '%previous') {
                            pass.feedbackLoop = true;
                        }

                        pass.textures.push(tex);
                    }
                }

                if (typeof userPass.header === 'string') {
                    pass.header = [userPass.header];
                } else {
                    pass.header = userPass.header || [];
                }

                if (userPass.uniforms !== undefined) {
                    if (Array.isArray(userPass.uniforms)) {
                        pass.uniforms = userPass.uniforms;
                    } else {
                        pass.uniforms = [userPass.uniforms];
                    }
                } else {
                    pass.uniforms = [];
                }

                pass.out = userPass.out;
                // filter/rgbm/srgb are undefined by default
                pass.out.divisor = pass.out.divisor || 1.0;

                pass.out.type = pass.out.type || Texture.UNSIGNED_BYTE;
                if (pass.out.immuable === undefined) pass.out.immuable = false;
                if (pass.out.reusable === undefined) pass.out.reusable = true;

                if (pass.feedbackLoop || pass.out.divisor === -1) {
                    pass.out.immuable = true;
                    pass.out.reusable = false;
                }

                pass.collapsible = userPass.collapsible || false;
                passes.push(pass);
            }

            return passes;
        },

        _canBeCollapsed: function(currentPass, nextPass) {
            // this won't merge passes with named textures even if they are collapsible
            // is this what we want?
            return (
                currentPass.funcs.length &&
                nextPass.collapsible &&
                currentPass.out.name === '%next' &&
                currentPass.out.divisor === nextPass.out.divisor &&
                // we dont want to merge fixed size texture if the same isn't equal
                currentPass.out.width === currentPass.out.width &&
                currentPass.out.height === currentPass.out.height
            );
        },

        _collapsePasses: function(currentPass, nextPass) {
            if (!this._canBeCollapsed(currentPass, nextPass)) {
                return false;
            }

            currentPass.funcs = currentPass.funcs.concat(nextPass.funcs);
            currentPass.header = currentPass.header.concat(nextPass.header);

            currentPass.textures = this._mergeWithoutDuplicates(
                currentPass.textures,
                nextPass.textures,
                function(a, b) {
                    return a.name === b.name;
                }
            );

            currentPass.uniforms = this._mergeWithoutDuplicates(
                currentPass.uniforms,
                nextPass.uniforms,
                function(a, b) {
                    return a.getName() === b.getName();
                }
            );

            // not sure if we should collapse feedbackLoop into lastpass?
            return true;
        },

        _renameTextureAlias: function(texture, passName, lastPassName) {
            if (texture.name === '%last') {
                texture.name = lastPassName;
                texture.uniformName = texture.uniformName || 'TextureInput';
            } else if (texture.name === '%previous') {
                texture.name = passName + 'FeedbackTexture';
                texture.uniformName = texture.uniformName || 'TexturePrevious';
            } else if (!texture.uniformName) {
                texture.uniformName = texture.name;
            }
        },

        _createTexture: function(name, divisor, type, filter) {
            var texture = new Texture();
            texture.setTextureSize(1, 1);
            texture.setInternalFormatType(type);

            // not always necessary to have 4 channels, might be interesting to set it in pass
            texture.setInternalFormat(Texture.RGBA);

            texture.setMinFilter(filter);
            texture.setMagFilter(filter);

            texture.divisor = divisor;
            texture.setName(name);

            return texture;
        },

        _computeHashFromPass: function(pass) {
            var hash = '';

            for (var i = 0; i < pass.funcs.length; i++) {
                hash += pass.funcs[i].name + '_' + pass.funcs[i].file + '_';
            }

            if (pass.header) {
                hash += pass.header.join('_');
            }

            for (i = 0; i < pass.textures.length; i++) {
                hash += !!pass.textures[i].rgbm + '_' + !!pass.textures[i].srgb + '_';
            }

            hash += !!pass.out.encodeSRGB + '_';
            hash += !!this._textures[pass.out.name].rgbm + '_';

            return hash;
        },

        _writeDeclarations: function(source, uniforms, textures, header) {
            var str = 'uniform sampler2D TextureInput;\n';

            var i;
            for (i = 0; i < textures.length; i++) {
                var tname = textures[i].uniformName || textures[i].name;
                str += 'uniform sampler2D ' + tname + ';\n';
            }
            for (i = 0; i < uniforms.length; i++) {
                var uniform = uniforms[i];
                str += 'uniform ' + uniform.getType() + ' ' + uniform.getName() + ';\n';
            }

            source = source.replace('%uniforms%', str);

            if (header) {
                source = source.replace('%header%', header.join('\n'));
            }

            return source;
        },

        setMethodWrapUV: function(method, threshold) {
            // hook every texture call to handle viewport/texture ratio
            // when reading out of texture assigned zone

            // 0 - do nothing
            // 1 - clamp uv
            // 2 - black color
            if (method !== undefined) this._methodWrapUV = method;
            if (threshold !== undefined) this._thresholdWrapUV = threshold;
            this._texInfos = undefined;
        },

        _getInfos: function() {
            if (this._texInfos) return this._texInfos;

            var bodySimple = 'texture2D(%tex, (uv) * %ratio)';
            var bodyNearest =
                'texture2D(%tex, (floor((uv) * %size) + 0.5) * %ratio / %size, -99999.0)';
            var bodyBias = 'texture2D(%tex, (uv) * %ratio)';

            // see setMethodWrapUV
            var val = this._thresholdWrapUV.toExponential();
            if (this._methodWrapUV === 1) {
                var replaceValue = 'min(uv, 1.0 - ' + val + ' / %size.xy)';
                bodySimple = bodySimple.replace(/(uv)/g, replaceValue);
                bodyNearest = bodyNearest.replace(/(uv)/g, replaceValue);
                bodyBias = bodyBias.replace(/(uv)/g, replaceValue);
            } else if (this._methodWrapUV === 2) {
                var prefix = 'step((uv).x, 1.0 - ' + val + ' / %size.x) *';
                prefix += 'step((uv).y, 1.0 - ' + val + ' / %size.y) * ';
                bodySimple = prefix + bodySimple;
                bodyNearest = prefix + bodyNearest;
                bodyBias = prefix + bodyBias;
            }

            this._texInfos = {
                TEXTURE_2D: {
                    signature: 'TEXTURE_2D_%tex(uv)',
                    body: bodySimple
                },
                TEXTURE_2D_NEAREST: {
                    signature: 'TEXTURE_2D_NEAREST_%tex(uv)',
                    body: bodyNearest
                },
                TEXTURE_2D_BIAS: {
                    signature: 'TEXTURE_2D_BIAS_%tex(uv, bias)',
                    body: bodyBias
                }
            };

            return this._texInfos;
        },

        _extractTextures: function(file) {
            var infos = this._getInfos();

            var lines = file.match(/TEXTURE_2D(?:_BIAS|_NEAREST)?_\w+\(/g);
            if (!lines) return {};

            var textures = {};

            for (var j = 0; j < lines.length; j++) {
                var str = lines[j].match(/((TEXTURE_2D(?:_BIAS|_NEAREST)?)_(\w+))\(/);
                var info = infos[str[2]];

                textures[str[1]] = {
                    name: str[3],
                    signature: info.signature,
                    body: info.body
                };
            }

            return textures;
        },

        _writeFunctionBodies: function(source, funcs, textures, collapsible) {
            var colorSpacesDefines = [];
            var functionBodies = '';
            var defineKeys = {};

            for (var i = 0; i < funcs.length; i++) {
                var file = this._shaderProcessor.getShaderTextPure(funcs[i].file);
                functionBodies += file + '\n';
            }

            // resolve pragma include
            var includeList = ['functions.glsl']; // included in composer main shader
            functionBodies = this._shaderProcessor.preprocess(functionBodies, 0, includeList);

            var textureDefines = this._extractTextures(functionBodies);
            if (collapsible) {
                var tex2dInfo = this._getInfos().TEXTURE_2D;
                textureDefines.TEXTURE_2D_TextureInput = {
                    name: 'TextureInput',
                    signature: tex2dInfo.signature,
                    body: tex2dInfo.body
                };
            }

            for (var key in textureDefines) {
                if (defineKeys[key]) {
                    continue;
                }

                defineKeys[key] = true;

                var defineInfo = textureDefines[key];
                var texName = defineInfo.name;

                var rgbm = false;
                // check if the textures is rgbm
                for (var j = 0; j < textures.length; j++) {
                    var inTex = textures[j];
                    if (inTex.uniformName !== texName) {
                        continue;
                    }

                    var tex = this._textures[inTex.name];
                    if (tex && tex.rgbm) {
                        rgbm = tex.rgbm;
                        break;
                    }
                }

                var code = defineInfo.body;
                if (rgbm) code = 'vec4(decodeRGBM(' + code + ', uRGBMRange), 1.0)';
                code = '#define ' + defineInfo.signature + ' (' + code + ')';

                // replace %stuff by uniform names
                var uName = this._getUniformName(texName);
                code = code.replace(/%size/g, uName + 'Size');
                code = code.replace(/%ratio/g, uName + 'Ratio');
                code = code.replace(/%tex/g, texName);

                colorSpacesDefines.push(code);
            }

            source = source.replace('%texturesColorSpace%', colorSpacesDefines.join('\n'));

            // allows multi-line defines in sub-shaders
            return source.replace('%functionBodies%', functionBodies.replace(/\\\n/g, ''));
        },

        _writeMainFunction: function(source, funcs, collapsible, textureName) {
            source = source.replace('%firstFunc%', funcs[0].name);

            var arg = collapsible ? 'TEXTURE_2D_TextureInput(gTexCoord)' : '';
            source = source.replace('%firstArg%', arg);

            var str = '';

            for (var i = 1; i < funcs.length; i++) {
                str += '\tcolor = ' + funcs[i].name + '(color);\n';
            }

            source = source.replace('%optionalFuncs%', str);

            if (this._textures[textureName].encodeSRGB === true) {
                var func = this._textures[textureName].srgb ? 'linearTosRGB' : 'sRGBToLinear';
                str = '\tcolor.rgb = ' + func + '(color.rgb);\n';
            } else {
                str = '';
            }

            if (this._textures[textureName].rgbm) {
                str += '\tcolor = encodeRGBM(color.rgb, uRGBMRange);';
            } else {
                str += '';
            }

            return source.replace('%colorSpaces%', str);
        },

        // an hash string is created using the user pass data before creating a program
        // shaders are stored inside a map using this string, so the composer knows there is no need to rebuild it if it already exists

        _removeDuplicatedUniforms: function(source) {
            var lines = source.split('\n');

            var uniforms = {};

            var numLines = lines.length;

            for (var i = 0; i < numLines; i++) {
                var match = lines[i].match(/uniform(?:\s+){1,}\w+(?:\s+){1,}(\w+)/);
                if (match === null) {
                    continue;
                }

                var name = match[1];

                if (uniforms[name] !== undefined) {
                    lines.splice(i, 1);
                    numLines--;
                    i--;
                } else {
                    uniforms[name] = true;
                }
            }

            return lines.join('\n');
        },

        _createProgram: function(pass, uniforms) {
            var hash = this._computeHashFromPass(pass);
            if (this._programs[hash] !== undefined) {
                return this._programs[hash];
            }

            var source = this._writeDeclarations(
                ComposerPostProcess.FragmentShader,
                uniforms,
                pass.textures,
                pass.header
            );

            source = this._writeFunctionBodies(source, pass.funcs, pass.textures, pass.collapsible);
            source = this._writeMainFunction(source, pass.funcs, pass.collapsible, pass.out.name);

            source = source.replace('%name%', pass.out.name);
            source = this._removeDuplicatedUniforms(source);

            var vertexSource = ComposerPostProcess.VertexShader.replace('%name%', pass.out.name);
            var program = new Program(
                new Shader(Shader.VERTEX_SHADER, vertexSource),
                new Shader(Shader.FRAGMENT_SHADER, source)
            );

            this._programs[hash] = program;
            return program;
        },

        resize: function(width, height) {
            this.setScreenSize(width, height);

            // resize texture
            for (var key in this._texturePool) {
                var texture = this._texturePool[key].texture;

                if (this._texturePool[key].width !== undefined) {
                    texture.setTextureSize(
                        this._texturePool[key].width,
                        this._texturePool[key].height
                    );

                    continue;
                }

                texture.setTextureSize(
                    this._getTextureSize(width, texture.divisor),
                    this._getTextureSize(height, texture.divisor)
                );
            }

            this.resizeRatio();
        },

        resizeRatio: function(xViewport, yViewport, xTexture, yTexture) {
            if (xViewport !== undefined) this._xViewportRatio = xViewport;
            if (yViewport !== undefined) this._yViewportRatio = yViewport;
            if (xTexture !== undefined) this._xTextureRatio = xTexture;
            if (yTexture !== undefined) this._yTextureRatio = yTexture;

            this._resizeViewports();
            this._resizeTextureUniforms();
        },

        _resizeViewports: function() {
            var xRatio = this.getGlobalXRatio();
            var yRatio = this.getGlobalYRatio();

            var cameras = this._cameras;
            for (var i = 0; i < cameras.length; ++i) {
                var camera = cameras[i];

                var isRtt = camera.isRenderToTextureCamera();
                var divisor = 1;
                if (isRtt) {
                    var attachment = camera.getAttachments()[FrameBufferObject.COLOR_ATTACHMENT0];
                    divisor = attachment.texture.divisor;
                }

                if (i === cameras.length - 1 && this._finalPassUpScaleToScreen) {
                    xRatio = this._xViewportRatio;
                    yRatio = this._yViewportRatio;
                }

                if (divisor === -1) {
                    continue;
                }

                var width = this._getTextureSize(this._screenWidth, divisor / xRatio);
                var height = this._getTextureSize(this._screenHeight, divisor / yRatio);

                camera.getViewport().setViewport(0, 0, width, height);
            }
        },

        _resizeTextureUniforms: function() {
            var xRatio = this.getGlobalXRatio();
            var yRatio = this.getGlobalYRatio();

            var xFinalRatio = this._finalPassUpScaleToScreen ? this._xViewportRatio : xRatio;
            var yFinalRatio = this._finalPassUpScaleToScreen ? this._yViewportRatio : yRatio;

            // we delay the uniform size/ratio of the feedback texture on next frame
            this._syncFeedbackUniforms = true;

            var tunifs = this._textureUniforms;
            for (var i = 0; i < tunifs.length; ++i) {
                var obj = tunifs[i];
                var size = obj.size.getInternalArray();
                var ratio = obj.ratio.getInternalArray();

                // feedback texture update is delayed (unless first frame)
                if (obj.isFeedback && size[0]) {
                    continue;
                }

                ratio[0] = xRatio;
                ratio[1] = yRatio;

                var texture = obj.texture;
                // final pass
                if (!texture) {
                    size[0] = this._screenWidth * xFinalRatio;
                    size[1] = this._screenHeight * yFinalRatio;
                    continue;
                }

                // external texture
                if (!texture.divisor || texture.divisor < 0) {
                    size[0] = texture.getWidth();
                    size[1] = texture.getHeight();

                    ratio[0] = ratio[1] = 1.0;
                    continue;
                }

                // don't floor/round/ceil
                // (it may be useful when we force a nearest fetch in a shader)
                size[0] = xRatio * texture.getWidth();
                size[1] = yRatio * texture.getHeight();
            }
        },

        _resizeFeedbackTextureUniforms: function() {
            var xRatio = this._lastXratio;
            var yRatio = this._lastYratio;

            var tunifs = this._textureUniforms;
            for (var i = 0; i < tunifs.length; ++i) {
                var obj = tunifs[i];
                if (!obj.isFeedback) continue;

                var size = obj.size.getInternalArray();
                var ratio = obj.ratio.getInternalArray();

                var texture = obj.texture;
                ratio[0] = xRatio;
                ratio[1] = yRatio;

                size[0] = xRatio * texture.getWidth();
                size[1] = yRatio * texture.getHeight();
            }
        },

        cull: function() {
            if (this._syncOnNextFrame) {
                this._resizeFeedbackTextureUniforms();
                this._syncOnNextFrame = false;
            }

            if (this._syncFeedbackUniforms) {
                if (this._feedbackSwapped) {
                    this._syncFeedbackUniforms = false;
                    this._syncOnNextFrame = true;
                    this._lastXratio = this.getGlobalXRatio();
                    this._lastYratio = this.getGlobalYRatio();
                }
            }

            this._feedbackSwapped = false;
            return true;
        },

        _mergeWithoutDuplicates: function(a, b, compareFunc) {
            for (var i = 0; i < b.length; i++) {
                var element = b[i];

                var add = true;

                for (var j = 0; j < a.length; j++) {
                    if (compareFunc(a[j], element)) {
                        add = false;
                        break;
                    }
                }

                if (add) {
                    a.push(element);
                }
            }

            return a;
        },

        _getTextureSize: function(size, divisor) {
            return Math.max(1.0, Math.round(size / divisor));
        },

        setScreenSize: function(width, height) {
            this._screenWidth = width;
            this._screenHeight = height;
        },

        setShaderProcessor: function(shaderProcessor) {
            this._shaderProcessor = shaderProcessor;
        },

        // textures owned by the composer, they will be cached/reused/resized unless reusable or immuable
        addInternalTexture: function(desc) {
            this._internalPasses.push({
                out: {
                    name: desc.name,
                    divisor: desc.divisor,
                    type: desc.type,
                    filter: desc.filter,
                    srgb: desc.srgb,
                    rgbm: desc.rgbm,
                    immuable: desc.immuable,
                    reusable: desc.reusable
                }
            });
        },

        // textures not owned by the composer, they won't be cached/reused/resized
        addExternalTexture: function(key, texture) {
            this._externalTextures[key] = texture;
        },

        setInputTexture: function(key) {
            this._firstTexture = key;
        },

        getCameras: function() {
            return this._cameras;
        },

        getStateSetPass: function(passName) {
            return this._stateSets[passName];
        },

        getInternalTexture: function(alias) {
            return this._userTextures[alias];
        }
    }),
    'osgUtil',
    'ComposerPostProcess'
);

export default ComposerPostProcess;
