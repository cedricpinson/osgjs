osg.UpdateVisitor = function () { 
    osg.NodeVisitor.call(this);
    var framestamp = new osg.FrameStamp();
    this.getFrameStamp = function() { return framestamp; };
    this.setFrameStamp = function(s) { framestamp = s; };
};
osg.UpdateVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    apply: function(node) {
        var ncs = node.getUpdateCallbackList();
        for (var i = 0, l = ncs.length; i < l; i++) {
            if (!ncs[i].update(node, this)) {
                return;
            }
        }
        this.traverse(node);
    }
});
