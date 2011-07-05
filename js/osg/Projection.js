osg.Projection = function () {
    osg.Node.call(this);
    this.projection = osg.Matrix.makeIdentity();
};
osg.Projection.prototype = osg.objectInehrit(osg.Node.prototype, {
    getProjectionMatrix: function() { return this.projection; },
    setProjectionMatrix: function(m) { this.projection = m; }
});
osg.Projection.prototype.objectType = osg.objectType.generate("Projection");
