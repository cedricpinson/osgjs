/** 
 *  Manage CullFace attribute
 *  @class CullFace
 */
osg.CullFace = function (mode) {
    osg.StateAttribute.call(this);
    if (mode === undefined) {
        mode = osg.CullFace.BACK;
    }
    this.setMode(mode);
};

osg.CullFace.DISABLE        = 0x0;
osg.CullFace.FRONT          = 0x0404;
osg.CullFace.BACK           = 0x0405;
osg.CullFace.FRONT_AND_BACK = 0x0408;

/** @lends osg.CullFace.prototype */
osg.CullFace.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "CullFace",
    cloneType: function() {return new osg.CullFace(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setMode: function(mode) {
        if ( typeof mode === 'string') {
            mode = osg.CullFace[mode];
        }
        this._mode = mode;
    },
    getMode: function() { return this._mode; },
    apply: function(state) {
        var gl = state.getGraphicContext();
        if (this._mode === osg.CullFace.DISABLE) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(this._mode);
        }
        this._dirty = false;
    }
});
