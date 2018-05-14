import utils from 'osg/utils';
import CullSettings from 'osg/CullSettings';
import CullVisitor from 'osg/CullVisitor';
import Object from 'osg/Object';
import RenderStage from 'osg/RenderStage';
import State from 'osg/State';
import StateGraph from 'osg/StateGraph';
import vec4 from 'osg/glMatrix';
import vec3 from 'osg/glMatrix';
import mat4 from 'osg/glMatrix';
import osgShader from 'osgShader/osgShader';
import DisplayGraph from 'osgUtil/DisplayGraph';
import NodeVisitor from 'osg/NodeVisitor';
import MatrixTransform from 'osg/MatrixTransform';
import PooledArray from 'osg/PooledArray';
import BoundingBox from 'osg/BoundingBox';
import BoundingSphere from 'osg/BoundingSphere';
import Polytope from 'osg/Polytope';
import PooledResource from 'osg/PooledResource';
import Camera from 'osg/Camera';
import Plane from 'osg/Plane';
import osgMath from 'osg/math';
import notify from 'osg/notify';

var RenderStageCustom = function() {
    RenderStage.apply(this, arguments);
    RenderStageCustom.prototype.init.call(this);
};

utils.createPrototypeObject(
    RenderStageCustom,
    utils.objectInherit(RenderStage.prototype, {
        constructor: RenderStageCustom,

        _computeBoundingBoxPerBin: function(bbox, bin, renderingMask) {
            var stateList = bin._stateGraphList.getArray();
            var stateListLength = bin._stateGraphList.getLength();
            var leafs = bin._leafs;
            var leaf, mask;
            var validRenderingMask = renderingMask !== undefined ? renderingMask : ~0x0;

            var bbTmp = new BoundingBox();
            var worldMatrix, geometryBbox;

            // draw fine grained ordering.
            for (var d = 0, dl = leafs.length; d < dl; d++) {
                leaf = leafs[d];
                mask = leaf.getRenderingMask();
                if (validRenderingMask & mask) {
                    worldMatrix = leaf._model;
                    geometryBbox = leaf._geometry.getBoundingBox();
                    geometryBbox.transformMat4(bbTmp, worldMatrix);
                    bbox.expandByBoundingBox(bbTmp);
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
                        worldMatrix = leaf._model;
                        geometryBbox = leaf._geometry.getBoundingBox();
                        geometryBbox.transformMat4(bbTmp, worldMatrix);
                        bbox.expandByBoundingBox(bbTmp);
                    }
                }
            }
        },

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

            this._binExecutor(bin, func, renderingMask);
        },

        _computeBoundSceneForShadow: function(boundingBox) {
            var bins = this._bins.getMap();
            var binsKeys = this._bins.getKeys();
            var binsKeysLength = binsKeys.getLength();
            var binsKeysArray = binsKeys.getArray();

            for (var i = 0; i < binsKeysLength; i++) {
                var keyBin = binsKeysArray[i];
                var bin = bins[keyBin];
                this._computeBoundingBoxPerBin(boundingBox, bin, 0x1);
            }

            this._computeBoundingBoxPerBin(boundingBox, this, 0x1);
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

        _distance: function(coord, matrix) {
            return -(
                coord[0] * matrix[2] +
                coord[1] * matrix[6] +
                coord[2] * matrix[10] +
                matrix[14]
            );
        },

        _cullShadowCasting: function(shadowMap, bbox, renderingMask) {
            shadowMap._emptyCasterScene = false;
            this._aimShadowCastingCamera(shadowMap, bbox);

            if (shadowMap._emptyCasterScene) {
                // nothing to draw, tell receiver to do early out
                // ie: in shader, no texfetch
                shadowMap.markSceneAsNoShadow();
                // Early out, no need to traverse scene either
                return;
            }

            // TO finalize:
            // in classic execution with traversal
            // first we cull geometry outside the frustrum
            // see CullCallback in ShadowMap
            var frustum = new Polytope();
            var viewMatrix = shadowMap.getCamera().getViewMatrix();
            mat4.getFrustumPlanes(
                frustum.getPlanes(),
                shadowMap.getCamera().getProjectionMatrix(),
                viewMatrix,
                false
            );
            var boundingSphereWorld = new BoundingSphere();
            var boundingBoxWorld = new BoundingBox();
            var renderLeafList = [];
            var lookVector = vec3.create();
            vec3.set(lookVector, -viewMatrix[2], -viewMatrix[6], -viewMatrix[10]);
            var farBits =
                (lookVector[0] >= 0 ? 1 : 0) |
                (lookVector[1] >= 0 ? 2 : 0) |
                (lookVector[2] >= 0 ? 4 : 0);
            var nearBits = ~farBits & 7;
            var nearVec = vec3.create();
            var farVec = vec3.create();
            var computedNear = Number.POSITIVE_INFINITY;
            var computedFar = Number.NEGATIVE_INFINITY;
            var distance = this._distance;
            var cullShadowMapLeaf = function(leaf) {
                var boundingSphereLeaf = leaf.getBound();
                var worldMatrix = leaf._model;
                boundingSphereLeaf.transformMat4(boundingSphereWorld, worldMatrix);
                var culled = frustum.containsBoundingSphere(boundingSphereWorld);
                if (culled) return;

                var boundingBox = leaf.getBoundingBox();
                boundingBox.transformMat4(boundingBoxWorld, worldMatrix);

                boundingBoxWorld.corner(nearBits, nearVec);
                boundingBoxWorld.corner(farBits, farVec);

                var dNear = distance(nearVec, viewMatrix);
                var dFar = distance(farVec, viewMatrix);

                if (dNear > dFar) {
                    var tmp = dNear;
                    dNear = dFar;
                    dFar = tmp;
                }

                if (dFar < 0.0) {
                    // whole object behind the eye point so discard
                    return;
                }

                if (dNear < computedNear) computedNear = dNear;
                if (dFar > computedFar) computedFar = dFar;

                renderLeafList.push(leaf);
            };

            this._binsExecutor(cullShadowMapLeaf, renderingMask);

            ///////////////////// STOP HERE
            if (computedNear === Number.POSITIVE_INFINITY && computedFar === Number.NEGATIVE_INFINITY) {
                this._shadowTechnique.markSceneAsNoShadow();
            }

            // get renderer to make the cull program
            // record the traversal mask on entry so we can reapply it later.
            var traversalMask = cullVisitor.getTraversalMask();

            cullVisitor.setTraversalMask(shadowMap._castsShadowDrawTraversalMask);

            // cast geometries into depth shadow map
            cullVisitor.pushStateSet(shadowMap._casterStateSet);

            shadowMap._cameraShadow.setEnableFrustumCulling(true);
            shadowMap._cameraShadow.setComputeNearFar(true);

            if (shadowMap._debug) {
                shadowMap._debugNode.accept(cullVisitor);
            }

            // do RTT from the camera traversal mimicking light pos/orient
            shadowMap._cameraShadow.accept(cullVisitor);

            // make sure no negative near
            shadowMap.nearFarBounding();

            // Here culling is done, we do have near/far.
            // and cull/non-culled info
            // if we wanted a tighter frustum.
            shadowMap.frameShadowCastingFrustum(cullVisitor);

            // disabling to prevent cullvisitor breaking
            // the projection matrix by "clamping" it
            shadowMap._cameraShadow.setComputeNearFar(false);

            cullVisitor.popStateSet();

            // re-apply the original traversal mask
            cullVisitor.setTraversalMask(traversalMask);
            shadowMap._needRedraw = false;
        },
        drawShadow: function() {
            var lt = this._shadows._shadowTechniques.length;
            var isDirty = false;
            for (var i = 0; i < lt; i++) {
                var shadowTechnique = this._shadowTechniques[i];

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
            if (!isDirty) return;

            var boundingBox = new BoundingBox();
            this._computeBoundSceneForShadow(boundingBox);
            var hasCastingScene = boundingBox.valid();
            if (!hasCastingScene) {
                // no shadow but still may need to clear
                // and makes sure shadow receiver shader
                // uses optimized early out codepath
                for (i = 0; i < lt; i++) {
                    shadowTechnique = this._shadows._shadowTechniques[i];
                    shadowTechnique.markSceneAsNoShadow();
                }
                return;
            }

            // cull Casters
            for (i = 0; i < lt; i++) {
                shadowTechnique = this._shadows._shadowTechniques[i];
                if (shadowTechnique.isContinuousUpdate() || shadowTechnique.needRedraw()) {
                    shadowTechnique.updateShadowTechnique();
                    this._cullShadowCasting(
                        shadowTechnique,
                        boundingBox,
                        shadowTechnique._castsShadowDrawTraversalMask
                    );
                }
            }
        },

        draw: function(state, previousRenderLeaf, renderingMask) {
            if (this._shadows) {
                this.drawShadow();
            }
            var previousLeaf = this.drawPreRenderStages(state, previousRenderLeaf, renderingMask);
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
    })
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
