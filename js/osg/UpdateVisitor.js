osg.UpdateVisitor = function () { 
    osg.NodeVisitor.call(this);
    var framestamp = new osg.FrameStamp();
    this.getFrameStamp = function() { return framestamp; };
    this.setFrameStamp = function(s) { framestamp = s; };
};
osg.UpdateVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    apply: function(node) {
        if (node.getUpdateCallback !== undefined) {
            var cb = node.getUpdateCallback();
            if (cb !== undefined) {
                cb.update(node, this);
                return;
            }
        }
        if (node.traverse) {
            this.traverse(node);
        }
    }
});
