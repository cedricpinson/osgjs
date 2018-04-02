import primitiveSet from 'osg/primitiveSet';

/**
 * DrawElements manage rendering of indexed primitives
 * @class DrawElements
 */
var DrawElements = function(mode, indices) {
    this._mode = primitiveSet.POINTS;
    if (mode !== undefined) {
        if (typeof mode === 'string') {
            mode = primitiveSet[mode];
        }
        this._mode = mode;
    }
    this._count = 0;
    this._offset = 0;
    this._indices = indices;
    this._uType = DrawElements.UNSIGNED_SHORT;
    if (indices !== undefined) {
        this.setIndices(indices);
    }
};

DrawElements.UNSIGNED_BYTE = 0x1401;
DrawElements.UNSIGNED_SHORT = 0x1403;
DrawElements.UNSIGNED_INT = 0x1405;

/** @lends DrawElements.prototype */
DrawElements.prototype = {
    getMode: function() {
        return this._mode;
    },
    draw: function(state) {
        if (this._count === 0) return;
        state.setIndexArray(this._indices);
        this.drawElements(state);
    },
    drawElements: function(state) {
        var gl = state.getGraphicContext();
        gl.drawElements(this._mode, this._count, this._uType, this._offset);
    },
    setIndices: function(indices) {
        this._indices = indices;
        var elts = indices.getElements();
        this._count = elts.length;

        var nbBytes = elts.BYTES_PER_ELEMENT;
        if (nbBytes === 1) this._uType = DrawElements.UNSIGNED_BYTE;
        else if (nbBytes === 2) this._uType = DrawElements.UNSIGNED_SHORT;
        else if (nbBytes === 4) this._uType = DrawElements.UNSIGNED_INT;
    },
    getIndices: function() {
        return this._indices;
    },
    setFirst: function(val) {
        this._offset = val;
    },
    getFirst: function() {
        return this._offset;
    },
    setCount: function(val) {
        this._count = val;
    },
    getCount: function() {
        return this._count;
    },
    getNumIndices: function() {
        return this._indices.getElements().length;
    },
    index: function(i) {
        return this._indices.getElements()[i];
    }
};

export default DrawElements;
