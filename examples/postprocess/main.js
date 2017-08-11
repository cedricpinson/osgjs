(function() {
    'use strict';

    var OSG = window.OSG;
    var osgViewer = OSG.osgViewer;
    var osgUtil = OSG.osgUtil;
    var osgShader = OSG.osgShader;

    var osgDB = OSG.osgDB;
    var requestFile = osgDB.requestFile;

    var osg = OSG.osg;

    var P = window.P;

    var Example = function() {
        this._composer = undefined;
        this._shaderProcessor = undefined;
        this._camera = undefined;

        this._composerConfigNames = ['passthrough.json'];
        this._composerConfigFiles = {};
        this._composerConfigFiles['passthrough.json'] = [
            {
                func: 'passthrough',
                textures: ['%last'],
                out: { name: '%next' }
            }
        ];

        var shaders = {};
        shaders['passthrough.glsl'] =
            'vec4 passthrough() { return vec4(TEXTURE_2D_TextureInput(gTexCoord).rgb,1.0);}';

        this._shaderProcessor = new osgShader.ShaderProcessor();
        this._shaderProcessor.addShaders(shaders);

        this._params = {
            composer: this._composerConfigNames[0]
        };

        this._lutTextureNames = [
            'ue4_neutralLUT.png',
            'ue4_lut2.jpg',
            'ue4_lut3.jpg',
            '2strip.jpg',
            '3strip.jpg',
            'wtf.jpg'
        ];

        this._lutTextures = {};
    };

    Example.prototype = {
        run: function() {
            this._viewer = new osgViewer.Viewer(document.getElementById('View'));
            this._viewer.init();
            this._viewer.setSceneData(this.createScene());
            this._viewer.setupManipulator();
            this._viewer.getManipulator().computeHomePosition();
            this._viewer.run();

            this.rebuildGUI('passthrough.json');
        },

        createCamera: function(width, height, texture) {
            var camera = new osg.Camera();
            camera.setName('MainCamera');

            camera.setViewport(new osg.Viewport(0, 0, width, height));

            camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
            camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, texture);

            camera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);

            camera.attachRenderBuffer(
                osg.FrameBufferObject.DEPTH_ATTACHMENT,
                osg.FrameBufferObject.DEPTH_COMPONENT16
            );

            camera.setClearColor([0.5, 0.5, 0.5, 1.0]);
            return camera;
        },

        addInternalTextures: function() {
            this._composer.addInternalTexture({
                name: 'TextureColor',
                immuable: true,
                srgb: true,
                rgbm: false
            });

            this._composer.setInputTexture('TextureColor');
        },

        createComposer: function(name, width, height) {
            var composer = new osgUtil.ComposerPostProcess();
            composer.setName(name);
            composer.setScreenSize(width, height);
            composer.setShaderProcessor(this._shaderProcessor);

            return composer;
        },

        loadLutTextures: function() {
            var promises = [];

            var i;
            for (i = 0; i < this._lutTextureNames.length; i++) {
                var name = this._lutTextureNames[i];

                var texture = new osg.Texture();
                texture.setMinFilter(osg.Texture.LINEAR);
                texture.setMagFilter(osg.Texture.LINEAR);

                this._lutTextures[name] = texture;
                var promise = osgDB.readImageURL('../media/textures/lookup-tables/' + name);
                promises.push(promise);
            }

            var self = this;

            P.all(promises).then(function(images) {
                for (i = 0; i < self._lutTextureNames.length; i++) {
                    self._lutTextures[self._lutTextureNames[i]].setImage(images[i]);
                }
            });
        },

        createScene: function() {
            var viewer = this._viewer;
            var width = viewer.getCanvasWidth();
            var height = viewer.getCanvasHeight();

            this._composer = this.createComposer('ComposerPostProcess', width, height);
            this.rebuildComposer('passthrough.json');

            var rttCamera = this.createCamera(
                width,
                height,
                this._composer.getInternalTexture('TextureColor')
            );

            rttCamera.setName('DepthCamera');

            //TODO: wut?
            // setClampProjectionMatrixCallback mandatory to update matrices
            // copy first projection = first frame bug
            // not copy first camera means nothing draw
            // ssao copies proj but not camera
            osg.mat4.copy(rttCamera.getViewMatrix(), viewer.getCamera().getViewMatrix());

            rttCamera.setClampProjectionMatrixCallback(function() {
                osg.mat4.copy(rttCamera.getViewMatrix(), viewer.getCamera().getViewMatrix());
                osg.mat4.copy(
                    rttCamera.getProjectionMatrix(),
                    viewer.getCamera().getProjectionMatrix()
                );
            });

            this._camera = rttCamera;

            var texture = new osg.Texture();
            var quad = osg.createTexturedFullScreenFakeQuadGeometry();

            osgDB.readImageURL('../media/textures/trees.jpeg').then(function(image) {
                texture.setImage(image);
                quad.getOrCreateStateSet().setTextureAttributeAndModes(0, texture);
            });

            this.loadLutTextures();

            this._camera.addChild(quad);

            var rootNode = new osg.Node();
            rootNode.addChild(rttCamera);
            rootNode.addChild(this._composer);

            return rootNode;
        },

        rebuildComposer: function(fileName) {
            var composer = this._composer;
            composer.clear();

            // we want to reload shaders on the fly
            // using cache would prevent that
            composer.clearShaderCache();

            if (fileName === 'colorCorrection.json') {
                this._composer.addExternalTexture(
                    'TextureLut',
                    this._lutTextures[this._lutTextureNames[0]]
                );
            }

            this.addInternalTextures();

            var configFile = this._composerConfigFiles[fileName];

            var passes =
                fileName === 'passthrough.json' ? configFile : JSON.parse(configFile).passes;

            composer.build(passes);

            var st = this._composer.getOrCreateStateSet();
            st.addUniform(osg.Uniform.createFloat2(osg.vec2.fromValues(0.8, 0.25), 'uLensRadius'));

            st.addUniform(
                osg.Uniform.createFloat2(osg.vec2.fromValues(0.25, 0.25), 'uRedControl1')
            );

            st.addUniform(
                osg.Uniform.createFloat2(osg.vec2.fromValues(0.75, 0.75), 'uRedControl2')
            );

            st.addUniform(
                osg.Uniform.createFloat2(osg.vec2.fromValues(0.25, 0.5), 'uGreenControl1')
            );
            st.addUniform(
                osg.Uniform.createFloat2(osg.vec2.fromValues(0.5, 0.75), 'uGreenControl2')
            );

            st.addUniform(
                osg.Uniform.createFloat2(osg.vec2.fromValues(0.25, 0.75), 'uBlueControl1')
            );
            st.addUniform(
                osg.Uniform.createFloat2(osg.vec2.fromValues(0.5, 0.875), 'uBlueControl2')
            );
        },

        rebuildGUI: function(name) {
            if (this._gui) {
                this._gui.destroy();
            }

            this._gui = new window.dat.GUI();

            var cb = this._gui.add(this._params, 'composer', this._composerConfigNames).listen();
            var self = this;

            cb.onFinishChange(function(value) {
                self.rebuildComposer(value);
                self.rebuildGUI(value);
            });

            var folder = this._gui.addFolder(name);
            folder.open();

            var st = this._composer.getOrCreateStateSet();

            if (name === 'vignette.json') {
                var uLensRadius = st.getUniform('uLensRadius');

                var vignette = {
                    innerRadius: uLensRadius.getInternalArray()[1],
                    outerRadius: uLensRadius.getInternalArray()[0]
                };

                var innerCtrl = folder.add(vignette, 'innerRadius', 0, 1);
                var outerCtrl = folder.add(vignette, 'outerRadius', 0, 1);

                innerCtrl.onChange(function(value) {
                    uLensRadius.getInternalArray()[1] = value;
                });

                outerCtrl.onChange(function(value) {
                    uLensRadius.getInternalArray()[0] = value;
                });
            } else if (name === 'colorCorrection.json') {
                var colorCorrectionParams = {
                    current: this._lutTextureNames[0]
                };

                var lutCtrl = folder.add(colorCorrectionParams, 'current', this._lutTextureNames);
                lutCtrl.onFinishChange(function(value) {
                    var passStateSet = self._composer.getStateSetPass('colorCorrection');
                    var uniform = passStateSet.getUniform('TextureLut');
                    passStateSet.setTextureAttributeAndModes(
                        uniform.getInternalArray()[0],
                        self._lutTextures[value]
                    );
                });
            } else if (name === 'colorBalance.json') {
                var uRedControl1 = st.getUniform('uRedControl1');
                var uRedControl2 = st.getUniform('uRedControl2');
                var uGreenControl1 = st.getUniform('uGreenControl1');
                var uGreenControl2 = st.getUniform('uGreenControl2');
                var uBlueControl1 = st.getUniform('uBlueControl1');
                var uBlueControl2 = st.getUniform('uBlueControl2');

                var colorBalanceParams = {
                    r1x: uRedControl1.getInternalArray()[0],
                    r1y: uRedControl1.getInternalArray()[1],
                    r2x: uRedControl2.getInternalArray()[0],
                    r2y: uRedControl2.getInternalArray()[1],
                    g1x: uGreenControl1.getInternalArray()[0],
                    g1y: uGreenControl1.getInternalArray()[1],
                    g2x: uGreenControl2.getInternalArray()[0],
                    g2y: uGreenControl2.getInternalArray()[1],
                    b1x: uBlueControl1.getInternalArray()[0],
                    b1y: uBlueControl1.getInternalArray()[1],
                    b2x: uBlueControl2.getInternalArray()[0],
                    b2y: uBlueControl2.getInternalArray()[1]
                };

                this.addWidget(folder, colorBalanceParams, 'r1x', uRedControl1, 0);
                this.addWidget(folder, colorBalanceParams, 'r1y', uRedControl1, 1);
                this.addWidget(folder, colorBalanceParams, 'r2x', uRedControl2, 0);
                this.addWidget(folder, colorBalanceParams, 'r2y', uRedControl2, 1);

                this.addWidget(folder, colorBalanceParams, 'g1x', uGreenControl1, 0);
                this.addWidget(folder, colorBalanceParams, 'g1y', uGreenControl1, 1);
                this.addWidget(folder, colorBalanceParams, 'g2x', uGreenControl2, 0);
                this.addWidget(folder, colorBalanceParams, 'g2y', uGreenControl2, 1);

                this.addWidget(folder, colorBalanceParams, 'b1x', uBlueControl1, 0);
                this.addWidget(folder, colorBalanceParams, 'b1y', uBlueControl1, 1);
                this.addWidget(folder, colorBalanceParams, 'b2x', uBlueControl2, 0);
                this.addWidget(folder, colorBalanceParams, 'b2y', uBlueControl2, 1);
            }

            this._currentComposer = name;
        },

        addWidget: function(folder, params, nameParam, uniform, index) {
            var ctrl = folder.add(params, nameParam, 0.0, 1.0);
            ctrl.onChange(function(value) {
                uniform.getInternalArray()[index] = value;
            });
        },

        addComposerConfig: function(name, content) {
            this._composerConfigNames.push(name);
            this._composerConfigFiles[name] = content;

            // dat.GUI doesn't have an easy way to add elements into the combobox
            // so we just rebuild the whole GUI
            this.rebuildGUI(this._currentComposer);
        }
    };

    var dragOverEvent = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    };

    var dropEvent = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files;
        if (files.length) {
            var promises = [];

            var i;
            for (i = 0; i < files.length; i++) {
                var file = files[i];

                if (file.name.indexOf('.json') === -1 && file.name.indexOf('.glsl') === -1) {
                    continue;
                }

                promises.push(
                    requestFile(file, {
                        requestType: 'string'
                    })
                );
            }

            var example = this;

            P.all(promises).then(function(fileContents) {
                var shaders = {};

                for (i = 0; i < fileContents.length; i++) {
                    var name = files[i].name;
                    var content = fileContents[i];

                    if (name.indexOf('.json') !== -1) {
                        example.addComposerConfig(name, content);
                    } else {
                        shaders[name] = content;
                    }
                }

                example._shaderProcessor.addShaders(shaders);
            });
        }
    };

    window.addEventListener(
        'load',
        function() {
            var example = new Example();
            example.run();

            window.addEventListener('dragover', dragOverEvent.bind(example), false);
            window.addEventListener('drop', dropEvent.bind(example), false);
        },
        true
    );
})();
