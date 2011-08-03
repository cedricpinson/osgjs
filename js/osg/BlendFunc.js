/** 
 *  Manage Blending mode
 *  @class BlendFunc
 */
osg.BlendFunc = function (sourceRGB, destinationRGB, sourceAlpha, destinationAlpha) {
    osg.StateAttribute.call(this);
    this._sourceFactor = osg.BlendFunc.ONE;
    this._destinationFactor = osg.BlendFunc.ZERO;
    this._sourceFactorAlpha = this._sourceFactor;
    this._destinationFactorAlpha = this._destinationFactor;
    this._separate = false;
    if (sourceRGB !== undefined) {
        this.setSource(sourceRGB);
    }
    if (destinationRGB !== undefined) {
        this.setDestination(destinationRGB);
    }

    if (sourceAlpha !== undefined) {
        this.setSourceAlpha(sourceAlpha);
    }
    if (destinationAlpha !== undefined) {
        this.setDestinationAlpha(destinationAlpha);
    }
};

osg.BlendFunc.ZERO                           = 0;
osg.BlendFunc.ONE                            = 1;
osg.BlendFunc.SRC_COLOR                      = 0x0300;
osg.BlendFunc.ONE_MINUS_SRC_COLOR            = 0x0301;
osg.BlendFunc.SRC_ALPHA                      = 0x0302;
osg.BlendFunc.ONE_MINUS_SRC_ALPHA            = 0x0303;
osg.BlendFunc.DST_ALPHA                      = 0x0304;
osg.BlendFunc.ONE_MINUS_DST_ALPHA            = 0x0305;
osg.BlendFunc.DST_COLOR                      = 0x0306;
osg.BlendFunc.ONE_MINUS_DST_COLOR            = 0x0307;
osg.BlendFunc.SRC_ALPHA_SATURATE             = 0x0308;

/* Separate Blend Functions */
osg.BlendFunc.BLEND_DST_RGB                  = 0x80C8;
osg.BlendFunc.BLEND_SRC_RGB                  = 0x80C9;
osg.BlendFunc.BLEND_DST_ALPHA                = 0x80CA;
osg.BlendFunc.BLEND_SRC_ALPHA                = 0x80CB;
osg.BlendFunc.CONSTANT_COLOR                 = 0x8001;
osg.BlendFunc.ONE_MINUS_CONSTANT_COLOR       = 0x8002;
osg.BlendFunc.CONSTANT_ALPHA                 = 0x8003;
osg.BlendFunc.ONE_MINUS_CONSTANT_ALPHA       = 0x8004;
osg.BlendFunc.BLEND_COLOR                    = 0x8005;


/** @lends osg.BlendFunc.prototype */
osg.BlendFunc.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    /** 
        StateAttribute type of BlendFunc
        @type String
     */
    attributeType: "BlendFunc",
    /** 
        Create an instance of this StateAttribute
    */ 
    cloneType: function() /**osg.BlendFunc*/ {return new osg.BlendFunc(); },
    /** 
        @type String
    */ 
    getType: function() { return this.attributeType;},
    /** 
        @type String
    */ 
    getTypeMember: function() { return this.attributeType;},
    setSource: function(f) { 
        this.setSourceRGB(f); 
        this.setSourceAlpha(f); 
    },
    setDestination: function(f) { 
        this.setDestinationRGB(f); 
        this.setDestinationAlpha(f);
    },
    checkSeparate: function() {
        return (this._sourceFactor !== this._sourceFactorAlpha ||
                this._destinationFactor !== this._destinationFactorAlpha);
    },
    setSourceRGB: function(f) { 
        if (typeof f === "string") {
            this._sourceFactor = osg.BlendFunc[f];
        } else {
            this._sourceFactor = f;
        }
        this._separate = this.checkSeparate();
    },
    setSourceAlpha: function(f) {
        if (typeof f === "string") {
            this._sourceFactorAlpha = osg.BlendFunc[f];
        } else {
            this._sourceFactorAlpha = f;
        }
        this._separate = this.checkSeparate();
    },
    setDestinationRGB: function(f) { 
        if (typeof f === "string") {
            this._destinationFactor = osg.BlendFunc[f];
        } else {
            this._destinationFactor = f;
        }
        this._separate = this.checkSeparate();
    },
    setDestinationAlpha: function(f) { 
        if (typeof f === "string") {
            this._destinationFactorAlpha = osg.BlendFunc[f];
        } else {
            this._destinationFactorAlpha = f;
        }
        this._separate = this.checkSeparate();
    },

    /** 
        Apply the mode, must be called in the draw traversal
        @param state
    */
    apply: function(state) {
        var gl = state.getGraphicContext();
        gl.enable(gl.BLEND);
        if (this._separate) {
            gl.blendFuncSeparate(this._sourceFactor, this._destinationFactor,
                                 this._sourceFactorAlpha, this._destinationFactorAlpha);
        } else {
            gl.blendFunc(this._sourceFactor, this._destinationFactor); 
        }
    }
});
