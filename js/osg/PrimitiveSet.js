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
    var d = new osg.DrawArrays(mode, first, count);
    return d;
};


/** 
 * DrawArrayLengths manage rendering primitives
 * @class DrawArrayLengths
 */
osg.DrawArrayLengths = function (mode, first, array)
{
    this._mode = mode;
    this._first = first;
    this._arrayLengths = array.slice(0);
};

/** @lends osg.DrawArrayLengths.prototype */
osg.DrawArrayLengths.prototype = {
    draw: function(state) {
        var gl = state.getGraphicContext();
        var mode = this._mode;
        var first = this._first;
        var array = this._arrayLengths;
        for (var i = 0, l = array.length; i < l; i++) {
            var count = array[i];
            gl.drawArrays(mode, first, count);
            first += count;
        }
    },
    getMode: function() { return this._mode; },
    getNumIndices: function() {
        var count = 0;
        var array = this._arrayLengths;
        for (var i = 0, l = array.length; i < l; i++) {
            count += array[i];
        }
        return count; 
    },
    getArrayLengths: function() { return this._arrayLengths; },
    getFirst: function() { return this._first; },
    setFirst: function(first) { this._first = first; }
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
        this.setIndices(indices);
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
    setIndices: function(indices) { 
        this.indices = indices;
        this.count = indices.getElements().length;
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
