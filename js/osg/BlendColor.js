/** 
 *  Manage BlendColor attribute
 *  @class BlendColor
 */
osg.BlendColor = function (color) {
    osg.StateAttribute.call(this);
    this._constantColor = new Array(4);
    this._constantColor[0] = this._constantColor[1] = this._constantColor[2] =this._constantColor[3] = 1.0;
    if (color !== undefined) {
        this.setConstantColor(color);
    }
};

/** @lends osg.BlendColor.prototype */
osg.BlendColor.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "BlendColor",
    cloneType: function() {return new osg.BlendColor(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setConstantColor: function(color) {
        osg.Vec4.copy(color, this._constantColor);
    },
    getConstantColor: function() { return this._constantColor; },
    apply: function(state) {
        var gl = state.getGraphicContext();
        gl.blendColor(this._constantColor[0],
                      this._constantColor[1],
                      this._constantColor[2],
                      this._constantColor[3]);
        this._dirty = false;
    }
});
