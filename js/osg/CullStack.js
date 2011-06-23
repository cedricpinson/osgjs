osg.CullStack = function() {
    this.modelviewMatrixStack = [osg.Matrix.makeIdentity()];
    this.projectionMatrixStack = [osg.Matrix.makeIdentity()];
    this.viewportStack = [];
};

osg.CullStack.prototype = {
    getViewport: function () {
        if (this.viewportStack.length === 0) {
            return undefined;
        }
        return this.viewportStack[this.viewportStack.length-1];
    },
    getLookVectorLocal: function() {
        var m = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
        return [ -m[2], -m[6], -m[10] ];
    },
    pushViewport: function (vp) {
        this.viewportStack.push(vp);
    },
    popViewport: function () {
        this.viewportStack.pop();
    },
    pushModelviewMatrix: function (matrix) {
        this.modelviewMatrixStack.push(matrix);

        var lookVector = this.getLookVectorLocal();
        this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);        
        this.bbCornerNear = (~this.bbCornerFar)&7;
    },
    popModelviewMatrix: function () {

        this.modelviewMatrixStack.pop();
        var lookVector;
        if (this.modelviewMatrixStack.length !== 0) {
            lookVector = this.getLookVectorLocal();
        } else {
            lookVector = [0,0,-1];
        }
        this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
        this.bbCornerNear = (~this.bbCornerFar)&7;

    },
    pushProjectionMatrix: function (matrix) {
        this.projectionMatrixStack.push(matrix);
    },
    popProjectionMatrix: function () {
        this.projectionMatrixStack.pop();
    }
};
