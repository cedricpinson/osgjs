import { assert } from 'chai';
import utils from 'osg/utils';
import IntersectionVisitor from 'osgUtil/IntersectionVisitor';
import PolytopeIntersector from 'osgUtil/PolytopeIntersector';
import Camera from 'osg/Camera';
import Viewport from 'osg/Viewport';
import { mat4 } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';
import Geometry from 'osg/Geometry';
import BufferArray from 'osg/BufferArray';
import DrawElements from 'osg/DrawElements';
import DrawArrays from 'osg/DrawArrays';
import primitiveSet from 'osg/primitiveSet';
import KdTreeBuilder from 'osg/KdTreeBuilder';
import intersectionEnums from 'osgUtil/intersectionEnums';

export default function() {
    var createLines = function(lineType) {
        var g = new Geometry();
        var vertexes = new utils.Float32Array(12);
        vertexes[0] = -2.0;
        vertexes[1] = 2.0;
        vertexes[2] = 0.0;

        vertexes[3] = 0.0;
        vertexes[4] = 0.0;
        vertexes[5] = 0.0;

        vertexes[6] = 2.0;
        vertexes[7] = 2.0;
        vertexes[8] = 0.0;

        vertexes[9] = 4.0;
        vertexes[10] = 0.0;
        vertexes[11] = 0.0;

        var normal = new utils.Float32Array(12);
        normal[0] = 0;
        normal[1] = 0;
        normal[2] = 1;

        normal[3] = 0;
        normal[4] = 0;
        normal[5] = 1;

        normal[6] = 0;
        normal[7] = 0;
        normal[8] = 1;

        normal[9] = 0;
        normal[10] = 0;
        normal[11] = 1;

        g.getAttributes().Vertex = new BufferArray(BufferArray.ARRAY_BUFFER, vertexes, 3);
        g.getAttributes().Normal = new BufferArray(BufferArray.ARRAY_BUFFER, normal, 3);

        var primitive = new DrawArrays(lineType, 0, vertexes.length / 3);
        g.getPrimitives().push(primitive);
        return g;
    };

    var createTriangle = function() {
        var g = new Geometry();
        var vertexes = new utils.Float32Array(9);
        vertexes[0] = -2.0;
        vertexes[1] = 2.0;
        vertexes[2] = 0.0;

        vertexes[3] = 0.0;
        vertexes[4] = 0.0;
        vertexes[5] = 0.0;

        vertexes[6] = 2.0;
        vertexes[7] = 2.0;
        vertexes[8] = 0.0;

        var normal = new utils.Float32Array(9);
        normal[0] = 0;
        normal[1] = 0;
        normal[2] = 1;

        normal[3] = 0;
        normal[4] = 0;
        normal[5] = 1;

        normal[6] = 0;
        normal[7] = 0;
        normal[8] = 1;

        g.getAttributes().Vertex = new BufferArray(BufferArray.ARRAY_BUFFER, vertexes, 3);
        g.getAttributes().Normal = new BufferArray(BufferArray.ARRAY_BUFFER, normal, 3);

        var primitive = new DrawArrays(primitiveSet.TRIANGLES, 0, vertexes.length / 3);
        g.getPrimitives().push(primitive);
        return g;
    };

    var createBigTriangle = function() {
        var g = new Geometry();
        var vertexes = new utils.Float32Array(9);
        vertexes[0] = -400.0;
        vertexes[1] = 600.0;
        vertexes[2] = 0.0;

        vertexes[3] = 0.0;
        vertexes[4] = -300.0;
        vertexes[5] = 0.0;

        vertexes[6] = 400.0;
        vertexes[7] = 600.0;
        vertexes[8] = 0.0;

        var normal = new utils.Float32Array(9);
        normal[0] = 0;
        normal[1] = 0;
        normal[2] = 1;

        normal[3] = 0;
        normal[4] = 0;
        normal[5] = 1;

        normal[6] = 0;
        normal[7] = 0;
        normal[8] = 1;

        g.getAttributes().Vertex = new BufferArray(BufferArray.ARRAY_BUFFER, vertexes, 3);
        g.getAttributes().Normal = new BufferArray(BufferArray.ARRAY_BUFFER, normal, 3);

        var primitive = new DrawArrays(primitiveSet.TRIANGLES, 0, vertexes.length / 3);
        g.getPrimitives().push(primitive);
        return g;
    };

    var createPoints = function() {
        var g = new Geometry();

        var vertexes = new utils.Float32Array(9);
        vertexes[0] = 0;
        vertexes[1] = 0;
        vertexes[2] = 0;

        vertexes[3] = 0.2;
        vertexes[4] = 0.2;
        vertexes[5] = 0.0;

        vertexes[6] = -0.2;
        vertexes[7] = 0.2;
        vertexes[8] = 0.0;

        var normal = new utils.Float32Array(9);
        normal[0] = 0;
        normal[1] = 0;
        normal[2] = 1;

        normal[3] = 0;
        normal[4] = 0;
        normal[5] = 1;

        normal[6] = 0;
        normal[7] = 0;
        normal[8] = 1;

        var indexes = new utils.Uint16Array(3);
        indexes[0] = 2;
        indexes[1] = 0;
        indexes[2] = 1;

        g.getAttributes().Vertex = new BufferArray(BufferArray.ARRAY_BUFFER, vertexes, 3);
        g.getAttributes().Normal = new BufferArray(BufferArray.ARRAY_BUFFER, normal, 3);

        var primitive = new DrawElements(
            primitiveSet.POINTS,
            new BufferArray(BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1)
        );
        g.getPrimitives().push(primitive);
        return g;
    };

    test('PolytopeIntersector intersectPoints', function() {
        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        var scene = createPoints();
        camera.addChild(scene);
        var pi = new PolytopeIntersector();

        // xMin, yMin, xMax, yMax
        pi.setPolytopeFromWindowCoordinates(395, 295, 405, 305);
        var iv = new IntersectionVisitor();
        iv.setIntersector(pi);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 1,
            'Hits should be 1 and result is ' + pi._intersections.length
        );
        assert.isOk(
            pi._intersections[0]._nodePath.length === 2,
            'NodePath should be 2 and result is ' + pi._intersections[0]._nodePath.length
        );
        assert.isOk(
            pi._intersections[0]._numIntersectionPoints === 1,
            'numPoints should be 1 and result is ' + pi._intersections[0]._numIntersectionPoints
        );
        assert.equalVector(pi._intersections[0]._intersectionPoints[0], [0.0, 0.0, 0.0]);
        pi.reset();
        // Test also setPolytope method, we do a bigger polytope so all the points should be inside
        pi.setPolytope([
            [1.0, 0.0, 0.0, -350],
            [-1.0, 0.0, 0.0, 450],
            [0.0, 1.0, 0.0, -250],
            [0.0, -1.0, 0.0, 350],
            [0.0, 0.0, 1.0, 0.0]
        ]);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 3,
            'Hits should be 3 and result is ' + pi._intersections.length
        );
        assert.isOk(
            pi._intersections[0]._nodePath.length === 2,
            'NodePath should be 2 and result is ' + pi._intersections[0]._nodePath.length
        );
        assert.equalVector(pi._intersections[0]._intersectionPoints[0], [-0.2, 0.2, 0]);
        assert.equalVector(pi._intersections[1]._intersectionPoints[0], [0.0, 0.0, 0]);
        assert.equalVector(pi._intersections[2]._intersectionPoints[0], [0.2, 0.2, 0]);
        pi.reset();
        // Test also setPolytope method, we do a bigger polytope so all the points should be inside
        pi.setPolytope([
            [1.0, 0.0, 0.0, -350],
            [-1.0, 0.0, 0.0, 450],
            [0.0, 1.0, 0.0, -250],
            [0.0, -1.0, 0.0, 350],
            [0.0, 0.0, 1.0, 0.0]
        ]);
        pi.setIntersectionLimit(intersectionEnums.LIMIT_ONE);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 1,
            'Hits should be 1 and result is ' + pi._intersections.length
        );
        // Test dimension mask
        pi.reset();
        pi.setPrimitiveMask(intersectionEnums.LINE_PRIMITIVES);
        pi.setIntersectionLimit(intersectionEnums.LIMIT_ONE);
        camera.accept(iv);

        assert.isOk(
            pi._intersections.length === 0,
            'Hits should be 0 and result is ' + pi._intersections.length
        );

        pi.reset();
        pi.setPrimitiveMask(intersectionEnums.POINT_PRIMITIVES);
        pi.setIntersectionLimit(intersectionEnums.LIMIT_ONE);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 1,
            'Hits should be 1 and result is ' + pi._intersections.length
        );
    });

    test('PolytopeIntersector intersectLines', function() {
        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        var scene = createLines(primitiveSet.LINES);
        camera.addChild(scene);
        var pi = new PolytopeIntersector();

        pi.setPolytopeFromWindowCoordinates(395, 295, 405, 305);
        var iv = new IntersectionVisitor();
        iv.setIntersector(pi);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 1,
            'Hits should be 1 and result is ' + pi._intersections.length
        );
        assert.isOk(
            pi._intersections[0]._nodePath.length === 2,
            'NodePath should be 2 and result is ' + pi._intersections[0]._nodePath.length
        );
        assert.isOk(
            pi._intersections[0]._numIntersectionPoints === 3,
            'numPoints should be 3 and result is ' + pi._intersections[0]._numIntersectionPoints
        );
        assert.equalVector(pi._intersections[0]._localIntersectionPoint, [-0.06415, 0.06415, 0]);
        assert.equalVector(pi._intersections[0]._intersectionPoints[0], [-0.096225, 0.096225, 0]);
        assert.equalVector(pi._intersections[0]._intersectionPoints[1], [0.0, 0.0, 0.0]);
        assert.equalVector(pi._intersections[0]._intersectionPoints[2], [-0.096225, 0.096225, 0]);
        // Test dimension masks
        pi.reset();
        pi.setPrimitiveMask(intersectionEnums.POINT_PRIMITIVES);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 0,
            'Hits should be 0 and result is ' + pi._intersections.length
        );
        pi.reset();
        pi.setPrimitiveMask(intersectionEnums.LINE_PRIMITIVES);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 1,
            'Hits should be 1 and result is ' + pi._intersections.length
        );
    });

    test('PolytopeIntersector intersectLineStrip', function() {
        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        var scene = createLines(primitiveSet.LINE_STRIP);
        camera.addChild(scene);
        var pi = new PolytopeIntersector();

        pi.setPolytopeFromWindowCoordinates(395, 295, 405, 305);
        var iv = new IntersectionVisitor();
        iv.setIntersector(pi);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 2,
            'Hits should be 2 and result is ' + pi._intersections.length
        );
        assert.isOk(
            pi._intersections[0]._nodePath.length === 2,
            'NodePath should be 2 and result is ' + pi._intersections[0]._nodePath.length
        );
        assert.equalVector(pi._intersections[0]._localIntersectionPoint, [-0.06415, 0.06415, 0]);
    });

    test('PolytopeIntersector intersectTriangle', function() {
        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        var scene = createTriangle();
        camera.addChild(scene);
        var pi = new PolytopeIntersector();

        pi.setPolytopeFromWindowCoordinates(395, 295, 405, 305);
        var iv = new IntersectionVisitor();
        iv.setIntersector(pi);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 1,
            'Hits should be 1 and result is ' + pi._intersections.length
        );
        assert.isOk(
            pi._intersections[0]._nodePath.length === 2,
            'NodePath should be 2 and result is ' + pi._intersections[0]._nodePath.length
        );

        // unify points because of the precision issues between browser / node tests
        var uniquePoints = [];
        for (var i = 0; i < pi._intersections[0]._numIntersectionPoints; i++) {
            var p = pi._intersections[0]._intersectionPoints[i];
            var alreadyInserted = false;

            for (var j = 0; j < uniquePoints.length; j++) {
                if (vec3.equals(uniquePoints[j], p)) {
                    alreadyInserted = true;
                    break;
                }
            }
            if (!alreadyInserted) uniquePoints.push(p);
        }

        assert.isOk(
            uniquePoints.length === 3,
            'numPoints should be 3 and result is ' + uniquePoints.length
        );
        assert.equalVector(uniquePoints[0], [-0.096225, 0.096225, 0]);
        assert.equalVector(uniquePoints[1], [0, 0, 0]);
        assert.equalVector(uniquePoints[2], [0.096225, 0.096225, 0]);

        // Test dimension mask
        pi.reset();
        pi.setPrimitiveMask(intersectionEnums.POINT_PRIMITIVES);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 0,
            'Hits should be 0 and result is ' + pi._intersections.length
        );
        // Test polytope going trough the triangle without containing any point of it
        pi.reset();
        pi.setPrimitiveMask(intersectionEnums.ALL_PRIMITIVES);
        pi.setPolytopeFromWindowCoordinates(395, 295, 405, 305);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 1,
            'Hits should be 1 and result is ' + pi._intersections.length
        );
    });

    test('PolytopeIntersector polytope inside Triangle ', function() {
        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        var scene = createBigTriangle();
        camera.addChild(scene);
        var pi = new PolytopeIntersector();

        pi.setPolytopeFromWindowCoordinates(395, 295, 405, 305);
        var iv = new IntersectionVisitor();
        iv.setIntersector(pi);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 1,
            'Hits should be 1 and result is ' + pi._intersections.length
        );
        assert.isOk(
            pi._intersections[0]._nodePath.length === 2,
            'NodePath should be 2 and result is ' + pi._intersections[0]._nodePath.length
        );

        // unify points because of the precision issues between browser / node tests
        var uniquePoints = [];
        for (var i = 0; i < pi._intersections[0]._numIntersectionPoints; i++) {
            var p = pi._intersections[0]._intersectionPoints[i];
            var alreadyInserted = false;

            for (var j = 0; j < uniquePoints.length; j++) {
                if (vec3.equals(uniquePoints[j], p)) {
                    alreadyInserted = true;
                    break;
                }
            }
            if (!alreadyInserted) uniquePoints.push(p);
        }

        assert.isOk(
            uniquePoints.length === 2,
            'numPoints should be 2 and result is ' + uniquePoints.length
        );

        assert.equalVector(uniquePoints[0], [0.096225, -0.096225, 0]);
        assert.equalVector(uniquePoints[1], [0.096225, 0.096225, 0]);

        // Test dimension mask
        pi.reset();
        pi.setPrimitiveMask(intersectionEnums.POINT_PRIMITIVES);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 0,
            'Hits should be 0 and result is ' + pi._intersections.length
        );
        // Test polytope going trough the triangle without containing any point of it
        pi.reset();
        pi.setPrimitiveMask(intersectionEnums.ALL_PRIMITIVES);
        pi.setPolytopeFromWindowCoordinates(395, 295, 405, 305);
        camera.accept(iv);
        assert.isOk(
            pi._intersections.length === 1,
            'Hits should be 1 and result is ' + pi._intersections.length
        );
    });


    test('PolytopeIntersector with kdtree and camera', function() {
        // This test will never work with kdtree
        var camera = new Camera();
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
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        var scene = createTriangle();
        camera.addChild(scene);
        var treeBuilder = new KdTreeBuilder({
            _numVerticesProcessed: 0.0,
            _targetNumTrianglesPerLeaf: 1,
            _maxNumLevels: 20
        });
        treeBuilder.apply(scene);

        var pi = new PolytopeIntersector();
        pi.setPolytopeFromWindowCoordinates(395, 295, 405, 305);
        var iv = new IntersectionVisitor();
        iv.setIntersector(pi);
        camera.accept(iv);
        // unify points because of the precision issues between browser / node tests
        var uniquePoints = [];
        for (var i = 0; i < pi._intersections[0]._numIntersectionPoints; i++) {
            var p = pi._intersections[0]._intersectionPoints[i];
            var alreadyInserted = false;

            for (var j = 0; j < uniquePoints.length; j++) {
                if (vec3.equals(uniquePoints[j], p)) {
                    alreadyInserted = true;
                    break;
                }
            }
            if (!alreadyInserted) uniquePoints.push(p);
        }

        assert.isOk(
            pi._intersections.length === 1,
            'Intersections should be 1 and result is ' + pi._intersections.length
        );
        assert.isOk(
            pi._intersections[0]._nodePath.length === 2,
            'NodePath should be 2 and result is ' + pi._intersections[0]._nodePath.length
        );
        assert.isOk(
            uniquePoints.length === 3,
            'numPoints should be 3 and result is ' + uniquePoints.length
        );
        assert.equalVector(uniquePoints[0], [-0.096225, 0.096225, 0]);
        assert.equalVector(uniquePoints[1], [0, 0, 0]);
        assert.equalVector(uniquePoints[2], [0.096225, 0.096225, 0]);
    });
}
