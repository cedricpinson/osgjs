import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import BoundingSphere from 'osg/BoundingSphere';
import BoundingBox from 'osg/BoundingBox';
import Node from 'osg/Node';
import Camera from 'osg/Camera';
import TransformEnums from 'osg/transformEnums';
import Shape from 'osg/shape';
import MatrixTransform from 'osg/MatrixTransform';
import { vec3 } from 'osg/glMatrix';
import { mat4 } from 'osg/glMatrix';

export default function() {
    test('BoundingSphere', function() {
        var simpleBoundingSphere = new BoundingSphere();
        assert.isOk(simpleBoundingSphere.valid() !== 1, 'BoundingSphere is invalid');

        var bs0 = new BoundingSphere();
        bs0.expandByVec3(vec3.fromValues(1.0, 4.0, 0.0));
        bs0.expandByVec3(vec3.fromValues(2.0, 3.0, 0.0));
        bs0.expandByVec3(vec3.fromValues(3.0, 2.0, 0.0));
        bs0.expandByVec3(vec3.fromValues(4.0, 1.0, 0.0));

        var cbs0 = vec3.fromValues(2.5, 2.5, 0);
        var rbs0 = 2.12132;
        var centerisequalbs0 =
            mockup.checkNear(cbs0, bs0._center, 0.0001) &
            mockup.checkNear(rbs0, bs0._radius, 0.0001);
        assert.isOk(centerisequalbs0, 'Expanding by vec3 -> bounding sphere test 1');
        var bs1 = new BoundingSphere();
        bs1.expandByVec3(vec3.fromValues(-1.0, 0.0, 0.0));
        bs1.expandByVec3(vec3.fromValues(2.0, -3.0, 2.0));
        bs1.expandByVec3(vec3.fromValues(3.0, 3.0, 1.0));
        bs1.expandByVec3(vec3.fromValues(5.0, 5.0, 0.0));

        var cbs1 = vec3.fromValues(2.00438, 0.862774, 0.784302);
        var rbs1 = 5.16774;
        var centerisequalbs1 =
            mockup.checkNear(cbs1, bs1._center, 0.0001) &
            mockup.checkNear(rbs1, bs1._radius, 0.0001);

        assert.isOk(centerisequalbs1, 'Expanding by vec3 ->  bounding sphere test 2');

        var bs01 = new BoundingSphere();
        bs01.expandByBoundingSphere(bs0);

        var cbs010 = vec3.fromValues(2.5, 2.5, 0);
        var rbs010 = 2.12132;
        var centerisequalbs010 =
            mockup.checkNear(cbs010, bs01._center, 0.0001) &
            mockup.checkNear(rbs010, bs01._radius, 0.0001);
        assert.isOk(centerisequalbs010, 'Expanding by BoundingSphere ->  bounding sphere test 1');

        bs01.expandByBoundingSphere(bs1);
        var cbs011 = vec3.fromValues(2.00438, 0.862774, 0.784302);
        var rbs011 = 5.16774;
        var centerisequalbs011 =
            mockup.checkNear(cbs011, bs01._center, 0.0001) &
            mockup.checkNear(rbs011, bs01._radius, 0.0001);
        assert.isOk(centerisequalbs011, 'Expanding by BoundingSphere ->  bounding sphere test 2');

        // test case with camera and absolute transform
        var main = new Node();
        var cam = new Camera();
        cam.setReferenceFrame(TransformEnums.ABSOLUTE_RF);
        var q = Shape.createTexturedQuadGeometry(-25, -25, 0, 50, 0, 0, 0, 50, 0);
        main.addChild(q);
        var q2 = Shape.createTexturedQuadGeometry(-250, 0, 0, 50, 0, 0, 0, 50, 0);
        cam.addChild(q2);
        main.addChild(cam);
        var bscam = main.getBound();
        assert.equalVector(
            bscam.center(),
            vec3.create(),
            'check camera bounding sphere in absolute mode'
        );

        // test case with invalid bounding sphere
        var main2 = new Node();
        var q3 = Shape.createTexturedQuadGeometry(-25, -25, 0, 50, 0, 0, 0, 50, 0);
        var mt3 = new MatrixTransform();
        mat4.fromTranslation(mt3.getMatrix(), [-1000, 0, 0]);
        main2.addChild(q3);
        main2.addChild(mt3);
        assert.equalVector(
            main2.getBound().center(),
            vec3.create(),
            'check computing bounding sphere with invalid bouding sphere'
        );
    });

    test('BoundingSphere - expand with box', function() {
        // test expand by bounding box
        var bbox = new BoundingBox();
        vec3.set(bbox.getMin(), -2.0, -2.0, -2.0);
        vec3.set(bbox.getMax(), 2.0, 2.0, 2.0);

        var bs = new BoundingSphere();
        bs.expandByBoundingBox(bbox);

        assert.equalVector(bs.radius(), 3.4641, 1e-2, 'Expands with box - check radius');
        assert.equalVector(bs.center(), vec3.create(), 1e-2, 'Expands with box - check center');

        vec3.set(bbox.getMin(), 2.0, 2.0, 2.0);
        vec3.set(bbox.getMax(), 4.0, 4.0, 4.0);
        bs.expandByBoundingBox(bbox);

        assert.equalVector(bs.radius(), 5.9135, 1e-2, 'Expands with box - check radius');
        assert.equalVector(
            bs.center(),
            vec3.fromValues(0.5857, 0.5857, 0.5857),
            1e-2,
            'Expands with box - check center'
        );
    });
}
