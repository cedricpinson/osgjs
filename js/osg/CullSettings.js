osg.CullSettings = function() {
    this.computeNearFar = true;
    this.nearFarRatio = 0.0005;

    var lookVector =[0.0,0.0,-1.0];
    this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this.bbCornerNear = (~this.bbCornerFar)&7;
};
osg.CullSettings.prototype = {
    setCullSettings: function(settings) {
        this.computeNearFar = settings.computeNearFar;
        this.nearFarRatio = settings.nearFarRatio;
    },
    setNearFarRatio: function( ratio) { this.nearFarRatio = ratio; },
    getNearFarRatio: function() { return this.nearFarRatio; },
    setComputeNearFar: function(value) { this.computeNearFar = value; },
    getComputeNearFar: function() { return this.computeNearFar; }
};
