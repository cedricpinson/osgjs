import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import IntersectionVisitor from 'osgUtil/IntersectionVisitor';
import LineSegmentIntersector from 'osgUtil/LineSegmentIntersector';
import KdTreeBuilder from 'osg/KdTreeBuilder';
import BoundingSphere from 'osg/BoundingSphere';
import Node from 'osg/Node';
import Geometry from 'osg/Geometry';
import BufferArray from 'osg/BufferArray';
import DrawArrays from 'osg/DrawArrays';
import Viewport from 'osg/Viewport';
import primitiveSet from 'osg/primitiveSet';
import { mat4 } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';
import MatrixTransform from 'osg/MatrixTransform';
import Shape from 'osg/shape';
import View from 'osgViewer/View';
import ReaderParser from 'osgDB/readerParser';

export default function() {
    test('LineSegmentIntersector simple test', function() {
        var lsi = new LineSegmentIntersector();
        var bs = new BoundingSphere();
        bs.set(vec3.fromValues(4.0, 2.0, 0.0), 2.0);

        // start right on the edge
        lsi.set(vec3.fromValues(2.0, 2.0, 0.0), vec3.fromValues(-1.0, 2.0, 0.0));
        lsi.setCurrentTransformation(mat4.create());
        assert.isOk(lsi.intersectBoundingSphere(bs), 'hit success');

        // end right on edge
        lsi.set(vec3.fromValues(2.0, 0.0, 0.0), vec3.fromValues(4.0, 0.0, 0.0));
        lsi.setCurrentTransformation(mat4.create());
        assert.isOk(lsi.intersectBoundingSphere(bs), 'hit success');

        // line right on edge
        lsi.set(vec3.fromValues(2.0, 0.0, 0.0), vec3.fromValues(4.0, 0.0, 0.0));
        lsi.setCurrentTransformation(mat4.create());
        assert.isOk(lsi.intersectBoundingSphere(bs), 'hit success');

        lsi.set(vec3.fromValues(2.0, 0.0, 0.0), vec3.fromValues(3.0, 1.0, 0.0));
        lsi.setCurrentTransformation(mat4.create());
        assert.isOk(lsi.intersectBoundingSphere(bs), 'hit success');

        lsi.set(vec3.fromValues(0.0, 2.0, 0.0), vec3.fromValues(1.9, 2.0, 0.0));
        lsi.setCurrentTransformation(mat4.create());
        assert.isOk(!lsi.intersectBoundingSphere(bs), 'hit failed');

        lsi.set(vec3.fromValues(0.0, 2.0, 0.0), vec3.fromValues(2.1, 2.0, 0.0));
        lsi.setCurrentTransformation(mat4.create());
        assert.isOk(lsi.intersectBoundingSphere(bs), 'hit success');

        lsi.set(vec3.fromValues(5.0, 1.0, 0.0), vec3.fromValues(6.0, 0.0, 0.0));
        lsi.setCurrentTransformation(mat4.create());
        assert.isOk(lsi.intersectBoundingSphere(bs), 'hit success');

        lsi.set(vec3.fromValues(1.0, 1.0, 0.0), vec3.fromValues(2.0, 3.0, 0.0));
        lsi.setCurrentTransformation(mat4.create());
        assert.isOk(!lsi.intersectBoundingSphere(bs), 'hit failed');
    });

    // quad center at (0, 0, 0) with dege 0.5
    // lines is grid with same center and 6 lines
    // points are : one in (0, 0, 0) and the other on picking path
    // picking is (0.1, 0.3, -0.5/+0.5) with threshold 0.15

    var createSceneGeometry = function() {
        var scene = new Node();
        var cx, cy, cz, wx, wy, wz, hx, hy, hz;
        cx = cy = -0.5;
        wx = hy = 1.0;
        cz = wy = wz = hx = hz = 0.0;
        var tris = Shape.createTexturedQuadGeometry(cx, cy, cz, wx, wy, wz, hx, hy, hz, 1.0, 1.0);
        var lines = Shape.createGridGeometry(cx, cy, cz, wx, wy, wz, hx, hy, hz, 1, 1);

        var points = new Geometry();
        var pverts = new Float32Array([0.0, 0.0, 0.0, 0.1, 0.3, 0.0]);
        points.getAttributes().Vertex = new BufferArray(BufferArray.ARRAY_BUFFER, pverts, 3);
        points.getPrimitives().push(new DrawArrays(primitiveSet.POINTS, 0, 2));

        scene.addChild(tris);
        scene.addChild(lines);
        scene.addChild(points);

        return scene;
    };

    test('LineSegmentIntersector with 2 branches', function() {
        // right branch should be picked
        // left branch shouldn't be picked
        //
        //  scene
        //   |
        //  tr1 (5 0 0)
        //   |  \
        //   |  tr2 (-5 0 0)
        //   |  /
        // scene geom

        var rootScene = new Node();
        var sceneGeom = createSceneGeometry();

        var tr1 = new MatrixTransform();
        mat4.fromTranslation(tr1.getMatrix(), [5.0, 0.0, 0.0]);

        var tr2 = new MatrixTransform();
        mat4.fromTranslation(tr2.getMatrix(), [-5.0, 0.0, 0.0]);

        rootScene.addChild(tr1);
        tr1.addChild(sceneGeom);
        tr1.addChild(tr2);
        tr2.addChild(sceneGeom);

        var lsi = new LineSegmentIntersector();
        lsi.set(vec3.fromValues(0.1, 0.3, -0.5), vec3.fromValues(0.1, 0.3, 0.5), 0.15);
        var iv = new IntersectionVisitor();
        iv.setIntersector(lsi);

        var testPick = function() {
            lsi.reset();
            iv.reset();
            rootScene.accept(iv);

            var inters = lsi._intersections;
            assert.isOk(inters.length === 3, 'Hits should be 3 and result is ' + inters.length);

            var npath = inters[0]._nodePath;
            assert.isOk(npath.length === 5, 'NodePath should be 5 and result is ' + npath.length);

            var points = [];
            var triangles = [];
            var lines = [];
            for (var i = 0; i < inters.length; ++i) {
                var int = inters[i];
                if (int._i3 >= 0) triangles.push(int);
                else if (int._i2 >= 0) lines.push(int);
                else if (int._i1 >= 0) points.push(int);
            }

            var one = points.length === 1 && lines.length === 1 && triangles.length === 1;
            assert.isOk(one, 'Check pick primitive');

            assert.equalVector(points[0]._localIntersectionPoint, [0.1, 0.3, 0]);
            assert.equalVector(lines[0]._localIntersectionPoint, [0.1, 0.3, 0]);
            assert.equalVector(triangles[0]._localIntersectionPoint, [0.1, 0.3, 0]);
        };

        testPick();

        // with kd tree
        var treeBuilder = new KdTreeBuilder({ _targetNumTrianglesPerLeaf: 0 });
        treeBuilder.apply(rootScene);

        testPick();
    });

    test('LineSegmentIntersector with mockup scene and computeIntersections', function() {
        var view = new View();
        var camera = view.getCamera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(
            mat4.lookAt(
                mat4.create(),
                vec3.fromValues(0.0, 0.0, -10),
                vec3.create(),
                vec3.fromValues(0.0, 1.0, 0.0)
            )
        );
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 1000.0)
        );

        // TODO it uses the old sync parseSceneGraphDeprecated
        var scene = ReaderParser.parseSceneGraph(mockup.getScene());
        view.setSceneData(scene);

        // no kd tree
        var result = view.computeIntersections(400, 300);
        assert.isOk(result.length === 1, 'Hits should be 1 and result is ' + result.length);

        // with kd tree
        var treeBuilder = new KdTreeBuilder({ _targetNumTrianglesPerLeaf: 0 });
        treeBuilder.apply(scene);

        result = view.computeIntersections(400, 300);
        assert.isOk(result.length === 1, 'Hits should be 1 and result is ' + result.length);
    });
}
