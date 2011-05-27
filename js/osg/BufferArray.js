osg.BufferArray = function () {
    if (osg.BufferArray.instanceID === undefined) {
        osg.BufferArray.instanceID = 0;
    }
    this.instanceID = osg.BufferArray.instanceID;
    osg.BufferArray.instanceID += 1;
    this._dirty = true;
};
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
    var a = new osg.BufferArray();
    a.itemSize = itemSize;
    a.type = type;
    if (a.type === gl.ELEMENT_ARRAY_BUFFER) {
        a.elements = new osg.Uint16Array(elements);
    } else {
        a.elements = new osg.Float32Array(elements);
    }
    return a;
};
