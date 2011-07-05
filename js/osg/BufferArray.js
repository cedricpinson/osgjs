/** 
 * BufferArray manage vertex / normal / ... array used by webgl.
 * @class BufferArray
 */
osg.BufferArray = function (type, elements, itemSize) {
    if (osg.BufferArray.instanceID === undefined) {
        osg.BufferArray.instanceID = 0;
    }
    this.instanceID = osg.BufferArray.instanceID;
    osg.BufferArray.instanceID += 1;
    this.dirty();

    this.itemSize = itemSize;
    this.type = type;
    if (this.type === gl.ELEMENT_ARRAY_BUFFER) {
        this.elements = new osg.Uint16Array(elements);
    } else {
        this.elements = new osg.Float32Array(elements);
    }
};

/** @lends osg.BufferArray.prototype */
osg.BufferArray.prototype = {
    init: function() {
        if (!this.buffer && this.elements.length > 0 ) {
            this.buffer = gl.createBuffer();
            this.buffer.itemSize = this.itemSize;
            this.buffer.numItems = this.elements.length / this.itemSize;
        }
    },
    dirty: function() { this._dirty = true; },
    isDirty: function() { return this._dirty; },
    compile: function() {
        if (this._dirty) {
            gl.bufferData(this.type, this.elements, gl.STATIC_DRAW);
            this._dirty = false;
        }
    },
    getElements: function() { return this.elements;}
};

osg.BufferArray.create = function(type, elements, itemSize) {
    osg.log("osg.BufferArray.create is deprecated, use new osg.BufferArray with same arguments instead");
    return new osg.BufferArray(type, elements, itemSize);
};
