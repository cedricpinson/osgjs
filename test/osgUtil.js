module("osgUtil");

test("TriangleIntersect", function() {

    var checkPrimitive = function(geom, msg) {
        var ti = new osgUtil.TriangleIntersect();
        var start = [0.4,0.2, -2.0];
        var end = [0.4,0.2, 0.5];
        var dir = osg.Vec3.sub(end,start, []);
        ti.set(start, end);
        
        ti.apply(geom);
        ok(ti.hits.length === 1, msg + " Hits should be 1 and result is " + ti.hits.length );
        var result = [ 0.4, 0.2, 0];
        var found = osg.Vec3.add(start, 
                                 osg.Vec3.mult(dir, ti.hits[0].ratio, []), 
                                 []);
        near(found, result, 1e-4);

        var ti2 = new osgUtil.TriangleIntersect();
        ti2.set([1.5,0.2, -0.5], [1.5,0.2, 0.5]);
        ti2.apply(geom);
        ok(ti2.hits.length === 0, msg + " Hits should be 0 " + ti2.hits.length);
    };

    (function() { 
        // triangles
        var quad = osg.createTexturedQuadGeometry(0,0,0, 1,0,0, 0,1,0, 1,1);
        checkPrimitive(quad, "Triangles indexed");
    })();

    (function() {
        var quad = osg.createTexturedQuadGeometry(0,0,0, 1,0,0, 0,1,0, 1,1);

        var indexes = [];
        indexes[0] = 0;
        indexes[1] = 1;
        indexes[2] = 3;
        indexes[3] = 2;

        var primitive = new osg.DrawElements(osg.PrimitiveSet.TRIANGLE_STRIP, new osg.BufferArray(osg.BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ));
        quad.getPrimitives()[0] = primitive;
        checkPrimitive(quad, "TriangleStrip indexed");
    })();


    (function() {
        var quad = osg.createTexturedQuadGeometry(0,0,0, 1,0,0, 0,1,0, 1,1);

        var indexes = [];
        indexes[0] = 0;
        indexes[1] = 1;
        indexes[2] = 2;
        indexes[3] = 3;

        var primitive = new osg.DrawElements(osg.PrimitiveSet.TRIANGLE_FAN, new osg.BufferArray(osg.BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ));
        quad.getPrimitives()[0] = primitive;
        checkPrimitive(quad, "TriangleFan indexed");
    })();


    (function() {
        var cornerx = 0, cornery = 0, cornerz = 0;
        var wx = 1, wy = 0, wz = 0;
        var hx = 0, hy = 1, hz = 0;
        var quad = new osg.Geometry();

        var vertexes = [];
        vertexes[0] = cornerx + hx;
        vertexes[1] = cornery + hy;
        vertexes[2] = cornerz + hz;

        vertexes[3] = cornerx;
        vertexes[4] = cornery;
        vertexes[5] = cornerz;

        vertexes[6] = cornerx + wx;
        vertexes[7] = cornery + wy;
        vertexes[8] = cornerz + wz;

        vertexes[9] = cornerx + hx;
        vertexes[10] = cornery + hy;
        vertexes[11] = cornerz + hz;

        vertexes[12] = cornerx + wx;
        vertexes[13] = cornery + wy;
        vertexes[14] = cornerz + wz;

        vertexes[15] =  cornerx + wx + hx;
        vertexes[16] = cornery + wy + hy;
        vertexes[17] = cornerz + wz + hz;

        quad.getAttributes().Vertex = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, vertexes, 3 );
        var primitive = new osg.DrawArrays(osg.PrimitiveSet.TRIANGLES, 0, 6);
        quad.getPrimitives().push(primitive);
        checkPrimitive(quad, "Triangles not indexed");
    })();


    (function() {
        var cornerx = 0, cornery = 0, cornerz = 0;
        var wx = 1, wy = 0, wz = 0;
        var hx = 0, hy = 1, hz = 0;
        var quad = new osg.Geometry();

        var vertexes = [];
        vertexes[0] = cornerx + hx;
        vertexes[1] = cornery + hy;
        vertexes[2] = cornerz + hz;

        vertexes[3] = cornerx;
        vertexes[4] = cornery;
        vertexes[5] = cornerz;

        vertexes[6] =  cornerx + wx + hx;
        vertexes[7] = cornery + wy + hy;
        vertexes[8] = cornerz + wz + hz;

        vertexes[9] = cornerx + wx;
        vertexes[10] = cornery + wy;
        vertexes[11] = cornerz + wz;

        quad.getAttributes().Vertex = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, vertexes, 3 );
        var primitive = new osg.DrawArrays(osg.PrimitiveSet.TRIANGLE_STRIP, 0, 4);
        quad.getPrimitives().push(primitive);
        checkPrimitive(quad, "TriangleStrip not indexed");
    })();

    (function() {
        var cornerx = 0, cornery = 0, cornerz = 0;
        var wx = 1, wy = 0, wz = 0;
        var hx = 0, hy = 1, hz = 0;
        var quad = new osg.Geometry();

        var vertexes = [];
        vertexes[0] = cornerx + hx;
        vertexes[1] = cornery + hy;
        vertexes[2] = cornerz + hz;

        vertexes[3] = cornerx;
        vertexes[4] = cornery;
        vertexes[5] = cornerz;

        vertexes[6] = cornerx + wx;
        vertexes[7] = cornery + wy;
        vertexes[8] = cornerz + wz;

        vertexes[9] =  cornerx + wx + hx;
        vertexes[10] = cornery + wy + hy;
        vertexes[11] = cornerz + wz + hz;

        quad.getAttributes().Vertex = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, vertexes, 3 );
        var primitive = new osg.DrawArrays(osg.PrimitiveSet.TRIANGLE_FAN, 0, 4);
        quad.getPrimitives().push(primitive);
        checkPrimitive(quad, "TriangleFan not indexed");
    })();

});


test("IntersectVisitor", function() {

    var camera = new osg.Camera();
    camera.setViewport(new osg.Viewport());
    camera.setViewMatrix(osg.Matrix.makeLookAt([0,0,-10], [0,0,0], [0,1,0], []));
    camera.setProjectionMatrix(osg.Matrix.makePerspective(60, 800/600, 0.1, 100.0, []));
    var scene = osg.createTexturedQuadGeometry(-0.5, -0.5,0, 1,0,0, 0,1,0, 1,1);

    var iv = new osgUtil.IntersectVisitor();
    iv.pushCamera(camera);
    iv.addLineSegment([400,300,0.0], [400,300,1.0]);
    scene.accept(iv);
    ok(iv.hits.length === 1, "Hits should be 1 and result is " + iv.hits.length );
    ok(iv.hits[0].nodepath.length === 1, "NodePath should be 1 and result is " + iv.hits[0].nodepath.length );

});

asyncTest("IntersectVisitorScene", function() {

    var view = new osgViewer.View();
    view.getCamera().setViewport(new osg.Viewport());
    view.getCamera().setViewMatrix(osg.Matrix.makeLookAt([0,0,-10], [0,0,0], [0,1,0]), []);
    view.getCamera().setProjectionMatrix(osg.Matrix.makePerspective(60, 800/600, 0.1, 100.0, []));
    var promise = osgDB.parseSceneGraph(getScene());
    osgDB.Promise.when(promise).then( function (quad) {
        view.setSceneData(quad);

        var result = view.computeIntersections(400,300);
        //console.log(result);
        ok(result.length === 1, "Hits should be 1 and result is " + result.length );
        start();
    });
});
