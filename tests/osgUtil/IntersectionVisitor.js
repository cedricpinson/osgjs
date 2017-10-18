import { assert } from 'chai';
import IntersectionVisitor from 'osgUtil/IntersectionVisitor';
import Camera from 'osg/Camera';
import Viewport from 'osg/Viewport';
import { mat4 } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';
import Shape from 'osg/shape';
import TransformEnums from 'osg/transformEnums';

export default function() {
    var DummyIntersector = function() {
        this.point = [0.5, 0.5, 0.5];
        this.stackTransforms = [];
    };

    DummyIntersector.prototype = {
        enter: function() {
            return true;
        },
        setCurrentTransformation: function(matrix) {
            mat4.invert(matrix, matrix);
            this.stackTransforms.push(vec3.transformMat4(vec3.create(), this.point, matrix));
        },
        intersect: function() {
            return true;
        }
    };

    test('IntersectionVisitor with 1 camera', function() {
        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        camera.addChild(Shape.createTexturedQuadGeometry(-0.5, -0.5, 0, 1, 0, 0, 0, 1, 0, 1, 1));

        var di = new DummyIntersector();
        var iv = new IntersectionVisitor();
        iv.setIntersector(di);
        camera.accept(iv);

        assert.equalVector(
            di.stackTransforms[0],
            [0.1536, -0.1152, -9.8002],
            0.001,
            'check end transform point'
        );
    });

    test('IntersectionVisitor with second relative camera', function() {
        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        var camera2 = new Camera();
        camera2.setViewport(new Viewport());
        camera2.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera2.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        camera2.addChild(Shape.createTexturedQuadGeometry(-0.5, -0.5, 0, 1, 0, 0, 0, 1, 0, 1, 1));

        camera.addChild(camera2);

        var di = new DummyIntersector();
        var iv = new IntersectionVisitor();
        iv.setIntersector(di);
        camera.accept(iv);

        assert.equalVector(
            di.stackTransforms[1],
            [-0.0197, -0.0111, -0.1666],
            0.001,
            'check end transform point'
        );
    });

    test('IntersectionVisitor with second absolute camera', function() {
        var camera = new Camera();
        camera.setViewport(new Viewport());
        camera.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        var camera2 = new Camera();
        camera2.setReferenceFrame(TransformEnums.ABSOLUTE_RF);
        camera2.setViewport(new Viewport());
        camera2.setViewMatrix(mat4.lookAt(mat4.create(), [0, 0, -10], [0, 0, 0], [0, 1, 0]));
        camera2.setProjectionMatrix(
            mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 100.0)
        );

        camera2.addChild(Shape.createTexturedQuadGeometry(-0.5, -0.5, 0, 1, 0, 0, 0, 1, 0, 1, 1));

        camera.addChild(camera2);

        var di = new DummyIntersector();
        var iv = new IntersectionVisitor();
        iv.setIntersector(di);
        camera.accept(iv);

        assert.equalVector(
            di.stackTransforms[1],
            [0.1536, -0.1152, -9.8002],
            0.001,
            'check end transform point'
        );
    });
}
