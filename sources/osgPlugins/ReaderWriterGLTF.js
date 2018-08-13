import P from 'bluebird';
import BoundingBox from 'osg/BoundingBox';
import StateSet from 'osg/StateSet';
import Input from 'osgDB/Input';
import Registry from 'osgDB/Registry';
import BasicAnimationManager from 'osgAnimation/BasicAnimationManager';
import Skeleton from 'osgAnimation/Skeleton';
import Bone from 'osgAnimation/Bone';
import StackedTranslate from 'osgAnimation/StackedTranslate';
import StackedQuaternion from 'osgAnimation/StackedQuaternion';
import StackedScale from 'osgAnimation/StackedScale';
import RigGeometry from 'osgAnimation/RigGeometry';
import MorphGeometry from 'osgAnimation/MorphGeometry';
import channelFactory from 'osgAnimation/channel';
import animationFactory from 'osgAnimation/animation';
import notify from 'osg/notify';

import Node from 'osg/Node';
import Geometry from 'osg/Geometry';
import Texture from 'osg/Texture';
import MatrixTransform from 'osg/MatrixTransform';
import BlendFunc from 'osg/BlendFunc';
import CullFace from 'osg/CullFace';
import Image from 'osg/Image';
import DrawElements from 'osg/DrawElements';
import primitiveSet from 'osg/primitiveSet';
import BufferArray from 'osg/BufferArray';
import UpdateBone from 'osgAnimation/UpdateBone';
import UpdateMorph from 'osgAnimation/UpdateMorph';
import UpdateMatrixTransform from 'osgAnimation/UpdateMatrixTransform';
import fileHelper from 'osgDB/fileHelper';

import Uniform from 'osg/Uniform';
import { mat4, vec3 } from 'osg/glMatrix';

var createQuatChannel = channelFactory.createQuatChannel;
var createVec3Channel = channelFactory.createVec3Channel;
var createFloatChannel = channelFactory.createFloatChannel;

var ReaderWriterGLTF = function() {
    // Contains all the needed glTF files (.gltf, .bin, etc...)
    this._filesMap = undefined;
    this._loadedFiles = undefined;
    this._bufferViewCache = undefined;
    this._basicAnimationManager = undefined;
    this._visitedNodes = undefined;
    this._animatedNodes = undefined;
    this._bones = undefined;
    this._skeletonToInfluenceMap = undefined;
    this._inputImgReader = undefined;
    this._localPath = '';

    this._extensions = [];

    this._nodeAnimationTypes = undefined;
    this.init();
};

function base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

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

ReaderWriterGLTF.ATTRIBUTE_OSGJS_TABLE = {
    POSITION: 'Vertex',
    NORMAL: 'Normal',
    TANGENT: 'Tangent',
    TEXCOORD_0: 'TexCoord0',
    TEXCOORD_1: 'TexCoord1',
    TEXCOORD_2: 'TexCoord2',
    TEXCOORD_3: 'TexCoord3',
    TEXCOORD_4: 'TexCoord4',
    TEXCOORD_5: 'TexCoord5',
    TEXCOORD_6: 'TexCoord6',
    TEXCOORD_7: 'TexCoord7',
    TEXCOORD_8: 'TexCoord8',
    TEXCOORD_9: 'TexCoord9',
    TEXCOORD_10: 'TexCoord10',
    TEXCOORD_11: 'TexCoord11',
    TEXCOORD_12: 'TexCoord12',
    TEXCOORD_13: 'TexCoord13',
    TEXCOORD_14: 'TexCoord14',
    TEXCOORD_15: 'TexCoord15',
    COLOR_0: 'Color',
    JOINTS_0: 'Bones',
    WEIGHTS_0: 'Weights'
};

ReaderWriterGLTF.TEXTURE_FORMAT = {
    6406: Texture.ALPHA,
    6407: Texture.RGB,
    6408: Texture.RGBA,
    6409: Texture.LUMINANCE,
    6410: Texture.LUMINANCE_ALPHA
};

ReaderWriterGLTF.TYPE_CHANNEL_PATH = {
    translation: {
        VEC3: createVec3Channel
    },
    scale: {
        VEC3: createVec3Channel
    },
    rotation: {
        VEC4: createQuatChannel
    },
    weights: {
        SCALAR: createFloatChannel
    }
};

ReaderWriterGLTF.TYPE_STACKED_TRANSFORMS = {
    translation: StackedTranslate,
    scale: StackedScale,
    rotation: StackedQuaternion
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
        this._nodeAnimationTypes = [];
        this._bufferViewCache = {};
        this._basicAnimationManager = undefined;
        this._localPath = '';
        this._visitedNodes = {};
        this._animatedNodes = {};
        this._bones = {};
        this._skeletonToInfluenceMap = {};
        this._stateSetMap = {};
        this._filesMap = {};
        this._inputReader = new Input();
        this._rootStateSet = new StateSet();

        this._defaultBlendFunc = new BlendFunc();
        this._transparentBlendFunc = new BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA');
        this._defaultCullFace = new CullFace();
        this._doubleSideCullFace = new CullFace(CullFace.DISABLE);
    },

    // Adds variable to help to convert nodes to osgjs
    // - add parent variable to all nodes
    // - add unique node name
    _preProcessNodes: function() {
        var nodes = this._gltfJSON.nodes;
        var meshes = this._gltfJSON.meshes;

        var name;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            name = node.name || '';
            name += '_' + i.toString();
            node.osgjsNodeName = name;

            var children = node.children;

            if (!children) continue;

            for (var j = 0; j < children.length; j++) {
                var child = children[j];
                nodes[child].parent = i;
            }
        }
        for (var k = 0; k < meshes.length; k++) {
            var mesh = meshes[k];
            name = mesh.name || '';
            name += '_' + k.toString();
            mesh.osgjsNodeName = name;
        }
    },

    loadBuffers: P.method(function() {
        var promises = [];
        var buffers = this._gltfJSON.buffers;
        for (var i = 0; i < buffers.length; i++) {
            var buffer = buffers[i];
            promises.push(
                this.loadURI(buffer.uri, { responseType: 'arraybuffer' }).then(function(
                    arrayBuffer
                ) {
                    buffer.data = arrayBuffer;
                })
            );
        }
        return P.all(promises);
    }),

    loadBufferViews: function() {
        var buffers = this._gltfJSON.buffers;
        var bufferViews = this._gltfJSON.bufferViews;
        for (var i = 0; i < bufferViews.length; i++) {
            var bufferView = bufferViews[i];
            var bufferIndex = bufferView.buffer;
            var buffer = buffers[bufferIndex];
            var byteLength = bufferView.byteLength || 0;
            var byteOffset = bufferView.byteOffset || 0;
            bufferView.data = buffer.data.slice(byteOffset, byteOffset + byteLength);
        }
    },

    loadAccessors: function() {
        var bufferViews = this._gltfJSON.bufferViews;
        var accessors = this._gltfJSON.accessors;
        for (var i = 0; i < accessors.length; i++) {
            var accessor = accessors[i];
            var bufferViewIndex = accessor.bufferView;
            var bufferView = bufferViews[bufferViewIndex];

            var itemSize = ReaderWriterGLTF.TYPE_TABLE[accessor.type];
            var TypedArray = ReaderWriterGLTF.WEBGL_COMPONENT_TYPES[accessor.componentType];

            // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
            var elementBytes = TypedArray.BYTES_PER_ELEMENT;
            var itemBytes = elementBytes * itemSize;
            var byteStride = bufferView.byteStride;
            var normalized = accessor.normalized === true;
            var bufferArray;

            // The buffer is not interleaved if the stride is the item size in bytes.
            if (byteStride && byteStride !== itemBytes) {
                // Use the full buffer if it's interleaved.
                notify.warn('GLTF interleaved accessors not supported');
            } else {
                var data = new TypedArray(
                    bufferView.data,
                    accessor.byteOffset,
                    accessor.count * itemSize
                );
                bufferArray = new BufferArray(undefined, data, itemSize);
                bufferArray.setNormalize(normalized);
            }
            accessor.data = bufferArray;
        }
    },

    _computeNodeMatrix: function(node) {
        var matrix;
        if (node.matrix) {
            matrix = mat4.clone(node.matrix);
        } else if (node.translation || node.rotation || node.scale) {
            var translation = mat4.IDENTITY;
            var rotation = mat4.IDENTITY;
            var scale = mat4.IDENTITY;
            if (node.translation)
                translation = mat4.fromTranslation(mat4.create(), node.translation);
            if (node.rotation) rotation = mat4.fromQuat(mat4.create(), node.rotation);
            if (node.scale) scale = mat4.fromScaling(mat4.create(), node.scale);
            matrix = mat4.create();
            mat4.multiply(matrix, rotation, scale);
            mat4.multiply(matrix, translation, matrix);
        }
        return matrix;
    },

    loadNodes: function() {
        var nodes = this._gltfJSON.nodes;
        var skins = this._gltfJSON.skins;
        var meshes = this._gltfJSON.meshes;

        // create all nodes
        // children relationship will be done in loadScenes
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.usedAsBone) continue;
            if (node.skin !== undefined) {
                var skin = skins[node.skin];
                var skeleton = skin.osgjsNode;
                if (!skin.osgjsNodeAttached) {
                    node.osgjsNode = skeleton;
                    skin.osgjsNodeAttached = i;
                }
                var mesh = meshes[node.mesh];
                mesh.osgjsGeometry.setBoneNameID(skin.osgjsBoneMapID);
                skeleton.addChild(mesh.osgjsGeometry);
            } else {
                if (node.matrix || node.translation || node.rotation || node.scale) {
                    node.osgjsNode = this._createMatrixTransform(i);
                }
                if (node.mesh !== undefined) {
                    if (node.osgjsNode) {
                        node.osgjsNode.addChild(meshes[node.mesh].osgjsGeometry);
                    } else {
                        node.osgjsNode = meshes[node.mesh].osgjsGeometry;
                    }
                }
                if (!node.osgjsNode) {
                    node.osgjsNode = new Node();
                }
            }
            if (node.name) node.osgjsNode.setName(node.name);
        }
    },

    _linkNodes: function(parent) {
        var nodes = this._gltfJSON.nodes;
        var children = parent.children;
        if (!children) return;

        for (var i = 0; i < children.length; i++) {
            var node = nodes[children[i]];

            // skip node used as bone
            if (node.usedAsBone) continue;

            var osgjsChild = node.osgjsNode;
            if (osgjsChild && !parent.osgjsNode.hasChild(osgjsChild)) {
                parent.osgjsNode.addChild(osgjsChild);
                this._linkNodes(node);
            }
        }
    },

    loadSkins: function() {
        var skins = this._gltfJSON.skins;
        if (!skins) return;

        for (var i = 0; i < skins.length; i++) {
            this._processSkin(i);
        }
    },

    loadScenes: function() {
        var nodes = this._gltfJSON.nodes;
        var scenes = this._gltfJSON.scenes;

        this._osgjsScene = [];

        for (var i = 0; i < scenes.length; i++) {
            var scene = scenes[i];
            var sceneNodes = scene.nodes;
            var rootNodes = [];
            for (var j = 0; j < sceneNodes.length; j++) {
                var node = nodes[sceneNodes[j]];
                this._linkNodes(node);
                rootNodes.push(node.osgjsNode);
            }

            var root = rootNodes[0];
            if (rootNodes.length > 1) {
                root = new Node();
                for (var r = 0; r < rootNodes.length; r++) {
                    root.addChild(rootNodes[r]);
                }
            }
            this._osgjsScene.push(root);
        }
    },

    _assignGeometryAttributes: function(osgjsGeometry, gltfAttributes, index) {
        var accessors = this._gltfJSON.accessors;
        for (var attribute in gltfAttributes) {
            var accessorIndex = gltfAttributes[attribute];
            var accessor = accessors[accessorIndex];
            var osgjsAttributeName = ReaderWriterGLTF.ATTRIBUTE_OSGJS_TABLE[attribute];
            if (index !== undefined) osgjsAttributeName += '_' + index.toString();
            osgjsGeometry.getVertexAttributeList()[osgjsAttributeName] = accessor.data;
            accessor.data._target = BufferArray.ARRAY_BUFFER;
        }
    },

    _assignGeometryPrimitives: function(osgjsGeometry, primitive) {
        var accessors = this._gltfJSON.accessors;
        var indexes = accessors[primitive.indices];
        indexes.data._target = BufferArray.ELEMENT_ARRAY_BUFFER;
        var primitiveMode = primitive.mode !== undefined ? primitive.mode : primitiveSet.TRIANGLES;
        var osgPrimitive = new DrawElements(primitiveMode, indexes.data);
        osgjsGeometry.getPrimitiveSetList().push(osgPrimitive);
    },

    _getMorphTargetName: function(mesh, index) {
        return mesh.osgjsNodeName + '_target_' + index.toString();
    },

    _computeAbsoluteMorphData: function(baseAttributes, morphAttributes) {
        var accessors = this._gltfJSON.accessors;
        for (var attribute in morphAttributes) {
            var accessorIndex = morphAttributes[attribute];
            var accessor = accessors[accessorIndex];

            if (accessor.morphAbsoluteComputed) continue; // dont compute twice absolute targets
            accessor.morphAbsoluteComputed = true;

            var baseAccessorIndex = baseAttributes[attribute];
            var baseAccessor = accessors[baseAccessorIndex];

            var base = baseAccessor.data.getElements();
            var target = accessor.data.getElements();
            var nbElements = base.length;
            for (var i = 0; i < nbElements; i++) {
                target[i] += base[i];
            }
        }
    },

    _processMorphGeometry: function(mesh, primitiveIndex) {
        var primitive = mesh.primitives[primitiveIndex];
        var geometry = new MorphGeometry();
        var morphUpdateCallback = new UpdateMorph();
        morphUpdateCallback.setName(mesh.osgjsNodeName);
        geometry.setName(mesh.osgjsNodeName);
        for (var t = 0; t < primitive.targets.length; t++) {
            this._computeAbsoluteMorphData(primitive.attributes, primitive.targets[t]);
            var targetName = this._getMorphTargetName(mesh, t);
            var morphTarget = new Geometry();
            morphTarget.setName(targetName);
            morphUpdateCallback.addTarget(targetName, t);
            this._assignGeometryAttributes(morphTarget, primitive.targets[t]);
            geometry.getMorphTargets().push(morphTarget);
        }
        this._assignGeometryAttributes(geometry, primitive.attributes);
        this._assignGeometryPrimitives(geometry, primitive);
        geometry.mergeChildrenVertexAttributeList();

        // set result in gltf mesh
        mesh.osgjsMorphGeometry = geometry;
        mesh.osgjsUpdateMorph = morphUpdateCallback;
    },

    loadMeshes: function() {
        var meshes = this._gltfJSON.meshes;
        var materials = this._gltfJSON.materials;

        for (var i = 0; i < meshes.length; i++) {
            var mesh = meshes[i];
            var name = mesh.name;
            var osgjsGeometries = [];
            for (var j = 0; j < mesh.primitives.length; j++) {
                var geometry = undefined;
                var primitive = mesh.primitives[j];
                var morphUpdateCallback = undefined;
                // means we have morph target
                if (primitive.targets && primitive.targets.length) {
                    this._processMorphGeometry(mesh, j);
                    geometry = mesh.osgjsMorphGeometry;
                    morphUpdateCallback = mesh.osgjsUpdateMorph;
                }

                if (primitive.attributes.JOINTS_0) {
                    var rigGeometry = new RigGeometry();
                    if (!geometry) {
                        geometry = new Geometry();
                        this._assignGeometryAttributes(geometry, primitive.attributes);
                        this._assignGeometryPrimitives(geometry, primitive);
                    }
                    var bbox = new BoundingBox();
                    geometry.computeBoundingBox(bbox);
                    rigGeometry.setBound(bbox);

                    rigGeometry.setSourceGeometry(geometry);
                    rigGeometry.mergeChildrenData();
                    geometry = rigGeometry;
                }

                if (!geometry) {
                    geometry = new Geometry();
                    this._assignGeometryAttributes(geometry, primitive.attributes);
                    this._assignGeometryPrimitives(geometry, primitive);
                }

                if (name) geometry.setName(name);

                // if has a morph geometry we addd the update callback on the top geometry
                if (morphUpdateCallback) geometry.addUpdateCallback(morphUpdateCallback);

                var osgjsStateSet = materials[primitive.material].osgjsStateSet;
                geometry.setStateSet(osgjsStateSet);
                geometry.setUserData(osgjsStateSet.getUserData());
                osgjsGeometries.push(geometry);
            }

            if (osgjsGeometries.length > 1) {
                var node = new Node();
                for (var c = 0; c < osgjsGeometries.length; c++) node.addChild(osgjsGeometries[c]);
                geometry = node;
            }
            mesh.osgjsGeometry = geometry;
        }
    },

    loadImages: function() {
        var images = this._gltfJSON.images;
        if (!images) return P.resolve();
        var promises = [];

        for (var i = 0; i < images.length; i++) {
            var image = images[i];
            var url = window.decodeURI(image.uri);
            var promise = this.loadURI(url).then(
                function(imageData) {
                    var osgjsImage = new Image();
                    osgjsImage.setImage(imageData);
                    this.osgjsImage = osgjsImage;
                }.bind(image)
            );
            promises.push(promise);
        }
        return P.all(promises);
    },

    _texture: function(gltfTexture) {
        var textures = this._gltfJSON.textures;
        var images = this._gltfJSON.images;
        var texture = textures[gltfTexture.index];
        var image = images[texture.source];

        if (texture.osgjsTexture) return texture.osgjsTexture;

        var osgjsTexture = new Texture();
        texture.osgjsTexture = osgjsTexture;

        // GLTF texture origin is correct
        osgjsTexture.setFlipY(false);
        osgjsTexture.setWrapS('REPEAT');
        osgjsTexture.setWrapT('REPEAT');

        if (image.osgjsImage) {
            var format = ReaderWriterGLTF.TEXTURE_FORMAT[texture.format];
            osgjsTexture.setImage(image.osgjsImage, format);
        }
        return osgjsTexture;
    },

    _pbrMetallicRoughnessTextureUniforms: function() {
        var stateSet = this._rootStateSet;
        if (stateSet.getUniformList()[ReaderWriterGLTF.ALBEDO_UNIFORM]) return;

        var albedo = Uniform.createInt(
            ReaderWriterGLTF.ALBEDO_TEXTURE_UNIT,
            ReaderWriterGLTF.ALBEDO_UNIFORM
        );
        var metalnessRoughness = Uniform.createInt(
            ReaderWriterGLTF.METALLIC_ROUGHNESS_TEXTURE_UNIT,
            ReaderWriterGLTF.METALLIC_ROUGHNESS_UNIFORM
        );
        stateSet.addUniform(albedo);
        stateSet.addUniform(metalnessRoughness);
    },

    _pbrMetallicRoughness: function(material, stateSet) {
        stateSet.setUserData({
            pbrWorklow: ReaderWriterGLTF.PBR_METAL_MODE
        });
        this._pbrMetallicRoughnessTextureUniforms();

        var osgjsTexture;
        // baseColor
        if (material.baseColorTexture) {
            osgjsTexture = this._texture(material.baseColorTexture);
            stateSet.setTextureAttributeAndModes(
                ReaderWriterGLTF.ALBEDO_TEXTURE_UNIT,
                osgjsTexture
            );
        } else if (material.baseColorFactor) {
            //PBR default uniforms
            var color = Uniform.createFloat4(material.baseColorFactor, 'uBaseColorFactor');
            stateSet.addUniform(color);
        }

        // metallic
        if (material.metallicFactor !== undefined) {
            var metallic = Uniform.createFloat1(material.metallicFactor, 'uMetallicFactor');
            stateSet.addUniform(metallic);
        }

        if (material.roughnessFactor !== undefined) {
            var roughness = Uniform.createFloat1(material.roughnessFactor, 'uRoughnessFactor');
            stateSet.addUniform(roughness);
        }

        if (material.metallicRoughnessTexture) {
            osgjsTexture = this._texture(material.metallicRoughnessTexture);
            stateSet.setTextureAttributeAndModes(
                ReaderWriterGLTF.METALLIC_ROUGHNESS_TEXTURE_UNIT,
                osgjsTexture
            );
        }
    },

    _KHR_materials_pbrSpecularGlossinessTextureUniforms: function() {
        if (this._extensions['KHR_materials_pbrSpecularGlossinessTextureUniforms']) return;
        this._extensions['KHR_materials_pbrSpecularGlossinessTextureUniforms'] = true;

        var stateSet = this._rootStateSet;
        var albedo = Uniform.createInt(
            ReaderWriterGLTF.DIFFUSE_TEXTURE_UNIT,
            ReaderWriterGLTF.ALBEDO_UNIFORM
        );
        var specluarGlossiness = Uniform.createInt(
            ReaderWriterGLTF.SPECULAR_GLOSSINESS_TEXTURE_UNIT,
            ReaderWriterGLTF.METALLIC_ROUGHNESS_UNIFORM
        );
        var specular = Uniform.createInt(
            ReaderWriterGLTF.SPECULAR_TEXTURE_UNIT,
            ReaderWriterGLTF.SPECULAR_UNIFORM
        );

        stateSet.addUniform(albedo);
        stateSet.addUniform(specluarGlossiness);
        stateSet.addUniform(specular);
    },

    _KHR_materials_pbrSpecularGlossiness: function(material, stateSet) {
        stateSet.setUserData({
            pbrWorklow: ReaderWriterGLTF.PBR_SPEC_MODE
        });

        this._KHR_materials_pbrSpecularGlossinessTextureUniforms();

        var osgjsTexture;
        var color;
        if (material.diffuseTexture) {
            osgjsTexture = this._texture(material.diffuseTexture);
            stateSet.setTextureAttributeAndModes(
                ReaderWriterGLTF.DIFFUSE_TEXTURE_UNIT,
                osgjsTexture
            );
        } else if (material.diffuseFactor) {
            color = Uniform.createFloat4(material.diffuseFactor, 'uBaseColorFactor');
            stateSet.addUniform(color);
        }

        if (material.specularFactor) {
            color = Uniform.createFloat3(material.specularFactor, 'uSpecularFactor');
            stateSet.addUniform(color);
        }

        if (material.glossinessFactor !== undefined) {
            var factor = Uniform.createFloat(material.glossinessFactor, 'uGlossinessFactor');
            stateSet.addUniform(factor);
        }

        if (material.specularGlossinessTexture) {
            osgjsTexture = this._texture(material.specularGlossinessTexture);
            stateSet.setTextureAttributeAndModes(
                ReaderWriterGLTF.SPECULAR_GLOSSINESS_TEXTURE_UNIT,
                osgjsTexture
            );
        }
    },

    loadMaterials: function() {
        var materials = this._gltfJSON.materials;
        var hasTransparentMaterial = false;
        var hasDoubleSidedMaterial = false;

        var rootStateSet = this._rootStateSet;
        rootStateSet.addUniform(
            Uniform.createInt(
                ReaderWriterGLTF.EMISSIVE_TEXTURE_UNIT,
                ReaderWriterGLTF.EMISSIVE_UNIFORM
            )
        );
        rootStateSet.addUniform(
            Uniform.createInt(ReaderWriterGLTF.AO_TEXTURE_UNIT, ReaderWriterGLTF.AO_UNIFORM)
        );
        rootStateSet.addUniform(
            Uniform.createInt(ReaderWriterGLTF.NORMAL_TEXTURE_UNIT, ReaderWriterGLTF.NORMAL_UNIFORM)
        );
        rootStateSet.addUniform(Uniform.createFloat3(vec3.ZERO, 'uEmissiveFactor'));

        for (var i = 0; i < materials.length; i++) {
            var material = materials[i];
            var stateSet = new StateSet();
            var osgjsTexture;
            material.osgjsStateSet = stateSet;

            if (material.pbrMetallicRoughness) {
                this._pbrMetallicRoughness(material.pbrMetallicRoughness, stateSet);
            } else if (material.extensions.KHR_materials_pbrSpecularGlossiness) {
                // https://github.com/KhronosGroup/glTF/blob/master/extensions/Khronos/KHR_materials_pbrSpecularGlossiness/README.md
                this._KHR_materials_pbrSpecularGlossiness(
                    material.extensions.KHR_materials_pbrSpecularGlossiness,
                    stateSet
                );
            }

            if (material.normalTexture) {
                osgjsTexture = this._texture(material.normalTexture);
                stateSet.setTextureAttributeAndModes(
                    ReaderWriterGLTF.NORMAL_TEXTURE_UNIT,
                    osgjsTexture
                );
            }

            if (material.occlusionTexture) {
                osgjsTexture = this._texture(material.occlusionTexture);
                stateSet.setTextureAttributeAndModes(
                    ReaderWriterGLTF.AO_TEXTURE_UNIT,
                    osgjsTexture
                );
            }

            if (material.emissiveTexture) {
                osgjsTexture = this._texture(material.emissiveTexture);
                stateSet.setTextureAttributeAndModes(
                    ReaderWriterGLTF.EMISSIVE_TEXTURE_UNIT,
                    osgjsTexture
                );
            }
            if (material.emissiveFactor) {
                stateSet.addUniform(
                    Uniform.createFloat3(material.emissiveFactor, 'uEmissiveFactor')
                );
            }

            if (material.alphaMode === 'BLEND') {
                hasTransparentMaterial = true;
                stateSet.setAttributeAndModes(this._transparentBlendFunc);
                stateSet.setRenderingHint('TRANSPARENT_BIN');
            }

            if (material.doubleSided) {
                hasDoubleSidedMaterial = true;
                stateSet.setAttributeAndModes(this._doubleSideCullFace);
            }
        }

        // need to add a default blend func if we have transparent materials in the model
        if (hasTransparentMaterial) {
            rootStateSet.setAttributeAndModes(this._defaultBlendFunc);
        }

        if (hasDoubleSidedMaterial) {
            rootStateSet.setAttributeAndModes(this._defaultCullFace);
        }
    },

    _createBone: function(nodeID) {
        var nodes = this._gltfJSON.nodes;
        var node = nodes[nodeID];
        node.usedAsBone = true;
        var nodeAnimationTypes = this._nodeAnimationTypes;

        var osgjsNode = new Bone();
        var name = node.osgjsNodeName;
        osgjsNode.setName(name);

        var matrix = this._computeNodeMatrix(node) || mat4.IDENTITY;
        osgjsNode.setMatrix(matrix);

        var updateCallback = new UpdateBone();
        updateCallback.setName(osgjsNode.getName());
        osgjsNode.addUpdateCallback(updateCallback);

        if (nodeAnimationTypes[nodeID]) {
            var stackTransforms = updateCallback.getStackedTransforms();
            for (var channelType in nodeAnimationTypes[nodeID]) {
                var StackedType = ReaderWriterGLTF.TYPE_STACKED_TRANSFORMS[channelType];
                var stack = new StackedType(channelType);
                stackTransforms.push(stack);
            }
        }

        // we set the default updateBone matrix with the bone matrix to avoid to copy identity
        // matrix when no animation is yet started
        updateCallback.setMatrix(matrix);
        //osgjsNode.addChild(shape.createAxisGeometry());
        return osgjsNode;
    },

    _createMatrixTransform: function(nodeID) {
        var nodes = this._gltfJSON.nodes;
        var node = nodes[nodeID];
        var nodeAnimationTypes = this._nodeAnimationTypes;

        var osgjsNode = new MatrixTransform();
        var name = node.osgjsNodeName;
        osgjsNode.setName(name);

        var matrix = this._computeNodeMatrix(node) || mat4.IDENTITY;
        osgjsNode.setMatrix(matrix);

        if (nodeAnimationTypes[nodeID]) {
            var updateCallback = new UpdateMatrixTransform();
            updateCallback.setName(osgjsNode.getName());
            osgjsNode.addUpdateCallback(updateCallback);
            updateCallback.setMatrix(matrix);

            var stackTransforms = updateCallback.getStackedTransforms();
            for (var channelType in nodeAnimationTypes[nodeID]) {
                var StackedType = ReaderWriterGLTF.TYPE_STACKED_TRANSFORMS[channelType];
                var stack = new StackedType(channelType);
                stackTransforms.push(stack);
            }
        }

        return osgjsNode;
    },

    _processSkin: function(skinID) {
        var skins = this._gltfJSON.skins;
        var nodes = this._gltfJSON.nodes;
        var skin = skins[skinID];
        var joints = skin.joints;

        var inverseBindMatrixAccessor, arrayBuffer;
        if (skin.inverseBindMatrices !== undefined) {
            inverseBindMatrixAccessor = this._gltfJSON.accessors[skin.inverseBindMatrices].data;
            arrayBuffer = inverseBindMatrixAccessor.getElements().buffer;
        }

        var skeleton = new Skeleton();
        skin.osgjsNode = skeleton;
        skeleton.setName('skin ID ' + skinID);
        var nodeID;
        var boneMap = {};
        var boneMapID = {};
        var node;
        var bone;
        // first create all bones
        for (var i = 0; i < joints.length; i++) {
            nodeID = joints[i];
            bone = this._createBone(nodeID);
            if (skin.inverseBindMatrices !== undefined) {
                var matrix = new Float32Array(arrayBuffer, i * 16 * 4, 16);
                bone.setInvBindMatrixInSkeletonSpace(matrix);
            }
            boneMap[nodeID] = bone;
            boneMapID[bone.getName()] = i;
        }
        skin.osgjsBoneMapID = boneMapID;

        for (var boneID in boneMap) {
            node = nodes[boneID];
            var parentID = node.parent;
            bone = boneMap[boneID];
            if (parentID === undefined || joints.indexOf(parentID) === -1) {
                skeleton.addChild(bone);
            } else {
                var boneParent = boneMap[parentID];
                boneParent.addChild(bone);
            }
        }
    },

    loadAnimations: function() {
        var animations = this._gltfJSON.animations;
        if (!animations) return;

        var accessors = this._gltfJSON.accessors;
        var nodeAnimationTypes = this._nodeAnimationTypes;
        var nodes = this._gltfJSON.nodes;
        var meshes = this._gltfJSON.meshes;

        var osgjsAnimations = [];
        for (var i = 0; i < animations.length; i++) {
            var channels = animations[i].channels;
            var samplers = animations[i].samplers;
            var osgjsChannels = [];
            for (var j = 0; j < channels.length; j++) {
                var channel = channels[j];
                var sampler = samplers[channel.sampler];
                var times = accessors[sampler.input].data.getElements();
                var accessorValues = accessors[sampler.output];
                var values = accessorValues.data.getElements();
                // target.id is deprecated
                var target = channel.target;
                var createChannel =
                    ReaderWriterGLTF.TYPE_CHANNEL_PATH[target.path][accessorValues.type];

                var nodeIndex = target.node !== undefined ? target.node : target.id;
                var node = nodes[nodeIndex];
                var channelName = target.path;
                var targetName = nodes[nodeIndex].osgjsNodeName;
                // needs to get the updateCallback name of the morph geometry
                if (channelName === 'weights') {
                    // if morph target we need to split each channel into scalar for each target
                    var mesh = meshes[node.mesh];

                    var nbTargets = mesh.primitives[0].targets.length;
                    var nkKeys = times.length;
                    for (var targetIndex = 0; targetIndex < nbTargets; targetIndex++) {
                        var weights = new Float32Array(nkKeys);
                        for (var v = 0; v < nkKeys; v++) {
                            weights[v] = values[v * nbTargets + targetIndex];
                        }
                        targetName = this._getMorphTargetName(mesh, targetIndex);
                        osgjsChannels.push(createChannel(weights, times, targetName, targetIndex));
                    }
                } else {
                    osgjsChannels.push(createChannel(values, times, targetName, channelName));
                }

                if (!nodeAnimationTypes[nodeIndex]) nodeAnimationTypes[nodeIndex] = {};
                nodeAnimationTypes[nodeIndex][channelName] = true;
            }

            var animationName = 'animation-' + i.toString();
            osgjsAnimations.push(animationFactory.createAnimation(osgjsChannels, animationName));
        }

        var animationManager = new BasicAnimationManager();
        animationManager.init(osgjsAnimations);
        this._animationManager = animationManager;
    },

    loadURI: P.method(function(uri, options) {
        // is base64 inline data
        if (uri.substr(0, 5) === 'data:') {
            return base64ToArrayBuffer(uri);
        }

        var result = this._filesMap[uri];
        if (result !== undefined) return result;
        return fileHelper.requestURI(uri, options);
    }),

    readNodeURL: function(url, options) {
        var self = this;

        this.init();
        if (options && options.filesMap !== undefined && Object.keys(options.filesMap).length > 0) {
            // it comes from the ZIP plugin or from drag'n drop
            // So we already have all the files.
            this._filesMap = options.filesMap;
            var glTFFile = this._filesMap[url];
            return this.readJSON(glTFFile, url);
        }

        var index = url.lastIndexOf('/');
        this._localPath = index === -1 ? '' : url.substr(0, index + 1);
        // Else it is a usual XHR request
        return fileHelper.requestURI(url).then(function(file) {
            return self.readJSON(file);
        });
    },

    readJSON: P.method(function(json, url) {
        this._gltfJSON = json;

        return P.all([this.loadBuffers(), this.loadImages()]).then(
            function() {
                this.loadBufferViews();
                this.loadAccessors();
                this._preProcessNodes();
                this.loadMaterials();
                this.loadMeshes();
                this.loadAnimations();
                this.loadSkins();
                this.loadNodes();
                this.loadScenes();

                var root = new MatrixTransform();
                root.addChild(this._osgjsScene[0]);
                root.setName(url);
                if (this._animationManager) root.addUpdateCallback(this._animationManager);
                root.setStateSet(this._rootStateSet);
                return root;
            }.bind(this)
        );
    })
};

Registry.instance().addReaderWriter('gltf', new ReaderWriterGLTF());

export default ReaderWriterGLTF;
