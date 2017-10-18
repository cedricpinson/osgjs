import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import IntersectionVisitor from 'osgUtil/IntersectionVisitor';
import SphereIntersector from 'osgUtil/SphereIntersector';
import KdTreeBuilder from 'osg/KdTreeBuilder';
import BoundingSphere from 'osg/BoundingSphere';
import Node from 'osg/Node';
import Geometry from 'osg/Geometry';
import BufferArray from 'osg/BufferArray';
import DrawArrays from 'osg/DrawArrays';
import primitiveSet from 'osg/primitiveSet';
import { mat4 } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';
import MatrixTransform from 'osg/MatrixTransform';
import Shape from 'osg/shape';
import ReaderParser from 'osgDB/readerParser';

export default function() {
    test('SphereIntersector simple test', function() {
        var spi = new SphereIntersector();
        var bs = new BoundingSphere();
        bs.set(vec3.fromValues(0.0, 0.0, 0.0), 2.0);

        // testing the same sphere
        spi.set(vec3.fromValues(0.0, 0.0, 0.0), 2.0);
        spi.setCurrentTransformation(mat4.create());
        assert.isOk(spi.intersectBoundingSphere(bs), 'hit success');

        // moving a bit also should hit
        spi.set(vec3.fromValues(2.0, 2.0, 0.0), 2.0);
        spi.setCurrentTransformation(mat4.create());
        assert.isOk(spi.intersectBoundingSphere(bs), 'hit success');

        // This should fail
        spi.set(vec3.fromValues(3.0, 3.0, 0.0), 1.0);
        spi.setCurrentTransformation(mat4.create());
        assert.isOk(!spi.intersectBoundingSphere(bs), 'hit failed');
    });

    // quad center at (0, 0, 0) with dege 0.5
    // lines is grid with same center and 6 lines
    // points are : one in (0, 0, 0) and the other on picking path
    // picking is (0.1, 0.3, 0) with radius 0.15

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

    test('SphereIntersector with 2 branches', function() {
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

        var lsi = new SphereIntersector();
        lsi.set(vec3.fromValues(0.1, 0.3, 0.0), 0.15);
        var iv = new IntersectionVisitor();
        iv.setIntersector(lsi);

        var testPick = function() {
            lsi.reset();
            iv.reset();
            rootScene.accept(iv);

            // no kd tree
            var inters = lsi._intersections;
            assert.isOk(inters.length === 3, 'Hits should be 3 and result is ' + inters.length);

            var npath = inters[0]._nodePath;
            assert.isOk(npath.length === 5, 'NodePath should be 5 and result is ' + npath.length);

            var prims = { point: 0, line: 0, triangle: 0 };
            for (var i = 0; i < inters.length; ++i) {
                if (inters[i]._i3 >= 0) prims.triangle++;
                else if (inters[i]._i2 >= 0) prims.line++;
                else if (inters[i]._i1 >= 0) prims.point++;
            }

            var one = prims.point === 1 && prims.line === 1 && prims.triangle === 1;
            assert.isOk(one, 'Check pick primitive');
        };

        testPick();

        // with kd tree
        var treeBuilder = new KdTreeBuilder({ _targetNumTrianglesPerLeaf: 0 });
        treeBuilder.apply(rootScene);

        testPick();
    });

    test('SphereIntersector with mockup scene', function() {
        // mockup scene is a sphere centered in 0 with radius ~50
        var rootScene = ReaderParser.parseSceneGraph(mockup.getScene());

        var lsi = new SphereIntersector();
        lsi.set(vec3.fromValues(100, 0, 0), 100.0);
        var iv = new IntersectionVisitor();
        iv.setIntersector(lsi);

        var testPick = function() {
            lsi.reset();
            iv.reset();
            rootScene.accept(iv);

            // no kd tree
            var inters = lsi._intersections;
            assert.isOk(inters.length === 670, 'Hits should be 670 and result is ' + inters.length);

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

            var one = points.length === 0 && lines.length === 0 && triangles.length === 670;
            assert.isOk(one, 'Check pick primitive');
        };

        testPick();

        // with kd tree
        var treeBuilder = new KdTreeBuilder({ _targetNumTrianglesPerLeaf: 0 });
        treeBuilder.apply(rootScene);

        testPick();
    });
}
