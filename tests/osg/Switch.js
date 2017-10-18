import { assert } from 'chai';
import 'tests/mockup/mockup';
import Node from 'osg/Node';
import NodeVisitor from 'osg/NodeVisitor';
import Switch from 'osg/Switch';
import Utils from 'osg/utils';

export default function() {
    test('Switch', function() {
        var switchNode = new Switch();
        assert.isOk(switchNode.children.length === 0, 'number of children must be 0');
        assert.isOk(switchNode.getParents().length === 0, 'number of parents must be 0');
        var enabledChild = new Node();
        enabledChild.setName('enabled');
        switchNode.addChild(enabledChild, true);
        var disabledChild = new Node();
        disabledChild.setName('disabled');
        switchNode.addChild(disabledChild, false);
        assert.isOk(switchNode.children.length === 2, 'number of children must be 2');
        assert.isOk(switchNode._values[0] === true, 'first value should be true');
        assert.isOk(switchNode._values[1] === false, 'first value should be false');

        var TestVisitor = function() {
            NodeVisitor.call(this, NodeVisitor.TRAVERSE_ACTIVE_CHILDREN);
        };

        TestVisitor.prototype = Utils.objectInherit(NodeVisitor.prototype, {
            apply: function(node) {
                if (node.getName !== undefined) {
                    assert.isOk(
                        node.getName() !== 'disabled',
                        'only enabled child should be traversed'
                    );
                }
                this.traverse(node);
            }
        });

        var testVisitor = new TestVisitor();
        testVisitor.apply(switchNode);
    });
}
