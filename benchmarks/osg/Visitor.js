import mockup from 'tests/mockup/mockup';
import { vec3, mat4 } from 'osg/glMatrix';
import Node from 'osg/Node';
import NodeVisitor from 'osg/NodeVisitor';
import Timer from 'osg/Timer';
import reportStats from 'benchmarks/reportStats';
import mockupBench from 'benchmarks/mockupBench';
import KdTreeBuilder from 'osg/KdTreeBuilder';
import Camera from 'osg/Camera';
import Viewport from 'osg/Viewport';
import View from 'osgViewer/View';
import ReaderParser from 'osgDB/readerParser';

export default function() {
    test('NodeVisitor Heavy Static Scene', function() {
        var root = new Node();
        mockupBench.addScene(root, 25, false, false);

        var timed = Timer.instance().tick();

        var visitor = new NodeVisitor();

        console.profile();
        console.time('time');

        var nCount = 20;
        for (var n = 0; n < nCount; n++) {
            visitor.apply(root);
        }

        console.timeEnd('time');
        console.profileEnd();

        timed = Timer.instance().tick() - timed;

        reportStats(timed, 'Visitor Visiting');
    });

    test('IntersectVisitor Heavy Static Scene', function() {
        this.timeout(20000);

        var view = new View();
        view.getCamera().setViewport(new Viewport());
        view
            .getCamera()
            .setViewMatrix(
                mat4.lookAt(
                    mat4.create(),
                    vec3.fromValues(0, 0, -10),
                    vec3.fromValues(0, 0, 0),
                    vec3.fromValues(0, 1, 0)
                )
            );
        view
            .getCamera()
            .setProjectionMatrix(
                mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
            );

        // TODO it uses the old sync parseSceneGraphDeprecated
        var root = ReaderParser.parseSceneGraph(mockup.getScene());
        view.setSceneData(root);

        mockupBench.addScene(root, 25, false, false);

        var treeBuilder = new KdTreeBuilder({
            _numVerticesProcessed: 0,
            _targetNumTrianglesPerLeaf: 50,
            _maxNumLevels: 20
        });
        treeBuilder.apply(root);

        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(
            mat4.lookAt(
                mat4.create(),
                vec3.fromValues(0, 0, -10),
                vec3.fromValues(0, 0, 0),
                vec3.fromValues(0, 1, 0)
            )
        );
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        var result;
        var accum = 0;
        var nCount = 100;
        var x = new Array(nCount);
        var y = new Array(nCount);
        var n;
        for (n = 0; n < nCount; n++) {
            x[n] = Math.random() * 800;
            y[n] = Math.random() * 600;
        }

        for (n = 0; n < nCount; n++) {
            result = view.computeIntersections(x[n], y[n]);
            accum += result.length;
        }

        var timed = Timer.instance().tick();
        console.profile();
        console.time('time');

        for (n = 0; n < nCount; n++) {
            result = view.computeIntersections(x[n], y[n]);
            accum += result.length;
        }

        console.timeEnd('time');
        console.profileEnd();
        timed = Timer.instance().tick() - timed;

        module.accum = accum; // keep the variable on a scope to avoid JIT otimimization and remove code
        reportStats(timed, 'IntersectVisitor Visiting');
    });
}
