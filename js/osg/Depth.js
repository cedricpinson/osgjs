osg.Depth = function (func, near, far, writeMask) {
    osg.StateAttribute.call(this);
    
    this._func = osg.Depth.LESS;
    this._near = 0.0;
    this._far = 1.0;
    this._writeMask = true;

    if (func !== undefined) {
        if (typeof(func) === "string") {
            this._func = osg.Depth[func];
        } else {
            this._func = func;
        }
    }
    if (near !== undefined) {
        this._near = near;
    }
    if (far !== undefined) {
        this._far = far;
    }
    if (writeMask !== undefined) {
        this._writeMask = writeMask;
    }
};

osg.Depth.DISABLE   = 0x0000;
osg.Depth.NEVER     = 0x0200;
osg.Depth.LESS      = 0x0201;
osg.Depth.EQUAL     = 0x0202;
osg.Depth.LEQUAL    = 0x0203;
osg.Depth.GREATE    = 0x0204;
osg.Depth.NOTEQU    = 0x0205;
osg.Depth.GEQUAL    = 0x0206;
osg.Depth.ALWAYS    = 0x0207;

osg.Depth.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Depth",
    cloneType: function() {return new osg.Depth(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setRange: function(near, far) { this._near = near; this._far = far; },
    setWriteMask: function(mask) { this._writeMask = mask; },
    apply: function(state) {
        var gl = state.getGraphicContext();
        if (this._func === 0) {
            gl.disable(gl.DEPTH_TEST);
        } else {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(this._func);
            gl.depthMask(this._writeMask);
            gl.depthRange(this._near, this._far);
        }
    }
});
