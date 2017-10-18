import utils from 'osg/utils';
import NodeVisitor from 'osg/NodeVisitor';
import KdTree from 'osg/KdTree';

var KdTreeBuilder = function(options) {
    NodeVisitor.call(this);
    this._buildOptions = {
        _numVerticesProcessed: 0,
        _targetNumTrianglesPerLeaf: 50,
        _maxNumLevels: 20
    };

    if (!options) return;

    // merge options
    var perLeaf = options._targetNumTrianglesPerLeaf;
    var maxLevel = options._maxNumLevels;

    if (perLeaf !== undefined) this._buildOptions._targetNumTrianglesPerLeaf = perLeaf;
    if (maxLevel !== undefined) this._buildOptions._maxNumLevels = maxLevel;
};

utils.createPrototypeObject(
    KdTreeBuilder,
    utils.objectInherit(NodeVisitor.prototype, {
        apply: function(node) {
            if (node.getShape) {
                var shape = node.getShape();
                // we test if the kdTree is already built and if we can build it (null means we skip it)
                if (shape === undefined) {
                    var kdTree = new KdTree();
                    if (kdTree.build(this._buildOptions, node)) {
                        node.setShape(kdTree);
                    }
                }
            }
            this.traverse(node);
        }
    }),
    'osg',
    'KdTreeBuilder'
);

export default KdTreeBuilder;
