import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import { mat4 } from 'osg/glMatrix';
import { vec3 } from 'osg/glMatrix';
import { quat } from 'osg/glMatrix';
import notify from 'osg/notify';

export default function() {
    test('Matrix.makeRotateFromQuat', function() {
        var m = mat4.create();
        mat4.fromQuat(m, quat.fromValues(0.653281, 0.270598, -0.653281, 0.270598));
        assert.equalVector(
            m,
            mat4.fromValues(
                1.66533e-16,
                1.11022e-16,
                -1,
                0.0,
                0.707107,
                -0.707107,
                0.0,
                0.0,
                -0.707107,
                -0.707107,
                -1.66533e-16,
                0.0,
                0.0,
                0.0,
                0.0,
                1.0
            )
        );
    });

    test('Matrix.getRotate', function() {
        var m = mat4.create();
        mat4.fromQuat(m, quat.fromValues(0.653281, 0.270598, -0.653281, 0.270598));
        var q = mat4.getRotation(quat.create(), m);
        assert.equalVector(q, quat.fromValues(0.653281, 0.270598, -0.653281, 0.270598));
    });

    test('Matrix.getPerspective', function() {
        var m = mat4.create();
        mat4.perspective(m, Math.PI / 180 * 60, 800 / 200, 2.0, 500.0);

        var r = {};
        mat4.getPerspective(r, m);
        assert.equalVector(r.zNear, 2.0);
        assert.equalVector(r.zFar, 500.0, 0.1);
        assert.equalVector(r.fovy, 60.0);
        assert.equalVector(r.aspectRatio, 4.0);
    });

    test('Matrix.makeLookAt', function() {
        var m = mat4.lookAt(
            mat4.create(),
            vec3.fromValues(0.0, -10, 0.0),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 0.0, 1.0)
        );
        assert.equalVector(
            m,
            mat4.fromValues(
                1.0,
                0.0,
                -0,
                0.0,
                0.0,
                0.0,
                -1,
                0.0,
                0.0,
                1.0,
                -0,
                0.0,
                0.0,
                0.0,
                -10,
                1.0
            )
        );

        var m2 = mat4.lookAt(
            mat4.create(),
            vec3.fromValues(0.0, 0.0, -10),
            vec3.create(),
            vec3.fromValues(0.0, 1.0, 0.0)
        );
        assert.equalVector(
            m2,
            mat4.fromValues(
                -1,
                0.0,
                -0,
                0.0,
                0.0,
                1.0,
                -0,
                0.0,
                0.0,
                -0,
                -1,
                0.0,
                0.0,
                0.0,
                -10,
                1.0
            )
        );
    });

    test('Matrix.getLookAt', function() {
        var m = mat4.lookAt(
            mat4.create(),
            vec3.fromValues(0.0, -10, 0.0),
            vec3.fromValues(0.0, 5.0, 0.0),
            vec3.fromValues(0.0, 0.0, 1.0)
        );
        var eye = vec3.create();
        var target = vec3.create();
        var up = vec3.create();
        mat4.getLookAt(eye, target, up, m, 5.0);
        assert.equalVector(eye, vec3.fromValues(0.0, -10, 0.0));
        assert.equalVector(target, vec3.fromValues(0.0, -5.0, 0.0)); // should be five but mimic same behaviour as OpenSceneGraph
        assert.equalVector(up, vec3.fromValues(0.0, 0.0, 1.0));
    });

    test('Matrix.transformVec3', function() {
        var m = mat4.fromRotation(mat4.create(), -Math.PI / 2.0, [0.0, 1.0, 0.0]);
        var vec = vec3.fromValues(0.0, 0.0, 10);
        var inv = mat4.create();
        mat4.invert(inv, m);
        var res = vec3.transformMat4(vec3.create(), vec, inv);
        assert.equalVector(res, vec3.fromValues(10, 0.0, 0.0));

        var res2 = vec3.transformMat4(vec3.create(), res, m);
        assert.equalVector(res2, vec3.fromValues(0.0, 0.0, 10));

        m = mat4.fromValues(
            -0.00003499092,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0000349909,
            0.0,
            0.0,
            0.0,
            0.0,
            1.816363636,
            -9.989999999,
            0.01399637,
            -0.010497277,
            -1.799999999,
            9.9999999
        );
        var preMultvec3 = function(s, v, result) {
            if (result === undefined) {
                result = mat4.create();
            }
            var d = 1.0 / (s[3] * v[0] + s[7] * v[1] + s[11] * v[2] + s[15]);
            result[0] = (s[0] * v[0] + s[4] * v[1] + s[8] * v[2] + s[12]) * d;
            result[1] = (s[1] * v[0] + s[5] * v[1] + s[9] * v[2] + s[13]) * d;
            result[2] = (s[2] * v[0] + s[6] * v[1] + s[10] * v[2] + s[14]) * d;
            return result;
        };
        var r0 = preMultvec3(m, vec3.fromValues(400, 300, 1.0));

        vec3.transformMat4(res, vec3.fromValues(400, 300, 1.0), m);
        assert.equalVector(res, r0);
    });

    test('Matrix.transpose', function() {
        var m = mat4.fromValues(0.0, 1.0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
        var res = mat4.transpose(mat4.create(), m);
        assert.equalVector(
            res,
            mat4.fromValues(0.0, 4, 8, 12, 1.0, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15)
        );

        var res2 = mat4.transpose(mat4.create(), m);
        assert.equalVector(
            res2,
            mat4.fromValues(0.0, 4, 8, 12, 1.0, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15)
        );

        var res3 = mat4.transpose(m, m);
        assert.equalVector(
            res3,
            mat4.fromValues(0.0, 4, 8, 12, 1.0, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15)
        );
    });

    test('Matrix.makeRotate', function() {
        var res = mat4.fromRotation(mat4.create(), 0.0, [0.0, 0.0, 1.0]);
        assert.equalVector(res, mat4.create());
    });

    test('Matrix.mult', function() {
        var width = 800;
        var height = 600;
        var translate = mat4.create();
        var scale = mat4.create();
        var res = mat4.create();

        mat4.fromTranslation(translate, [1.0, 1.0, 1.0]);
        mat4.fromScaling(scale, [0.5 * width, 0.5 * height, 0.5]);
        mat4.mul(res, scale, translate);
        assert.equalVector(
            res,
            mat4.fromValues(
                400,
                0.0,
                0.0,
                0.0,
                0.0,
                300,
                0.0,
                0.0,
                0.0,
                0.0,
                0.5,
                0.0,
                400,
                300,
                0.5,
                1.0
            )
        );

        // test to check equivalent
        mat4.fromTranslation(translate, [1.0, 1.0, 1.0]);
        mat4.fromScaling(scale, [0.5 * width, 0.5 * height, 0.5]);

        var ident = mat4.create();
        mat4.mul(ident, ident, scale);

        mat4.mul(ident, ident, translate);
        assert.equalVector(
            ident,
            mat4.fromValues(
                400,
                0.0,
                0.0,
                0.0,
                0.0,
                300,
                0.0,
                0.0,
                0.0,
                0.0,
                0.5,
                0.0,
                400,
                300,
                0.5,
                1.0
            )
        );
        mat4.mul(scale, scale, translate);
        assert.equalVector(
            scale,
            mat4.fromValues(
                400,
                0.0,
                0.0,
                0.0,
                0.0,
                300,
                0.0,
                0.0,
                0.0,
                0.0,
                0.5,
                0.0,
                400,
                300,
                0.5,
                1.0
            )
        );
    });

    test('Matrix.inverse4x3', function() {
        var m = mat4.fromValues(
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            10,
            10,
            10,
            1.0
        );

        var result = [];
        //var valid = Matrix.inverse4x3( m, result );
        var valid = mat4.invert(result, m);
        assert.isOk(true, valid);
        assert.equalVector(
            result,
            mat4.fromValues(
                1.0,
                0.0,
                0.0,
                0.0,
                0.0,
                1.0,
                0.0,
                0.0,
                0.0,
                0.0,
                1.0,
                0.0,
                -10,
                -10,
                -10,
                1.0
            )
        );

        var m1 = mat4.fromValues(
            0.0011258089,
            0.001312161,
            -0.001274753,
            0.0,
            -0.0002278837182,
            0.001585725704,
            0.001430999692,
            0.0,
            0.00181517053,
            -0.00061475582,
            0.0009702887,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0
        );
        var m1result = [];
        //Matrix.inverse4x3( m1, m1result );
        mat4.invert(m1result, m1);
        assert.equalVector(
            m1result,
            mat4.fromValues(
                243.988,
                -49.3875,
                393.386,
                0.0,
                284.374,
                343.661,
                -133.23,
                0.0,
                -276.267,
                310.128,
                210.282,
                0.0,
                -0,
                -0,
                -0,
                1.0
            ),
            1e-3
        );

        var m2 = mat4.fromValues(
            0.001125808,
            -0.0002278837,
            0.00181517053,
            0.0,
            0.00131216,
            0.0015857257,
            -0.000614755824,
            0.0,
            -0.00127475,
            0.0014309996,
            0.000970288764,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0
        );
        var m2result = [];
        //Matrix.inverse4x3( m2, m2result );
        mat4.invert(m2result, m2);
        assert.equalVector(
            m2result,
            mat4.fromValues(
                243.988,
                284.374,
                -276.267,
                0.0,
                -49.3875,
                343.661,
                310.128,
                0.0,
                393.386,
                -133.23,
                210.282,
                0.0,
                -0,
                -0,
                -0,
                1.0
            ),
            1e-3
        );
    });

    test('Matrix.inverse', function() {
        // var result = mat4.create();
        // var m = mat4.fromValues( -1144.3119, 23.8650, -0.12300, -0.12288, -1553.3126, -1441.499, -1.6196, -1.6180, 0.0, 0.0, 0.0, 0.0, 25190.498, 13410.539, 21.885, 21.963 );

        // assert.isOk( true, Matrix.invert( result, m ) );

        var result2 = mat4.create();
        var m2 = mat4.fromValues(
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1375333.5195828325,
            -4275596.259263198,
            4514838.703939765,
            1.0
        );
        var valid = mat4.invert(result2, m2);
        assert.isOk(true, valid);
        notify.log('inverse ' + mat4.str(result2));
        //    assert.isOk(true, valid);
    });

    test('Matrix.makePerspective', function() {
        var m = mat4.fromValues(
            1.299038105676658,
            0.0,
            0.0,
            0.0,
            0.0,
            1.7320508075688774,
            0.0,
            0.0,
            0.0,
            0.0,
            -1.002002002002002,
            -1,
            0.0,
            0.0,
            -2.0020020020020022,
            0.0
        );
        var res = mat4.perspective(mat4.create(), Math.PI / 180 * 60, 800 / 600, 1.0, 1000);

        assert.isOk(mockup.checkNear(res, m), 'makePerspective should be ' + m + ' and is ' + res);
    });

    test('Matrix.makeScale', function() {
        var m = mat4.fromValues(
            500.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0
        );
        var res = mat4.fromScaling(mat4.create(), [500, 1, 2]);
        assert.isOk(mockup.checkNear(res, m), 'makeScale should be ' + m + ' and is ' + res);
    });
}
