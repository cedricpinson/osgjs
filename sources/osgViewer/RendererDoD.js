import utils from 'osg/utils';
import CullSettings from 'osg/CullSettings';
import CullVisitor from 'osg/CullVisitor';
import Object from 'osg/Object';
import Transform from 'osg/Transform';
import Camera from 'osg/Camera';
import BoundingBox from 'osg/BoundingBox';
import Geometry from 'osg/Geometry';
import NodeVisitor from 'osg/NodeVisitor';
import RenderStage from 'osg/RenderStage';
import State from 'osg/State';
import StateGraph from 'osg/StateGraph';
import {vec3, vec4, mat4} from 'osg/glMatrix';
import osgShader from 'osgShader/osgShader';
import DisplayGraph from 'osgUtil/DisplayGraph';
import notify from 'osg/notify';

var ComponentInstance = 0;

// just use inline function, it's faster than having the test in the code
var applyUniformCache = [
    // apply just modelview and projection
    function(state, modelview, model, view, projection) {
        state.applyModelViewMatrix(modelview, model);
        state.applyProjectionMatrix(projection);
    },

    // apply model
    function(state, modelview, model, view, projection) {
        var gl = state.getGraphicContext();
        var matrixModelViewChanged = state.applyModelViewMatrix(modelview, model);
        state.applyProjectionMatrix(projection);

        if (matrixModelViewChanged) {
            var modelMatrix = state._modelMatrix;
            modelMatrix.setMatrix4(model);
            modelMatrix.apply(gl, this.modelUniform);
        }
    },

    // apply view
    function(state, modelview, model, view, projection) {
        var gl = state.getGraphicContext();
        var matrixModelViewChanged = state.applyModelViewMatrix(modelview, model);
        state.applyProjectionMatrix(projection);

        if (matrixModelViewChanged) {
            var viewMatrix = state._viewMatrix;
            viewMatrix.setMatrix4(view);
            viewMatrix.apply(gl, this.viewUniform);
        }
    },

    // applyModelAndViewUniform
    function(state, modelview, model, view, projection) {
        var gl = state.getGraphicContext();
        var matrixModelViewChanged = state.applyModelViewMatrix(modelview, model);
        state.applyProjectionMatrix(projection);

        if (matrixModelViewChanged) {
            var modelMatrix = state._modelMatrix;
            modelMatrix.setMatrix4(model);
            modelMatrix.apply(gl, this.modelUniform);

            var viewMatrix = state._viewMatrix;
            viewMatrix.setMatrix4(view);
            viewMatrix.apply(gl, this.viewUniform);
        }
    }
];

var CacheUniformApply = function(state, program) {
    this.modelUniform = program._uniformsCache[state._modelMatrix.getName()];
    this.viewUniform = program._uniformsCache[state._viewMatrix.getName()];

    var cacheIndex = 0;
    if (this.modelUniform) cacheIndex = 1;
    if (this.viewUniform) cacheIndex |= 2;

    this.apply = applyUniformCache[cacheIndex];
};

var renderGeometry = function(state, geom, modelView, model, view, projection) {
    var program = state.getLastProgramApplied();
    var programInstanceID = program.getInstanceID();
    var cache = state.getCacheUniformsApplyRenderLeaf();
    var obj = cache[programInstanceID];

    if (!obj) {
        obj = new CacheUniformApply(state, program);
        cache[programInstanceID] = obj;
    }

    obj.apply(state, modelView, model, view, projection);

    geom.drawImplementation(state);
};

var createParentChildren = function() {
    return {
        _parent: 0,
        _children: []
    };
};

var MatrixTransformComponent = function() {
    this._local = [];
    this._world = [];

    this._parent = [];
    this._children = [];
    this.Component = MatrixTransformComponent.Component;
};

MatrixTransformComponent.Component = ComponentInstance++;

MatrixTransformComponent.prototype = {
    createResource: function() {
        var id = this._local.length;
        this._local.push(mat4.create());
        this._world.push(mat4.create());
        return id;
    },
    addParentChildren: function(id, children) {
        this._parent.push(id);
        this._children.push(children);
    },
    getWorldMatrix: function(id) {
        return this._world[id];
    },
    getLocalMatrix: function(id) {
        return this._local[id];
    },
    compute: function() {
        var parent = this._parent;
        for (var l = 0; l < parent.length; l++) {
            var parentMatrix = this.getWorldMatrix(parent[l]);
            var children = this._children[l];
            for (var c = 0; c < children.length; c++) {
                var child = children[c];
                var localMatrix = this.getLocalMatrix(child);
                var worldMatrix = this.getWorldMatrix(child);
                mat4.mul(worldMatrix, parentMatrix, localMatrix);
            }
        }
    }
};

var CameraComponent = function() {
    this._view = [];
    this._projection = [];

    this.Component = CameraComponent.Component;
};

CameraComponent.Component = ComponentInstance++;
CameraComponent.prototype = {
    createResource: function() {
        var id = this._view.length;
        this._view.push(mat4.create());
        this._projection.push(mat4.create());
        return id;
    },
    getViewMatrix: function(id) {
        return this._view[id];
    },
    getProjectionMatrix: function(id) {
        return this._projection[id];
    }
};

var GeometryData = function() {
    this._geometry = [];
    this._boundingBox = [];
    this._map = {};
};
GeometryData.prototype = {
    addGeometry: function(geom) {
        if (this._map[geom.getInstanceID()] !== undefined) return this._map[geom.getInstanceID()];
        var idx = this._geometry.length;
        this._map[geom.getInstanceID()] = idx;
        this._geometry.push(geom);
        return idx;
    },
    getGeometry: function(id) {
        return this._geometry[id];
    },
    computeBoundingBox: function() {
        for (var i = 0; i < this._geometry.length; i++) {
            var bb = this._geometry[i].getBoundingBox();
            this._boundingBox[i] = bb;
        }
    }
};

var GeometryComponent = function() {
    // this component is more to mimic renderleaf
    this._transformParent = [];
    this._geometry = []; // reference a real geometry data
    this._stateSetPath = [];
};

GeometryComponent.Component = ComponentInstance++;
GeometryComponent.prototype = {
    createResource: function() {
        var id = this._geometry.length;
        this._transformParent.push(0);
        this._geometry.push(0);
        this._stateSetPath.push(null);
        return id;
    },
    setTransformId: function(id, transformId) {
        this._transformParent[id] = transformId;
    },
    getTransformId: function(id) {
        return this._transformParent[id];
    },
    setGeometry: function(id, geometryId) {
        this._geometry[id] = geometryId;
    },
    getGeometry: function(id) {
        return this._geometry[id];
    },
    addStateSetPath: function(geomId, stateSetIdList) {
        this._stateSetPath[geomId] = stateSetIdList;
    },
    getStateSetPath: function(geomId) {
        return this._stateSetPath[geomId];
    }
};

// the idea of StateSet component is to keep a list of a stateSet to apply to render a geometry
var StateSetComponent = function() {
    this._stateSets = [];
};
StateSetComponent.Component = ComponentInstance++;
StateSetComponent.prototype = {
    createResource: function() {
        var id = this._stateSets.push(null);
        return id;
    },
    setStateSet: function(id, stateSet) {
        this._stateSets[id] = stateSet;
    },
    getStateSet: function(id) {
        return this._stateSets[id];
    }
};

var RenderStageQueue = function() {
    this._projectionMatrix = [];
    this._viewMatrix = [];
    this._boundingBox = [];
};
RenderStageQueue.prototype = {};

var HierarchyComponent = function() {
    this._hierarchy = []; // could be sorted in different way
    this._data = []; // index is id cant be changed
    this.Component = HierarchyComponent.Component;
};
HierarchyComponent.Component = ComponentInstance++;
HierarchyComponent.prototype = {
    createResource: function() {
        var data = createParentChildren();
        var id = this._data.length;
        this._data.push(data);
        this._hierarchy.push(id);
        return id;
    },
    getParentChildren: function(id) {
        return this._data[id];
    }
};

// to simplify the multi parent issue
// we will create a shadowNodekk

var ShadowNode = function(node) {
    Node.call(this);
    this._node = node;
};
utils.createPrototypeNode(
    ShadowNode,
    utils.objectInherit(Node.prototype, {
        getRealNode: function() {
            return this._node;
        },
        getStateSet: function() {
            return this._node.getStateSet();
        }
    })
);

var System = function() {
    this._entities = [];
    this._instance = 0;

    this._stateSetComponent = new StateSetComponent();
    this._geometryData = new GeometryData();
    this._hierarchyComponent = new HierarchyComponent();
    this._transformComponent = new MatrixTransformComponent();
    this._cameraComponent = new CameraComponent();
    this._geometryComponent = new GeometryComponent();
};

System.prototype = {
    createEntity: function() {
        var id = this._instance++;
        var entity = {
            _id: id,
            _components: {}
        };
        this._entities.push(entity);

        return entity._id;
    },

    _getStateSetPath: function(nodePath) {
        var stateSets = [];
        for (var n = 0; n < nodePath.length; n++) {
            var node = nodePath[n];
            var stateSet = node.getStateSet();
            if (stateSet) stateSets.push(stateSet);
        }
        return stateSets;
    },

    _getGeometryParentTransform: function(nodePath) {
        for (var n = nodePath.length - 2; n >= 0; n--) {
            var node = nodePath[n];
            if (node instanceof Transform) return node.getInstanceID();
        }
        return undefined;
    },

    initNode: function(camera) {
        //var root = camera.getChildren()[0];
        var osgjsNodeEntityMap = {};
        var osgjsEntityNodeMap = {};

        // var id = this.createEntity(camera);
        // this.addComponent(id, this._cameraComponent);

        // instanceId -> nodepath to root
        var nodePathsGeometryMap = {};

        // traverse the osgjs graph and create entity
        // we will set components after
        var nv = new NodeVisitor();
        nv.setNodeMaskOverride(~0x0);
        var self = this;
        nv.apply = function(node) {
            // replace multi parents node with shadow node
            // does not work for root node
            // works only for a node but not really for a fullscene graph
            var toAdd = [];
            var toRemove = [];
            var children = node.getChildren();
            for (var j = 0; j < children.length; j++) {
                var child = children[j];
                if (child.getParents().length > 1) {
                    console.log('found a multi parent node');
                    // replace
                    toRemove.push(child);
                    toAdd.push(new ShadowNode(child));
                }
            }
            for (j = 0; j < toRemove.length; j++) node.removeChild(toRemove[j]);
            for (j = 0; j < toAdd.length; j++) node.addChild(toAdd[j]);

            // reference node path per geometry
            // we will then extract stateSet from geometry to root
            var realNode = node instanceof ShadowNode ? node.getRealNode() : node;
            if (realNode instanceof Geometry) {
                nodePathsGeometryMap[node.getInstanceID()] = this.getNodePath().slice(1);
            }

            var id = self.createEntity(node);
            osgjsNodeEntityMap[node.getInstanceID()] = id;
            osgjsEntityNodeMap[id] = node;
            this.traverse(node);
        };
        camera.accept(nv);

        // this loop on entites and add component
        for (var i = 0; i < this._entities.length; i++) {
            var entity = this._entities[i];

            var osgjsNode = osgjsEntityNodeMap[entity._id];
            var osgjsChildren = osgjsNode.getChildren();

            var realNode = osgjsNode;
            if (osgjsNode instanceof ShadowNode) {
                realNode = osgjsNode.getRealNode();
            }

            if (realNode instanceof Geometry) {
                var geometryDataId = this._geometryData.addGeometry(realNode);
                var geomId = this.addComponent(entity._id, this._geometryComponent);
                this._geometryComponent.setGeometry(geomId, geometryDataId);

                var nodePath = nodePathsGeometryMap[osgjsNode.getInstanceID()];
                var stateSetArray = [];

                // get stateSet list
                var stateSets = this._getStateSetPath(nodePath);
                for (var n = 0; n < stateSets.length; n++) {
                    var stateSetId = this.addComponent(entity._id, this._stateSetComponent);
                    this._stateSetComponent.setStateSet(stateSetId, stateSets[n]);
                    stateSetArray.push(stateSetId);
                }
                this._geometryComponent.addStateSetPath(geomId, stateSetArray);

                var instanceId = this._getGeometryParentTransform(nodePath);
                if (instanceId === undefined) {
                    notify.error('no parent transform');
                }
                var parentId = osgjsNodeEntityMap[instanceId];
                var transformId = this.getComponentResource(parentId, this._transformComponent);
                this._geometryComponent.setTransformId(geomId, transformId);
            }

            // no children no needs to have relationship
            if (!osgjsChildren.length) continue;

            if (osgjsNode instanceof Camera) {
                this.addComponent(entity._id, this._cameraComponent);
                continue;
            }

            // handle hierarchy
            var id = this.addComponent(entity._id, this._hierarchyComponent);
            var data = this._hierarchyComponent.getParentChildren(id);
            data._parent = entity._id;
            for (var c = 0; c < osgjsChildren.length; c++) {
                var instanceId = osgjsChildren[c].getInstanceID();
                var entityId = osgjsNodeEntityMap[instanceId];
                if (entityId === undefined) {
                    console.log('uncool');
                }
                data._children.push(entityId);
            }

            // handle transform
            if (osgjsNode instanceof Transform) {
                var trId = this.addComponent(entity._id, this._transformComponent);
                mat4.copy(this._transformComponent.getLocalMatrix(trId), osgjsNode.getMatrix());
            }
        }

        console.log('hierarchy', this._hierarchyComponent._data.length);

        this._prepareTransform();
    },

    _prepareTransform: function() {
        // handle transform data from hierarchy
        var hierarchy = this._hierarchyComponent._hierarchy;
        for (var h = 0; h < hierarchy.length; h++) {
            var data = this._hierarchyComponent.getParentChildren(hierarchy[h]);
            var parentId = data._parent;
            var resourceIdComponent = this.getComponentResource(parentId, this._transformComponent);
            if (resourceIdComponent !== undefined) {
                var childrenEnitities = data._children;
                var childrenResource = [];
                for (var ci = 0; ci < childrenEnitities.length; ci++) {
                    var resourceIdChild = this.getComponentResource(
                        childrenEnitities[ci],
                        this._transformComponent
                    );
                    if (resourceIdChild !== undefined) childrenResource.push(resourceIdChild);
                }
                if (childrenResource.length)
                    this._transformComponent.addParentChildren(
                        resourceIdComponent,
                        childrenResource
                    );
            }
        }
        console.log('transform', this._transformComponent._local.length);
    },

    hasComponent: function(id, component) {
        var componentId = component.Component;
        return this._entities[id]._components[componentId] !== undefined;
    },

    getComponentResource: function(id, component) {
        var componentId = component.Component;
        return this._entities[id]._components[componentId];
    },

    addComponent: function(id, component) {
        var componentId = component.Component;
        var resourceId = component.createResource();
        this._entities[id]._components[componentId] = resourceId;
        return resourceId;
    },

    distance: function(coord, matrix) {
        return -(coord[0] * matrix[2] + coord[1] * matrix[6] + coord[2] * matrix[10] + matrix[14]);
    },

    clampProjectionMatrix: function(projection, znear, zfar, nearFarRatio, resultNearFar) {
        var epsilon = 1e-6;
        if (zfar < znear - epsilon) {
            notify.log(
                'clampProjectionMatrix not applied, invalid depth range, znear = ' +
                    znear +
                    '  zfar = ' +
                    zfar,
                false,
                true
            );
            return false;
        }

        var desiredZnear, desiredZfar;
        if (zfar < znear + epsilon) {
            // znear and zfar are too close together and could cause divide by zero problems
            // late on in the clamping code, so move the znear and zfar apart.
            var average = (znear + zfar) * 0.5;
            znear = average - epsilon;
            zfar = average + epsilon;
            // OSG_INFO << '_clampProjectionMatrix widening znear and zfar to '<<znear<<' '<<zfar<<std::endl;
        }

        if (
            Math.abs(projection[3]) < epsilon &&
            Math.abs(projection[7]) < epsilon &&
            Math.abs(projection[11]) < epsilon
        ) {
            // OSG_INFO << 'Orthographic matrix before clamping'<<projection<<std::endl;

            var deltaSpan = (zfar - znear) * 0.02;
            if (deltaSpan < 1.0) {
                deltaSpan = 1.0;
            }
            desiredZnear = znear - deltaSpan;
            desiredZfar = zfar + deltaSpan;

            // assign the clamped values back to the computed values.
            znear = desiredZnear;
            zfar = desiredZfar;

            projection[10] = -2.0 / (desiredZfar - desiredZnear);
            projection[14] = -(desiredZfar + desiredZnear) / (desiredZfar - desiredZnear);
            // OSG_INFO << 'Orthographic matrix after clamping '<<projection<<std::endl;
        } else {
            // OSG_INFO << 'Persepective matrix before clamping'<<projection<<std::endl;
            //std::cout << '_computed_znear'<<_computed_znear<<std::endl;
            //std::cout << '_computed_zfar'<<_computed_zfar<<std::endl;

            var zfarPushRatio = 1.02;
            var znearPullRatio = 0.98;

            //znearPullRatio = 0.99;

            desiredZnear = znear * znearPullRatio;
            desiredZfar = zfar * zfarPushRatio;

            // near plane clamping.
            var minNearPlane = zfar * nearFarRatio;
            if (desiredZnear < minNearPlane) {
                desiredZnear = minNearPlane;
            }

            // assign the clamped values back to the computed values.
            znear = desiredZnear;
            zfar = desiredZfar;

            var m22 = projection[10];
            var m32 = projection[14];
            var m23 = projection[11];
            var m33 = projection[15];
            var transNearPlane = (-desiredZnear * m22 + m32) / (-desiredZnear * m23 + m33);
            var transFarPlane = (-desiredZfar * m22 + m32) / (-desiredZfar * m23 + m33);

            var ratio = Math.abs(2.0 / (transNearPlane - transFarPlane));
            var center = -(transNearPlane + transFarPlane) / 2.0;

            var centerRatio = center * ratio;
            projection[2] = projection[2] * ratio + projection[3] * centerRatio;
            projection[6] = projection[6] * ratio + projection[7] * centerRatio;
            projection[10] = m22 * ratio + m23 * centerRatio;
            projection[14] = m32 * ratio + m33 * centerRatio;
            // same as
            // var matrix = [ 1.0, 0.0, 0.0, 0.0,
            //     0.0, 1.0, 0.0, 0.0,
            //     0.0, 0.0, ratio, 0.0,
            //     0.0, 0.0, center * ratio, 1.0
            // ];
            // mat4.mul( projection , matrix, projection );

            // OSG_INFO << 'Persepective matrix after clamping'<<projection<<std::endl;
        }
        if (resultNearFar !== undefined) {
            resultNearFar[0] = znear;
            resultNearFar[1] = zfar;
        }
        return true;
    },

    cull: function(camera) {
        if (!this._cameraComponent.getProjectionMatrix(0)) return;

        mat4.copy(this._cameraComponent.getProjectionMatrix(0), camera.getProjectionMatrix());
        mat4.copy(this._cameraComponent.getViewMatrix(0), camera.getViewMatrix());
        this._cameraStateSet = camera.getStateSet();

        // update transform
        this._transformComponent.compute();

        var projectionMatrix = this._cameraComponent.getProjectionMatrix(0);
        var viewMatrix = this._cameraComponent.getViewMatrix(0);
        var geometryDataList = this._geometryData;
        var geometries = this._geometryComponent._geometry;
        var transformParent = this._geometryComponent._transformParent;
        var transformComponent = this._transformComponent;

        var computedNear = Number.POSITIVE_INFINITY;
        var computedFar = Number.NEGATIVE_INFINITY;
        var sceneBoundingBox = new BoundingBox();
        var bboxTmp = new BoundingBox();

        var resultGeometries = [];

        var nearVec = vec3.create();
        var farVec = vec3.create();

        // update near / far
        var dNear, dFar;

        // actually this part could be a choice, per geometry or for the entire scene
        // per geometry can make sense for big scene but for only a few geometry always on screen
        // per scene is enough
        for (var i = 0, l = geometries.length; i < l; i++) {
            var geometryData = geometryDataList.getGeometry(geometries[i]);
            var bbox = geometryData.getBoundingBox();
            var matrix = transformComponent.getWorldMatrix(transformParent[i]);
            bbox.transformMat4(bboxTmp, matrix);
            sceneBoundingBox.expandByBoundingBox(bboxTmp);

            // compute near / far and reject geometries behind view
            // efficient computation of near and far, only taking into account the nearest and furthest
            // corners of the bounding box.
            var farBits = 1 | 2 | 0;
            var nearBits = ~farBits & 7;
            dNear = this.distance(bboxTmp.corner(nearBits, nearVec), viewMatrix);
            dFar = this.distance(bboxTmp.corner(farBits, farVec), viewMatrix);

            if (dNear > dFar) {
                var tmp = dNear;
                dNear = dFar;
                dFar = tmp;
            }

            if (dFar < 0.0) {
                // whole object behind the eye point so discard
                continue;
            }

            if (dNear < computedNear) computedNear = dNear;
            if (dFar > computedFar) computedFar = dFar;

            resultGeometries.push(i);
        }

        // update projection and near far
        var nearFarRatio = 0.005;
        this.clampProjectionMatrix(projectionMatrix, computedNear, computedFar, nearFarRatio);

        // organize data per stategraph
        // the order is always the same if there is no sort or change in geometry order so we can
        // build a list that will be always the same in multiple frames
        this._resultGeometries = resultGeometries;
    },

    render: function(state) {
        var resultGeometries = this._resultGeometries;
        if (!resultGeometries) return;
        var geometryDataList = this._geometryData;

        var projectionMatrix = this._cameraComponent.getProjectionMatrix(0);
        var viewMatrix = this._cameraComponent.getViewMatrix(0);
        var modelViewList = [mat4.create(), mat4.create()];

        state.pushStateSet(this._cameraStateSet);

        for (var i = 0; i < resultGeometries.length; i++) {
            var geomId = resultGeometries[i];
            var geometryData = geometryDataList.getGeometry(geomId);

            // push stateSets
            var stateSets = this._geometryComponent.getStateSetPath(geomId);
            var stateSet;
            var l = stateSets.length - 1;
            for (var j = 0; j < l; j++) {
                stateSet = this._stateSetComponent.getStateSet(stateSets[j]);
                state.pushStateSet(stateSet);
            }
            stateSet = this._stateSetComponent.getStateSet(stateSets[l]);
            state.applyStateSet(stateSet);

            // draw
            var transformId = this._geometryComponent.getTransformId(geomId);
            var worldMatrix = this._transformComponent.getWorldMatrix(transformId);

            // because state cache the reference
            var m = modelViewList[i % 2];
            var modelView = mat4.mul(m, viewMatrix, worldMatrix);
            renderGeometry(
                state,
                geometryData,
                modelView,
                worldMatrix,
                viewMatrix,
                projectionMatrix
            );
            // restore previous states
            // pop stateSets
            for (j = 0; j < l; j++) {
                state.popStateSet();
            }
        }

        state.popStateSet();
    }
};

var createSystem = function() {
    console.log('testing DoD renderer');
    return new System();
};

var RendererDoD = function(camera) {
    Object.call(this);

    this._state = undefined;
    this._camera = camera;
    this._renderStage = undefined;
    this._stateGraph = undefined;

    this._frameStamp = undefined;

    this._previousCullsettings = new CullSettings();

    this.setDefaults();

    this._system = createSystem(camera);
};

RendererDoD.debugGraph = false;

utils.createPrototypeObject(
    RendererDoD,
    utils.objectInherit(Object.prototype, {
        setDefaults: function() {
            this._state = new State(new osgShader.ShaderGeneratorProxy());

            this._cullVisitor = new CullVisitor();
            this._cullVisitor.setRenderer(this);
            this._stateGraph = new StateGraph();

            this.getCamera().setClearColor(vec4.create());
            this.setRenderStage(new RenderStage());

            var osg = require('osg/osg').default;
            var stateSet = this.getCamera().getOrCreateStateSet();
            stateSet.setAttributeAndModes(new osg.Material());
            stateSet.setAttributeAndModes(new osg.Depth());
            stateSet.setAttributeAndModes(new osg.BlendFunc());
            stateSet.setAttributeAndModes(new osg.CullFace());
        },

        getCullVisitor: function() {
            return this._cullVisitor;
        },

        setCullVisitor: function(cv) {
            if (cv && !cv.getRenderer()) cv.setRenderer(this);
            this._cullVisitor = cv;
        },

        setRenderStage: function(rs) {
            this._renderStage = rs;
        },

        getCamera: function() {
            return this._camera;
        },

        setFrameStamp: function(fs) {
            this._frameStamp = fs;
        },

        getFrameStamp: function() {
            return this._frameStamp;
        },

        getState: function() {
            return this._state;
        },

        setState: function(state) {
            this._state = state;
        },

        setGraphicContext: function(gc) {
            this._state.setGraphicContext(gc);
        },

        getGraphicContext: function() {
            return this._state.getGraphicContext();
        },

        cull: function() {
            var camera = this.getCamera();

            if (!this._systemReady) {
                this._systemReady = true;
                this._system.initNode(camera);
            }

            this._system.cull(camera);
            return;
            var view = camera.getView();

            this._cullVisitor.setFrameStamp(this._frameStamp);

            // reset stats
            this._cullVisitor.resetStats();

            // this part of code should be called for each view
            // right now, we dont support multi view

            // reset all stateGraph per frame
            StateGraph.reset();
            this._stateGraph.clean();

            this._renderStage.reset();

            this._cullVisitor.reset();
            this._cullVisitor.setStateGraph(this._stateGraph);
            this._cullVisitor.setRenderStage(this._renderStage);

            this._cullVisitor.pushStateSet(camera.getStateSet());

            // save cullSettings
            this._previousCullsettings.reset();
            this._previousCullsettings.setCullSettings(this._cullVisitor);
            this._cullVisitor.setCullSettings(camera);
            if (
                this._previousCullsettings.getSettingSourceOverrider() === this._cullVisitor &&
                this._previousCullsettings.getEnableFrustumCulling()
            ) {
                this._cullVisitor.setEnableFrustumCulling(true);
            }

            // Push reference on the projection stack, it means that if compute near/far
            // is activated, it will update the projection matrix of the camera
            this._cullVisitor.pushCameraModelViewProjectionMatrix(
                camera,
                camera.getViewMatrix(),
                camera.getProjectionMatrix()
            );

            // update bound
            camera.getBound();

            var light = view.getLight();
            var View = require('osgViewer/View').default;

            if (light) {
                switch (view.getLightingMode()) {
                    case View.LightingMode.HEADLIGHT:
                        this._cullVisitor.addPositionedAttribute(null, light);
                        break;

                    case View.LightingMode.SKY_LIGHT:
                        this._cullVisitor.addPositionedAttribute(camera.getViewMatrix(), light);
                        break;

                    default:
                        break;
                }
            }

            var viewport = camera.getViewport();
            var scissor = camera.getScissor();

            this._cullVisitor.pushViewport(viewport);

            this._renderStage.setClearDepth(camera.getClearDepth());
            this._renderStage.setClearColor(camera.getClearColor());
            this._renderStage.setClearMask(camera.getClearMask());
            this._renderStage.setViewport(viewport);
            this._renderStage.setScissor(scissor);

            // pass de dbpager to the cullvisitor, so plod's can do the requests
            this._cullVisitor.setDatabaseRequestHandler(this._camera.getView().getDatabasePager());
            // dont add camera on the stack just traverse it
            this._cullVisitor.handleCullCallbacksAndTraverse(camera);

            // fix projection matrix if camera has near/far auto compute
            this._cullVisitor.popCameraModelViewProjectionMatrix(camera);

            // Important notes about near/far
            // If you are using the picking on the main camera and
            // you use only children sub camera for RTT, your
            // main camera will keep +/-infinity for near/far because
            // the computation of near/far is done by camera and use Geometry

            // restore previous state of the camera
            this._cullVisitor.setCullSettings(this._previousCullsettings);

            this._cullVisitor.popViewport();
            this._cullVisitor.popStateSet();

            this._renderStage.sort();
        },

        draw: function() {
            var state = this.getState();

            // important because cache are used in cullvisitor
            state.resetCacheFrame();

            // reset stats counter
            state.resetStats();

            this._system.render(state);
            return;

            this._renderStage.setCamera(this._camera);

            // this._renderStage.draw(state);

            if (RendererDoD.debugGraph) {
                DisplayGraph.instance().createRenderGraph(this._renderStage);
                RendererDoD.debugGraph = false;
            }

            this._renderStage.setCamera(undefined);

            state.applyDefault();
        }
    }),
    'osgViewer',
    'RendererDoD'
);

export default RendererDoD;
