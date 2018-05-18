import utils from 'osg/utils';
import CullSettings from 'osg/CullSettings';
import CullVisitor from 'osg/CullVisitor';
import Object from 'osg/Object';
import RenderStage from 'osg/RenderStage';
import State from 'osg/State';
import StateGraph from 'osg/StateGraph';
import { vec4 } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';
import { mat4 } from 'osg/glMatrix';
import osgShader from 'osgShader/osgShader';
import DisplayGraph from 'osgUtil/DisplayGraph';
import NodeVisitor from 'osg/NodeVisitor';
import BoundingBox from 'osg/BoundingBox';
import BoundingSphere from 'osg/BoundingSphere';
import Polytope from 'osg/Polytope';
import Camera from 'osg/Camera';
import StateAttribute from 'osg/StateAttribute';
import osgMath from 'osg/math';
import notify from 'osg/notify';

var getInsertPosition = function(state, previous) {
    var sg = previous ? previous._parent : undefined;
    var num = 0;
    // need to pop back all statesets and matrices.
    while (sg) {
        if (sg.stateset) num++;
        sg = sg.parent;
    }

    if (num > 1) num--;
    return state.getStateSetStackSize() - num;
};

var distance = function(coord, matrix) {
    return -(coord[0] * matrix[2] + coord[1] * matrix[6] + coord[2] * matrix[10] + matrix[14]);
};

var cullShadowMapLeaf = function(leaf) {
    var geometry = leaf._geometry;
    var boundingSphereLeaf = geometry.getBound();
    var worldMatrix = leaf._model;
    boundingSphereLeaf.transformMat4(this.boundingSphereWorld, worldMatrix);
    var isContained = this.frustum.containsBoundingSphere(this.boundingSphereWorld);
    if (!isContained) return;

    var boundingBox = geometry.getBoundingBox();
    boundingBox.transformMat4(this.boundingBoxWorld, worldMatrix);

    this.boundingBoxWorld.corner(this.nearBits, this.nearVec);
    this.boundingBoxWorld.corner(this.farBits, this.farVec);

    var dNear = distance(this.nearVec, this.viewMatrix);

    var dFar = distance(this.farVec, this.viewMatrix);

    if (dNear > dFar) {
        var tmp = dNear;
        dNear = dFar;
        dFar = tmp;
    }

    if (dFar < 0.0) {
        // whole object behind the eye point so discard
        return;
    }

    if (dNear < this.computedNear) this.computedNear = dNear;
    if (dFar > this.computedFar) this.computedFar = dFar;

    this.renderLeafList.push(leaf);
};

var computeSceneBoundingBox = function(leaf) {
    var worldMatrix = leaf._model;
    var geometryBbox = leaf._geometry.getBoundingBox();
    geometryBbox.transformMat4(this.bboxTmp, worldMatrix);
    this.bbox.expandByBoundingBox(this.bboxTmp);
};

var RenderStageCustom = function() {
    RenderStage.apply(this, arguments);
    RenderStageCustom.prototype.init.call(this);

    var context = {
        boundingSphereWorld: new BoundingSphere(),
        boundingBoxWorld: new BoundingBox(),
        nearVec: vec3.create(),
        farVec: vec3.create(),
        renderLeafList: [],
        frustum: new Polytope()
    };
    this._cullShadowMapLeaf = cullShadowMapLeaf.bind(context);
    this._cullShadowMapLeafContext = context;

    var bboxContext = {
        bboxTmp: new BoundingBox(),
        bbox: new BoundingBox()
    };
    this._computeSceneBoundingBox = computeSceneBoundingBox.bind(bboxContext);
    this._computeSceneBoundingBoxContext = bboxContext;
};

utils.createPrototypeObject(
    RenderStageCustom,
    utils.objectInherit(RenderStage.prototype, {
        constructor: RenderStageCustom,

        _binExecutor: function(bin, func, renderingMask) {
            var stateList = bin._stateGraphList.getArray();
            var stateListLength = bin._stateGraphList.getLength();
            var leafs = bin._leafs;
            var leaf, mask;
            var validRenderingMask = renderingMask !== undefined ? renderingMask : ~0x0;

            // draw fine grained ordering.
            for (var d = 0, dl = leafs.length; d < dl; d++) {
                leaf = leafs[d];
                mask = leaf.getRenderingMask();
                if (validRenderingMask & mask) {
                    func(leaf);
                }
            }

            // draw coarse grained ordering.
            for (var i = 0, l = stateListLength; i < l; i++) {
                var sg = stateList[i];
                var leafArray = sg._leafs.getArray();
                var leafArrayLength = sg._leafs.getLength();
                for (var j = 0; j < leafArrayLength; j++) {
                    leaf = leafArray[j];
                    mask = leaf.getRenderingMask();
                    if (validRenderingMask & mask) {
                        func(leaf);
                    }
                }
            }
        },

        _binsExecutor: function(func, renderingMask) {
            var bins = this._bins.getMap();
            var binsKeys = this._bins.getKeys();
            var binsKeysLength = binsKeys.getLength();
            var binsKeysArray = binsKeys.getArray();

            for (var i = 0; i < binsKeysLength; i++) {
                var keyBin = binsKeysArray[i];
                var bin = bins[keyBin];
                this._binExecutor(bin, func, renderingMask);
            }

            this._binExecutor(this, func, renderingMask);
        },

        _aimShadowCastingCamera: function(shadowMap, bbox) {
            var light = shadowMap._light;

            if (!light) {
                shadowMap._emptyCasterScene = true;
                return;
            }

            var camera = shadowMap._cameraShadow;

            var worldLightPos = shadowMap._worldLightPos;
            var worldLightDir = shadowMap._worldLightDir;

            // make sure it's not modified outside our computations
            // camera matrix can be modified by cullvisitor afterwards...
            mat4.copy(shadowMap._projectionMatrix, camera.getProjectionMatrix());
            mat4.copy(shadowMap._viewMatrix, camera.getViewMatrix());
            var projection = shadowMap._projectionMatrix;
            var view = shadowMap._viewMatrix;

            // inject camera world matrix.
            // from light current world/pos and camera eye pos.
            // inject camera world matrix.
            // from light current world/pos
            // NEED same camera eye pos
            var positionedAttribute = this.getPositionedAttribute();

            var lightMatrix;
            var positionedAttributeElements = positionedAttribute.getArray();
            for (var i = 0; i < positionedAttribute.getLength(); i++) {
                var pa = positionedAttributeElements[i];
                var attribute = pa[1];
                var matrix = pa[0];
                if (attribute === light) {
                    lightMatrix = matrix;
                    break;
                }
            }

            if (lightMatrix === undefined) {
                notify.warn('light isnt inside children of shadowedScene Node');
                shadowMap._emptyCasterScene = true;
                return;
            }

            var eyeToWorld = shadowMap._tmpMatrix;
            var cameraViewMatrix = this._camera.getViewMatrix();
            mat4.invert(eyeToWorld, cameraViewMatrix);

            //  light pos & lightTarget in World Space
            if (!shadowMap._light.isDirectionLight()) {
                mat4.mul(shadowMap._tmpMatrix, eyeToWorld, lightMatrix);
                var worldMatrix = shadowMap._tmpMatrix;

                // same code as light spot shader
                vec3.transformMat4(worldLightPos, light.getPosition(), worldMatrix);
                worldMatrix[12] = 0;
                worldMatrix[13] = 0;
                worldMatrix[14] = 0;
                mat4.invert(worldMatrix, worldMatrix);
                mat4.transpose(worldMatrix, worldMatrix);

                // not a directional light, compute the world light dir
                vec3.copy(worldLightDir, light.getDirection());
                vec4.transformMat4(worldLightDir, worldLightDir, worldMatrix);
                vec3.normalize(worldLightDir, worldLightDir);

                // and compute a perspective frustum
                shadowMap.makePerspectiveFromBoundingBox(
                    bbox,
                    light.getSpotCutoff(),
                    worldLightPos,
                    worldLightDir,
                    view,
                    projection
                );
            } else {
                vec4.transformMat4(worldLightPos, light.getPosition(), lightMatrix);
                vec4.transformMat4(worldLightPos, worldLightPos, eyeToWorld);
                // same code as light sun shader
                // lightpos is a light dir
                // so we now have to normalize
                // since the transform to world above
                vec3.scale(worldLightPos, worldLightPos, -1.0);
                vec3.normalize(worldLightPos, worldLightPos);
                shadowMap.makeOrthoFromBoundingBox(bbox, worldLightPos, view, projection);

                if (shadowMap._debug) {
                    // project box by view to get projection debug bbox
                    mat4.invert(shadowMap._debugNodeFrustum.getMatrix(), view);
                }
            }

            mat4.copy(camera.getProjectionMatrix(), shadowMap._projectionMatrix);
            mat4.copy(camera.getViewMatrix(), shadowMap._viewMatrix);
        },

        _cullShadowCasting: (function() {
            var modelViewMatrix = [mat4.create(), mat4.create()];
            var lookVector = vec3.create();

            return function(state, previousRenderLeaf, shadowMap, bbox, renderingMask) {
                shadowMap._emptyCasterScene = false;
                this._aimShadowCastingCamera(shadowMap, bbox);
                var previous = previousRenderLeaf;
                if (shadowMap._emptyCasterScene) {
                    // nothing to draw, tell receiver to do early out
                    // ie: in shader, no texfetch
                    shadowMap.markSceneAsNoShadow();
                    // Early out, no need to traverse scene either
                    return previous;
                }

                var cullShadowMapLeafContext = this._cullShadowMapLeafContext;

                // TO finalize:
                // in classic execution with traversal
                // first we cull geometry outside the frustrum
                // see CullCallback in ShadowMap
                cullShadowMapLeafContext.frustum.setupMask(4);
                var viewMatrix = shadowMap.getCamera().getViewMatrix();
                mat4.getFrustumPlanes(
                    cullShadowMapLeafContext.frustum.getPlanes(),
                    shadowMap.getCamera().getProjectionMatrix(),
                    viewMatrix,
                    false
                );
                cullShadowMapLeafContext.viewMatrix = viewMatrix;
                cullShadowMapLeafContext.renderLeafList.length = 0;
                vec3.set(lookVector, -viewMatrix[2], -viewMatrix[6], -viewMatrix[10]);
                cullShadowMapLeafContext.farBits =
                    (lookVector[0] >= 0 ? 1 : 0) |
                    (lookVector[1] >= 0 ? 2 : 0) |
                    (lookVector[2] >= 0 ? 4 : 0);
                cullShadowMapLeafContext.nearBits = ~cullShadowMapLeafContext.farBits & 7;
                cullShadowMapLeafContext.computedNear = Number.POSITIVE_INFINITY;
                cullShadowMapLeafContext.computedFar = Number.NEGATIVE_INFINITY;

                this._binsExecutor(this._cullShadowMapLeaf, renderingMask);

                if (
                    cullShadowMapLeafContext.computedNear === Number.POSITIVE_INFINITY &&
                    cullShadowMapLeafContext.computedFar === Number.NEGATIVE_INFINITY
                ) {
                    shadowMap.markSceneAsNoShadow();
                    return previous;
                }

                shadowMap.setLightFrustum(
                    cullShadowMapLeafContext.frustum,
                    cullShadowMapLeafContext.computedNear,
                    cullShadowMapLeafContext.computedFar
                );

                // make sure no negative near
                shadowMap.nearFarBounding();

                // Here culling is done, we do have near/far.
                // and cull/non-culled info
                // if we wanted a tighter frustum.
                shadowMap.frameShadowCastingFrustum(0.005); // default near far ratio of cullvisitor

                var insertStateSetPosition = getInsertPosition(state, previous);

                var camera = shadowMap.getCamera();

                var cameraStateSet = camera.getStateSet();
                // transform stateSet of camera to override
                var attributePair = cameraStateSet.getAttributePair('Viewport');
                if (!(attributePair.getValue() & StateAttribute.OVERRIDE)) {
                    cameraStateSet.setAttributeAndModes(
                        cameraStateSet.getAttribute('Viewport'),
                        StateAttribute.OVERRIDE
                    );
                    if (cameraStateSet.getAttribute('Scissor')) {
                        cameraStateSet.setAttributeAndModes(
                            cameraStateSet.getAttribute('Scissor'),
                            StateAttribute.OVERRIDE
                        );
                    }
                }

                // cast geometries into depth shadow map
                state.insertStateSet(insertStateSetPosition, cameraStateSet);
                state.insertStateSet(insertStateSetPosition + 1, shadowMap._casterStateSet);

                RenderStage.prototype.applyCamera(state, camera);
                var clearMask = camera.getClearMask();
                if (clearMask !== 0x0) {
                    if (clearMask & Camera.COLOR_BUFFER_BIT) {
                        state.clearColor(camera.getClearColor());
                    }
                    if (clearMask & Camera.DEPTH_BUFFER_BIT) {
                        state.depthMask(true);
                        state.clearDepth(camera.getClearDepth());
                    }
                    state.clear(clearMask);
                }

                var projectionMatrix = shadowMap.getCamera().getProjectionMatrix();
                CullVisitor.prototype.clampProjectionMatrix.call(
                    null,
                    projectionMatrix,
                    cullShadowMapLeafContext.computedNear,
                    cullShadowMapLeafContext.computedFar,
                    shadowMap.getCamera().getNearFarRatio()
                );

                var renderLeafList = cullShadowMapLeafContext.renderLeafList;
                for (var i = 0; i < renderLeafList.length; i++) {
                    var projection = renderLeafList[i]._projection;
                    var view = renderLeafList[i]._view;
                    var modelView = renderLeafList[i]._modelView;
                    var model = renderLeafList[i]._model;

                    renderLeafList[i]._view = viewMatrix;
                    renderLeafList[i]._projection = projectionMatrix;
                    var m = modelViewMatrix[i % 2];
                    mat4.mul(m, viewMatrix, model);
                    renderLeafList[i]._modelView = m;

                    renderLeafList[i].render(state, previous);
                    previous = renderLeafList[i];

                    renderLeafList[i]._projection = projection;
                    renderLeafList[i]._view = view;
                    renderLeafList[i]._modelView = modelView;
                }

                state.removeStateSet(insertStateSetPosition + 1);
                state.removeStateSet(insertStateSetPosition);

                shadowMap._needRedraw = false;

                return previous;
            };
        })(),

        drawShadow: function(state, previousRenderLeaf) {
            var lt = this._shadows._shadowTechniques.length;
            var isDirty = false;
            var previous = previousRenderLeaf;
            for (var i = 0; i < lt; i++) {
                var shadowTechnique = this._shadows._shadowTechniques[i];

                // dirty check for user playing with shadows inside update traverse
                if (!shadowTechnique || !shadowTechnique.valid()) continue;

                if (shadowTechnique.isDirty()) {
                    isDirty = true;
                    shadowTechnique.init();
                }

                if (shadowTechnique.isContinuousUpdate() || shadowTechnique.needRedraw()) {
                    isDirty = true;
                }
            }
            if (!isDirty) return previous;

            var boundingBox = this._computeSceneBoundingBoxContext.bbox;
            this._computeSceneBoundingBoxContext.bboxTmp.init();
            boundingBox.init();
            this._binsExecutor(this._computeSceneBoundingBox, this._castsShadowDrawTraversalMask);

            var hasCastingScene = boundingBox.valid();
            if (!hasCastingScene) {
                // no shadow but still may need to clear
                // and makes sure shadow receiver shader
                // uses optimized early out codepath
                for (i = 0; i < lt; i++) {
                    shadowTechnique = this._shadows._shadowTechniques[i];
                    shadowTechnique.markSceneAsNoShadow();
                }
                return previous;
            }

            // cull Casters
            for (i = 0; i < lt; i++) {
                shadowTechnique = this._shadows._shadowTechniques[i];
                if (shadowTechnique.isContinuousUpdate() || shadowTechnique.needRedraw()) {
                    shadowTechnique.updateShadowTechnique();
                    previous = this._cullShadowCasting(
                        state,
                        previous,
                        shadowTechnique,
                        boundingBox,
                        this._castsShadowDrawTraversalMask
                    );
                }
            }
            return previous;
        },

        draw: function(state, previousRenderLeaf, renderingMask) {
            var previousLeaf = previousRenderLeaf;
            if (this._shadows) {
                previousLeaf = this.drawShadow(state, previousLeaf);
            }
            previousLeaf = this.drawPreRenderStages(state, previousLeaf, renderingMask);
            previousLeaf = this.drawImplementation(state, previousLeaf, renderingMask);
            previousLeaf = this.drawPostRenderStages(state, previousLeaf, renderingMask);
            return previousLeaf;
        },

        drawImplementation: function(state, previousLeaf, renderingMask) {
            return RenderStage.prototype.drawImplementation.call(
                this,
                state,
                previousLeaf,
                renderingMask
            );
        }
    }),
    'osg',
    'RenderStageCustom'
);
var renderStageInstance = new RenderStageCustom();

var createBoundingBox = function() {
    return new BoundingBox();
};

var ListVisitor = function() {
    CullVisitor.call(this);
};

var copyLeavesFromStateGraphList = function(stateGraphArray, result) {
    var detectedNaN = false;
    var stateGraphList = stateGraphArray.getArray();
    var stateGraphListLength = stateGraphArray.getLength();
    for (var i = 0; i < stateGraphListLength; i++) {
        var leafs = stateGraphList[i]._leafs;
        var leafsArray = leafs.getArray();
        var leafsArrayLength = leafs.getLength();
        for (var j = 0; j < leafsArrayLength; j++) {
            var leaf = leafsArray[j];
            if (osgMath.isNaN(leaf._depth)) {
                detectedNaN = true;
            } else {
                result.push(leaf);
            }
        }
    }
    if (detectedNaN) {
        notify.debug(
            'warning: RenderBin::copyLeavesFromStateGraphListToRenderLeafList() detected NaN depth values, database may be corrupted.'
        );
    }
};

var sortBinNumberFunction = function(a, b) {
    return a._binNum - b._binNum;
};

var sortBackToFrontFunction = function(a, b) {
    return b._depth - a._depth;
};

utils.createPrototypeObject(
    ListVisitor,
    utils.objectInherit(CullVisitor.prototype, {
        _findMainScene: function(root) {
            var mainScene;
            var nv = new NodeVisitor();
            nv.apply = function(node) {
                if (node.getName() === 'main-scene') {
                    mainScene = node;
                    return;
                }
                if (mainScene) return;
                this.traverse(node);
            };
            root.accept(nv);
            return mainScene;
        },

        getBins: function() {
            var binsArray = [];
            var bins = this._rootRenderStage._bins.getMap();
            var binsKeys = this._rootRenderStage._bins.getKeys();
            var binsKeysLength = binsKeys.getLength();
            var binsKeysArray = binsKeys.getArray();
            for (var i = 0; i < binsKeysLength; i++) {
                var keyBin = binsKeysArray[i];
                binsArray.push(bins[keyBin]);
            }
            binsArray.sort(sortBinNumberFunction);
            return binsArray;
        },

        parseMainScene: function(mainCamera) {
            if (!this._mainScene) {
                this._mainScene = this._findMainScene(mainCamera);
            }
            var mainScene = this._mainScene;
            this.handleCullCallbacksAndTraverse(mainScene);

            // assume that order is ok if we keep it this way
            var opaque = [];
            var transparent = [];

            copyLeavesFromStateGraphList(this._rootRenderStage.getStateGraphList(), opaque);

            var binsArray = this.getBins();
            for (var i = 0; i < binsArray.length; i++) {
                var bin = binsArray[i];
                if (bin.getBinNumber() === 10) {
                    copyLeavesFromStateGraphList(bin.getStateGraphList(), transparent);
                } else {
                    copyLeavesFromStateGraphList(bin.getStateGraphList(), opaque);
                }
            }
            transparent.sort(sortBackToFrontFunction);
            this._opaque = opaque;
            this._transparent = transparent;
        }
    })
);

var Renderer = function(camera) {
    Object.call(this);

    this._state = undefined;
    this._camera = camera;
    this._renderStage = undefined;
    this._stateGraph = undefined;

    this._frameStamp = undefined;

    this._previousCullsettings = new CullSettings();

    this.setDefaults();
};

Renderer.debugGraph = false;

utils.createPrototypeObject(
    Renderer,
    utils.objectInherit(Object.prototype, {
        setDefaults: function() {
            this._state = new State(new osgShader.ShaderGeneratorProxy());

            this._cullVisitor = new CullVisitor();
            this._cullVisitor.setRenderer(this);
            this._stateGraph = new StateGraph();

            this.getCamera().setClearColor(vec4.create());
            this.setRenderStage(new RenderStageCustom());

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

        cullAndDraw: function() {
            this.cull();
            this.draw();
        },

        cull: function() {
            var camera = this.getCamera();
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
        },

        draw: function() {
            this._renderStage.sort();

            var state = this.getState();

            // important because cache are used in cullvisitor
            state.resetCacheFrame();

            // reset stats counter
            state.resetStats();

            this._renderStage.setCamera(this._camera);
            this._renderStage.draw(state);

            if (Renderer.debugGraph) {
                DisplayGraph.instance().createRenderGraph(this._renderStage);
                Renderer.debugGraph = false;
            }

            this._renderStage.setCamera(undefined);

            state.applyDefault();
        }
    }),
    'osgViewer',
    'RendererFlat'
);

export default Renderer;
