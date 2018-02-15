import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import Shape from 'osg/shape';


export default function() {
    var canvas;
    var viewer;

    beforeEach(function () {
        canvas = mockup.createCanvas();
        viewer = new mockup.Viewer(canvas);
    });

    afterEach(function () {
        mockup.removeCanvas(canvas);
        viewer.getInputManager().cleanup();
    });
    test('Viewer', function() {


        (function() {
            assert.isOk(viewer.getCamera() !== undefined, 'Check camera creation');
            assert.isOk(viewer.getCamera().getViewport() !== undefined, 'Check camera viewport');
            assert.isOk(viewer.getCamera().getRenderer() !== undefined, 'Check camera Renderer');

            viewer.init();
            assert.isOk(viewer._updateVisitor !== undefined, 'Check update visitor');
            assert.isOk(
                viewer.getState().getGraphicContext() !== undefined,
                'Check state graphic context'
            );
        })();

        (function() {

            var createScene = function() {
                return Shape.createTexturedBoxGeometry(0, 0, 0, 10, 10, 10);
            };
            viewer.init();
            viewer.setupManipulator();

            viewer.setSceneData(createScene());
            viewer.getCamera().getRenderer().draw = function() {}; // do nothing
            viewer.frame();

            var cullvisitor = viewer
                .getCamera()
                .getRenderer()
                .getCullVisitor();
            // with auto compute near far
            assert.approximately(cullvisitor._computedFar, 31.30036755335, 1e-5, 'check far');
            assert.approximately(cullvisitor._computedNear, 18.6996324495, 1e-5, 'check near');

            cullvisitor.reset();
            assert.equal(
                cullvisitor._computedNear,
                Number.POSITIVE_INFINITY,
                'Check near after reset'
            );
            assert.equal(
                cullvisitor._computedFar,
                Number.NEGATIVE_INFINITY,
                'Check far after reset'
            );
        })();

        // test device
        (function() {

            var mouseInput = viewer.getInputManager().getInputSource('Mouse');
            var keyboardInput = viewer.getInputManager().getInputSource('Keyboard');

            assert.notEqual(mouseInput, undefined, 'detected mouse');
            assert.notEqual(keyboardInput, undefined, 'detected keyboard');

        })();

        // test context lost
        (function() {

            viewer.setContextLostCallback(function() {
                assert.isOk(true, 'detected contextLost Lost');
            });

            window.cancelAnimationFrame = function() {
                assert.isOk(true, 'context lost does cancel render loop');
            };

            viewer.init();

            var createScene = function() {
                return Shape.createTexturedBoxGeometry(0, 0, 0, 10, 10, 10);
            };
            viewer.setupManipulator();
            viewer.setSceneData(createScene());
            viewer.getCamera().getRenderer().draw = function() {}; // do nothing

            var renderCount = 0;

            viewer.beginFrame = function() {
                renderCount++;
            };

            viewer.setDone(false);
            viewer.requestRedraw();
            viewer.frame();

            viewer.contextLost();

            viewer.frame();
            assert.isOk(renderCount === 1, 'no render after context Lost');
        })();
    });
}
