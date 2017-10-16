import { assert } from 'chai';
import 'tests/mockup/mockup';
import { mat4 } from 'osg/glMatrix';
import { quat } from 'osg/glMatrix';
import StackedRotateAxis from 'osgAnimation/StackedRotateAxis';
import StackedTranslate from 'osgAnimation/StackedTranslate';
import StackedScale from 'osgAnimation/StackedScale';
import StackedMatrix from 'osgAnimation/StackedMatrix';
import StackedQuaternion from 'osgAnimation/StackedQuaternion';

export default function() {
    test('StackedRotateAxis', function() {
        var st = new StackedRotateAxis('rotateX');
        assert.isOk(st.getName() === 'rotateX', 'Check name');
        assert.equalVector(st._axis, [0.0, 0.0, 1.0], 'Check default axis');
        assert.isOk(st._target.value === 0.0, 'Check default angle');

        st.init([1.0, 0.0, 0.0], 2.88);
        assert.equalVector(st._axis, [1.0, 0.0, 0.0], 'Check axis after init');
        assert.isOk(st._target.value === 2.88, 'Check angle after init');
    });

    test('StackedTranslate', function() {
        var st = new StackedTranslate('translate');
        assert.isOk(st.getName() === 'translate', 'Ckeck Name');
        assert.equalVector(st._target.value, [0.0, 0.0, 0.0], 'Ckeck default translate');

        st.init([23, 78, 9.78]);
        assert.equalVector(st._target.value, [23, 78, 9.78], 'Check translate after init');
    });
    test('StackedScale', function() {
        var st = new StackedScale('scale');
        assert.isOk(st.getName() === 'scale', 'Ckeck Name');
        assert.equalVector(st._target.value, [1.0, 1.0, 1.0], 'Check scale default value');

        st.init([1.0, 2.0, 3.0]);
        assert.equalVector(st._target.value, [1.0, 2.0, 3.0], 'Check scale value after init');
    });

    test('StackedMatrix', function() {
        var st = new StackedMatrix('matrix');
        assert.isOk(st.getName() === 'matrix', 'Check Name');
        assert.isOk(mat4.exactEquals(st._target.value, mat4.IDENTITY), 'Check default matrix');

        var m = mat4.fromTranslation(mat4.create(), [4, 0, 0]);
        st.init(m);
        assert.equalVector(m, st._target.value, 'Check matrix value after init');
    });

    test('StackedQuaternion', function() {
        var st = new StackedQuaternion('quat');
        var q = quat.create();
        assert.isOk(st.getName() === 'quat', 'Check Name');
        assert.equalVector(st._target.value, q, 'Check default quat value');

        quat.setAxisAngle(q, [0, 0, 1], 0.45);
        st.init(q);
        assert.equalVector(q, st._target.value, 'Check quat value after init');
    });
}
