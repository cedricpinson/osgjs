osg.Viewport = function (x,y, w, h) {
    osg.StateAttribute.call(this);

    if (x === undefined) { x = 0; }
    if (y === undefined) { y = 0; }
    if (w === undefined) { w = 800; }
    if (h === undefined) { h = 600; }

    var xstart = x;
    var ystart = y;
    var width = w;
    var height = h;
    this.x = function() { return xstart; };
    this.y = function() { return ystart; };
    this.width = function() { return width; };
    this.height = function() { return height; };
    this.computeWindowMatrix = function() {
        // res = Matrix offset * Matrix scale * Matrix translate
        var translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
        var scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
        var offset = osg.Matrix.makeTranslate(xstart,ystart,0.0);
        //return osg.Matrix.mult(osg.Matrix.mult(translate, scale, translate), offset, offset);
        return osg.Matrix.preMult(offset, osg.Matrix.preMult(scale, translate));
    };
    this._dirty = true;
};
osg.Viewport.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Viewport",
    cloneType: function() {return new osg.Viewport(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) {
        gl.viewport(this.x(), this.y(), this.width(), this.height()); 
        this._dirty = false;
    }
});
