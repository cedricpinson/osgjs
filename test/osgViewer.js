module("osgViewer");

test("Viewer", function() {
    (function() {
        var canvas = createCanvas();
        var viewer = new osgViewer.Viewer(canvas);
        ok(viewer.getCamera() !== undefined, "Check camera creation");
        ok(viewer.getCamera().getViewport() !== undefined, "Check camera viewport");

        viewer.init();
        ok(viewer._updateVisitor !== undefined, "Check update visitor");
        ok(viewer._cullVisitor !== undefined, "Check cull visitor");
        ok(viewer._state !== undefined, "Check state");
        ok(viewer.getState().getGraphicContext() !== undefined, "Check state graphic context");
        removeCanvas(canvas);
    })();


    (function() {
        var canvas = createCanvas();
        var viewer = new osgViewer.Viewer(canvas);
        var createScene = function() {
            return osg.createTexturedBoxGeometry(0,0,0,
                                                 10, 10, 10);
        };
        viewer.init();
        viewer.setupManipulator();
        
        viewer.setSceneData(createScene());
        viewer.frame();
        
        osg.log(viewer.getCamera().getProjectionMatrix());
        // without auto compute near far
        // [1.7320508075688774, 0, 0, 0, 0, 1.7320508075688774, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -2.002002002002002, 0]

        // with auto compute near far
        ok(check_near(viewer.getCamera().getProjectionMatrix(), [0.8660254037844387, 0, 0, 0, 0, 1.7320508075688774, 0, 0, 0, 0, -3.6948013697711914, -1, 0, 0, -86.03523882425281, 0]), "check near / far computation");

        viewer._cullVisitor.reset();
        ok(viewer._cullVisitor._computedNear === Number.POSITIVE_INFINITY, "Check near after reset");
        ok(viewer._cullVisitor._computedFar === Number.NEGATIVE_INFINITY, "Check far after reset");

        removeCanvas(canvas);

    })();

});


test("View", function() {
    var gc = 2;
    var view = new osgViewer.View();
    view.setGraphicContext(gc);
    ok(view.getGraphicContext() === 2, "Check graphic context");

    ok(view.getFrameStamp() !== undefined, "Check FrameStamp");

    ok(view.getScene() !== undefined, "Check scene");
    ok(view.getSceneData() === undefined, "Check scene data");
    ok(view.getScene().getStateSet() !== undefined, "Check scene stateset");

});
