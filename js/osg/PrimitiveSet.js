osg.PrimitiveSet = function() {};
osg.PrimitiveSet.POINTS                         = 0x0000;
osg.PrimitiveSet.LINES                          = 0x0001;
osg.PrimitiveSet.LINE_LOOP                      = 0x0002;
osg.PrimitiveSet.LINE_STRIP                     = 0x0003;
osg.PrimitiveSet.TRIANGLES                      = 0x0004;
osg.PrimitiveSet.TRIANGLE_STRIP                 = 0x0005;
osg.PrimitiveSet.TRIANGLE_FAN                   = 0x0006;

/** 
 * DrawArrays manage rendering primitives
 * @class DrawArrays
 */
osg.DrawArrays = function (mode, first, count) 
{
    this.mode = mode;
    this.first = first;
    this.count = count;
};

/** @lends osg.DrawArrays.prototype */
osg.DrawArrays.prototype = {
    draw: function(state) {
        var gl = state.getGraphicContext();
        gl.drawArrays(this.mode, this.first, this.count);
    },
    getMode: function() { return this.mode; },
    getCount: function() { return this.count; },
    getFirst: function() { return this.first; }
};
osg.DrawArrays.create = function(mode, first, count) {
    osg.log("osg.DrawArrays.create is deprecated, use new osg.DrawArrays with same arguments");
    var d = new osg.DrawArray(mode, first, count);
    return d;
};


/** 
 * DrawElements manage rendering of indexed primitives
 * @class DrawElements
 */
osg.DrawElements = function (mode, indices) {
    this.mode = osg.PrimitiveSet.POINTS;
    if (mode !== undefined) {
        this.mode = mode;
    }

    this.count = 0;
    this.offset = 0;
    this.indices = indices;
    if (indices !== undefined) {
        this.count = indices.getElements().length;
    }
};

/** @lends osg.DrawElements.prototype */
osg.DrawElements.prototype = {
    getMode: function() { return this.mode; },
    draw: function(state) {
        state.setIndexArray(this.indices);
        var gl = state.getGraphicContext();
        gl.drawElements(this.mode, this.count, gl.UNSIGNED_SHORT, this.offset );
    },
    getIndices: function() { return this.indices; },
    setFirst: function(val) { this.offset = val; },
    getFirst: function() { return this.offset;},
    setCount: function(val) { this.count = val;},
    getCount: function() { return this.count; }

};

osg.DrawElements.create = function(mode, indices) {
    osg.log("osg.DrawElements.create is deprecated, use new osg.DrawElements with same arguments");
    return new osg.DrawElements(mode, indices);
};
