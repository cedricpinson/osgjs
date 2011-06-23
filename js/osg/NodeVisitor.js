osg.NodeVisitor = function (traversalMode) {
    this.traversalMask = ~0x0;
    this.nodeMaskOverride = 0;
    this.traversalMode = traversalMode;
    if (traversalMode === undefined) {
        this.traversalMode = osg.NodeVisitor.TRAVERSE_ALL_CHILDREN;
    }
    this.nodePath = [];
};
//osg.NodeVisitor.TRAVERSE_NONE = 0;
osg.NodeVisitor.TRAVERSE_PARENTS = 1;
osg.NodeVisitor.TRAVERSE_ALL_CHILDREN = 2;
//osg.NodeVisitor.TRAVERSE_ACTIVE_CHILDREN = 3;
osg.NodeVisitor._traversalFunctions = {};
osg.NodeVisitor._traversalFunctions[osg.NodeVisitor.TRAVERSE_PARENTS] = function(node) { node.ascend(this); };
osg.NodeVisitor._traversalFunctions[osg.NodeVisitor.TRAVERSE_ALL_CHILDREN] = function(node) { node.traverse(this); };

osg.NodeVisitor._pushOntoNodePath = {};
osg.NodeVisitor._pushOntoNodePath[osg.NodeVisitor.TRAVERSE_PARENTS] = function(node) { this.nodePath.unshift(node); };
osg.NodeVisitor._pushOntoNodePath[osg.NodeVisitor.TRAVERSE_ALL_CHILDREN] = function(node) { this.nodePath.push(node); };

osg.NodeVisitor._popFromNodePath = {};
osg.NodeVisitor._popFromNodePath[osg.NodeVisitor.TRAVERSE_PARENTS] = function() { return this.nodePath.shift(); };
osg.NodeVisitor._popFromNodePath[osg.NodeVisitor.TRAVERSE_ALL_CHILDREN] = function() { this.nodePath.pop(); };

osg.NodeVisitor.prototype = {
    setTraversalMask: function(m) { this.traversalMask = m; },
    getTraversalMask: function() { return this.traversalMask; },
    pushOntoNodePath: function(node) {
        osg.NodeVisitor._pushOntoNodePath[this.traversalMode].call(this, node);
    },
    popFromNodePath: function() {
        osg.NodeVisitor._popFromNodePath[this.traversalMode].call(this);
    },
    validNodeMask: function(node) {
        var nm = node.getNodeMask();
        return ((this.traversalMask & (this.nodeMaskOverride | nm)) !== 0);
    },
    apply: function ( node ) {
        this.traverse(node);
    },
    traverse: function ( node ) {
        osg.NodeVisitor._traversalFunctions[this.traversalMode].call(this, node);
    }
};
