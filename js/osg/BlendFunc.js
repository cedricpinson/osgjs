/** 
 *  Manage Blending mode
 *  @class BlendFunc
 */
osg.BlendFunc = function (source, destination) {
    osg.StateAttribute.call(this);
    this.sourceFactor = 'ONE';
    this.destinationFactor = 'ZERO';
    if (source !== undefined) {
        this.sourceFactor = source;
    }
    if (destination !== undefined) {
        this.destinationFactor = destination;
    }
};
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
    /** 
        Apply the mode, must be called in the draw traversal
        @param state
    */
    apply: function(state) { 
        gl.blendFunc(gl[this.sourceFactor], gl[this.destinationFactor]); 
    }
});
