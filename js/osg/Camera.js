/** 
 * Camera - is a subclass of Transform which represents encapsulates the settings of a Camera.
 * @class Camera
 * @inherits osg.Transform osg.CullSettings
 */
osg.Camera = function () {
    osg.Transform.call(this);
    osg.CullSettings.call(this);

    this.viewport = undefined;
    this.setClearColor([0, 0, 0, 1.0]);
    this.setClearDepth(1.0);
    this.setClearMask(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.setViewMatrix(osg.Matrix.makeIdentity());
    this.setProjectionMatrix(osg.Matrix.makeIdentity());
    this.renderOrder = osg.Camera.NESTED_RENDER;
    this.renderOrderNum = 0;
};
osg.Camera.PRE_RENDER = 0;
osg.Camera.NESTED_RENDER = 1;
osg.Camera.POST_RENDER = 2;

/** @lends osg.Camera.prototype */
osg.Camera.prototype = osg.objectInehrit(
    osg.CullSettings.prototype, 
    osg.objectInehrit(osg.Transform.prototype, {

        setClearDepth: function(depth) { this.clearDepth = depth;}, 
        getClearDepth: function() { return this.clearDepth;},

        setClearMask: function(mask) { this.clearMask = mask;}, 
        getClearMask: function() { return this.clearMask;},

        setClearColor: function(color) { this.clearColor = color;},
        getClearColor: function() { return this.clearColor;},

        setViewport: function(vp) { 
            this.viewport = vp;
            this.getOrCreateStateSet().setAttributeAndMode(vp);
        },
        getViewport: function() { return this.viewport; },


        setViewMatrix: function(matrix) {
            this.modelviewMatrix = matrix;
        },

        setProjectionMatrix: function(matrix) {
            this.projectionMatrix = matrix;
        },

        /** Set to an orthographic projection. See OpenGL glOrtho for documentation further details.*/
        setProjectionMatrixAsOrtho: function(left, right,
                                             bottom, top,
                                             zNear, zFar) {
            osg.Matrix.makeOrtho(left, right, bottom, top, zNear, zFar, this.getProjectionMatrix());
        },

        getViewMatrix: function() { return this.modelviewMatrix; },
        getProjectionMatrix: function() { return this.projectionMatrix; },
        getRenderOrder: function() { return this.renderOrder; },
        setRenderOrder: function(order, orderNum) {
            this.renderOrder = order;
            this.renderOrderNum = orderNum; 
        },

        attachTexture: function(bufferComponent, texture, level) {
            if (this.frameBufferObject) {
                this.frameBufferObject.dirty();
            }
            if (level === undefined) {
                level = 0;
            }
            if (this.attachments === undefined) {
                this.attachments = {};
            }
            this.attachments[bufferComponent] = { 'texture' : texture , 'level' : level };
        },

        attachRenderBuffer: function(bufferComponent, internalFormat) {
            if (this.frameBufferObject) {
                this.frameBufferObject.dirty();
            }
            if (this.attachments === undefined) {
                this.attachments = {};
            }
            this.attachments[bufferComponent] = { 'format' : internalFormat };
        },

        computeLocalToWorldMatrix: function(matrix,nodeVisitor) {
            if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
                osg.Matrix.preMult(matrix, this.modelviewMatrix);
            } else {// absolute
                matrix = this.modelviewMatrix;
            }
            return true;
        },

        computeWorldToLocalMatrix: function(matrix, nodeVisitor) {
            var inverse = osg.Matrix.inverse(this.modelviewMatrix);
            if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
                osg.Matrix.postMult(inverse, matrix);
            } else {
                matrix = inverse;
            }
            return true;
        }

    }));
osg.Camera.prototype.objectType = osg.objectType.generate("Camera");

