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
osg.BlendFunc.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "BlendFunc",
    cloneType: function() {return new osg.BlendFunc(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) { 
        gl.blendFunc(gl[this.sourceFactor], gl[this.destinationFactor]); 
    }
});
