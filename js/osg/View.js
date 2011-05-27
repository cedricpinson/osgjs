osg.View = function() { osg.Camera.call(this); };
osg.View.prototype = osg.objectInehrit(osg.Camera.prototype, {
    computeIntersections: function (x, y, traversalMask) {
        if (traversalMask === undefined) {
            traversalMask = ~0;
        }
        
        var iv = new osgUtil.IntersectVisitor();
        iv.setTraversalMask(traversalMask);
        iv.addLineSegment([x,y,0.0], [x,y,1.0]);
        iv.apply(this);
        return iv.hits;
    }
});
