(function() {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;
    var ExampleOSGJS = window.ExampleOSGJS;

    var composeFragmentShader = [
        osgUtil.Composer.Filter.defaultFragmentShaderHeader,
        'uniform sampler2D Texture1;',
        'void main (void)',
        '{',
        '  vec4 transp = texture2D(Texture1, vTexCoord0 );',
        '  vec4 opaque = texture2D(Texture0, vTexCoord0 );',
        '  gl_FragColor = opaque * (1.0 - transp.a) + transp.rgba;',
        '}'
    ].join('\n');

    var sortBin = function(a, b) {
        return a._binNum - b._binNum;
    };

    var getInsertPosition = function(state, previous) {
        var sg = previous ? previous._parent : undefined;
        var num = 0;
        // need to pop back all statesets and matrices.
        while (sg) {
            if (sg.stateset) num++;
            sg = sg.parent;
        }

        if (num > 1) num--;
        return state.getStateSetStackSize() - num;
    };

    // opaque post earlyz
    var stateSetDepthEqual = new osg.StateSet();
    stateSetDepthEqual.setAttributeAndModes(
        new osg.Depth(osg.Depth.EQUAL, 0.0, 1.0, false),
        osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON
    );

    // transparent post earlyz
    var stateSetDepthLEqual = new osg.StateSet();
    stateSetDepthLEqual.setAttributeAndModes(
        new osg.Depth(osg.Depth.LEQUAL, 0.0, 1.0, false),
        osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON
    );

    var stateSetEarlyZ = (function() {
        var fullOverride = osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON;

        var stateSet = new osg.StateSet();
        stateSet.setAttributeAndModes(new osg.Depth(osg.Depth.LESS), fullOverride);
        stateSet.setAttributeAndModes(new osg.BlendFunc(), fullOverride);
        // disable it to debug and see ff00ff color if bad depth
        stateSet.setAttributeAndModes(new osg.ColorMask(false, false, false, false), fullOverride);

        return stateSet;
    })();

    var RenderStageSplitter = function() {
        osg.RenderStage.apply(this, arguments);
        this._binArraySorted = [];
    };

    RenderStageSplitter.prototype = osg.objectInherit(osg.RenderStage.prototype, {
        constructor: RenderStageSplitter,

        isMainCamera: function() {
            var camera = this.getCamera();
            if (camera && camera.getName() === 'MainCamera') return true;
            return false;
        },

        sortBinArray: function() {
            var binsArray = this._binArraySorted;
            binsArray.length = 0;

            this._bins.forEach(function(key, bin) {
                binsArray.push(bin);
            });

            binsArray.sort(sortBin);
        },

        drawImplementationRenderBin: function(state, previousRenderLeaf) {
            var previousLeaf = previousRenderLeaf;
            var binsArray = this._binArraySorted;

            var current = 0;
            var end = binsArray.length;

            var bin;
            // draw pre bins
            for (; current < end; current++) {
                bin = binsArray[current];
                if (bin.getBinNumber() > 0) break;

                previousLeaf = bin.draw(state, previousLeaf);
            }

            // draw leafs
            previousLeaf = this.drawLeafs(state, previousLeaf);

            // draw post bins
            for (; current < end; current++) {
                bin = binsArray[current];

                // handle transparency on different RTT
                // sort mode is used as transparent
                if (bin.getSortMode() === osg.RenderBin.SORT_BACK_TO_FRONT) {
                    this.useTransparencyRTT(state);
                    previousLeaf = bin.draw(state, previousLeaf);
                    this.useOpaqueRTT(state);
                } else {
                    previousLeaf = bin.draw(state, previousLeaf);
                }
            }

            return previousLeaf;
        },

        // transparent
        drawImplementationRenderBinBackToFront: function(state, previousRenderLeaf) {
            var previousLeaf = previousRenderLeaf;

            var binsArray = this._binArraySorted;

            var current = 0;
            var end = binsArray.length;

            // handle transparency on different RTT
            this.useTransparencyRTT(state);

            var bin;

            // draw pre bins
            for (; current < end; current++) {
                bin = binsArray[current];
                // sort mode is used as transparent
                if (bin.getSortMode() === osg.RenderBin.SORT_BACK_TO_FRONT)
                    previousLeaf = bin.draw(state, previousLeaf);
            }

            this.useOpaqueRTT(state);
            return previousLeaf;
        },

        // opaque
        drawImplementationRenderBinFrontToBack: function(state, previousRenderLeaf) {
            var previousLeaf = previousRenderLeaf;

            var binsArray = this._binArraySorted;

            var current = 0;
            var end = binsArray.length;

            var bin;

            // transparency by default are renderbin num 10 and sort mode back to front

            // draw pre bins
            for (; current < end; current++) {
                bin = binsArray[current];
                if (bin.getBinNumber() > 0) break;
                // we dont test the sort mode here because transparency hint
                // is 10 + sort back to front
                // in some special case you could want to sort back to front with
                // render bin num < 0
                previousLeaf = bin.draw(state, previousLeaf);
            }

            // draw leafs
            previousLeaf = this.drawLeafs(state, previousLeaf);

            // draw post bins
            for (; current < end; current++) {
                bin = binsArray[current];
                if (bin.getSortMode() !== osg.RenderBin.SORT_BACK_TO_FRONT)
                    previousLeaf = bin.draw(state, previousLeaf);
            }

            return previousLeaf;
        },

        useTransparencyRTT: function(state) {
            this.getCamera().frameBufferObjectTransparent.apply(state);
        },

        useOpaqueRTT: function(state) {
            this.getCamera().frameBufferObject.apply(state);
        },

        createFBO: function(state, texture) {
            var viewport = this.getViewport();
            var fbo = new osg.FrameBufferObject();

            fbo.createFrameBufferObject(state);
            fbo.bindFrameBufferObject();

            // set the depth render buffer
            var renderBufferDepth = this._renderBufferDepth;
            if (!renderBufferDepth) {
                renderBufferDepth = fbo.createRenderBuffer(
                    osg.FrameBufferObject.DEPTH_COMPONENT16,
                    viewport.width(),
                    viewport.height()
                );
                this._renderBufferDepth = renderBufferDepth;
            }
            fbo.framebufferRenderBuffer(osg.FrameBufferObject.DEPTH_ATTACHMENT, renderBufferDepth);

            // apply and assign texture
            fbo.framebufferTexture2D(
                state,
                osg.FrameBufferObject.COLOR_ATTACHMENT0,
                osg.Texture.TEXTURE_2D,
                texture
            );

            fbo.checkStatus();

            return fbo;
        },

        createCamera2RTT: function(state) {
            var fbo;

            fbo = this.createFBO(state, this.getCamera()._textureOpaque);
            this.getCamera().frameBufferObject = fbo;

            fbo = this.createFBO(state, this.getCamera()._textureTransparent);
            this.getCamera().frameBufferObjectTransparent = fbo;
        },

        clearCameraColorDepth: function(gl) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.depthMask(true);
            gl.clearDepth(this.getClearDepth());
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        },

        clearCameraColor: function(gl) {
            gl.clear(gl.COLOR_BUFFER_BIT);
        },

        drawImplementationEarlyZ: function(state, previousLeaf) {
            var previous = previousLeaf;

            var insertStateSetPosition = getInsertPosition(state, previous);

            // draw zbuffer only
            state.insertStateSet(insertStateSetPosition, stateSetEarlyZ);
            previous = this.drawImplementationRenderBinFrontToBack(state, previous);
            state.removeStateSet(insertStateSetPosition);

            // opaque
            state.insertStateSet(insertStateSetPosition, stateSetDepthEqual);
            previous = this.drawImplementationRenderBinFrontToBack(state, previous);
            state.removeStateSet(insertStateSetPosition);

            // transparent
            state.insertStateSet(insertStateSetPosition, stateSetDepthLEqual);
            previous = this.drawImplementationRenderBinBackToFront(state, previous);
            state.removeStateSet(insertStateSetPosition);

            return previous;
        },

        drawImplementation: function(state, previousRenderLeaf) {
            if (!this.isMainCamera()) {
                return osg.RenderStage.prototype.drawImplementation.call(
                    this,
                    state,
                    previousRenderLeaf
                );
            }

            var gl = state.getGraphicContext();

            // check / init FBO
            var fbo = this.getCamera().frameBufferObject;
            if (!fbo) this.createCamera2RTT(state);

            if (this.getViewport() === undefined)
                osg.log('RenderStage does not have a valid viewport');

            state.applyAttribute(this.getViewport());

            // clear transparency
            this.useTransparencyRTT(state);
            this.clearCameraColorDepth(gl);

            // clear opaque
            this.useOpaqueRTT(state);
            this.clearCameraColor(gl);

            if (this._positionedAttribute.length !== 0) {
                this.applyPositionedAttribute(state, this._positionedAttribute);
            }

            this.sortBinArray();

            var previous = previousRenderLeaf;
            previous = this.drawImplementationEarlyZ(state, previous);
            // previous = this.drawImplementationRenderBin( state, previous );
            return previous;
        }
    });

    var Example = function() {
        ExampleOSGJS.call(this);
    };

    Example.prototype = osg.objectInherit(ExampleOSGJS.prototype, {
        createCameraRTT: function(textureOpaque, textureTranparent) {
            var camera = new osg.Camera();
            camera.setName('MainCamera');
            camera.setViewport(new osg.Viewport(0, 0, this._canvas.width, this._canvas.height));

            camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);

            // hack, our custom RenderStage will create FBO from those two textures
            camera._textureOpaque = textureOpaque;
            camera._textureTransparent = textureTranparent;

            camera.setClearColor(osg.vec4.fromValues(0.0, 0.0, 0.1, 1.0));
            return camera;
        },

        createCamera: function(texture) {
            var camera = new osg.Camera();
            camera.setName('composer2D');
            camera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);

            var geometry = osg.createTexturedQuadGeometry(-1, -1, 0, 2, 0, 0, 0, 2, 0);
            geometry.getOrCreateStateSet().setTextureAttributeAndModes(0, texture);
            camera.addChild(geometry);

            return camera;
        },

        ///// UTILS
        // createTextureRTT( 'name', osg.Texture.LINEAR, osg.Texture.UNSIGNED_BYTE );
        createTextureRTT: function(name, filter, type) {
            var texture = new osg.Texture();
            texture.setInternalFormatType(type);
            texture.setTextureSize(this._canvas.width, this._canvas.height);

            texture.setInternalFormat(osg.Texture.RGBA);
            texture.setMinFilter(filter);
            texture.setMagFilter(filter);
            texture.setName(name);
            return texture;
        },

        createScene: function() {
            // the root node
            var scene = new osg.Node();

            // camera RTT
            var opaque = this.createTextureRTT(
                'mainSceneOpaque',
                osg.Texture.NEAREST,
                osg.Texture.UNSIGNED_BYTE
            );
            var transparent = this.createTextureRTT(
                'mainSceneTransparent',
                osg.Texture.NEAREST,
                osg.Texture.UNSIGNED_BYTE
            );
            var camera = this.createCameraRTT(opaque, transparent);
            camera.addChild(scene);
            this._root.addChild(camera);

            // create the model
            var model0 = this.createModel('../media/models/material-test/file.osgjs');
            var model1 = this.createModel('../media/models/material-test/file.osgjs');

            osg.mat4.fromTranslation(model0.getMatrix(), [-10, 0, 0]);
            osg.mat4.fromTranslation(model1.getMatrix(), [10, 0, 0]);

            var stateSet = model1.getOrCreateStateSet();
            var material = new osg.Material();
            material.setTransparency(0.4);

            stateSet.setRenderingHint('TRANSPARENT_BIN');
            stateSet.setAttributeAndModes(new osg.Depth(osg.Depth.LEQUAL, 0.0, 1.0, false));
            stateSet.setAttributeAndModes(new osg.BlendFunc('ONE', 'ONE_MINUS_SRC_ALPHA'));
            stateSet.setAttributeAndModes(material);

            scene.addChild(model0);
            scene.addChild(model1);

            // create textured quad with the texture rtt
            // var cameraScreen = this.createCamera( opaque );
            // this._root.addChild( cameraScreen );

            // composer
            var composer = new osgUtil.Composer();
            var blendPass = new osgUtil.Composer.Filter.Custom(composeFragmentShader, {
                Texture1: transparent,
                Texture0: opaque
            });

            blendPass.getOrCreateStateSet().setTextureAttributeAndModes(1, transparent);
            blendPass.getOrCreateStateSet().setTextureAttributeAndModes(0, opaque);
            composer.addPass(blendPass);
            composer.renderToScreen(this._canvas.width, this._canvas.height);

            this._root.addChild(composer);

            var textureListDebug = [opaque, transparent];

            var refreshDebugTextureList = function() {
                this.createDebugTextureList(textureListDebug, {
                    horizontal: false
                });
            }.bind(this);

            refreshDebugTextureList();
            window.refreshDebugTextureList = refreshDebugTextureList;

            // hook RenderStage
            this._viewer.getCamera().getRenderer().setRenderStage(new RenderStageSplitter());
        }
    });

    window.addEventListener(
        'load',
        function() {
            var example = new Example();
            example.run();
            window.example = example;
        },
        true
    );
})();
