import { assert } from 'chai';
import 'tests/mockup/mockup';
import ComputeBoundsVisitor from 'osg/ComputeBoundsVisitor';
import { mat4 } from 'osg/glMatrix';
import MatrixTransform from 'osg/MatrixTransform';
import Shape from 'osg/shape';
import { vec3 } from 'osg/glMatrix';

export default function() {
    test('ComputeBoundsVisitor translate', function() {
        var root = new MatrixTransform();

        var child1 = new MatrixTransform();
        mat4.fromTranslation(child1.getMatrix(), [10, 0, 0]);

        var child2 = new MatrixTransform();
        mat4.fromTranslation(child2.getMatrix(), [-10, 0, 0]);

        root.addChild(child1);
        root.addChild(child2);

        var shape = Shape.createTexturedBoxGeometry(0, 0, 0, 5, 5, 5);

        child1.addChild(shape);
        child2.addChild(shape);

        child2.setNodeMask(0);

        var bs = root.getBound();

        assert.equalVector(bs.radius(), 14.330127018922195, 'Check radius of the scene');

        var visitor = new ComputeBoundsVisitor();
        root.accept(visitor);

        var tmp = vec3.create();

        assert.equalVector(
            visitor.getBoundingBox().corner(0, tmp),
            vec3.fromValues(7.5, -2.5, -2.5),
            'Check Min of bounding box'
        );
        assert.equalVector(
            visitor.getBoundingBox().corner(7, tmp),
            vec3.fromValues(12.5, 2.5, 2.5),
            'Check Max of bounding box'
        );

        // getBoundingBox don't skip the 0 nodemask
        assert.equalVector(
            root.getBoundingBox().corner(0, tmp),
            vec3.fromValues(-12.5, -2.5, -2.5),
            'Check Min of bounding box with getBoundingBox'
        );
        assert.equalVector(
            root.getBoundingBox().corner(7, tmp),
            vec3.fromValues(12.5, 2.5, 2.5),
            'Check Max of bounding box getBoundingBox'
        );
    });

    test('ComputeBoundsVisitor translate and rotate', function() {
        var root = new MatrixTransform();
        var tra = mat4.create();

        var child1 = new MatrixTransform();
        mat4.fromRotation(child1.getMatrix(), -Math.PI * 0.5, [0, 1, 0]);
        mat4.mul(child1.getMatrix(), mat4.fromTranslation(tra, [-10, 0, 0]), child1.getMatrix());

        root.addChild(child1);

        var child2 = new MatrixTransform();
        mat4.fromRotation(child2.getMatrix(), Math.PI, [0, 1, 0]);
        mat4.mul(child2.getMatrix(), mat4.fromTranslation(tra, [0, 0, 10]), child2.getMatrix());

        child1.addChild(child2);
        var shape = Shape.createTexturedBoxGeometry(0, 0, 0, 5, 5, 5);
        child2.addChild(shape);

        var bs = root.getBound();

        assert.equalVector(bs.radius(), 4.330127018922194, 'Check radius of the scene');

        var visitor = new ComputeBoundsVisitor();
        root.accept(visitor);

        var tmp = vec3.create();

        assert.equalVector(
            visitor.getBoundingBox().corner(0, tmp),
            vec3.fromValues(-22.5, -2.5, -2.5),
            'Check Min of bounding box'
        );
        assert.equalVector(
            visitor.getBoundingBox().corner(7, tmp),
            vec3.fromValues(-17.5, 2.5, 2.5),
            'Check Max of bounding box'
        );

        // all the nodemask are active so same result as the visitor method
        assert.equalVector(
            root.getBoundingBox().corner(0, tmp),
            vec3.fromValues(-22.5, -2.5, -2.5),
            'Check Min of bounding box with getBoundingBox'
        );
        assert.equalVector(
            root.getBoundingBox().corner(7, tmp),
            vec3.fromValues(-17.5, 2.5, 2.5),
            'Check Max of bounding box getBoundingBox'
        );
    });
}
