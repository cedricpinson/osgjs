import { assert } from 'chai';
import 'tests/mockup/mockup';
import { quat } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';
import { mat4 } from 'osg/glMatrix';

export default function() {
    // shared const
    var id = quat.create(); // inited with identity
    var sqrt2 = Math.sqrt(0.5);

    // remarquable quaternion list
    var Y90Rot = quat.fromValues(sqrt2, 0.0, sqrt2, 0.0);
    var Y90RotNeg = quat.fromValues(-sqrt2, 0.0, -sqrt2, 0.0);
    var Y90RotNegX180Rot = quat.fromValues(0.0, sqrt2, 0.0, sqrt2);
    var Y180Rot = quat.fromValues(0.0, 0.0, 1.0, 0.0);
    var Y180X90NegRot = quat.fromValues(0.0, 0.0, sqrt2, sqrt2);
    var Y45Rot = quat.fromValues(0.5, 0.0, 0.5, 0.7071067811865475);
    var Y45RotNeg = quat.fromValues(-0.5, 0.0, -0.5, 0.7071067811865475);
    //Quat.createAndSet(0.0, 0.38, 0.0, 0.92 );

    test('Quat.init', function() {
        var q = quat.create();
        quat.init(q);
        assert.equalVector(q, quat.fromValues(0.0, 0.0, 0.0, 1.0));
    });

    test('Quat.makeRotate', function() {
        var q0 = quat.setAxisAngle(quat.create(), [1.0, 0.0, 0.0], Math.PI);
        assert.equalVector(q0, quat.fromValues(1.0, 0.0, 0.0, 6.12303e-17), 1e-5);

        var q1 = quat.setAxisAngle(quat.create(), [0.0, 1.0, 0.0], Math.PI / 2);
        assert.equalVector(q1, quat.fromValues(0.0, 0.707107, 0.0, 0.707107));

        var q2 = quat.setAxisAngle(quat.create(), [0.0, 0.0, 1.0], Math.PI / 4);
        assert.equalVector(q2, quat.fromValues(0.0, 0.0, 0.382683, 0.92388));
    });

    test('Quat.makeRotateFromTo', function() {
        //var q1 = quat.makeRotateFromTo( vec3.fromValues( 1.0, 0.0, 0.0 ), vec3.fromValues( 0.0, 1.0, 0.0 ), Quat.create() );
        var q1 = quat.rotationTo(
            quat.create(),
            vec3.fromValues(1.0, 0.0, 0.0),
            vec3.fromValues(0.0, 1.0, 0.0)
        );
        assert.equalVector(q1, quat.fromValues(0.0, 0.0, 0.707107, 0.707107), 1e-5);

        // it test both makeRotate and makeRotateFromTo
        var qyrot = quat.setAxisAngle(quat.create(), [0.0, 1.0, 0.0], Math.PI / 2.0);
        var q2 = quat.rotationTo(
            quat.create(),
            vec3.fromValues(0.0, 0.0, 1.0),
            vec3.fromValues(1.0, 0.0, 0.0)
        );
        assert.equalVector(q2, qyrot, 1e-5);
    });

    // test('Quat.rotatevec3', function() {
    //     var q0 = Quat.makeRotate(Math.PI, 1.0, 0.0, 0);
    //     var result = Quat.rotatevec3(q0, [10, 0.0,0), Quat.create());
    //     near(result , [-10.0, 0.0, 0]);
    // });

    test('Quat.multiply', function() {
        var q0 = quat.setAxisAngle(quat.create(), [1.0, 0.0, 0.0], Math.PI);
        var q1 = quat.setAxisAngle(quat.create(), [0.0, 1.0, 0.0], Math.PI / 2);
        var q2 = quat.setAxisAngle(quat.create(), [0.0, 0.0, 1.0], Math.PI / 4);

        var qr = quat.create();
        quat.multiply(qr, q1, q0);
        assert.equalVector(qr, quat.fromValues(0.707107, 4.32964e-17, -0.707107, 4.32964e-17));

        // check consistency with quaternion and matrix multiplication order
        var m1 = mat4.create();
        var m0 = mat4.create();
        var mr = mat4.create();
        mat4.fromQuat(m1, q1);
        mat4.fromQuat(m0, q0);
        mat4.mul(mr, m1, m0);

        var qr2 = quat.create();
        mat4.getRotation(qr2, mr);
        assert.equalVector(qr, qr2);
        // consistency

        assert.equalVector(
            quat.multiply(quat.create(), q2, quat.multiply(quat.create(), q1, q0)),
            quat.fromValues(0.653281, 0.270598, -0.653281, 0.270598)
        );
    });

    test('Quat.slerp', function() {
        var res = quat.fromValues(0.0, 0.0, 0.0, 0.0);

        // t = 0.5, half the angle between Y90RotNegX180Rot and ?Z90Rot?
        quat.slerp(res, Y90RotNegX180Rot, quat.fromValues(0.0, 0.0, 0.382683, 0.92388), 0.5);
        assert.equalVector(res, quat.fromValues(0.0, 0.388863, 0.210451, 0.896937));

        quat.slerp(res, id, Y90Rot, 0.0);
        assert.equalVector(res, id, 1e-5, 't = 0');

        quat.slerp(res, id, Y90Rot, 1.0);
        assert.equalVector(res, Y90Rot, 1e-5, 't = 1');

        quat.slerp(res, id, Y90Rot, 0.5);
        assert.equalVector(res, Y45Rot, 1e-5, '0 -> 90; t:0.5');

        quat.slerp(res, Y90Rot, id, 0.5);
        assert.equalVector(res, Y45Rot, 1e-5, '90 -> 0 t:0.5');

        quat.slerp(res, id, Y90RotNeg, 0.5);
        assert.equalVector(res, Y45RotNeg, 1e-5, 'shortest path t:0.5');

        quat.slerp(res, Y90RotNeg, id, 0.5);
        assert.equalVector(res, Y45RotNeg, 1e-5, 'shortest path inverted t:0.5');

        quat.slerp(res, Y90Rot, Y90Rot, 0.5);
        assert.equalVector(res, Y90Rot, 1e-5, 'same input t:0.5');

        quat.slerp(res, id, Y180Rot, 0.5);
        assert.equalVector(res, Y180X90NegRot, 1e-5, '0 to 180 t:0.5');

        quat.slerp(res, id, quat.fromValues(0.0, 0.0, 0.0, 0.999), 0.5);
        assert.equalVector(res, id, 1e4, 'a~n, t:0.5'); // less prec than nlerp

        quat.slerp(res, id, quat.fromValues(0.0, 0.0, 0.0, -1.0), 0.5);
        assert.equalVector(res, id, 1e-5, 'opposite sign, t:0.5');
    });

    test('Quat.nlerp', function() {
        var res = quat.fromValues(0.0, 0.0, 0.0, 0.0);

        // t = 0.5, half the angle between Y90RotNegX180Rot and ?Z90Rot?
        quat.nlerp(res, Y90RotNegX180Rot, quat.fromValues(0.0, 0.0, 0.382683, 0.92388), 0.5);
        assert.equalVector(res, quat.fromValues(0.0, 0.388863, 0.210451, 0.896937));

        quat.nlerp(res, id, Y90Rot, 0.0);
        assert.equalVector(res, id, 1e-5, 't = 0');

        quat.nlerp(res, id, Y90Rot, 1.0);
        assert.equalVector(res, Y90Rot, 1e-5, 't = 1');

        quat.nlerp(res, id, Y90Rot, 0.5);
        assert.equalVector(res, Y45Rot, 1e-5, '0 -> 90; t:0.5');

        quat.nlerp(res, Y90Rot, id, 0.5);
        assert.equalVector(res, Y45Rot, 1e-5, '90 -> 0 t:0.5');

        quat.nlerp(res, id, Y90RotNeg, 0.5);
        assert.equalVector(res, Y45RotNeg, 1e-5, 'shortest path t:0.5');

        quat.nlerp(res, Y90RotNeg, id, 0.5);
        assert.equalVector(res, Y45RotNeg, 1e-5, 'shortest path inverted t:0.5');

        quat.nlerp(res, Y90Rot, Y90Rot, 0.5);
        assert.equalVector(res, Y90Rot, 1e-5, 'same input t:0.5');

        quat.nlerp(res, id, Y180Rot, 0.5);
        assert.equalVector(res, Y180X90NegRot, 1e-5, '0 to 180 t:0.5');

        quat.nlerp(res, id, quat.fromValues(0.0, 0.0, 0.0, 0.999), 0.5);
        assert.equalVector(res, id, 1e-5, 'a~n, t:0.5');

        quat.nlerp(res, id, quat.fromValues(0.0, 0.0, 0.0, -1.0), 0.5);
        assert.equalVector(res, id, 1e-5, 'opposite sign, t:0.5');
    });

    test('Quat.transformVec3', function() {
        var v = vec3.fromValues(1.0, 2.0, 3.0);
        vec3.transformQuat(v, v, quat.fromValues(0.0, 0.707107, 0.0, 0.707107));
        assert.equalVector(v, vec3.fromValues(3.0, 2.0, -1.0));
    });
}
