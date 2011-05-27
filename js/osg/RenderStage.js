/**
 * From OpenSceneGraph http://www.openscenegraph.org
 * RenderStage base class. Used for encapsulate a complete stage in
 * rendering - setting up of viewport, the projection and model
 * matrices and rendering the RenderBin's enclosed with this RenderStage.
 * RenderStage also has a dependency list of other RenderStages, each
 * of which must be called before the rendering of this stage.  These
 * 'pre' rendering stages are used for advanced rendering techniques
 * like multistage pixel shading or impostors.
 */
osg.RenderStage = function () {
    osg.RenderBin.call(this);
    this.positionedAttribute = [];
    this.clearDepth = 1.0;
    this.clearColor = [0,0,0,1];
    this.clearMask = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
    this.camera = undefined;
    this.viewport = undefined;
    this.preRenderList = [];
    this.postRenderList = [];
    this.renderStage = this;
};
osg.RenderStage.prototype = osg.objectInehrit(osg.RenderBin.prototype, {
    reset: function() { 
        osg.RenderBin.prototype.reset.call(this);
        this.preRenderList.length = 0;
        this.postRenderList.length = 0;
    },
    setClearDepth: function(depth) { this.clearDepth = depth;},
    getClearDepth: function() { return this.clearDepth;},
    setClearColor: function(color) { this.clearColor = color;},
    getClearColor: function() { return this.clearColor;},
    setClearMask: function(mask) { this.clearMask = mask;},
    getClearMask: function() { return this.clearMask;},
    setViewport: function(vp) { this.viewport = vp; },
    getViewport: function() { return this.viewport; },
    setCamera: function(camera) { this.camera = camera; },
    addPreRenderStage: function(rs, order) {
        for (var i = 0, l = this.preRenderList.length; i < l; i++) {
            var render = this.preRenderList[i];
            if (order < render.order) {
                break;
            }
        }
        if (i < this.preRenderList.length) {
            this.preRenderList = this.preRenderList.splice(i,0, { 'order' : order, 'renderStage' : rs });
        } else {
            this.preRenderList.push({ 'order' : order, 'renderStage' : rs });
        }
    },
    addPostRenderStage: function(rs, order) {
        for (var i = 0, l = this.postRenderList.length; i < l; i++) {
            var render = this.postRenderList[i];
            if (order < render.order) {
                break;
            }
        }
        if (i < this.postRenderList.length) {
            this.postRenderList = this.postRenderList.splice(i,0, { 'order' : order, 'renderStage' : rs });
        } else {
            this.postRenderList.push({ 'order' : order, 'renderStage' : rs });
        }
    },

    drawPreRenderStages: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        for (var i = 0, l = this.preRenderList.length; i < l; ++i) {
            var sg = this.preRenderList[i].renderStage;
            previous = sg.draw(state, previous);
        }
        return previous;
    },

    draw: function(state, previousRenderLeaf) {
        var previous = this.drawPreRenderStages(state, previousRenderLeaf);
        previous = this.drawImplementation(state, previous);

        previous = this.drawPostRenderStages(state, previous);
        return previous;
    },

    drawPostRenderStages: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        for (var i = 0, l = this.postRenderList.length; i < l; ++i) {
            var sg = this.postRenderList[i].renderStage;
            previous = sg.draw(state, previous);
        }
        return previous;
    },

    applyCamera: function(state) {
        if (this.camera === undefined) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        var viewport = this.camera.getViewport();
        var fbo = this.camera.frameBufferObject;
        if (this.camera.frameBufferObject === undefined) {
            fbo = new osg.FrameBufferObject();
            this.camera.frameBufferObject = fbo;
            if (this.camera.attachments !== undefined) {
                for ( var key in this.camera.attachments) {
                    var a = this.camera.attachments[key];
                    var attach = undefined;
                    if (a.texture === undefined) { //renderbuffer
                        attach = { attachment: key, 
                                   format: a.format, 
                                   width: viewport.width(),
                                   height: viewport.height()
                                 };
                    } else if (a.texture !== undefined) {
                        attach = { 
                            attachment: key, 
                            texture: a.texture, 
                            level: a.level 
                        };
                        if (a.format) {
                            attach.format = a.format;
                        }
                    }
                    fbo.setAttachment(attach);
                }
            }
        }
        fbo.apply(state);
    },

    drawImplementation: function(state, previousRenderLeaf) {
        var error;
        if (osg.reportErrorGL === true) {
            error = gl.getError();
            osg.checkError(error);
        }

        this.applyCamera(state);

        if (this.viewport === undefined) {
            osg.log("RenderStage does not have a valid viewport");
        }

        state.applyAttribute(this.viewport);

        if (this.clearMask & gl.COLOR_BUFFER_BIT) {
            gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        }
        if (this.clearMask & gl.DEPTH_BUFFER_BIT) {
            gl.clearDepth(this.clearDepth);
        }
        gl.clear(this.clearMask);

        if (this.positionedAttribute) {
            this.applyPositionedAttribute(state, this.positionedAttribute);
        }

        var previous = osg.RenderBin.prototype.drawImplementation.call(this, state, previousRenderLeaf);

        if (osg.reportErrorGL === true) {
            error = gl.getError();
            osg.checkError(error);
        }

        return previous;
    }
});
