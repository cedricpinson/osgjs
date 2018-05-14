import utils from 'osg/utils';
import CullSettings from 'osg/CullSettings';
import CullVisitor from 'osg/CullVisitor';
import Object from 'osg/Object';
import Camera from 'osg/Camera';
import BoundingBox from 'osg/BoundingBox';
import Geometry from 'osg/Geometry';
import MatrixTransform from 'osg/MatrixTransform';
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

var MatrixTransformComponent = function() {
    this.Component = MatrixTransformComponent.Component;
    this.reset();
};

MatrixTransformComponent.Component = ComponentInstance++;
MatrixTransformComponent.DIRTY_LIST = 2;
MatrixTransformComponent.DIRTY = 1;
MatrixTransformComponent.prototype = {
    reset: function() {
        this._local = [];
        this._world = [];

        this._children = []; // children of the id
        this._parent = []; // parent of the id

        this._depth = []; // depth in the hierarchy, used to order update of transform
        this._dirty = []; // dirty state

        // for a full parent children dirty
        this._dirtyParentChildren = [];
        this._dirtyParentChildrenCount = 0;

        // for just a parent / child dirty
        this._dirtyParent = [];
        this._dirtyChild = [];
        this._dirtyParentCount = 0;

        this._dirtyByDepthList = [];
        this._dirtyByDepthListCount = [];

        this.createResource();
    },
    // default parent id is for geometry with no transform
    // we use the first transform as identity
    getDefaultParentID: function() {
        return 0;
    },
    createResource: function() {
        var id = this._local.length;
        this._local.push(mat4.create());
        this._world.push(mat4.create());
        this._children.push([]);
        this._parent.push(-1);
        this._depth.push(0);
        this._dirty.push(0);

        this._dirtyChild.push(0);
        this._dirtyParent.push(0);
        this._dirtyParentChildren.push(0);

        return id;
    },
    addChild: function(parent, child) {
        if (this._children[parent].indexOf(child) !== -1) return;
        this._children[parent].push(child);
        this._parent[child] = parent;
        let depth = this._depth[parent] + 1;
        this._depth[child] = depth;

        if (depth >= this._dirtyByDepthListCount.length) {
            this._dirtyByDepthListCount.push(0);
            this._dirtyByDepthList.push([0]);
        }

        // needs to dirty children
        // this._dirty();
    },
    removeChild: function(parent, child) {
        var index = this._children[parent].indexOf(child);
        if (index === -1) return;
        this._children[parent].splice(index, 1);
        this._parent[child] = -1;
        // needs to dirty children
        // this._dirty();
    },
    getChildren: function(parentId) {
        return this._children[parentId];
    },
    getWorldMatrix: function(id) {
        return this._world[id];
    },
    getLocalMatrix: function(id) {
        return this._local[id];
    },
    setLocalMatrix: function(id, matrix) {
        mat4.copy(this._local[id], matrix);
    },

    dirtyId: function(id) {
        if (this._parent[id] === -1) return;
        if (this._dirty[id]) return;
        this._dirty[id] = MatrixTransformComponent.DIRTY;
        var depth = this._depth[id];
        this._dirtyByDepthList[depth][this._dirtyByDepthListCount[depth]++] = id;
    },

    dirty: function() {
        // simulate a dirty all
        // actually we would need to keep track of dirty transforms with a inverse map
        // to not recompute more than once time the transform in the update
        var count = 0;
        var nbItems = this._parent.length;
        // skip item 0 (root dummy node)
        for (var i = 1; i < nbItems; i++) {
            if (this._children[i].length && this._parent[i] !== -1) {
                this._dirtyParentChildren[count++] = i;
            }
        }
        this._dirtyParentChildrenCount = count;
    },

    _dirtyChildren: function(parentId) {
        let children = this._children[parentId];
        for (let i = 0; i < children.length; i++) {
            let childrenId = children[i];
            if (
                this._dirty[childrenId] !== MatrixTransformComponent.DIRTY_LIST &&
                this._children[childrenId].length
            ) {
                this._dirty[childrenId] = MatrixTransformComponent.DIRTY_LIST;
                this._dirtyChildren(childrenId);
                this._dirtyParentChildren[this._dirtyParentChildrenCount++] = childrenId;
            }
        }
    },
    _createDirtyList: function() {
        this._dirtyParentCount = 0;
        this._dirtyParentChildrenCount = 0;
        for (let depth = 0; depth < this._dirtyByDepthList.length; depth++) {
            let nbDirty = this._dirtyByDepthListCount[depth];
            let dirtyList = this._dirtyByDepthList[depth];
            for (let i = 0; i < nbDirty; i++) {
                let currentId = dirtyList[i];
                let parentId = this._parent[currentId];
                if (
                    this._dirty[currentId] === MatrixTransformComponent.DIRTY_LIST ||
                    this._dirty[parentId] === MatrixTransformComponent.DIRTY_LIST
                ) {
                    continue;
                }

                if (this._dirty[parentId] !== MatrixTransformComponent.DIRTY) {
                    this._dirtyParent[this._dirtyParentCount++] = currentId;
                }

                this._dirty[currentId] = MatrixTransformComponent.DIRTY_LIST;
                this._dirtyParentChildren[this._dirtyParentChildrenCount++] = currentId;
                this._dirtyChildren(currentId);
            }
            this._dirtyByDepthListCount[depth] = 0;
        }
    },
    update: function() {
        //this._createDirtyList();

        // recompute only the parent dirty
        for (let i = 0; i < this._dirtyParentCount; i++) {
            let childId = this._dirtyParent[i];
            let parentId = this._parent[childId];
            let parentMatrix = this.getWorldMatrix(parentId);
            let localMatrix = this.getLocalMatrix(childId);
            let worldMatrix = this.getWorldMatrix(childId);
            mat4.mul(worldMatrix, parentMatrix, localMatrix);
        }

        for (let i = 0; i < this._dirtyParentChildrenCount; i++) {
            let parentId = this._dirtyParentChildren[i];
            let children = this._children[parentId];
            let parentMatrix = this.getWorldMatrix(parentId);
            this._dirty[parentId] = 0;
            for (let c = 0; c < children.length; c++) {
                let childId = children[c];
                let localMatrix = this.getLocalMatrix(childId);
                let worldMatrix = this.getWorldMatrix(childId);
                mat4.mul(worldMatrix, parentMatrix, localMatrix);
                this._dirty[childId] = 0;
            }
        }
        this._dirtyParentCount = 0;
        this._dirtyParentChildrenCount = 0;
    }
};

var GeometryData = function() {
    this._geometry = [];
    this._map = {};
};
GeometryData.prototype = {
    reset: function() {
        this._geometry = [];
        this._map = {};
    },
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
            this._geometry[i].getBoundingBox();
        }
    }
};

var GeometryComponent = function() {
    // this component is more to mimic renderleaf
    this.reset();
    this.Component = GeometryComponent.Component;
};

GeometryComponent.Component = ComponentInstance++;
GeometryComponent.prototype = {
    reset: function() {
        this._transformParent = [];
        this._boundingBoxWorldSpace = [];
        this._geometry = []; // reference a real geometry data
        this._stateSetPath = [];

        this._dirty = [];
        this._dirtyCount = 0;
    },
    createResource: function() {
        var id = this._geometry.length;
        this._transformParent.push(0);
        this._geometry.push(0);
        this._stateSetPath.push(null);
        this._dirty.push(0);
        this._boundingBoxWorldSpace.push(new BoundingBox());
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
    getBoundingBoxWorldSpace: function(id) {
        return this._boundingBoxWorldSpace[id];
    },
    setStateSetPath: function(geomId, stateSetIdList) {
        this._stateSetPath[geomId] = stateSetIdList;
    },
    getStateSetPath: function(geomId) {
        return this._stateSetPath[geomId];
    },
    dirty: function() {
        this._dirtyCount = this._geometry.length;
        for (var i = 0; i < this._dirtyCount; i++) {
            this._dirty[i] = i;
        }
    },
    update: function(geometryDataList, transformComponent) {
        for (var i = 0; i < this._dirtyCount; i++) {
            var geometryId = this._geometry[this._dirty[i]];
            var geometryData = geometryDataList.getGeometry(geometryId);
            var bbox = geometryData.getBoundingBox();
            var worldMatrix = transformComponent.getWorldMatrix(this._transformParent[geometryId]);
            bbox.transformMat4(this._boundingBoxWorldSpace[geometryId], worldMatrix);
        }
        this._dirtyCount = 0;
    }
};

// the idea of StateSet component is to keep a list of a stateSet to apply to render a geometry
var StateSetComponent = function() {
    this._stateSets = [];
    this.Component = StateSetComponent.Component;
};
StateSetComponent.Component = ComponentInstance++;
StateSetComponent.prototype = {
    reset: function() {
        this._stateSets = [];
    },
    createResource: function() {
        var id = this._stateSets.length;
        this._stateSets.push(null);
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
    this._geometry = [];
    this._stateSet = [];
    this._cameraNode = [];
    this._geometryToDraw = [];
    this._geometryCountToDraw = [];
    this.Component = RenderStageQueue.Component;
};
RenderStageQueue.Component = ComponentInstance++;
RenderStageQueue.prototype = {
    reset: function() {
        this._projectionMatrix = [];
        this._viewMatrix = [];
        this._geometry = [];
        this._stateSet = [];
        this._cameraNode = [];
        this._geometryToDraw = [];
        this._geometryCountToDraw = [];
    },
    createResource: function() {
        var id = this._projectionMatrix.length;
        this._projectionMatrix.push(mat4.create());
        this._viewMatrix.push(mat4.create());
        this._geometry.push([]);
        this._stateSet.push(null);
        this._cameraNode.push(null);
        this._geometryToDraw.push([]);
        this._geometryCountToDraw.push(0);
        return id;
    },
    getViewMatrix: function(id) {
        return this._viewMatrix[id];
    },
    getProjectionMatrix: function(id) {
        return this._projectionMatrix[id];
    },
    getGeometry: function(id) {
        return this._geometry[id];
    },
    setCameraNode: function(id, node) {
        this._cameraNode[id] = node;
        this._stateSet[id] = node.getStateSet();
    },
    setGeometryCountToDraw: function(id, count) {
        this._geometryCountToDraw[id] = count;
    },
    getGeometriesToDraw: function(id) {
        return this._geometryToDraw[id];
    },
    getGeometryCountToDraw: function(id) {
        return this._geometryCountToDraw[id];
    },
    getStateSet: function(id) {
        return this._stateSet[id];
    },
    update: function() {
        for (var i = 0; i < this._cameraNode.length; i++) {
            // grow the array count if needed
            if (this._geometryToDraw[i].length < this._geometry[i].length) {
                for (var j = this._geometryToDraw[i].length; j < this._geometry[i].length; j++) {
                    this._geometryToDraw[i].push(0);
                }
            }
            var camera = this._cameraNode[i];
            mat4.copy(this._viewMatrix[i], camera.getViewMatrix());
            // if (i === 0) {
            //     mat4.copy(
            //         this._viewMatrix[i],
            //         mat4.fromValues(
            //             0.9004856224259998,
            //             -0.22139246140884053,
            //             0.3743140684443947,
            //             0,
            //             0.4348857824809406,
            //             0.45842089220495763,
            //             -0.7750642823572447,
            //             0,
            //             -0,
            //             0.8607181092676891,
            //             0.5090818562654285,
            //             0,
            //             -0,
            //             2.220446049250313e-16,
            //             -2.759232798986803,
            //             1
            //         )
            //     );
            // }
            mat4.copy(this._projectionMatrix[i], camera.getProjectionMatrix());
        }
    }
};

var System = function(camera) {
    this._root = camera;
    this._entities = [];
    this._instance = 0;

    this._renderStageQueue = new RenderStageQueue();
    this._stateSetComponent = new StateSetComponent();
    this._geometryData = new GeometryData();
    this._transformComponent = new MatrixTransformComponent();
    this._geometryComponent = new GeometryComponent();
};

System.prototype = {
    reset: function() {
        utils.time('RenderDoD-reset');
        this._instance = 0;
        this._entities.length = 0;

        this._renderStageQueue.reset();
        this._stateSetComponent.reset();
        this._geometryData.reset();
        this._transformComponent.reset();
        this._geometryComponent.reset();

        this.initNode(this._root);
        utils.timeEnd('RenderDoD-reset');
    },

    notifyAddChild: function(parent, child) {
        var parentId = this.getComponentResource(parent, this._transformComponent);
        var childId = this.getComponentResource(child, this._transformComponent);
        this._transformComponent.addChild(parentId, childId);
    },
    notifyRemoveChild: function(parent, child) {
        var parentId = this.getComponentResource(parent, this._transformComponent);
        var childId = this.getComponentResource(child, this._transformComponent);
        this._transformComponent.removeChild(parentId, childId);
    },

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
        // n = 1 to skip stateSet of camera
        for (var n = 1; n < nodePath.length; n++) {
            var node = nodePath[n];
            var stateSet = node.getStateSet();
            if (stateSet) stateSets.push(stateSet);
        }
        return stateSets;
    },

    _getGeometryParentTransform: function(nodePath) {
        for (var n = nodePath.length - 2; n >= 0; n--) {
            var node = nodePath[n];
            if (node instanceof MatrixTransform) return node.getInstanceID();
        }
        return undefined;
    },
    _listGeometriesPerCamera: function(nodePathsGeometryMap) {
        var keys = window.Object.keys(nodePathsGeometryMap);
        var cameras = {};
        for (var i = 0; i < keys.length; i++) {
            var geometryInstanceId = keys[i];
            var nodePath = nodePathsGeometryMap[geometryInstanceId];
            for (var j = nodePath.length - 2; j >= 0; j--) {
                var node = nodePath[j];
                if (node instanceof Camera) {
                    var geometryList = cameras[node.getInstanceID()];
                    if (!geometryList) {
                        geometryList = [];
                        cameras[node.getInstanceID()] = geometryList;
                    }
                    geometryList.push(geometryInstanceId);
                    break;
                }
            }
        }
        return cameras;
    },
    initNode: function(camera) {
        utils.time('initNode');
        //var root = camera.getChildren()[0];
        var osgjsNodeEntityMap = {};
        var osgjsEntityNodeMap = {};

        // instanceId -> nodepath to root
        var nodePathsGeometryMap = {};
        var nodePathsGeometryOrder = []; //need to process them in order of traversing

        // keep camera order
        var cameraOrder = [];

        // traverse the osgjs graph and create entity
        // we will set components after
        var nv = new NodeVisitor();
        var self = this;
        nv.apply = function(node) {
            // does not work for root node
            // works only for a node but not really for a fullscene graph
            var children = node.getChildren();
            for (var j = 0; j < children.length; j++) {
                var child = children[j];
                if (child.getParents().length > 1) {
                    console.error('found a multi parent node');
                }
            }

            // reference node path per geometry
            // we will then extract stateSet from geometry to root
            if (node instanceof Geometry) {
                var nodePath = this.getNodePath();
                // we want only camera->geometry not camera->camera->geometry
                var cameraIndex = 0;
                for (j = nodePath.length - 1; j >= 0; j--) {
                    if (nodePath[j] instanceof Camera) {
                        cameraIndex = j;
                        break;
                    }
                }
                nodePathsGeometryMap[node.getInstanceID()] = nodePath.slice(cameraIndex);
                // but we dont want to
                nodePathsGeometryOrder.push(node.getInstanceID());
            }
            if (node instanceof Camera) {
                cameraOrder.push(node.getInstanceID());
            }

            var id = self.createEntity(node);
            osgjsNodeEntityMap[node.getInstanceID()] = id;
            osgjsEntityNodeMap[id] = node;

            this.traverse(node);
        };
        camera.accept(nv);

        var geometriesInstanceId = nodePathsGeometryOrder;

        // create transform entity and set them
        var transformParentChildren = {};
        var transformId;
        var entityId;
        for (var i = 0; i < geometriesInstanceId.length; i++) {
            var nodePath = nodePathsGeometryMap[geometriesInstanceId[i]];
            var nodePathTransform = [];
            var node, j;

            // create transform component and filter only matrix transform
            // convert
            // [T5, T0, N0, T1, G1]
            // [T5, T4, N1, N2, G2]
            // [T5, T7, G3]

            // to

            // [T5, T0, T1]
            // [T5, T4]
            // [T5, T7]
            for (j = 0; j < nodePath.length - 1; j++) {
                node = nodePath[j];
                if (node instanceof MatrixTransform) {
                    nodePathTransform.push(node);
                    entityId = osgjsNodeEntityMap[node.getInstanceID()];
                    if (!this.hasComponent(entityId, this._transformComponent)) {
                        transformId = this.addComponent(entityId, this._transformComponent);
                        var matrix = node.getMatrix();
                        mat4.copy(this._transformComponent.getLocalMatrix(transformId), matrix);
                        mat4.copy(this._transformComponent.getWorldMatrix(transformId), matrix);
                    }
                }
            }

            // convert
            // [T5, T0, T1]
            // [T5, T4]
            // [T5, T7]

            // to

            // T5: [ T0, T4, T7 ]
            // T0: [ T1 ]
            for (j = 1; j < nodePathTransform.length; j++) {
                var parent = nodePathTransform[j - 1];
                var children = transformParentChildren[parent.getInstanceID()];
                if (!children) {
                    children = [];
                    transformParentChildren[parent.getInstanceID()] = children;
                }
                node = nodePathTransform[j];
                entityId = osgjsNodeEntityMap[node.getInstanceID()];
                transformId = this.getComponentResource(entityId, this._transformComponent);
                if (children.indexOf(transformId) === -1) children.push(transformId);
            }
        }
        for (var parentInstanceId in transformParentChildren) {
            entityId = osgjsNodeEntityMap[parentInstanceId];
            var childrenTransformId = transformParentChildren[parentInstanceId];
            transformId = this.getComponentResource(entityId, this._transformComponent);
            for (var cc = 0; cc < childrenTransformId.length; cc++) {
                this._transformComponent.addChild(transformId, childrenTransformId[cc]);
            }
        }

        // create and setup geom component on entity
        for (var i = 0; i < geometriesInstanceId.length; i++) {
            entityId = osgjsNodeEntityMap[geometriesInstanceId[i]];
            var osgjsNode = osgjsEntityNodeMap[entityId];
            var geometryDataId = this._geometryData.addGeometry(osgjsNode);
            var geomId = this.addComponent(entityId, this._geometryComponent);
            this._geometryComponent.setGeometry(geomId, geometryDataId);
            var nodePath = nodePathsGeometryMap[osgjsNode.getInstanceID()];
            var stateSetArray = [];

            // get stateSet list
            var stateSets = this._getStateSetPath(nodePath);
            for (var n = 0; n < stateSets.length; n++) {
                var stateSetId = this.addComponent(entityId, this._stateSetComponent);
                this._stateSetComponent.setStateSet(stateSetId, stateSets[n]);
                stateSetArray.push(stateSetId);
            }
            this._geometryComponent.setStateSetPath(geomId, stateSetArray);

            var parentTranformInstanceId = this._getGeometryParentTransform(nodePath);
            if (parentTranformInstanceId === undefined) {
                transformId = this._transformComponent.getDefaultParentID();
            } else {
                var parentId = osgjsNodeEntityMap[parentTranformInstanceId];
                transformId = this.getComponentResource(parentId, this._transformComponent);
            }
            this._geometryComponent.setTransformId(geomId, transformId);
        }

        // handle camera
        var geometriesPerCamera = this._listGeometriesPerCamera(nodePathsGeometryMap);
        for (var i = 0; i < cameraOrder.length; i++) {
            var cameraInstanceId = cameraOrder[i];
            entityId = osgjsNodeEntityMap[cameraInstanceId];
            var renderQueueId = this.addComponent(entityId, this._renderStageQueue);
            this._renderStageQueue.setCameraNode(renderQueueId, osgjsEntityNodeMap[entityId]);
            var geoms = geometriesPerCamera[cameraInstanceId];
            if (geoms === undefined) continue;
            for (var k = 0; k < geoms.length; k++) {
                entityId = osgjsNodeEntityMap[geoms[k]];
                var geomId = this.getComponentResource(entityId, this._geometryComponent);
                this._renderStageQueue.getGeometry(renderQueueId).push(geomId);
            }
        }

        this._transformComponent.dirty();
        this._geometryComponent.dirty();

        utils.timeEnd('initNode');
    },

    hasComponent: function(id, component) {
        if (id >= this._entities.length) return false;

        var componentId = component.Component;
        return this._entities[id]._components[componentId] !== undefined;
    },

    getComponentResource: function(id, component) {
        if (id >= this._entities.length) return undefined;

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

    cull: function() {
        this._renderStageQueue.update();

        // update transform
        //this._transformComponent.dirtyId(2);
        //this._transformComponent.dirty();
        this._transformComponent.update();

        // update geometries bbox in worldspace
        this._geometryComponent.update(this._geometryData, this._transformComponent);

        // corners of the bounding box.
        var farBits = 1 | 2 | 0;
        var nearBits = ~farBits & 7;

        // compute look vector to get the nearBits/farBits
        var lookVector = vec3.create();
        var nearVec = vec3.create();
        var farVec = vec3.create();

        var renderQueue = this._renderStageQueue;
        for (var i = 0; i < renderQueue._projectionMatrix.length; i++) {
            var projectionMatrix = renderQueue.getProjectionMatrix(i);
            var viewMatrix = renderQueue.getViewMatrix(i);

            vec3.set(lookVector, -viewMatrix[2], -viewMatrix[6], -viewMatrix[10]);
            farBits =
                (lookVector[0] >= 0 ? 1 : 0) |
                (lookVector[1] >= 0 ? 2 : 0) |
                (lookVector[2] >= 0 ? 4 : 0);
            nearBits = ~farBits & 7;

            var renderQueueGeoms = renderQueue.getGeometry(i);
            var resultGeometries = renderQueue.getGeometriesToDraw(i);

            var computedNear = Number.POSITIVE_INFINITY;
            var computedFar = Number.NEGATIVE_INFINITY;

            var nbGeometry = 0;

            // update near / far
            var dNear, dFar;

            // actually this part could be avoided. We can either compute near/far per geometry
            // but if we see that the nearest z is viewed we could cache the bbox for the scene and compute only near/far for the entire scene. And switch back to per geometry if the nearest z start to be behind the camera
            for (var j = 0, l = renderQueueGeoms.length; j < l; j++) {
                var geomId = renderQueueGeoms[j];
                var boundingBoxWorldSpace = this._geometryComponent.getBoundingBoxWorldSpace(
                    geomId
                );

                boundingBoxWorldSpace.corner(nearBits, nearVec);
                boundingBoxWorldSpace.corner(farBits, farVec);

                dNear = this.distance(nearVec, viewMatrix);
                dFar = this.distance(farVec, viewMatrix);

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

                resultGeometries[nbGeometry++] = geomId;
            }
            renderQueue.setGeometryCountToDraw(i, nbGeometry);

            // update projection and near far
            var nearFarRatio = 0.005;
            if (
                computedNear !== Number.POSITIVE_INFINITY &&
                computedFar !== Number.NEGATIVE_INFINITY
            ) {
                this.clampProjectionMatrix(
                    projectionMatrix,
                    computedNear,
                    computedFar,
                    nearFarRatio
                );
            }
        }
    },
    render: function(state) {
        var renderQueue = this._renderStageQueue;
        var geometryDataList = this._geometryData;
        var nbDrawCall = 0;
        var modelViewList = [mat4.create(), mat4.create()];

        for (var r = 0; r < renderQueue._projectionMatrix.length; r++) {
            var resultGeometries = renderQueue.getGeometriesToDraw(r);
            var nbGeoms = renderQueue.getGeometryCountToDraw(r);
            if (!nbGeoms) continue;

            var projectionMatrix = renderQueue.getProjectionMatrix(r);
            var viewMatrix = renderQueue.getViewMatrix(r);

            state.pushStateSet(renderQueue.getStateSet(r));

            for (var i = 0; i < nbGeoms; i++) {
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
                var m = modelViewList[nbDrawCall % 2];
                var modelView = mat4.mul(m, viewMatrix, worldMatrix);
                renderGeometry(
                    state,
                    geometryData,
                    modelView,
                    worldMatrix,
                    viewMatrix,
                    projectionMatrix
                );
                nbDrawCall++;
                // restore previous states
                // pop stateSets
                for (j = 0; j < l; j++) {
                    state.popStateSet();
                }
            }
            state.popStateSet();
        }
    }
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

    this._system = new System(camera);
    var self = this;
    window.reset = function() {
        self._system.reset();
    };
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
            state.applyDefault();
            return;

            this._renderStage.setCamera(this._camera);

            this._renderStage.draw(state);

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
