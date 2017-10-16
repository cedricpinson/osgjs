import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import BoundingBox from 'osg/BoundingBox';
import Camera from 'osg/Camera';
import CullSettings from 'osg/CullSettings';
import CullVisitor from 'osg/CullVisitor';
import { mat4 } from 'osg/glMatrix';
import MatrixTransform from 'osg/MatrixTransform';
import Node from 'osg/Node';
import RenderBin from 'osg/RenderBin';
import RenderStage from 'osg/RenderStage';
import Shape from 'osg/shape';
import StateGraph from 'osg/StateGraph';
import State from 'osg/State';
import StateSet from 'osg/StateSet';
import TransformEnums from 'osg/transformEnums';
import { vec3 } from 'osg/glMatrix';
import Viewport from 'osg/Viewport';
import View from 'osgViewer/View';
import ShaderGeneratorProxy from 'osgShader/ShaderGeneratorProxy';

export default function() {
    test('CullVisitor', function() {
        console.log('toto');
        var canvas = mockup.createCanvas();
        var viewer = new mockup.Viewer(canvas);
        viewer.setupManipulator();
        viewer.init();
        viewer.frame();
        var uv = viewer
            .getCamera()
            .getRenderer()
            .getCullVisitor();
        var root = new Node();
        root.setName('a');
        var b = new Node();
        b.setName('b');
        var c = new Node();
        c.setName('c');
        root.addChild(b);
        b.addChild(c);

        var callb = 0;
        var callc = 0;

        var fb = function() {};
        fb.prototype = {
            cull: function(/*node, nv*/) {
                callb = 1;
                return false;
            }
        };

        var fc = function() {};
        fc.prototype = {
            cull: function(/*node, nv*/) {
                callc = 1;
                return true;
            }
        };

        b.setCullCallback(new fb());
        c.setCullCallback(new fc());

        uv.apply(root);

        assert.isOk(callb === 1, 'Called b cull callback');
        assert.isOk(callc === 0, 'Did not Call c cull callback as expected');

        root.setNodeMask(~0);
        assert.isOk(callb === 1, 'Called b cull callback');
        assert.isOk(callc === 0, 'Did not Call c cull callback as expected');
        mockup.removeCanvas(canvas);
    });
    return;
    test('CullVisitor 2', function() {
        // check render stage and render bin
        (function() {
            var canvas = mockup.createCanvas();
            var viewer = new mockup.Viewer(canvas);
            viewer.setupManipulator();
            viewer.init();
            viewer.frame();
            var cull = viewer.getCamera().getRenderer()._cullVisitor;

            var camera0 = new Camera();
            camera0.setRenderOrder(Camera.NESTED_RENDER);
            var node0 = new Node();
            var node1 = new Node();
            camera0.addChild(node0);
            camera0.addChild(node1);

            var camera1 = new Camera();
            camera1.setRenderOrder(Camera.NESTED_RENDER);
            var node00 = new Node();
            var node10 = new Node();
            camera1.addChild(node00);
            camera1.addChild(node10);

            camera0.addChild(camera1);

            //var cull = new CullVisitor();
            var rs = new RenderStage();
            var sg = new StateGraph();
            cull.setRenderStage(rs);
            cull.setStateGraph(sg);

            cull.pushProjectionMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            camera0.accept(cull);

            assert.isOk(
                cull.rootRenderStage === cull.currentRenderBin,
                'renderStage should stay the render bin and id '
            ); //+ cull.rootRenderStage === cull.currentRenderBin
            mockup.removeCanvas(canvas);
        })();

        // check render stage and render bin
        (function() {
            var state = new State(new ShaderGeneratorProxy());
            var fakeRenderer = mockup.createFakeRenderer();
            fakeRenderer.validateProgram = function() {
                return true;
            };
            fakeRenderer.getProgramParameter = function() {
                return true;
            };
            fakeRenderer.isContextLost = function() {
                return false;
            };

            state.setGraphicContext(fakeRenderer);
            var camera0 = new Camera();
            camera0.setViewport(new Viewport());
            camera0.setRenderOrder(Camera.NESTED_RENDER);
            var geom = Shape.createTexturedQuadGeometry(
                -10 / 2.0,
                0,
                -10 / 2.0,
                20,
                0,
                0,
                0,
                0,
                20,
                1,
                1
            );
            camera0.addChild(geom);

            var cull = new CullVisitor();
            var rs = new RenderStage();
            var sg = new StateGraph();
            rs.setViewport(camera0.getViewport());

            cull.setRenderStage(rs);
            cull.setStateGraph(sg);

            cull.pushProjectionMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.pushStateSet(new StateSet());

            camera0.accept(cull);

            assert.isOk(
                cull.rootRenderStage === cull.currentRenderBin,
                'renderStage should stay the render bin and id '
            ); // + cull.rootRenderStage === cull.currentRenderBin);

            rs.draw(state);
        })();

        // check the computation of nearfar
        (function() {
            var camera0 = new Camera();

            var mt = new MatrixTransform();
            mat4.fromTranslation(mt.getMatrix(), [0, 0, 10]);
            var geom = Shape.createTexturedQuadGeometry(-5.0, -5, 0, 10, 0, 0, 0, 10, 0, 1, 1);
            mt.addChild(geom);
            camera0.addChild(mt);

            mat4.lookAt(camera0.getViewMatrix(), [-10, 0, 10], [0, 0, 10], [0, 1, 0]);
            mat4.perspective(
                camera0.getProjectionMatrix(),
                Math.PI / 180 * 60,
                800 / 600,
                1.0,
                1000.0
            );

            var stack = [];

            var setCullSettings = function(settings) {
                if (this._computedNear !== undefined) {
                    stack.push([this._computedNear, this._computedFar]);
                }
                CullSettings.prototype.setCullSettings.call(this, settings);
            };
            var resultProjection;

            var popProjectionMatrix = function() {
                resultProjection = this._projectionMatrixStack.back();
                CullVisitor.prototype.popProjectionMatrix.call(this);
            };
            CullVisitor.prototype.setCullSettings = setCullSettings;
            var cull = new CullVisitor();
            var rs = new RenderStage();
            var sg = new StateGraph();
            cull.popProjectionMatrix = popProjectionMatrix;
            cull.setRenderStage(rs);
            cull.setStateGraph(sg);

            cull.pushProjectionMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());

            camera0.accept(cull);
            var supposedProjection = [
                1.299038105676658,
                0,
                0,
                0,
                0,
                1.7320508075688774,
                0,
                0,
                0,
                0,
                -1.9423076923076918,
                -1,
                0,
                0,
                -14.417307692307686,
                0
            ];
            assert.isOk(
                mockup.checkNear(stack[1][0], 5),
                'near should be 5.0 and is ' + stack[1][0]
            );
            assert.isOk(
                mockup.checkNear(stack[1][1], 15),
                'near should be 15.0 and is ' + stack[1][1]
            );
            assert.isOk(
                mockup.checkNear(resultProjection, supposedProjection, 1e-3),
                'check projection matrix [' +
                    resultProjection.toString() +
                    '] [' +
                    supposedProjection.toString() +
                    ']'
            );
        })();

        // check the computation of nearfar with camera in position that it reverses near far
        (function() {
            var camera0 = new Camera();

            var mt = new MatrixTransform();
            mat4.fromTranslation(mt.getMatrix(), [0, 0, 10]);
            var geom = Shape.createTexturedQuadGeometry(-5.0, -5, 0, 10, 0, 0, 0, 10, 0, 1, 1);
            mt.addChild(geom);
            camera0.addChild(mt);

            mat4.lookAt(camera0.getViewMatrix(), [0, 0, 20], [0, 0, 10], [0, 1, 0]);
            mat4.perspective(
                camera0.getProjectionMatrix(),
                Math.PI / 180 * 60,
                800 / 600,
                1.0,
                1000.0
            );

            var stack = [];

            var setCullSettings = function(settings) {
                if (this._computedNear !== undefined) {
                    stack.push([this._computedNear, this._computedFar]);
                }
                CullSettings.prototype.setCullSettings.call(this, settings);
            };
            CullVisitor.prototype.setCullSettings = setCullSettings;

            var resultProjection;

            var popProjectionMatrix = function() {
                resultProjection = this.getCurrentProjectionMatrix();
                CullVisitor.prototype.popProjectionMatrix.call(this);
            };

            var supposedProjection = [
                1.299038105676658,
                0,
                0,
                0,
                0,
                1.7320508075688774,
                0,
                0,
                0,
                0,
                -49.999750101250868,
                -1,
                0,
                0,
                -499.79750101250352,
                0
            ];
            var cull = new CullVisitor();
            var rs = new RenderStage();
            var sg = new StateGraph();
            cull.popProjectionMatrix = popProjectionMatrix;
            cull.setRenderStage(rs);
            cull.setStateGraph(sg);

            cull.pushProjectionMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());

            camera0.accept(cull);
            assert.isOk(
                mockup.checkNear(stack[1][0], 10),
                'near should be 10 and is ' + stack[1][0]
            );
            assert.isOk(
                mockup.checkNear(stack[1][1], 10),
                'near should be 10 and is ' + stack[1][1]
            );
            assert.isOk(
                mockup.checkNear(resultProjection, supposedProjection, 1e-3),
                'check projection matrix [' +
                    resultProjection.toString() +
                    '] [' +
                    supposedProjection.toString() +
                    ']'
            );
        })();

        (function() {
            var camera0 = new Camera();

            var geom = Shape.createTexturedQuadGeometry(-5.0, -5, 0, 10, 0, 0, 0, 10, 0, 1, 1);
            geom.getBoundingBox = function() {
                var bb = new BoundingBox();
                bb._min = [-6131940, -6297390, -6356750];
                bb._max = [6353000, 6326310, 6317430];
                return bb;
            };
            camera0.addChild(geom);

            var eye = [-8050356.805171473, 5038241.363464848, 5364184.10053209];
            var target = [110530, 14460, -19660];

            //        var dFar = 15715646.446620844;
            //        var dNear = 6098715.042224069;

            //var matrixOffset = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 9520443.940837447, 0, 0, 0, -9539501.699646605, 1];
            // var projectionResult = [
            //      0.9742785792574936, 0, 0, 0,
            //      0, 1.7320508075688774, 0, 0,
            //      0, 0, -2.1890203449875116, -1,
            //      0, 0, -19059947.8295044, 0];

            // osg
            //      var projectionResult = [0.9742785792574936, 0, 0, 0, 0, 1.7320508075688774, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -2.0020020020020022, 0]

            var dFar = 21546781.95939;
            var dNear = 267579.84430311248;
            //      var bbmax = [6353000, 6326310, 6317430];
            //      var bbmin = [-6131940, -6297390, -6356750];
            //      var bbCornerFar = 1;
            //      var bbCornerNear = 6;

            mat4.lookAt(camera0.getViewMatrix(), vec3.add(vec3.create(), eye, target), target, [
                0,
                0,
                1
            ]);
            mat4.perspective(
                camera0.getProjectionMatrix(),
                Math.PI / 180 * 60,
                800 / 450,
                1.0,
                1000.0
            );

            var stack = [];

            var setCullSettings = function(settings) {
                if (this._computedNear !== undefined) {
                    stack.push([this._computedNear, this._computedFar]);
                }
                CullSettings.prototype.setCullSettings.call(this, settings);
            };
            CullVisitor.prototype.setCullSettings = setCullSettings;

            var resultProjection;

            var popProjectionMatrix = function() {
                resultProjection = this.getCurrentProjectionMatrix();
                CullVisitor.prototype.popProjectionMatrix.call(this);
            };

            var supposedProjection = [
                0.97427857925749362,
                0,
                0,
                0,
                0,
                1.7320508075688774,
                0,
                0,
                0,
                0,
                -1.0241512629639544,
                -1,
                0,
                0,
                -530789.63819638337,
                0
            ];
            var cull = new CullVisitor();
            var rs = new RenderStage();
            var sg = new StateGraph();
            cull.popProjectionMatrix = popProjectionMatrix;
            cull.setRenderStage(rs);
            cull.setStateGraph(sg);

            cull.pushProjectionMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());

            camera0.accept(cull);
            assert.isOk(
                mockup.checkNear(stack[1][0], dNear, 1.0),
                'near should be ' + dNear + ' and is ' + stack[1][0]
            );
            assert.isOk(
                mockup.checkNear(stack[1][1], dFar, 1.0),
                'near should be ' + dFar + ' and is ' + stack[1][1]
            );
            assert.isOk(
                mockup.checkNear(resultProjection, supposedProjection, 1.0),
                'check projection matrix [' +
                    resultProjection.toString() +
                    '] [' +
                    supposedProjection.toString() +
                    ']'
            );
        })();

        (function() {
            var q = Shape.createTexturedBoxGeometry(0, 0, 0, 1, 1, 1);

            var node3 = new MatrixTransform();
            mat4.fromTranslation(node3.getMatrix(), [0, 0, 20]);
            node3.getOrCreateStateSet().setRenderBinDetails(1, '');
            node3.getOrCreateStateSet().setName('Node3');
            node3.addChild(q);

            var node0 = new MatrixTransform();
            mat4.fromTranslation(node0.getMatrix(), [0, 0, -10]);
            node0.getOrCreateStateSet().setRenderBinDetails(0, 'DepthSortedBin');
            node0.getOrCreateStateSet().setName('Node0');
            node0.addChild(q);

            var node1 = new MatrixTransform();
            mat4.fromTranslation(node1.getMatrix(), [0, 0, 5]);
            node1.getOrCreateStateSet().setName('Node1');
            node1.addChild(q);

            var node2 = new MatrixTransform();
            mat4.fromTranslation(node2.getMatrix(), [0, 0, -20]);
            node2.getOrCreateStateSet().setRenderBinDetails(0, 'RenderBin');
            node2.getOrCreateStateSet().setName('Node2');
            node2.addChild(q);

            node3.addChild(node0);
            node0.addChild(node1);
            node1.addChild(node2);

            var cull = new CullVisitor();
            var rs = new RenderStage();
            var sg = new StateGraph();
            cull.pushProjectionMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.setRenderStage(rs);
            cull.setStateGraph(sg);
            cull.setComputeNearFar(false);

            node3.accept(cull);
            rs.sort();

            assert.isOk(rs._bins.getMap()['0']._leafs[2]._depth === -15, 'Check depth of leaf 0');
            assert.isOk(rs._bins.getMap()['0']._leafs[1]._depth === -10, 'Check depth of leaf 1');
            assert.isOk(rs._bins.getMap()['0']._leafs[0]._depth === 5, 'Check depth of leaf 2');
            assert.isOk(
                rs._bins.getMap()['0']._sortMode === RenderBin.SORT_BACK_TO_FRONT,
                'Check RenderBin sort mode'
            );
        })();

        (function() {
            var q = Shape.createTexturedBoxGeometry(0, 0, 0, 1, 1, 1);

            var node0 = new MatrixTransform();
            mat4.fromTranslation(node0.getMatrix(), [0, 0, -10]);
            node0.getOrCreateStateSet().setRenderingHint('OPAQUE_BIN');
            node0.getOrCreateStateSet().setName('Node0');
            node0.addChild(q);

            var node1 = new MatrixTransform();
            mat4.fromTranslation(node1.getMatrix(), [0, 0, 5]);
            node0.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
            node1.getOrCreateStateSet().setName('Node1');
            node1.addChild(q);

            var root = new Node();
            root.addChild(node1);
            root.addChild(node0);

            var canvas = mockup.createCanvas();
            var viewer = new mockup.Viewer(canvas);
            viewer.init();
            viewer.frame();
            var cull = viewer.getCamera().getRenderer()._cullVisitor;
            //var cull = new CullVisitor();
            var rs = new RenderStage();
            var sg = new StateGraph();
            cull.pushProjectionMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.setRenderStage(rs);
            cull.setStateGraph(sg);
            cull.setComputeNearFar(false);

            root.accept(cull);
            rs.sort();

            assert.isOk(rs._bins.getMap()['10']._leafs[0]._depth === 10, 'Check transparent bin');
            var binMap = rs._bins.getMap();
            assert.isOk(
                binMap[10].getStateGraphList().getLength() === 0,
                'Check transparent bin StateGraphList'
            );
            assert.isOk(rs._leafs.length === 0, 'Check leafs for normal rendering bin');
            assert.isOk(
                rs.getStateGraphList().getLength() === 1,
                'Check StateGraphList for normal rendering bin'
            );
            mockup.removeCanvas(canvas);
        })();

        (function() {
            var canvas = mockup.createCanvas();
            var viewer = new mockup.Viewer(canvas);
            viewer.init();
            viewer.frame();
            var cull = viewer.getCamera().getRenderer()._cullVisitor;
            var q = Shape.createTexturedBoxGeometry(0, 0, 0, 1, 1, 1);

            var node0 = new MatrixTransform();
            mat4.fromTranslation(node0.getMatrix(), [0, 0, -10]);
            node0.getOrCreateStateSet().setRenderingHint('OPAQUE_BIN');
            node0.getOrCreateStateSet().setName('Node0');
            node0.addChild(q);

            var node1 = new MatrixTransform();
            mat4.fromTranslation(node1.getMatrix(), [0, 0, 5]);
            node0.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
            node1.getOrCreateStateSet().setName('Node1');
            node1.addChild(q);

            var root = new Node();
            root.addChild(node1);
            root.addChild(node0);

            //var cull = new CullVisitor();
            var rs = new RenderStage();
            var sg = new StateGraph();
            rs.setViewport(new Viewport());
            cull.pushProjectionMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.pushModelViewMatrix(mat4.create());
            cull.setRenderStage(rs);
            cull.setStateGraph(sg);
            cull.setComputeNearFar(false);

            root.accept(cull);
            rs.sort();

            var state = new State(new ShaderGeneratorProxy());
            var fakeRenderer = mockup.createFakeRenderer();
            fakeRenderer.validateProgram = function() {
                return true;
            };
            fakeRenderer.getProgramParameter = function() {
                return true;
            };
            fakeRenderer.isContextLost = function() {
                return false;
            };
            state.setGraphicContext(fakeRenderer);

            rs.draw(state);
        })();

        (function() {
            var getFirstPositionedAttribute = function(renderStage) {
                return renderStage.getPositionedAttribute().getArray()[0][0];
            };
            var canvas = mockup.createCanvas();
            var viewer = new mockup.Viewer(canvas);
            viewer.init();

            viewer.frame();
            var cull = viewer.getCamera().getRenderer()._cullVisitor;
            var m = getFirstPositionedAttribute(cull._currentRenderBin.getStage());
            // Test for HeadLight, matrix should be identity
            assert.equalVector(m, [1, 0, -0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            // Test for Sky_Light, matrix != identity
            viewer.setLightingMode(View.LightingMode.SKY_LIGHT);
            viewer.frame();
            m = getFirstPositionedAttribute(cull._currentRenderBin.getStage());
            assert.equalVector(m, [-1, 0, -0, 0, 0, 1, -0, 0, 0, -0, -1, 0, 0, 0, -10, 1]);

            mockup.removeCanvas(canvas);
        })();

        (function() {
            var canvas = mockup.createCanvas();
            var viewer = new mockup.Viewer(canvas, {
                enableFrustumCulling: true
            });

            var scene = new Node();
            var mat = mat4.create();
            var mt = new MatrixTransform();
            var quad = Shape.createTexturedQuadGeometry(-0.5, -0.5, 0, 1, 0, 0, 0, 1, 0, 1, 1);
            mt.setMatrix(mat);
            mt.addChild(quad);
            scene.addChild(mt);
            viewer.setSceneData(scene);
            viewer.init();
            viewer._updateVisitor.setFrameStamp(viewer.getFrameStamp());
            viewer.updateTraversal();

            // test done inside Camera cullcallback
            // to get all context
            var fb = function() {};
            fb.prototype = {
                cull: function(cam, cull) {
                    cull.nodePath = [];
                    cull.nodePath.push(scene);
                    cull.nodePath.push(mt);
                    //  push the nodepath, simulating a scene traversal.
                    var culled = cull.isCulled(quad, cull.nodePath);
                    assert.isOk(culled === false, 'scene should not be culled');
                    return false;
                }
            };
            //Get the cullVisitor in context
            viewer.getCamera().setCullCallback(new fb());
            viewer._updateVisitor.setFrameStamp(viewer.getFrameStamp());
            viewer.updateTraversal();
            // traverse so that it Build the frustum planes and cullsettings to check against them
            viewer.renderingTraversal();

            // TEST2
            mat4.setTranslation(mat, [200, 0, 0]);
            mt.setMatrix(mat); // dirty Bounds

            // test done inside Camera cullcallback
            // to get all context
            var fb2 = function() {};
            fb2.prototype = {
                cull: function(cam, cull) {
                    cull.nodePath = [];
                    cull.nodePath.push(scene);
                    cull.nodePath.push(mt);
                    // Translate outside of the frustum, scene should be culled now
                    var culled = cull.isCulled(quad, cull.nodePath);
                    assert.isOk(culled === true, 'scene should be culled');

                    return false;
                }
            };
            //Get the cullVisitor in context
            viewer.getCamera().setCullCallback(new fb2());
            viewer._updateVisitor.setFrameStamp(viewer.getFrameStamp());
            viewer.updateTraversal();
            // traverse so that it Build the frustum planes and cullsettings to check against them
            viewer.renderingTraversal();

            // test3
            mat4.fromScaling(mat, [500, 0, 0]);
            mat4.setTranslation(mat, [200, 0, 0]);
            mt.setMatrix(mat); // dirty Bounds

            // test done inside Camera cullcallback
            // to get all context
            var fb3 = function() {};
            fb3.prototype = {
                cull: function(cam, cull) {
                    cull.nodePath = [];
                    cull.nodePath.push(scene);
                    cull.nodePath.push(mt);
                    // Translate outside of the frustum and scale, node should not be culled now
                    var culled = cull.isCulled(quad, cull.nodePath);
                    assert.isOk(culled === false, 'scene should not be culled');
                    return false;
                }
            };
            //Get the cullVisitor in context
            viewer.getCamera().setCullCallback(new fb3());
            viewer._updateVisitor.setFrameStamp(viewer.getFrameStamp());
            viewer.updateTraversal();
            // traverse so that it Build the frustum planes and cullsettings to check against them
            viewer.renderingTraversal();

            // tests finished
            mockup.removeCanvas(canvas);
        })();
    });

    test('CullVisitor World/View matrix', function() {
        var checkLeaf = function(leaf) {
            var tmp = mat4.create();
            mat4.mul(tmp, leaf._view, leaf._model);

            assert.equalVector(tmp, leaf._modelView);
            //assert.isOk( mockup.checkNear( tmp, leaf.modelview ), 'View * World === ModelView' );
        };

        var q = Shape.createTexturedBoxGeometry(0, 0, 0, 1, 1, 1);

        var node4 = new Node();
        var node5 = new Node();
        node4.addChild(node5);
        var camera4 = new Camera();
        camera4.setReferenceFrame(TransformEnums.ABSOLUTE_RF);
        mat4.lookAt(camera4.getViewMatrix(), [0, 20, 10], [0, 2, 0], [0, 0, 1]);
        node5.addChild(camera4);
        var node6 = new MatrixTransform();
        mat4.fromTranslation(node6.getMatrix(), [0, 0, -10]);
        camera4.addChild(node6);
        node6.addChild(q);

        var node0 = new MatrixTransform();
        mat4.fromTranslation(node0.getMatrix(), [0, 0, -10]);
        node0.getOrCreateStateSet().setName('Node0');
        node0.addChild(q);

        var node1 = new MatrixTransform();
        mat4.fromTranslation(node1.getMatrix(), [0, 0, 5]);
        node1.getOrCreateStateSet().setName('Node1');
        node1.addChild(q);

        var camera0 = new Camera();
        var node2 = new MatrixTransform();
        mat4.fromTranslation(node1.getMatrix(), [0, 0, 5]);
        camera0.addChild(node2);
        node2.addChild(q);

        var camera1 = new Camera();
        camera1.setReferenceFrame(TransformEnums.ABSOLUTE_RF);
        mat4.lookAt(camera1.getViewMatrix(), [0, 0, 0], [0, 2, 0], [0, 0, 1]);
        var node3 = new MatrixTransform();
        mat4.fromTranslation(node3.getMatrix(), [0, 0, 5]);
        camera1.addChild(node3);
        node3.addChild(q);

        var root = new Node();
        root.addChild(node4);
        root.addChild(node1);
        root.addChild(camera0);
        root.addChild(node0);
        root.addChild(camera1);

        var cull = new CullVisitor();
        var rs = new RenderStage();
        var sg = new StateGraph();
        rs.setViewport(new Viewport());
        cull.pushProjectionMatrix(mat4.create());
        cull.pushModelViewMatrix(mat4.create());
        cull.pushModelViewMatrix(mat4.create());
        cull.setRenderStage(rs);
        cull.setStateGraph(sg);
        cull.setComputeNearFar(false);

        root.accept(cull);

        assert.isOk(cull._pooledLeaf.getLength() > 1, 'check we have leaf to validate this test');
        cull._pooledLeaf.forEach(checkLeaf);
        // for (var i = 0; i < cull._pooledLeaf.getLength() - 1; i++) {
        //     checkLeaf(cull._pooledLeaf._pool[i]);
        // }
    });
}
