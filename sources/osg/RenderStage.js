import utils from 'osg/utils';
import Camera from 'osg/Camera';
import FrameBufferObject from 'osg/FrameBufferObject';
import notify from 'osg/notify';
import RenderBin from 'osg/RenderBin';
import { vec4 } from 'osg/glMatrix';
import PooledResource from 'osg/PooledResource';

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
var RenderStage = function() {
    RenderBin.call(this);
    this._clearColor = vec4.create();
    this._clearDepth = undefined;
    this._clearMask = undefined;
    this._camera = undefined;
    this._viewport = undefined;
    this._scissor = undefined;
    this._preRenderList = [];
    this._postRenderList = [];
    // calling prototype to make sure
    // we call renderstage and not renderbin init
    RenderStage.prototype.init.call(this);
};

var createRenderStageOrder = function() {
    return {
        renderStage: null,
        order: null
    };
};

var pooledRenderStageOrder = new PooledResource(createRenderStageOrder);

utils.createPrototypeObject(
    RenderStage,
    utils.objectInherit(RenderBin.prototype, {
        init: function() {
            RenderBin.prototype.init.call(this);
            this._clearDepth = 1.0;
            vec4.set(this._clearColor, 0.0, 0.0, 0.0, 1.0);
            /*jshint bitwise: false */
            this._clearMask = Camera.COLOR_BUFFER_BIT | Camera.DEPTH_BUFFER_BIT;
            /*jshint bitwise: true */
            this._camera = undefined;
            this._viewport = undefined;
            this._scissor = undefined;
            this._renderStage = this;
            RenderStage.prototype._initInternal.call(this);
            return this;
        },

        _initInternal: function() {
            this._preRenderList.length = 0;
            this._postRenderList.length = 0;
        },

        reset: function() {
            pooledRenderStageOrder.reset();
            RenderBin.prototype.reset.call(this);
            RenderStage.prototype._initInternal.call(this);
        },

        setClearDepth: function(depth) {
            this._clearDepth = depth;
        },

        getClearDepth: function() {
            return this._clearDepth;
        },

        setClearColor: function(color) {
            vec4.copy(this._clearColor, color);
        },

        getClearColor: function() {
            return this._clearColor;
        },

        setClearMask: function(mask) {
            this._clearMask = mask;
        },

        getClearMask: function() {
            return this._clearMask;
        },

        setViewport: function(vp) {
            this._viewport = vp;
        },

        getViewport: function() {
            return this._viewport;
        },

        setScissor: function(scissor) {
            this._scissor = scissor;
        },

        getScissor: function() {
            return this._scissor;
        },

        setCamera: function(camera) {
            this._camera = camera;
        },

        getCamera: function() {
            return this._camera;
        },

        getPreRenderStageList: function() {
            return this._preRenderList;
        },

        getPostRenderStageList: function() {
            return this._postRenderList;
        },

        addPreRenderStage: function(rs, order) {
            for (var i = 0, l = this._preRenderList.length; i < l; i++) {
                var render = this._preRenderList[i];
                if (order < render.order) {
                    break;
                }
            }

            var renderStageOrder = pooledRenderStageOrder.getOrCreateObject();
            renderStageOrder.order = order;
            renderStageOrder.renderStage = rs;
            if (i < this._preRenderList.length) {
                this._preRenderList = this._preRenderList.splice(i, 0, renderStageOrder);
            } else {
                this._preRenderList.push(renderStageOrder);
            }
        },

        addPostRenderStage: function(rs, order) {
            for (var i = 0, l = this._postRenderList.length; i < l; i++) {
                var render = this._postRenderList[i];
                if (order < render.order) {
                    break;
                }
            }

            var renderStageOrder = pooledRenderStageOrder.getOrCreateObject();
            renderStageOrder.order = order;
            renderStageOrder.renderStage = rs;
            if (i < this._postRenderList.length) {
                this._postRenderList = this._postRenderList.splice(i, 0, renderStageOrder);
            } else {
                this._postRenderList.push(renderStageOrder);
            }
        },

        drawPreRenderStages: function(state, previousRenderLeaf) {
            var previousLeaf = previousRenderLeaf;
            for (var i = 0, l = this._preRenderList.length; i < l; ++i) {
                var sg = this._preRenderList[i].renderStage;
                previousLeaf = sg.draw(state, previousLeaf);
            }
            return previousLeaf;
        },

        draw: function(state, previousRenderLeaf) {
            if (this._camera && this._camera.getInitialDrawCallback()) {
                // if we have a camera with a final callback invoke it.
                this._camera.getInitialDrawCallback()(state);
            }

            var previousLeaf = this.drawPreRenderStages(state, previousRenderLeaf);

            previousLeaf = this.drawImplementation(state, previousLeaf);

            previousLeaf = this.drawPostRenderStages(state, previousLeaf);

            if (this._camera && this._camera.getFinalDrawCallback()) {
                // if we have a camera with a final callback invoke it.
                this._camera.getFinalDrawCallback()(state);
            }

            return previousLeaf;
        },

        sort: function() {
            for (var i = 0, l = this._preRenderList.length; i < l; ++i) {
                this._preRenderList[i].renderStage.sort();
            }

            RenderBin.prototype.sort.call(this);

            for (var j = 0, k = this._postRenderList.length; j < k; ++j) {
                this._postRenderList[j].renderStage.sort();
            }
        },

        drawPostRenderStages: function(state, previousRenderLeaf) {
            var previousLeaf = previousRenderLeaf;
            for (var i = 0, l = this._postRenderList.length; i < l; ++i) {
                var sg = this._postRenderList[i].renderStage;
                previousLeaf = sg.draw(state, previousLeaf);
            }
            return previousLeaf;
        },

        applyCamera: function(state) {
            var gl = state.getGraphicContext();
            if (this._camera === undefined) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                return;
            }
            var viewport = this._camera.getViewport();
            var fbo = this._camera.frameBufferObject;

            if (!fbo) {
                fbo = new FrameBufferObject();
                this._camera.frameBufferObject = fbo;
            }

            if (fbo.isDirty()) {
                var attachments = this._camera.getAttachments();

                // framebuffer texture and renderbuffer must be same dimension
                // otherwise framebuffer is incomplete
                var framebufferWidth, framebufferHeight;
                var colorAttachment = attachments[FrameBufferObject.COLOR_ATTACHMENT0];
                if (colorAttachment && colorAttachment.texture) {
                    framebufferWidth = colorAttachment.texture.getWidth();
                    framebufferHeight = colorAttachment.texture.getHeight();
                }

                // we should use a map in camera to avoid to regenerate the keys
                // each time. But because we dont have a lot of camera I guess
                // it does not change a lot
                // texture and renderbuffer must be same size.
                for (var keyAttachment in attachments) {
                    colorAttachment = attachments[keyAttachment];

                    var attach = {};
                    attach.attachment = colorAttachment.attachment;

                    if (colorAttachment.texture === undefined) {
                        //renderbuffer

                        attach.format = colorAttachment.format;
                        attach.width =
                            framebufferWidth !== undefined ? framebufferWidth : viewport.width();
                        attach.height =
                            framebufferHeight !== undefined ? framebufferHeight : viewport.height();
                    } else {
                        attach.texture = colorAttachment.texture;
                        attach.textureTarget = colorAttachment.textureTarget;

                        if (colorAttachment.format) {
                            attach.format = colorAttachment.format;
                        }
                    }

                    fbo.setAttachment(attach);
                }
            }
            fbo.apply(state);
        },

        drawImplementation: function(state, previousRenderLeaf) {
            var gl = state.getGraphicContext();

            this.applyCamera(state);

            // projection clipping
            if (this._viewport === undefined) {
                notify.log('RenderStage does not have a valid viewport');
            }
            state.applyAttribute(this._viewport);

            if (this._scissor) {
                state.applyAttribute(this._scissor);
            }

            if (this._clearMask !== 0x0) {
                if (this._clearMask & gl.COLOR_BUFFER_BIT) {
                    state.clearColor(this._clearColor);
                }
                if (this._clearMask & gl.DEPTH_BUFFER_BIT) {
                    state.depthMask(true);
                    state.clearDepth(this._clearDepth);
                }
                state.clear(this._clearMask);
            }

            if (this._positionedAttribute.getLength() !== 0) {
                this.applyPositionedAttribute(state, this._positionedAttribute);
            }

            var previousLeaf = RenderBin.prototype.drawImplementation.call(
                this,
                state,
                previousRenderLeaf
            );

            return previousLeaf;
        }
    }),
    'osg',
    'RenderStage'
);

export default RenderStage;
