osg.Depth = function (func, near, far, writeMask) {
    osg.StateAttribute.call(this);
    this.func = 'LESS';
    this.near = 0.0;
    this.far = 1.0;
    this.writeMask = true;

    if (func !== undefined) {
        this.func = func;
    }
    if (near !== undefined) {
        this.near = near;
    }
    if (far !== undefined) {
        this.far = far;
    }
    if (writeMask !== undefined) {
        this.writeMask = far;
    }
};
osg.Depth.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Depth",
    cloneType: function() {return new osg.Depth(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setRange: function(near, far) { this.near = near; this.far = far; },
    setWriteMask: function(mask) { this.mask = mask; },
    apply: function(state) {
        if (this.func === 'DISABLE') {
            gl.disable(gl.DEPTH_TEST);
        } else {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl[this.func]);
            gl.depthMask(this.writeMask);
            gl.depthRange(this.near, this.far);
        }
    }
});
