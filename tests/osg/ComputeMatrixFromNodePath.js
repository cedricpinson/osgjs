import { assert } from 'chai';
import 'tests/mockup/mockup';
import ComputeMatrixFromNodePath from 'osg/computeMatrixFromNodePath';
import NodeVisitor from 'osg/NodeVisitor';
import utils from 'osg/utils';
import MatrixTransform from 'osg/MatrixTransform';
import { mat4 } from 'osg/glMatrix';
import Camera from 'osg/Camera';
import { vec3 } from 'osg/glMatrix';
import TransformEnums from 'osg/transformEnums';

export default function() {
    test('ComputeMatrixFromNodePath', function() {
        (function() {
            // test visit parents
            var GetRootItem = function() {
                NodeVisitor.call(this, NodeVisitor.TRAVERSE_PARENTS);
                this.node = undefined;
            };
            GetRootItem.prototype = utils.objectInherit(NodeVisitor.prototype, {
                apply: function(node) {
                    this.node = node;
                    this.traverse(node);
                }
            });

            var root = new MatrixTransform();
            root.setName('root');
            mat4.fromTranslation(root.getMatrix(), [10, 0, 0]);

            var child0 = new Camera();
            child0.setReferenceFrame(TransformEnums.ABSOLUTE_RF);
            mat4.fromTranslation(child0.getViewMatrix(), [0, 5, 0]);

            var child1 = new MatrixTransform();
            mat4.fromTranslation(child1.getMatrix(), [0, -10, 0]);

            var child2 = new MatrixTransform();
            mat4.fromTranslation(child2.getMatrix(), [0, 0, 10]);

            root.addChild(child0);
            child0.addChild(child1);
            child1.addChild(child2);

            var path = [root, child0, child1, child2];
            var matrix = ComputeMatrixFromNodePath.computeLocalToWorld(path);
            var trans = mat4.getTranslation(vec3.create(), matrix);
            assert.equalVector(trans, [0, -10, 10], 'Check translation of matrix');
        })();

        (function() {
            var root = new Camera();
            root.setName('root');
            root.setViewMatrix(mat4.fromTranslation(mat4.create(), [0, 0, 1000]));

            var child1 = new MatrixTransform();
            mat4.fromTranslation(child1.getMatrix(), [0, -10, 0]);

            var child2 = new MatrixTransform();
            mat4.fromTranslation(child2.getMatrix(), [0, 0, 10]);

            var path = [root, child1, child2];
            var matrix = ComputeMatrixFromNodePath.computeLocalToWorld(path);
            var result = vec3.create();
            mat4.getTranslation(result, matrix);
            assert.equalVector(result, [0, -10, 10], 'Check we dont use the camera on top');
        })();
    });
}
