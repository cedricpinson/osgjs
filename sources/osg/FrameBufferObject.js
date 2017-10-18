import notify from 'osg/notify';
import utils from 'osg/utils';
import GLObject from 'osg/GLObject';
import StateAttribute from 'osg/StateAttribute';
import Timer from 'osg/Timer';
import WebglCaps from 'osg/WebGLCaps';

/**
 * FrameBufferObject manage fbo / rtt
 * @class FrameBufferObject
 */
var FrameBufferObject = function() {
    GLObject.call(this);
    StateAttribute.call(this);

    this._fbo = undefined;
    this._rbo = undefined;
    this._attachments = [];
    this._buffers = [];
    this._dirty = true;
    this._hasMRT = WebglCaps.instance().getWebGLExtension('WEBGL_draw_buffers');
};

FrameBufferObject.COLOR_ATTACHMENT0 = 0x8ce0;
FrameBufferObject.DEPTH_ATTACHMENT = 0x8d00;
FrameBufferObject.DEPTH_COMPONENT16 = 0x81a5;

// static cache of glFrameBuffer flagged for deletion, which will actually
// be deleted in the correct GL context.
FrameBufferObject._sDeletedGLFrameBufferCache = new window.Map();

// static method to delete FrameBuffers
FrameBufferObject.deleteGLFrameBuffer = function(gl, fb) {
    if (!FrameBufferObject._sDeletedGLFrameBufferCache.has(gl))
        FrameBufferObject._sDeletedGLFrameBufferCache.set(gl, []);

    FrameBufferObject._sDeletedGLFrameBufferCache.get(gl).push(fb);
};

// static method to flush all the cached glFrameBuffers which need to be deleted in the GL context specified
FrameBufferObject.flushDeletedGLFrameBuffers = function(gl, availableTime) {
    // if no time available don't try to flush objects.
    if (availableTime <= 0.0) return availableTime;

    if (!FrameBufferObject._sDeletedGLFrameBufferCache.has(gl)) return availableTime;
    var deleteList = FrameBufferObject._sDeletedGLFrameBufferCache.get(gl);
    if (deleteList.length === 0) return availableTime;

    var elapsedTime = 0.0;
    var beginTime = Timer.instance().tick();
    var numBuffers = deleteList.length;
    for (var i = numBuffers - 1; i >= 0 && elapsedTime < availableTime; i--) {
        gl.deleteFramebuffer(deleteList[i]);
        deleteList.splice(i, 1);
        elapsedTime = Timer.instance().deltaS(beginTime, Timer.instance().tick());
    }

    return availableTime - elapsedTime;
};

FrameBufferObject.flushAllDeletedGLFrameBuffers = function(gl) {
    if (!FrameBufferObject._sDeletedGLFrameBufferCache.has(gl)) return;
    var deleteList = FrameBufferObject._sDeletedGLFrameBufferCache.get(gl);
    if (deleteList.length === 0) return;
    var numBuffers = deleteList.length;
    for (var i = numBuffers - 1; i >= 0; i--) {
        gl.deleteFramebuffer(deleteList[i]);
        deleteList.splice(i, 1);
    }
};

// static cache of glRenderBuffer flagged for deletion, which will actually
// be deleted in the correct GL context.
FrameBufferObject._sDeletedGLRenderBufferCache = new window.Map();

// static method to delete RenderBuffers
FrameBufferObject.deleteGLRenderBuffer = function(gl, fb) {
    if (!FrameBufferObject._sDeletedGLRenderBufferCache.has(gl))
        FrameBufferObject._sDeletedGLRenderBufferCache.set(gl, []);

    FrameBufferObject._sDeletedGLRenderBufferCache.get(gl).push(fb);
};

// static method to flush all the cached glRenderBuffers which need to be deleted in the GL context specified
FrameBufferObject.flushDeletedGLRenderBuffers = function(gl, availableTime) {
    // if no time available don't try to flush objects.
    if (availableTime <= 0.0) return availableTime;

    if (!FrameBufferObject._sDeletedGLRenderBufferCache.has(gl)) return availableTime;

    var elapsedTime = 0.0;
    var beginTime = Timer.instance().tick();
    var deleteList = FrameBufferObject._sDeletedGLRenderBufferCache.get(gl);
    var numBuffers = deleteList.length;

    for (var i = numBuffers - 1; i >= 0 && elapsedTime < availableTime; i--) {
        gl.deleteRenderbuffer(deleteList[i]);
        deleteList.splice(i, 1);
        elapsedTime = Timer.instance().deltaS(beginTime, Timer.instance().tick());
    }
    return availableTime - elapsedTime;
};

FrameBufferObject.flushAllDeletedGLRenderBuffers = function(gl) {
    if (!FrameBufferObject._sDeletedGLRenderBufferCache.has(gl)) return;

    var deleteList = FrameBufferObject._sDeletedGLRenderBufferCache.get(gl);
    var numBuffers = deleteList.length;

    for (var i = numBuffers - 1; i >= 0; i--) {
        gl.deleteRenderbuffer(deleteList[i]);
        deleteList.splice(i, 1);
    }
};

FrameBufferObject.onLostContext = function(gl) {
    if (!FrameBufferObject._sDeletedGLFrameBufferCache.has(gl)) return;

    var deleteList = FrameBufferObject._sDeletedGLFrameBufferCache.get(gl);
    deleteList.length = 0;

    if (!FrameBufferObject._sDeletedGLRenderBufferCache.has(gl)) return;

    deleteList = FrameBufferObject._sDeletedGLRenderBufferCache.get(gl);
    deleteList.length = 0;
};

/** @lends FrameBufferObject.prototype */
utils.createPrototypeStateAttribute(
    FrameBufferObject,
    utils.objectInherit(
        GLObject.prototype,
        utils.objectInherit(StateAttribute.prototype, {
            attributeType: 'FrameBufferObject',

            cloneType: function() {
                return new FrameBufferObject();
            },

            invalidate: function() {
                if (this._rbo && this._attachments) {
                    for (var i = 0, l = this._attachments.length; i < l; ++i) {
                        var attachment = this._attachments[i];
                        // shared renderbuffer object between camera
                        // must still be set to null as it's webgl object
                        // apply will reshare it when creating it.
                        if (!attachment.texture) {
                            attachment.renderBufferObject = undefined;
                        }
                    }
                    this._rbo = undefined;
                }
                this._fbo = undefined;
                this._buffers.length = 0;
                this._dirty = true;
            },

            dirty: function() {
                this._buffers.length = 0;
                this._dirty = true;
            },

            isDirty: function() {
                return this._dirty;
            },

            setAttachment: function(attachment) {
                this._attachments.push(attachment);
            },

            getAttachment: function(attachmentType) {
                if (!this._attachments) return;
                for (var i = 0, l = this._attachments.length; i < l; ++i) {
                    var attachment = this._attachments[i];
                    // shared renderbuffer object between camera
                    // must still be set to null as it's webgl object
                    // apply will reshare it when creating it.
                    if (attachment.attachment === attachmentType) {
                        return attachment;
                    }
                }
                return;
            },
            releaseGLObjects: function() {
                if (this._fbo !== undefined && this._gl !== undefined) {
                    FrameBufferObject.deleteGLFrameBuffer(this._gl, this._fbo);
                }
                this._fbo = undefined;

                if (this._rbo !== undefined && this._gl !== undefined) {
                    FrameBufferObject.deleteGLRenderBuffer(this._gl, this._rbo);
                }
                this.invalidate();
            },

            _reportFrameBufferError: function(code) {
                switch (code) {
                    case 0x8cd6:
                        notify.debug('FRAMEBUFFER_INCOMPLETE_ATTACHMENT');
                        break;
                    case 0x8cd7:
                        notify.debug('FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT');
                        break;
                    case 0x8cd9:
                        notify.debug('FRAMEBUFFER_INCOMPLETE_DIMENSIONS');
                        break;
                    case 0x8cdd:
                        notify.debug('FRAMEBUFFER_UNSUPPORTED');
                        break;
                    default:
                        notify.debug('FRAMEBUFFER unknown error ' + code.toString(16));
                }
            },

            reset: function() {
                this.releaseGLObjects();
                this._attachments = [];
            },

            getFrameBufferObject: function() {
                return this._fbo;
            },

            getRenderBufferObject: function() {
                return this._rbo;
            },

            createFrameBufferObject: function(state) {
                this.setGraphicContext(state.getGraphicContext());
                this._fbo = this._gl.createFramebuffer();
            },

            createRenderBuffer: function(format, width, height) {
                var gl = this._gl;
                var renderBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);

                return renderBuffer;
            },

            framebufferRenderBuffer: function(attachment, renderBuffer) {
                var gl = this._gl;
                gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
                gl.framebufferRenderbuffer(
                    gl.FRAMEBUFFER,
                    attachment,
                    gl.RENDERBUFFER,
                    renderBuffer
                );

                /* develblock:start */
                // only visible with webgl-insector enabled
                if (gl.rawgl !== undefined) {
                    notify.log('FBO: renderBuffer: ' + this._fbo.trackedObject.defaultName);
                }
                /* develblock:end */
            },

            framebufferTexture2D: function(state, attachment, textureTarget, texture) {
                var gl = this._gl;

                // apply on unit 1 to init it
                // make sure we do bind it whatever state stack
                // texture is cached
                state.applyTextureAttribute(1, texture);

                if (texture.isDirty() || !texture.getTextureObject()) {
                    // image wasn't ready, texture not allocated due to lack of gpu MEM
                    return false;
                }

                // gl2 vs gl1
                var target = gl.DRAW_FRAMEBUFFER || gl.FRAMEBUFFER;
                gl.framebufferTexture2D(
                    target,
                    attachment,
                    textureTarget,
                    texture.getTextureObject().id(),
                    0
                );

                /* develblock:start */
                // only visible with webgl-insector enabled
                // allow trace debug (fb<->texture link)
                if (gl.rawgl !== undefined) {
                    notify.log(
                        'FBO: texture: ' +
                            texture.getName() +
                            ' : ' +
                            texture.getTextureObject().id().trackedObject.defaultName +
                            ' fbo: ' +
                            this._fbo.trackedObject.defaultName
                    );
                }
                /* develblock:end */

                return true;
            },

            bindFrameBufferObject: function() {
                var gl = this._gl;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
            },

            checkStatus: function() {
                var gl = this._gl;
                var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (status !== gl.FRAMEBUFFER_COMPLETE) {
                    this._reportFrameBufferError(status);
                }
            },

            _checkAllowedSize: function(w, h) {
                var maxSize = WebglCaps.instance().getWebGLParameter('MAX_RENDERBUFFER_SIZE');

                if (w === 0 || h === 0 || h > maxSize || w > maxSize) {
                    notify.error(
                        'width (' +
                            w +
                            ') or height (' +
                            w +
                            ') makes frame buffer not bindable. Max RenderBuffer is "' +
                            maxSize +
                            '"'
                    );
                    return false;
                }

                return true;
            },

            apply: function(state) {
                if (!this._gl) this.setGraphicContext(state.getGraphicContext());
                var gl = this._gl;

                var attachments = this._attachments;

                // ?
                if (attachments.length === 0 && !this._fbo) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    return;
                }

                // each frame
                if (!this.isDirty()) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
                    if (notify.reportWebGLError === true) this.checkStatus();
                    return;
                }

                // if the fbo is created manually, we want to just bind it
                if (!this._fbo) this.createFrameBufferObject(state);

                this.bindFrameBufferObject();

                // Check extDrawBuffers extension
                var bufs = this._hasMRT ? this._buffers : undefined;
                var hasRenderBuffer = false;

                for (var i = 0, l = attachments.length; i < l; ++i) {
                    var attachment = attachments[i];

                    // render buffer
                    if (!attachment.texture) {
                        if (!this._checkAllowedSize(attachment.width, attachment.height)) {
                            this.releaseGLObjects();
                            return;
                        }
                        if (attachment.renderBufferObject) {
                            // shared renderbuffer object between camera
                            // ie: early-z
                            this._rbo = attachment.renderBufferObject;
                        } else {
                            this._rbo = this.createRenderBuffer(
                                attachment.format,
                                attachment.width,
                                attachment.height
                            );
                            // necessary for shared attachment between camera
                            attachment.renderBufferObject = this._rbo;
                        }
                        this.framebufferRenderBuffer(attachment.attachment, this._rbo);
                        hasRenderBuffer = true;
                    } else {
                        // use texture
                        var texture = attachment.texture;

                        if (!this._checkAllowedSize(texture.getWidth(), texture.getHeight())) {
                            this.releaseGLObjects();
                            return;
                        }

                        // Not sure is needed to check the attachment.attachment
                        if (
                            this._hasMRT &&
                            attachment.attachment >= gl.COLOR_ATTACHMENT0 &&
                            attachment.attachment <= gl.COLOR_ATTACHMENT15 &&
                            bufs.indexOf(attachment.attachment) === -1
                        ) {
                            bufs.push(attachment.attachment);
                        }

                        if (
                            !this.framebufferTexture2D(
                                state,
                                attachment.attachment,
                                attachment.textureTarget,
                                texture
                            )
                        ) {
                            this.releaseGLObjects();
                            return;
                        }
                    }
                }

                if (bufs && bufs.length > 0) {
                    gl.drawBuffers(bufs);
                }

                this.checkStatus();

                // set it to null only if used renderbuffer
                if (hasRenderBuffer) gl.bindRenderbuffer(gl.RENDERBUFFER, null);

                this._dirty = false;
            }
        })
    ),
    'osg',
    'FrameBufferObject'
);

export default FrameBufferObject;
