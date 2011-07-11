test("osgViewer_Viewer", function() {
    var canvas = document.getElementById('3DView');
    var viewer = new osgViewer.Viewer(canvas);
    ok(viewer.getCamera() !== undefined, "Check camera creation");
    ok(viewer.getCamera().getViewport() !== undefined, "Check camera viewport");

    viewer.init();
    ok(viewer._updateVisitor !== undefined, "Check update visitor");
    ok(viewer._cullVisitor !== undefined, "Check cull visitor");

});