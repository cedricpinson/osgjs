


test("osgUtil_TriangleIntersect", function() {

    var checkPrimitive = function(geom, msg) {
        var ti = new osgUtil.TriangleIntersect();
        var start = [0.4,0.4, -2.0];
        var end = [0.4,0.4, 0.5];
        var dir = osg.Vec3.sub(end,start, []);
        ti.set(start, end);
        
        ti.apply(geom);
        ok(ti.hits.length === 1, msg + " Hits should be 1 and result is " + ti.hits.length );
        var result = [ 0.4, 0.4, 0];
        var found = osg.Vec3.add(start, 
                                 osg.Vec3.mult(dir, ti.hits[0].ratio, []), 
                                 []);
        near(found, result, 1e-4);

        var ti2 = new osgUtil.TriangleIntersect();
        ti2.set([1.5,0.4, -0.5], [1.5,0.4, 0.5]);
        ti2.apply(geom);
        ok(ti2.hits.length === 0, msg + " Hits should be 0 " + ti2.hits.length);
    };

    (function() { 
        // triangles
        var quad = osg.createTexturedQuadGeometry(0,0,0, 1,0,0, 0,1,0, 1,1);
        checkPrimitive(quad, "Triangles indexed");
    })();

    (function() { 
        var quad = osg.createTexturedQuad(0,0,0, 1,0,0, 0,1,0, 1,1);

        var indexes = [];
        indexes[0] = 0;
        indexes[1] = 1;
        indexes[2] = 2;
        indexes[3] = 3;

        var primitive = new osg.DrawElements(osg.PrimitiveSet.TRIANGLE_STRIP, new osg.BufferArray(osg.BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ));
        quad.getPrimitives()[0] = primitive;
        checkPrimitive(quad, "TriangleStrip indexed");
    })();


    (function() { 
        var quad = osg.createTexturedQuad(0,0,0, 1,0,0, 0,1,0, 1,1);

        var indexes = [];
        indexes[0] = 0;
        indexes[1] = 1;
        indexes[2] = 2;
        indexes[3] = 3;

        var primitive = new osg.DrawElements(osg.PrimitiveSet.TRIANGLE_FAN, new osg.BufferArray(osg.BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ));
        quad.getPrimitives()[0] = primitive;
        checkPrimitive(quad, "TriangleFan indexed");
    })();


});


test("osgUtil_IntersectVisitor", function() {

    var camera = new osg.Camera();
    camera.setViewport(new osg.Viewport());
    camera.setViewMatrix(osg.Matrix.makeLookAt([0,0,-10], [0,0,0], [0,1,0], []));
    camera.setProjectionMatrix(osg.Matrix.makePerspective(60, 800/600, 0.1, 100.0, []));
    var scene = osg.createTexturedQuad(-0.5, -0.5,0, 1,0,0, 0,1,0, 1,1);

    var iv = new osgUtil.IntersectVisitor();
    iv.pushCamera(camera);
    iv.addLineSegment([400,300,0.0], [400,300,1.0]);
    scene.accept(iv);
    ok(iv.hits.length === 1, "Hits should be 1 and result is " + iv.hits.length );
});

test("osgUtil_IntersectVisitorScene", function() {

    var view = new osgViewer.View();
    view.getCamera().setViewport(new osg.Viewport());
    view.getCamera().setViewMatrix(osg.Matrix.makeLookAt([0,0,-10], [0,0,0], [0,1,0]), []);
    view.getCamera().setProjectionMatrix(osg.Matrix.makePerspective(60, 800/600, 0.1, 100.0, []));
    var quad = osgDB.parseSceneGraph(Scene);
    view.setSceneData(quad);

    var result = view.computeIntersections(400,300);
    //console.log(result);
    ok(result.length === 1, "Hits should be 1 and result is " + result.length );


});
