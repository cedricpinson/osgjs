'use strict';
var assert = require('chai').assert;
require('tests/mockup/mockup');
var IntersectionVisitor = require('osgUtil/IntersectionVisitor');
var SphereIntersector = require('osgUtil/SphereIntersector');
var KdTreeBuilder = require('osg/KdTreeBuilder');
var BoundingSphere = require('osg/BoundingSphere');
var Camera = require('osg/Camera');
var Viewport = require('osg/Viewport');
var mat4 = require('osg/glMatrix').mat4;
var vec3 = require('osg/glMatrix').vec3;
var MatrixTransform = require('osg/MatrixTransform');
var Shape = require('osg/shape');

module.exports = function() {
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

    test('SphereIntersector with 2 branches', function() {
        // right branch should be picked
        // left branch shouldn't be picked
        //
        // MatrixTransform  (-10 -10 -10)
        //     /    \
        //    |     MatrixTransform (10 10 10)
        //     \   /
        //     Scene

        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(
            mat4.lookAt(
                mat4.create(),
                vec3.fromValues(0.0, 0.0, -10.0),
                vec3.create(),
                vec3.fromValues(0.0, 1.0, 0.0)
            )
        );
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800.0 / 600.0, 0.1, 1000.0)
        );

        var scene = Shape.createTexturedQuadGeometry(
            -0.5,
            -0.5,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            1.0,
            1.0
        );

        var tr1 = new MatrixTransform();
        mat4.fromTranslation(tr1.getMatrix(), [5.0, 0.0, 0.0]);
        tr1.addChild(scene);

        var mrot = new MatrixTransform();
        mat4.fromTranslation(mrot.getMatrix(), [-5.0, 0.0, 0.0]);
        mrot.addChild(tr1);
        mrot.addChild(scene);

        camera.addChild(mrot);

        var spi = new SphereIntersector();
        spi.set(vec3.fromValues(420, 300, 0.5), 0.1);
        var iv = new IntersectionVisitor();
        iv.setIntersector(spi);
        camera.accept(iv);
        // we hit the right branch
        assert.isOk(
            spi._intersections.length === 2,
            'Hits should be 2 and result is ' + spi._intersections.length
        );
        assert.isOk(
            spi._intersections[0]._nodePath.length === 4,
            'NodePath should be 4 and result is ' + spi._intersections[0]._nodePath.length
        );

        // Bigger sphere we should intersect both branches
        spi = new SphereIntersector();
        spi.set(vec3.fromValues(420, 300, 0.5), 0.5);
        iv = new IntersectionVisitor();
        iv.setIntersector(spi);
        camera.accept(iv);
        assert.isOk(
            spi._intersections.length === 4,
            'Hits should be 2 and result is ' + spi._intersections.length
        );
        assert.isOk(
            spi._intersections[3]._nodePath.length === 3,
            'NodePath should be 3 and result is ' + spi._intersections[3]._nodePath.length
        );
    });

    test('SphereIntersector without kdtree and camera', function() {
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
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 1000.0)
        );

        var scene = Shape.createTexturedQuadGeometry(
            -0.5,
            -0.5,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            1.0,
            1.0
        );
        camera.addChild(scene);
        var spi = new SphereIntersector();
        spi.set(vec3.fromValues(400, 300, 0.5), 0.1);
        var iv = new IntersectionVisitor();
        iv.setIntersector(spi);
        camera.accept(iv);
        assert.isOk(
            spi._intersections.length === 2,
            'Hits should be 1 and result is ' + spi._intersections.length
        );
        assert.isOk(
            spi._intersections[0]._nodePath.length === 2,
            'NodePath should be 2 and result is ' + spi._intersections[0]._nodePath.length
        );
    });

    test('SphereIntersector with kdtree, no camera', function() {
        var scene = Shape.createTexturedQuadGeometry(
            -0.5,
            -0.5,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            1.0,
            1.0
        );
        var treeBuilder = new KdTreeBuilder({
            _numVerticesProcessed: 0.0,
            _targetNumTrianglesPerLeaf: 1,
            _maxNumLevels: 20
        });
        treeBuilder.apply(scene);

        var spi = new SphereIntersector();
        spi.set(vec3.fromValues(-0.5, -0.5, 0.0), 0.1);
        var iv = new IntersectionVisitor();
        iv.setIntersector(spi);
        scene.accept(iv);
        assert.isOk(
            spi._intersections.length === 1,
            'Intersections should be 1 and result is ' + spi._intersections.length
        );
        assert.isOk(
            spi._intersections[0]._nodePath.length === 1,
            'NodePath should be 1 and result is ' + spi._intersections[0]._nodePath.length
        );
        // Move the sphere so we hit both triangles
        spi.set(vec3.fromValues(0.0, 0.0, 0.0), 0.1);
        iv = new IntersectionVisitor();
        iv.setIntersector(spi);
        scene.accept(iv);
        assert.isOk(
            spi._intersections.length === 2,
            'Intersections should be 2 and result is ' + spi._intersections.length
        );
        assert.isOk(
            spi._intersections[0]._nodePath.length === 1,
            'NodePath should be 2 and result is ' + spi._intersections[0]._nodePath.length
        );
    });
};
