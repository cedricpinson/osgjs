'use strict';
var assert = require('chai').assert;
var Node = require('osg/Node');
var PooledResource = require('osg/PooledResource');
var mat4 = require('osg/glMatrix').mat4;

module.exports = function() {
    test('Node', function() {
        var n = new Node();
        assert.isOk(n.children.length === 0, 'number of children must be 0');
        assert.isOk(n.getParents().length === 0, 'number of parents must be 0');
        assert.isOk(n.nodeMask === ~0, 'nodemask must be ~0');
        assert.isOk(n._boundingSphere !== undefined, 'boundingSphere must not be undefined');
        assert.isOk(n._boundingSphereComputed === false, 'boundingSphereComputed must be false');
        n.getBound();
        assert.isOk(n._boundingSphereComputed === true, 'boundingSphereComputed must be true');

        var n1 = new Node();
        n.addChild(n1);
        assert.isOk(n.children.length === 1, 'n must have 1 child');
        assert.isOk(n1.getParents().length === 1, 'n1 must have 1 parent');
        assert.isOk(
            n._boundingSphereComputed === false,
            'boundingSphereComputed must be false after adding child'
        );
        n.getBound();
        assert.isOk(
            n._boundingSphereComputed === true,
            'boundingSphereComputed must be true after calling getBound'
        );

        n1.dirtyBound();
        assert.isOk(
            n._boundingSphereComputed === false,
            'boundingSphereComputed must be true if a child call dirtyBound'
        );

        var matrixGenerator = new PooledResource(mat4.create);
        var functorMatrix = matrixGenerator.getOrCreateObject.bind(matrixGenerator);
        var matrixes = n1.getWorldMatrices(undefined, functorMatrix);
        assert.isOk(
            matrixes.length === 1 &&
                matrixes[0][0] === 1.0 &&
                matrixes[0][5] === 1.0 &&
                matrixes[0][10] === 1.0 &&
                matrixes[0][15] === 1.0,
            'getWorldMatrices should return one identity matrix'
        );
        // Test culling active, we need a valid bounding sphere
        n1.getBound()._radius = 1;
        n1.setCullingActive(false);
        assert.isOk(
            n.isCullingActive() === false,
            'culling should be disabled because n has a child with the culling disabled'
        );
        n1.setCullingActive(true);
        assert.isOk(
            n.isCullingActive() === true,
            'culling should be enabled because all of the children have their culling active'
        );

        // Test bounding after remove child
        n.getBound(); // make sure bound is computed
        n.removeChild(n1);
        assert.isOk(
            n._boundingSphereComputed === false,
            'boundingSphereComputed must be false after removing a child'
        );
    });

    test('Node.getNumChildrenRequiringUpdateTraversal', function() {
        var DummyUpdateCallback = function() {};
        DummyUpdateCallback.prototype = {
            update: function() {
                return true;
            }
        };

        var fakeCallback = new DummyUpdateCallback();

        var root = new Node();
        var n1 = new Node();
        var n2 = new Node();
        root.addChild(n1);
        root.addChild(n2);

        assert.equal(
            root.getNumChildrenRequiringUpdateTraversal(),
            0,
            'Check not need to traverse if no callback'
        );

        n2.addUpdateCallback(fakeCallback);
        assert.equal(
            root.getNumChildrenRequiringUpdateTraversal(),
            1,
            'Check need to traverse because of callback on n2'
        );

        n2.removeUpdateCallback(fakeCallback);
        assert.equal(
            root.getNumChildrenRequiringUpdateTraversal(),
            0,
            'Check no need to traverse because of callback removed on n2'
        );

        var stateSet = n1.getOrCreateStateSet();
        stateSet.addUpdateCallback(fakeCallback);
        assert.equal(
            root.getNumChildrenRequiringUpdateTraversal(),
            1,
            'Check need to traverse because of callback on stateset'
        );

        n2.addUpdateCallback(fakeCallback);
        n1.addUpdateCallback(fakeCallback);
        assert.equal(
            root.getNumChildrenRequiringUpdateTraversal(),
            2,
            'Check need to traverse because of callback on stateset, n2 and n1'
        );

        stateSet.removeUpdateCallback(fakeCallback);
        n2.removeUpdateCallback(fakeCallback);
        n1.removeUpdateCallback(fakeCallback);
        assert.equal(
            root.getNumChildrenRequiringUpdateTraversal(),
            0,
            'Check no need to traverse because no callback anymore'
        );
    });
};
