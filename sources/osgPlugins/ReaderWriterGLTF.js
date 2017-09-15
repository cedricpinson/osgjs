'use strict';

var P = require('bluebird');
var requestFile = require('osgDB/requestFile');
var Input = require('osgDB/Input');
var Registry = require('osgDB/Registry');
var animation = require('osgAnimation/animation');
var BasicAnimationManager = require('osgAnimation/BasicAnimationManager');
var Skeleton = require('osgAnimation/Skeleton');
var Bone = require('osgAnimation/Bone');
var StackedTranslate = require('osgAnimation/StackedTranslate');
var StackedQuaternion = require('osgAnimation/StackedQuaternion');
var StackedScale = require('osgAnimation/StackedScale');
var RigGeometry = require('osgAnimation/RigGeometry');
var channel = require('osgAnimation/channel');
var createQuatChannel = channel.createQuatChannel;
var createVec3Channel = channel.createVec3Channel;
var BlendFunc = require('osg/BlendFunc');

var Geometry = require('osg/Geometry');
var Texture = require('osg/Texture');
var MatrixTransform = require('osg/MatrixTransform');
var Material = require('osg/Material');
var DrawElements = require('osg/DrawElements');
var primitiveSet = require('osg/primitiveSet');
var BufferArray = require('osg/BufferArray');
var UpdateBone = require('osgAnimation/UpdateBone');
var UpdateMatrixTransform = require('osgAnimation/UpdateMatrixTransform');
var FileHelper = require('osgDB/FileHelper');

var Uniform = require('osg/Uniform');
var vec3 = require('osg/glMatrix').vec3;
var quat = require('osg/glMatrix').quat;
var mat4 = require('osg/glMatrix').mat4;

var ReaderWriterGLTF = function() {
    // Contains all the needed glTF files (.gltf, .bin, etc...)
    this._filesMap = undefined;
    this._loadedFiles = undefined;
    this._bufferViewCache = undefined;
    this._basicAnimationManager = undefined;
    this._visitedNodes = undefined;
    this._animatedNodes = undefined;
    this._skeletons = undefined;
    this._bones = undefined;
    this._skeletonToInfluenceMap = undefined;
    this._inputImgReader = undefined;
    this._localPath = '';

    this.init();
};

ReaderWriterGLTF.WEBGL_COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
};

ReaderWriterGLTF.TYPE_TABLE = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
};

ReaderWriterGLTF.TEXTURE_FORMAT = {
    6406: Texture.ALPHA,
    6407: Texture.RGB,
    6408: Texture.RGBA,
    6409: Texture.LUMINANCE,
    6410: Texture.LUMINANCE_ALPHA
};

ReaderWriterGLTF.PBR_SPEC_EXT = 'KHR_materials_pbrSpecularGlossiness';
ReaderWriterGLTF.PBR_SPEC_MODE = 'PBR_specular_glossiness';
ReaderWriterGLTF.PBR_METAL_MODE = 'PBR_metal_roughness';

ReaderWriterGLTF.ALBEDO_TEXTURE_UNIT = 2;
ReaderWriterGLTF.DIFFUSE_TEXTURE_UNIT = 2;
ReaderWriterGLTF.SPECULAR_GLOSSINESS_TEXTURE_UNIT = 3;
ReaderWriterGLTF.METALLIC_ROUGHNESS_TEXTURE_UNIT = 3;
ReaderWriterGLTF.SPECULAR_TEXTURE_UNIT = 4;
ReaderWriterGLTF.NORMAL_TEXTURE_UNIT = 5;
ReaderWriterGLTF.AO_TEXTURE_UNIT = 6;
ReaderWriterGLTF.EMISSIVE_TEXTURE_UNIT = 7;

ReaderWriterGLTF.ALBEDO_UNIFORM = 'albedoMap';
ReaderWriterGLTF.METALLIC_ROUGHNESS_UNIFORM = 'metallicRoughnessMap';
ReaderWriterGLTF.SPECULAR_UNIFORM = 'specularMap';
ReaderWriterGLTF.NORMAL_UNIFORM = 'normalMap';
ReaderWriterGLTF.AO_UNIFORM = 'aoMap';
ReaderWriterGLTF.EMISSIVE_UNIFORM = 'emissiveMap';

ReaderWriterGLTF.prototype = {
    init: function() {
        this._glTFJSON = undefined;
        this._bufferViewCache = {};
        this._basicAnimationManager = undefined;
        this._localPath = '';
        this._visitedNodes = {};
        this._animatedNodes = {};
        this._skeletons = {};
        this._bones = {};
        this._skeletonToInfluenceMap = {};
        this._stateSetMap = {};
        this._filesMap = new window.Map();
        this._inputReader = new Input();
    },

    loadFile: P.method(function(uri) {
        if (this._filesMap.has(uri)) return this._filesMap.get(uri);

        var ext = uri.substr(uri.lastIndexOf('.') + 1);
        var fileType = FileHelper.getTypeForExtension(ext);

        var promiseFile;
        var url = this._localPath + uri;
        if (fileType === 'blob') {
            promiseFile = this._inputReader.readImageURL(url, {
                imageLoadingUsePromise: true
            });
        } else if (fileType === 'arraybuffer') {
            promiseFile = this._inputReader.readBinaryArrayURL(url, {
                fileType: fileType
            });
        }

        this._filesMap.set(uri, promiseFile);

        promiseFile.then(function(file) {
            return file;
        });
        return promiseFile;
    }),

    /**
     * Loads a osg.BufferArray from a TypeArray obtained by using a glTF accessor.
     * No memory allocation is done, the result is a subarray obtained from a glTF binary file
     * @param  {Object} accessor
     * @param  {osg.BufferArray.ARRAY_BUFFER | osg.BufferArray.ELEMENT_ARRAY_BUFFER} type WebGL buffer type
     * @param  {TypedArray} BufferType specific TypedArray type used for extraction
     * @return {osg.BufferArray} OSG readable buffer contaning the extracted data
     */
    loadAccessorBuffer: function(accessor, type) {
        var json = this._glTFJSON;
        var bufferView = json.bufferViews[accessor.bufferView];
        var buffer = json.buffers[bufferView.buffer];
        var filePromise = this.loadFile(buffer.uri);
        var self = this;
        return filePromise.then(function(data) {
            return self.assignBuffers(data, accessor, type, bufferView);
        });
    },

    assignBuffers: P.method(function(data, accessor, type, bufferView) {
        if (!data) return null;

        var TypedArray = ReaderWriterGLTF.WEBGL_COMPONENT_TYPES[accessor.componentType];
        var typedArray = null;

        if (!this._bufferViewCache[accessor.bufferView])
            this._bufferViewCache[accessor.bufferView] = data.slice(
                bufferView.byteOffset,
                bufferView.byteOffset + bufferView.byteLength
            );

        var bufferViewArray = this._bufferViewCache[accessor.bufferView];
        typedArray = new TypedArray(
            bufferViewArray,
            accessor.byteOffset,
            accessor.count * ReaderWriterGLTF.TYPE_TABLE[accessor.type]
        );

        if (type)
            return new BufferArray(
                type,
                typedArray,
                ReaderWriterGLTF.TYPE_TABLE[accessor.type],
                true
            );
        return typedArray;
    }),

    findByKey: function(obj, key) {
        return obj && obj[key];
    },

    registerUpdateCallback: function(callbackName, node) {
        var json = this._glTFJSON;

        var animationCallback = null;
        if (json.nodes[callbackName].jointName) animationCallback = new UpdateBone();
        else animationCallback = new UpdateMatrixTransform();

        animationCallback.setName(callbackName);

        var translation = vec3.create();
        mat4.getTranslation(translation, node.getMatrix());

        var rotationQuat = quat.create();
        mat4.getRotation(rotationQuat, node.getMatrix());

        var scale = vec3.create();
        mat4.getScale(scale, node.getMatrix());

        animationCallback
            .getStackedTransforms()
            .push(new StackedTranslate('translation', translation));
        animationCallback
            .getStackedTransforms()
            .push(new StackedQuaternion('rotation', rotationQuat));
        animationCallback.getStackedTransforms().push(new StackedScale('scale', scale));

        node.addUpdateCallback(animationCallback);
    },

    createTextureAndSetAttrib: P.method(function(glTFTextureObject, stateSet, location, uniform) {
        if (!glTFTextureObject) return;
        var json = this._glTFJSON;
        var glTFTexture = json.textures[glTFTextureObject.index];
        if (!glTFTexture) return;

        var image = json.images[glTFTexture.source];

        if (!image) return;
        var texture = new Texture();
        // GLTF texture origin is correct
        texture.setFlipY(false);
        texture.setWrapS('REPEAT');
        texture.setWrapT('REPEAT');

        this.loadFile(image.uri).then(function(data) {
            if (!data) return;
            texture.setImage(data, ReaderWriterGLTF.TEXTURE_FORMAT[glTFTexture.format]);
            stateSet.setTextureAttributeAndModes(location, texture);
            if (uniform) {
                stateSet.addUniform(Uniform.createInt(location, uniform));
            }
            return;
        });
    }),

    /**
     * Creates a MatrixTransform node by using
     * glTF node's properties (matrix, translation, rotation, scale)
     * @param  {Object} glTFNode glTF node
     * @return {OSG.MatrixTransform} MatrixTransform node containing the glTF node transform
     */
    loadTransform: function(glTFNode) {
        var mat = mat4.create();
        // The transform is given under a matrix form
        if (glTFNode.matrix) {
            mat4.copy(mat, glTFNode.matrix);
            return mat;
        }
        // The transform is given under the form
        // translation, rotation, scale
        var scale = glTFNode.scale || vec3.ONE;
        var rot = glTFNode.rotation || quat.IDENTITY;
        var trans = glTFNode.translation || vec3.ZERO;

        mat4.fromRotationTranslationScale(mat, rot, trans, scale);
        return mat;
    },

    preprocessChannel: function(glTFChannel, glTFAnim) {
        var json = this._glTFJSON;
        var promisesArray = [];

        var glTFSampler = glTFAnim.samplers[glTFChannel.sampler];

        var timeAccessor = json.accessors[glTFSampler.input];
        var valueAccessor = json.accessors[glTFSampler.output];

        var timePromise = this.loadAccessorBuffer(timeAccessor, null);
        var valuePromise = this.loadAccessorBuffer(valueAccessor, null);

        promisesArray.push(timePromise, valuePromise);

        var self = this;

        return P.all(promisesArray).then(function(timeAndValue) {
            var timeKeys = timeAndValue[0];
            var valueKeys = timeAndValue[1];

            var osgChannel = null;

            if (ReaderWriterGLTF.TYPE_TABLE[valueAccessor.type] === 4) {
                osgChannel = createQuatChannel(
                    valueKeys,
                    timeKeys,
                    glTFChannel.target.node,
                    glTFChannel.target.path,
                    null
                );
            } else if (ReaderWriterGLTF.TYPE_TABLE[valueAccessor.type] === 3) {
                osgChannel = createVec3Channel(
                    valueKeys,
                    timeKeys,
                    glTFChannel.target.node,
                    glTFChannel.target.path,
                    null
                );
            }

            self._animatedNodes[glTFChannel.target.node] = true;

            return osgChannel;
        });
    },

    createAnimationFromChannels: function(channelsPromiseArray, animName) {
        return P.all(channelsPromiseArray).then(function(channels) {
            return animation.createAnimation(channels, animName);
        });
    },

    /**
     * Loads all the solid animations registering
     * them in a BasicAnimationManager instance
     * @return {BasicAnimationManager} the animation manager containing the animations
     */
    preprocessAnimations: P.method(function() {
        var json = this._glTFJSON;

        if (!json.animations) return;

        var animPromiseArray = [];

        var animationsObjectKeys = window.Object.keys(json.animations);
        for (var i = 0; i < animationsObjectKeys.length; ++i) {
            var glTFAnim = json.animations[animationsObjectKeys[i]];

            var channelsPromiseArray = [];
            // Creates each OSGJS channel
            for (var j = 0; j < glTFAnim.channels.length; ++j) {
                var glTFChannel = glTFAnim.channels[j];

                var osgChannel = this.preprocessChannel(glTFChannel, glTFAnim);
                channelsPromiseArray.push(osgChannel);
            }

            var animPromise = this.createAnimationFromChannels(
                channelsPromiseArray,
                animationsObjectKeys[i]
            );
            animPromiseArray.push(animPromise);
        }

        var self = this;
        return P.all(animPromiseArray).then(function(animations) {
            var animationManager = new BasicAnimationManager();
            animationManager.init(animations);

            self._basicAnimationManager = animationManager;
            animationManager.playAnimation(animations[0].name);
        });
    }),

    loadBone: function(boneId, skin) {
        var json = this._glTFJSON;
        var node = json.nodes[boneId];

        var self = this;

        var inverseBindMatricesAccessor = json.accessors[skin.inverseBindMatrices];
        var bonePromise = this.loadAccessorBuffer(inverseBindMatricesAccessor, null);
        return bonePromise.then(function(data) {
            // Creates the current bone
            // initializing it with initial pose
            for (var i = 0; i < skin.joints.length; ++i) {
                if (skin.joints[i] === node.jointName) break;
            }

            var boneNode = new Bone(node.jointName);
            var invMat = data.subarray(i * 16, i * 16 + 16);
            boneNode.setInvBindMatrixInSkeletonSpace(invMat);

            self._bones[boneId] = boneNode;

            return boneNode;
        });
    },

    buildInfluenceMap: function(rootBoneId, skin) {
        if (this._skeletonToInfluenceMap[rootBoneId]) return;
        this._skeletonToInfluenceMap[rootBoneId] = {};
        for (var j = 0; j < skin.joints.length; j++) {
            var jointName = skin.joints[j];
            this._skeletonToInfluenceMap[rootBoneId][jointName] = j;
        }
    },

    mapBonesToSkin: function() {
        var json = this._glTFJSON;

        var boneToSkin = {};

        // Maps each bone ID to its skin
        var skinsKeys = window.Object.keys(json.skins);
        for (var i = 0; i < skinsKeys.length; ++i) {
            var skin = json.skins[skinsKeys[i]];

            for (var j = 0; j < skin.joints.length; ++j) {
                var jName = skin.joints[j];

                var nodesKeys = window.Object.keys(json.nodes);
                for (var k = 0; k < nodesKeys.length; ++k) {
                    var node = json.nodes[nodesKeys[k]];

                    if (node.jointName && node.jointName === jName) boneToSkin[nodesKeys[k]] = skin;
                }
            }
        }

        return boneToSkin;
    },

    preprocessBones: function(bonesToSkin) {
        var json = this._glTFJSON;
        var nodesKeys = window.Object.keys(json.nodes);
        var promises = [];
        for (var i = 0; i < nodesKeys.length; ++i) {
            var boneId = nodesKeys[i];
            var boneNode = json.nodes[boneId];
            if (!boneNode.jointName) continue;
            var bonePromise = this.loadBone(boneId, bonesToSkin[boneId]);
            promises.push(bonePromise);
        }
        return P.all(promises);
    },

    preprocessSkeletons: P.method(function() {
        var json = this._glTFJSON;
        if (!json.skins) return;
        var bonesToSkin = this.mapBonesToSkin();

        // Saves each skeleton in the skeleton maprep
        var nodesKeys = window.Object.keys(json.nodes);
        for (var j = 0; j < nodesKeys.length; ++j) {
            var nodeId = nodesKeys[j];
            var node = json.nodes[nodeId];
            var skin = json.skins[node.skin];

            if (!node.skeletons) continue;

            for (var i = 0; i < node.skeletons.length; ++i) {
                var rootBoneId = null;
                var rootJointId = node.skeletons[i];
                for (var k = 0; k < nodesKeys.length; ++k) {
                    var subnodeId = nodesKeys[k];
                    var subnode = json.nodes[subnodeId];
                    if (!subnode.jointName) continue;
                    var rootJoint = json.nodes[rootJointId];
                    if (subnode.jointName === rootJoint.jointName) {
                        rootBoneId = subnodeId;
                        break;
                    }
                }
                if (rootBoneId && !this._skeletons[rootBoneId]) {
                    this._skeletons[rootJointId] = new Skeleton();
                    // Adds missing bone to the boneMap
                    bonesToSkin[rootBoneId] = skin;
                }
                this.buildInfluenceMap(rootJointId, skin);
            }
        }

        return this.preprocessBones(bonesToSkin);
    }),

    loadPBRMaterial: P.method(function(materialId, glTFmaterial, geometryNode, extension) {
        var pbrMetallicRoughness = glTFmaterial.pbrMetallicRoughness;
        var osgStateSet = geometryNode.getOrCreateStateSet();

        var promises = [];
        var model = '';

        if (pbrMetallicRoughness) {
            if (pbrMetallicRoughness.baseColorTexture)
                promises.push(
                    this.createTextureAndSetAttrib(
                        pbrMetallicRoughness.baseColorTexture,
                        osgStateSet,
                        ReaderWriterGLTF.ALBEDO_TEXTURE_UNIT,
                        ReaderWriterGLTF.ALBEDO_UNIFORM
                    )
                );
            if (pbrMetallicRoughness.baseColorFactor) {
                //PBR default uniforms
                osgStateSet.addUniform(
                    Uniform.createFloat4(pbrMetallicRoughness.baseColorFactor, 'uBaseColorFactor')
                );
            }

            if (pbrMetallicRoughness.metallicFactor !== undefined) {
                osgStateSet.addUniform(
                    Uniform.createFloat1(pbrMetallicRoughness.metallicFactor, 'uMetallicFactor')
                );
            }
            if (pbrMetallicRoughness.roughnessFactor !== undefined) {
                osgStateSet.addUniform(
                    Uniform.createFloat1(pbrMetallicRoughness.roughnessFactor, 'uRoughnessFactor')
                );
            }

            if (pbrMetallicRoughness.metallicRoughnessTexture)
                promises.push(
                    this.createTextureAndSetAttrib(
                        pbrMetallicRoughness.metallicRoughnessTexture,
                        osgStateSet,
                        ReaderWriterGLTF.METALLIC_ROUGHNESS_TEXTURE_UNIT,
                        ReaderWriterGLTF.METALLIC_ROUGHNESS_UNIFORM
                    )
                );
            model = ReaderWriterGLTF.PBR_METAL_MODE;
        }
        // SPECULAR/GLOSSINESS
        if (extension) {
            if (extension.diffuseFactor) {
                //PBR default uniforms
                osgStateSet.addUniform(
                    Uniform.createFloat4(extension.diffuseFactor, 'uBaseColorFactor')
                );
            }
            if (extension.glossinessFactor !== undefined) {
                osgStateSet.addUniform(
                    Uniform.createFloat1(extension.glossinessFactor, 'uGlossinessFactor')
                );
            }
            if (extension.specularFactor !== undefined) {
                osgStateSet.addUniform(
                    Uniform.createFloat3(extension.specularFactor, 'uSpecularFactor')
                );
            }
            if (extension.diffuseTexture) {
                promises.push(
                    this.createTextureAndSetAttrib(
                        extension.diffuseTexture,
                        osgStateSet,
                        ReaderWriterGLTF.DIFFUSE_TEXTURE_UNIT,
                        ReaderWriterGLTF.ALBEDO_UNIFORM
                    )
                );
            }
            if (extension.specularGlossinessTexture) {
                promises.push(
                    this.createTextureAndSetAttrib(
                        extension.specularGlossinessTexture,
                        osgStateSet,
                        ReaderWriterGLTF.SPECULAR_GLOSSINESS_TEXTURE_UNIT,
                        ReaderWriterGLTF.METALLIC_ROUGHNESS_UNIFORM
                    )
                );
            }
            model = ReaderWriterGLTF.PBR_SPEC_MODE;
        }
        if (glTFmaterial.normalTexture) {
            promises.push(
                this.createTextureAndSetAttrib(
                    glTFmaterial.normalTexture,
                    osgStateSet,
                    ReaderWriterGLTF.NORMAL_TEXTURE_UNIT,
                    ReaderWriterGLTF.NORMAL_UNIFORM
                )
            );
        }
        if (glTFmaterial.occlusionTexture) {
            promises.push(
                this.createTextureAndSetAttrib(
                    glTFmaterial.occlusionTexture,
                    osgStateSet,
                    ReaderWriterGLTF.AO_TEXTURE_UNIT,
                    ReaderWriterGLTF.AO_UNIFORM
                )
            );
        }
        if (glTFmaterial.emissiveFactor !== undefined) {
            osgStateSet.addUniform(
                Uniform.createFloat3(glTFmaterial.emissiveFactor, 'uEmissiveFactor')
            );
        }
        if (glTFmaterial.emissiveTexture !== undefined) {
            promises.push(
                this.createTextureAndSetAttrib(
                    glTFmaterial.emissiveTexture,
                    osgStateSet,
                    ReaderWriterGLTF.EMISSIVE_TEXTURE_UNIT,
                    ReaderWriterGLTF.EMISSIVE_UNIFORM
                )
            );
        }
        // TODO:Need to check for specular glossiness extension
        geometryNode.setUserData({
            pbrWorklow: model
        });

        geometryNode.stateset = osgStateSet;
        osgStateSet.setRenderingHint('TRANSPARENT_BIN');
        osgStateSet.setRenderBinDetails(1000, 'RenderBin');
        osgStateSet.setAttributeAndModes(new BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));
        this._stateSetMap[materialId] = osgStateSet;

        return P.all(promises);
    }),

    loadMaterial: P.method(function(materialId, geometryNode) {
        var json = this._glTFJSON;
        var glTFmaterial = json.materials[materialId];

        if (this._stateSetMap[materialId]) {
            geometryNode.stateset = this._stateSetMap[materialId];
            return;
        }

        var extension = this.findByKey(glTFmaterial.extensions, ReaderWriterGLTF.PBR_SPEC_EXT);
        if (glTFmaterial.pbrMetallicRoughness || extension)
            return this.loadPBRMaterial(materialId, glTFmaterial, geometryNode, extension);

        var values = glTFmaterial.values;
        if (!values) return;

        // Handles basic material attributes
        var osgMaterial = new Material();
        var osgStateSet = geometryNode.getOrCreateStateSet();
        osgStateSet.setAttribute(osgMaterial);

        if (values.ambient) osgMaterial.setAmbient(values.ambient);
        if (values.emission) osgMaterial.setEmission(values.emission);
        if (values.shininess) osgMaterial.setShininess(values.shininess);
        if (values.specular) osgMaterial.setSpecular(values.specular);

        // Create a texture for the diffuse, if any
        if (values.diffuse) {
            if (typeof values.diffuse !== 'string') osgMaterial.setDiffuse(values.diffuse);
            else return this.createTextureAndSetAttrib(values.diffuse, osgStateSet, 0);
        }

        geometryNode.stateset = osgStateSet;
        this._stateSetMap[materialId] = osgStateSet;

        return;
    }),

    createGeometry: function(primitive, skeletonJointId) {
        var json = this._glTFJSON;
        var promisesArray = [];

        // Builds the geometry from the extracted vertices & normals
        var geom = new Geometry();
        var rigOrGeom = geom;

        var cbSetBuffer = function(name, buffer) {
            if (!buffer) return;

            this.getVertexAttributeList()[name] = buffer;
        };

        if (skeletonJointId) {
            rigOrGeom = new RigGeometry();
            rigOrGeom._boneNameID = this._skeletonToInfluenceMap[skeletonJointId];
        }

        var attributeWeight = function(data) {
            if (!data) return;

            rigOrGeom.getAttributes().Weights = data;

            var elts = rigOrGeom.getAttributes().Weights.getElements();
            for (var i = 0, l = elts.length / 4; i < l; ++i) {
                var sum = elts[i * 4] + elts[i * 4 + 1] + elts[i * 4 + 2] + elts[i * 4 + 3];
                var correc = 1.0 / sum;
                elts[i * 4] *= correc;
                elts[i * 4 + 1] *= correc;
                elts[i * 4 + 2] *= correc;
                elts[i * 4 + 3] *= correc;
            }
        };

        // Registers each glTF primitive attributes
        // into a respective geometry attribute
        var attributesKeys = window.Object.keys(primitive.attributes);
        for (var i = 0; i < attributesKeys.length; ++i) {
            var accessor = json.accessors[primitive.attributes[attributesKeys[i]]];
            var promise = this.loadAccessorBuffer(accessor, BufferArray.ARRAY_BUFFER);

            if (attributesKeys[i].indexOf('POSITION') !== -1) {
                promise.then(cbSetBuffer.bind(geom, 'Vertex'));
            } else if (attributesKeys[i].indexOf('NORMAL') !== -1) {
                promise.then(cbSetBuffer.bind(geom, 'Normal'));
            } else if (attributesKeys[i].indexOf('TANGENT') !== -1) {
                promise.then(cbSetBuffer.bind(geom, 'Tangent'));
            } else if (attributesKeys[i].indexOf('JOINT') !== -1) {
                promise.then(cbSetBuffer.bind(rigOrGeom, 'Bones'));
            } else if (attributesKeys[i].indexOf('WEIGHT') !== -1) {
                promise.then(attributeWeight);
            } else if (attributesKeys[i].indexOf('COLOR') !== -1) {
                promise.then(cbSetBuffer.bind(geom, 'Color'));
            } else if (attributesKeys[i].indexOf('TEXCOORD') !== -1) {
                var texCoordId = attributesKeys[i].substr(9);
                promise.then(cbSetBuffer.bind(geom, 'TexCoord' + texCoordId));
            }

            promisesArray.push(promise);
        }

        var indicesAccessor = json.accessors[primitive.indices];
        var indicesPromise = this.loadAccessorBuffer(
            indicesAccessor,
            BufferArray.ELEMENT_ARRAY_BUFFER
        );
        indicesPromise.then(function(data) {
            if (!data) return;

            var osgPrimitive = new DrawElements(primitiveSet.TRIANGLES, data);
            geom.getPrimitives().push(osgPrimitive);
        });

        promisesArray.push(indicesPromise);

        if (primitive.material !== undefined)
            promisesArray.push(this.loadMaterial(primitive.material, geom));

        return P.all(promisesArray).then(function() {
            if (skeletonJointId) {
                rigOrGeom.setSourceGeometry(geom);
                rigOrGeom.mergeChildrenData();

                rigOrGeom.computeBoundingBox = geom.computeBoundingBox;
            }

            return rigOrGeom;
        });
    },

    loadGLTFPrimitives: function(meshId, resultMeshNode, skeletonJointId) {
        var json = this._glTFJSON;
        var mesh = json.meshes[meshId];

        var primitives = mesh.primitives;

        var promisesArray = [];
        var i;
        for (i = 0; i < primitives.length; ++i) {
            var primitive = primitives[i];
            var promiseGeom = this.createGeometry(primitive, skeletonJointId);

            promisesArray.push(promiseGeom);
        }

        return P.all(promisesArray).then(function(geoms) {
            for (i = 0; i < geoms.length; ++i) resultMeshNode.addChild(geoms[i]);

            return geoms;
        });
    },

    loadGLTFNode: P.method(function(nodeId, root) {
        if (this._visitedNodes[nodeId]) return;

        var json = this._glTFJSON;
        var glTFNode = json.nodes[nodeId];

        var currentNode = glTFNode.jointName ? this._bones[nodeId] : new MatrixTransform();
        currentNode.setName(nodeId);
        mat4.copy(currentNode.getMatrix(), this.loadTransform(glTFNode));

        if (glTFNode.jointName && this._skeletons[glTFNode.joinName]) {
            var skeleton = this._skeletons[glTFNode.jointName];
            skeleton.addChild(currentNode);
            root.addChild(skeleton);
        }

        // Recurses on children before
        // processing the current node
        var children = glTFNode.children;
        var i;
        var promises = [];
        if (children) {
            for (i = 0; i < children.length; ++i) {
                var nodePromise = this.loadGLTFNode(children[i], currentNode);
                promises.push(nodePromise);
            }
        }
        // Loads meshes contained in the node
        // Adds RigGeometry to corresponding skeleton if any
        if (glTFNode.mesh !== undefined) {
            var meshId = glTFNode.mesh;
            if (!glTFNode.skeletons) {
                var geomPromise = this.loadGLTFPrimitives(meshId, currentNode, null);
                promises.push(geomPromise);
            } else {
                for (var j = 0; j < glTFNode.skeletons.length; ++j) {
                    var rootJointId = glTFNode.skeletons[j];
                    var skeletonNode = this._skeletons[rootJointId];
                    var meshTransformNode = new MatrixTransform();
                    mat4.copy(meshTransformNode.getMatrix(), currentNode.getMatrix());
                    var geomP = this.loadGLTFPrimitives(meshId, meshTransformNode, rootJointId);
                    skeletonNode.addChild(meshTransformNode);
                    promises.push(geomP);
                }
            }
        }
        // Loads solid animations
        // by adding an update callback
        if (this._animatedNodes[nodeId]) this.registerUpdateCallback(nodeId, currentNode);

        if (!this._skeletons[nodeId]) root.addChild(currentNode);

        this._visitedNodes[nodeId] = true;
        return P.all(promises);
    }),

    readNodeURL: function(url, options) {
        var self = this;

        this.init();
        if (options && options.filesMap !== undefined && options.filesMap.size > 0) {
            // it comes from the ZIP plugin or from drag'n drop
            // So we already have all the files.
            this._filesMap = options.filesMap;
            var glTFFile = this._filesMap.get(url);
            return this.readJSON(glTFFile, url);
        }

        var index = url.lastIndexOf('/');
        this._localPath = index === -1 ? '' : url.substr(0, index + 1);
        // Else it is a usual XHR request
        var filePromise = requestFile(url);
        return filePromise.then(function(file) {
            return self.readJSON(file);
        });
    },

    readJSON: P.method(function(glTFFile, url) {
        // Creates the root node
        // adding a PI / 2 rotation arround the X-axis
        var root = new MatrixTransform();
        root.setName(url);

        var json = JSON.parse(glTFFile);
        if (!json) return;

        this._glTFJSON = json;

        var promisesArray = [];
        // Preprocesses animations
        var animPromise = this.preprocessAnimations();
        // Preprocesses skin animations if any
        var skeletonPromise = this.preprocessSkeletons();

        promisesArray.push(skeletonPromise, animPromise);
        var self = this;
        return P.all(promisesArray).then(function() {
            var promises = [];
            // Loops through each scene
            // loading geometry nodes, transform nodes, etc...s
            var sceneKeys = window.Object.keys(json.scenes);
            for (var i = 0; i < sceneKeys.length; ++i) {
                var scene = json.scenes[sceneKeys[i]];

                if (!scene) continue;
                for (var j = 0; j < scene.nodes.length; ++j) {
                    var p = self.loadGLTFNode(scene.nodes[j], root);
                    promises.push(p);
                }
            }

            // Register the animation manager
            // if the glTF file contains animations
            if (self._basicAnimationManager) root.addUpdateCallback(self._basicAnimationManager);

            return P.all(promises).then(function() {
                return root;
            });
        });
    })
};

Registry.instance().addReaderWriter('gltf', new ReaderWriterGLTF());

module.exports = ReaderWriterGLTF;
