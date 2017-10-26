import utils from 'osg/utils';
import NodeVisitor from 'osg/NodeVisitor';
import Geometry from 'osg/Geometry';
import RigGeometry from 'osgAnimation/RigGeometry';
import Uniform from 'osg/Uniform';
import StateSet from 'osg/StateSet';
import { vec3 } from 'osg/glMatrix';
import ShaderGenerator from 'osgShader/ShaderGenerator';
import Compiler from 'osgShader/Compiler';
import BufferArray from 'osg/BufferArray';
import DrawArrays from 'osg/DrawArrays';
import primitiveSet from 'osg/primitiveSet';
import MatrixTransform from 'osg/MatrixTransform';
import Depth from 'osg/Depth';

////////////////////////
// COMPILER DEBUG GEOMETRY
////////////////////////
var CompilerColorGeometry = function() {
    Compiler.apply(this, arguments);
};

var configColor = Compiler.cloneStateAttributeConfig(Compiler);
configColor.textureAttribute = [];
configColor.attribute = ['PointSize', 'Morph', 'Skinning'];

Compiler.setStateAttributeConfig(CompilerColorGeometry, configColor);

utils.createPrototypeObject(
    CompilerColorGeometry,
    utils.objectInherit(Compiler.prototype, {
        getCompilerName: function() {
            return 'CompilerDebugGeometry';
        },
        initTextureAttributes: function() {},
        createFragmentShaderGraph: function() {
            var frag = this.getNode('glFragColor');

            this.getNode('SetAlpha')
                .inputs({
                    color: this.getOrCreateUniform('vec3', 'uColorDebug'),
                    alpha: this.createVariable('float').setValue('1.0')
                })
                .outputs({
                    result: frag
                });

            return [frag];
        }
    }),
    'osgUtil',
    'CompilerColorGeometry'
);

var ShaderGeneratorCompilerColorGeometry = function() {
    ShaderGenerator.apply(this, arguments);
    this.setShaderCompiler(CompilerColorGeometry);
};

utils.createPrototypeObject(
    ShaderGeneratorCompilerColorGeometry,
    utils.objectInherit(ShaderGenerator.prototype, {}),
    'osgUtil',
    'ShaderGeneratorCompilerColorGeometry'
);

////////////////////////
// COMPILER SKINNING DEBUG
////////////////////////
var CompilerColorSkinning = function() {
    Compiler.apply(this, arguments);
};

var configSkinning = Compiler.cloneStateAttributeConfig(Compiler);
configSkinning.textureAttribute = [];

Compiler.setStateAttributeConfig(CompilerColorSkinning, configSkinning);

utils.createPrototypeObject(
    CompilerColorSkinning,
    utils.objectInherit(Compiler.prototype, {
        getCompilerName: function() {
            return 'CompilerDebugSkinning';
        },
        initTextureAttributes: function() {},
        createFragmentShaderGraph: function() {
            var frag = this.getNode('glFragColor');

            this.getNode('SetAlpha')
                .inputs({
                    color: this.getOrCreateVarying('vec3', 'vBonesColor'),
                    alpha: this.createVariable('float').setValue('1.0')
                })
                .outputs({
                    result: frag
                });

            return [frag];
        },
        declareVertexVaryings: function(roots) {
            var color = this.getOrCreateVarying('vec3', 'vBonesColor');
            this.getNode('SetFromNode')
                .inputs(this.getOrCreateAttribute('vec3', 'BonesColor'))
                .outputs(color);
            return Compiler.prototype.declareVertexVaryings.call(this, roots);
        }
    }),
    'osgUtil',
    'CompilerColorSkinning'
);

var ShaderGeneratorCompilerColorSkinning = function() {
    ShaderGenerator.apply(this, arguments);
    this.setShaderCompiler(CompilerColorSkinning);
};

utils.createPrototypeObject(
    ShaderGeneratorCompilerColorSkinning,
    utils.objectInherit(ShaderGenerator.prototype, {}),
    'osgUtil',
    'ShaderGeneratorCompilerColorSkinning'
);

///////////////////////////
// DISPLAY GEOMETRY VISITOR
///////////////////////////

var GeometryColorDebugVisitor = function() {
    NodeVisitor.call(this);
    this._debugColor = true;
    this._debugSkinning = false;

    this._stCenter = new StateSet(); // state set of center crosses
    this._stCenter.setShaderGeneratorName('debugGeometry');
};

GeometryColorDebugVisitor.CompilerColorGeometry = CompilerColorGeometry;
GeometryColorDebugVisitor.ShaderGeneratorCompilerColorGeometry = ShaderGeneratorCompilerColorGeometry;

GeometryColorDebugVisitor.CompilerSkinningGeometry = CompilerColorSkinning;
GeometryColorDebugVisitor.ShaderGeneratorCompilerColorSkinning = ShaderGeneratorCompilerColorSkinning;

utils.createPrototypeObject(
    GeometryColorDebugVisitor,
    utils.objectInherit(NodeVisitor.prototype, {
        setGeometryDebug: function(node) {
            this._stCenter.setAttributeAndModes(new Depth(Depth.ALWAYS));
            this._debugColor = true;
            this._debugSkinning = false;
            this.apply(node);
        },

        setSkinningDebug: function(node) {
            this._stCenter.setAttributeAndModes(new Depth(Depth.NEVER));
            this._debugColor = false;
            this._debugSkinning = true;
            this.apply(node);
        },

        disableDebug: function(node) {
            this._stCenter.setAttributeAndModes(new Depth(Depth.NEVER));
            this._debugColor = false;
            this._debugSkinning = false;
            this.apply(node);
        },

        _debugCenterGeometry: function(node, color) {
            // draw cross with slightly different color than the geometry
            var bb = node.getBound();

            var verts = new Float32Array(18);
            var off = bb.radius() * 0.1;
            verts[0] = off;
            verts[3] = -off;

            verts[7] = off;
            verts[10] = -off;

            verts[14] = off;
            verts[17] = -off;

            var geo = new Geometry();
            geo.getAttributes().Vertex = new BufferArray(BufferArray.ARRAY_BUFFER, verts, 3);
            var primitive = new DrawArrays(primitiveSet.LINES, 0, 6);
            geo.getPrimitives().push(primitive);

            var mt = new MatrixTransform();
            var center = bb.center();
            mt.getMatrix()[12] = center[0];
            mt.getMatrix()[13] = center[1];
            mt.getMatrix()[14] = center[2];

            mt.addChild(geo);
            this.nodePath[this.nodePath.length - 2].addChild(mt);
            color = vec3.fromValues(color[0] * 0.8, color[1] * 0.8, color[2] * 0.8);
            geo.getOrCreateStateSet().addUniform(Uniform.createFloat3(color, 'uColorDebug'));
            mt.setStateSet(this._stCenter);

            mt._isCenterDebug = true;
        },

        _debugRigGeometry: function(node) {
            // a bone can be shared between several rigs so we use the instanceID to get unique color
            var vList = node.getVertexAttributeList();
            if (vList.BonesColor) return;

            var eltBones = vList.Bones.getElements();
            var eltWeights = vList.Weights.getElements();

            var bones = node._rigTransformImplementation._bones;
            var nbBones = eltBones.length / 4;

            var bonesColor = new Float32Array(nbBones * 3);

            for (var i = 0; i < nbBones; ++i) {
                var idb = i * 4;
                var c0 = bones[eltBones[idb]].getOrCreateDebugColor();
                var c1 = bones[eltBones[idb + 1]].getOrCreateDebugColor();
                var c2 = bones[eltBones[idb + 2]].getOrCreateDebugColor();
                var c3 = bones[eltBones[idb + 3]].getOrCreateDebugColor();

                var w0 = eltWeights[idb];
                var w1 = eltWeights[idb + 1];
                var w2 = eltWeights[idb + 2];
                var w3 = eltWeights[idb + 3];

                var idc = i * 3;
                bonesColor[idc] = w0 * c0[0] + w1 * c1[0] + w2 * c2[0] + w3 * c3[0];
                bonesColor[idc + 1] = w0 * c0[1] + w1 * c1[1] + w2 * c2[1] + w3 * c3[1];
                bonesColor[idc + 2] = w0 * c0[2] + w1 * c1[2] + w2 * c2[2] + w3 * c3[2];
            }

            vList.BonesColor = new BufferArray(BufferArray.ARRAY_BUFFER, bonesColor, 3);
        },

        _debugGeometry: function(node) {
            var debugColor = this._debugColor;
            var debugSkinning = this._debugSkinning && node instanceof RigGeometry;

            if (!debugColor && !debugSkinning) {
                if (node._originalStateSet !== undefined) {
                    node.setStateSet(node._originalStateSet || undefined);
                }
                return;
            }

            if (node._originalStateSet === undefined) {
                node._originalStateSet = node.getStateSet() || null;
            }

            var stateSet = new StateSet();
            node.setStateSet(stateSet);

            if (debugSkinning) {
                stateSet.setShaderGeneratorName('debugSkinning');
                this._debugRigGeometry(node);
                return;
            }

            // debug color
            var color = vec3.fromValues(Math.random(), Math.random(), Math.random());
            stateSet.addUniform(Uniform.createFloat3(color, 'uColorDebug'));
            stateSet.setShaderGeneratorName('debugGeometry');

            this._debugCenterGeometry(node, color);
        },

        apply: function(node) {
            if (node._isNormalDebug || node._isCenterDebug) return;

            if (node instanceof Geometry) {
                this._debugGeometry(node);
            }

            this.traverse(node);
        }
    }),
    'osgUtil',
    'GeometryColorDebugVisitor'
);

export default GeometryColorDebugVisitor;
