/** 
 * FrameBufferObject manage fbo / rtt 
 * @class FrameBufferObject
 */
osg.FrameBufferObject = function () {
    osg.StateAttribute.call(this);
    this.fbo = undefined;
    this.attachments = [];
    this.dirty();
};

/** @lends osg.FrameBufferObject.prototype */
osg.FrameBufferObject.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "FrameBufferObject",
    cloneType: function() {return new osg.FrameBufferObject(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setAttachment: function(attachment) { this.attachments.push(attachment); },
    apply: function(state) {
        var status;
        if (this.attachments.length > 0) {
            if (this.isDirty()) {

                if (!this.fbo) {
                    this.fbo = gl.createFramebuffer();
                }

                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                var hasRenderBuffer = false;
                for (var i = 0, l = this.attachments.length; i < l; ++i) {
                    
                    if (this.attachments[i].texture === undefined) { // render buffer
                        var rb = gl.createRenderbuffer();
                        gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
                        gl.renderbufferStorage(gl.RENDERBUFFER, this.attachments[i].format, this.attachments[i].width, this.attachments[i].height);
                        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, this.attachments[i].attachment, gl.RENDERBUFFER, rb);
                        hasRenderBuffer = true;
                    } else {
                        var texture = this.attachments[i].texture;
                        // apply on unit 0 to init it
                        state.applyTextureAttribute(0, texture);
                        
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachments[i].attachment, gl[texture.target], texture.textureObject, this.attachments[i].level);
                    }
                }
                status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (status !== 0x8CD5) {
                    osg.log("framebuffer error check " + status);
                }
                
                if (hasRenderBuffer) { // set it to null only if used renderbuffer
                    gl.bindRenderbuffer(null);
                }
                this.setDirty(false);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                if (osg.reportErrorGL === true) {
                    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                    if (status !== 0x8CD5) {
                        osg.log("framebuffer error check " + status);
                    }
                }
            }
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }
});
