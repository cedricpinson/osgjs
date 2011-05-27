osg.CullFace = function (mode) {
    osg.StateAttribute.call(this);
    this.mode = 'BACK';
    if (mode !== undefined) {
        this.mode = mode;
    }
};
osg.CullFace.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "CullFace",
    cloneType: function() {return new osg.CullFace(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) { 
        if (this.mode === 'DISABLE') {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl[this.mode]);
        }
        this._dirty = false;
    }
});
