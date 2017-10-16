import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import MatrixTransform from 'osg/MatrixTransform';
import { mat4 } from 'osg/glMatrix';
import ReaderParser from 'osgDB/readerParser';
import TransformEnums from 'osg/transformEnums';

export default function() {
    test('MatrixTransform', function() {
        var n = new MatrixTransform();
        var scene = ReaderParser.parseSceneGraph(mockup.getBoxScene());
        mat4.fromTranslation(n.getMatrix(), [100, 0, 0]);
        n.addChild(scene);
        var bs = n.getBound();
        assert.equalVector(bs.center(), [100, 0, 0]);
        assert.equalVector(bs.radius(), 2.414213562373095);
    });

    test('Transform', function() {
        var n = new MatrixTransform();
        var scene = ReaderParser.parseSceneGraph(mockup.getBoxScene());
        mat4.fromScaling(n.getMatrix(), [2, 3, 4]);
        n.addChild(scene);
        var bs = n.getBound();
        assert.equalVector(bs.center(), [0, 0, 0]);
        assert.equalVector(bs.radius(), 9.65685424949238);
    });

    test('Transform absolute vs relative', function() {
        var mat = mat4.fromRotation(mat4.create(), -Math.PI * 0.5, [1.0, 0.0, 0.0]);
        var inv = mat4.create();
        mat4.invert(inv, mat);

        var n = new MatrixTransform();
        mat4.copy(n.getMatrix(), mat);
        var test = mat4.create();

        var checkMatrices = function(node) {
            assert.equalVector(node.getWorldMatrices()[0], mat);

            node.computeLocalToWorldMatrix(mat4.identity(test));
            assert.equalVector(test, mat);

            node.computeWorldToLocalMatrix(mat4.identity(test));
            assert.equalVector(test, inv);
        };

        checkMatrices(n);
        n.setReferenceFrame(TransformEnums.ABSOLUTE_RF);
        checkMatrices(n);
    });
}
