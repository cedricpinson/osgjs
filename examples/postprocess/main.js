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

        createRandomMatrixTransform: function() {
            var trans = osg.vec3.create();
            trans[0] = Math.random() - 0.5;
            trans[1] = Math.random() - 0.5;
            trans[2] = Math.random() - 0.5;
            osg.vec3.scale(trans, trans, 20.0);

            var scale = osg.vec3.create();
            scale[0] = Math.random() + 1.0;
            scale[1] = Math.random() + 1.0;
            scale[2] = Math.random() + 1.0;

            var rot = osg.quat.create();
            rot[0] = Math.random() - 0.5;
            rot[1] = Math.random() - 0.5;
            rot[2] = Math.random() - 0.5;
            rot[3] = Math.random() - 0.5;
            osg.quat.normalize(rot, rot);

            var mt = new osg.MatrixTransform();
            var mat = mt.getMatrix();
            osg.mat4.fromRotationTranslationScale(mat, rot, trans, scale);

            return mt;
        },

        createRandomPrimitives: function() {
            var primitives = new osg.MatrixTransform();

            var i = 0;
            for (i = 0; i < 100; ++i) {
                var geom;
                if (i < 50) {
                    geom = osg.createTexturedSphereGeometry(1.0, 32, 32);
                } else {
                    geom = osg.createTexturedBoxGeometry();
                }

                var randMT = this.createRandomMatrixTransform();
                primitives.addChild(randMT);
                randMT.addChild(geom);

                // random color
                var mat = new osg.Material();
                geom.getOrCreateStateSet().setAttribute(mat);
                var diff = mat.getDiffuse();
                diff[0] = Math.random();
                diff[1] = Math.random();
                diff[2] = Math.random();
                osg.vec3.lerp(diff, diff, osg.vec3.ONE, 0.5);
            }

            // rotate primitives
            var axis = osg.vec3.fromValues(0.4, 0.6, 0.8);
            osg.vec3.normalize(axis, axis);
            primitives.addUpdateCallback({
                update: function(node) {
                    var matrix = node.getMatrix();
                    osg.mat4.rotate(matrix, matrix, 0.005, axis);
                }
            });

            return primitives;
        },

        createTexturedQuad: function() {
            // add static quad with texture
            var quad = osg.createTexturedQuadGeometry(-0.5, 0, -0.5, 1, 0, 0, 0, 0, 1);
            var stQuad = quad.getOrCreateStateSet();

            // texture + no light
            var texture = new osg.Texture();
            texture.setMinFilter(osg.Texture.LINEAR_MIPMAP_LINEAR);
            texture.setMagFilter(osg.Texture.LINEAR);
            stQuad.setTextureAttributeAndModes(0, texture);
            stQuad.setAttribute(new osg.CullFace(osg.CullFace.DISABLE));
            stQuad.setAttributeAndModes(new osg.Light(0, true));
            osgDB.readImageURL('../media/textures/trees.jpeg').then(texture.setImage.bind(texture));

            // offset on right
            var mtTexQuad = new osg.MatrixTransform();
            mtTexQuad.addChild(quad);
            var fac = 30;
            var texMat = mtTexQuad.getMatrix();
            osg.mat4.translate(texMat, texMat, osg.vec3.fromValues(fac, 0.0, 0));
            osg.mat4.scale(texMat, texMat, osg.vec3.fromValues(fac, fac, fac));

            return mtTexQuad;
        },

        createSceneGeometryGroup: function() {
            var group = new osg.Node();
            group.addChild(this.createRandomPrimitives());
            group.addChild(this.createTexturedQuad());
            return group;
        },

        createCamera: function(texture) {
            var camera = new osg.Camera();
            camera.setName('MainCamera');

            camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
            camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, texture);

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

            var sceneTexture = this._composer.getInternalTexture('TextureColor');
            this._camera = this.createCamera(sceneTexture);

            this.loadLutTextures();

            this._camera.addChild(this.createSceneGeometryGroup());

            var rootNode = new osg.Node();
            rootNode.addChild(this._camera);
            rootNode.addChild(this._composer);

            // resize stuff
            this._canvasWidth = width;
            this._canvasHeight = height;
            rootNode.addUpdateCallback(this);

            return rootNode;
        },

        update: function() {
            var viewer = this._viewer;
            var width = viewer.getCanvasWidth();
            var height = viewer.getCanvasHeight();

            if (width !== this._canvasWidth || height !== this._canvasHeight) {
                this._canvasWidth = width;
                this._canvasHeight = height;
                this._composer.resize(width, height);

                // reset attachment and redo them (because of render buffer)
                // camera should have a resize attachments function for helper
                this._camera.resetAttachments();
                var texture = this._composer.getInternalTexture('TextureColor');
                this._camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, texture);
                this._camera.attachRenderBuffer(
                    osg.FrameBufferObject.DEPTH_ATTACHMENT,
                    osg.FrameBufferObject.DEPTH_COMPONENT16
                );
            }

            return true;
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
                var lensArray = uLensRadius.getInternalArray();

                var vignette = {
                    outerRadius: lensArray[0],
                    innerRadius: lensArray[1]
                };

                var outerCtrl = folder.add(vignette, 'outerRadius', 0, 1);
                var innerCtrl = folder.add(vignette, 'innerRadius', 0, 1);

                var eps = 0.01;
                outerCtrl.onChange(function(value) {
                    lensArray[0] = value;
                    if (value <= lensArray[1]) 
                        innerCtrl.setValue(value - eps);
                });

                innerCtrl.onChange(function(value) {
                    lensArray[1] = value;
                    if (value >= lensArray[0]) 
                        outerCtrl.setValue(value + eps);
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
        },

        addContent: function(files, fileContents) {
            var shaders = {};

            for (var i = 0; i < fileContents.length; i++) {
                var name = files[i].name;
                var content = fileContents[i];

                if (name.indexOf('.json') !== -1) {
                    this.addComposerConfig(name, content);
                } else {
                    shaders[name] = content;
                }
            }

            this._shaderProcessor.addShaders(shaders);
        },

        dragOverEvent: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        },

        dropEvent: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.dataTransfer.files;
            if (!files.length) return;

            var promises = [];
            for (var i = 0; i < files.length; i++) {
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

            P.all(promises).then(this.addContent.bind(this, files));
        },

        loadXHR: function(url) {
            var split = url.split('/');
            var shaderName = split[split.length - 1];

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'text';
            xhr.onload = function() {
                if (xhr.status !== 200 && (!xhr.response || !xhr.response.byteLength)) {
                    return;
                }

                this.addContent([{ name: shaderName }], [xhr.responseText]);
            }.bind(this);
            xhr.send(null);
        }
    };

    var initExample = function() {
        var example = new Example();
        example.run();

        window.addEventListener('dragover', example.dragOverEvent.bind(example), false);
        window.addEventListener('drop', example.dropEvent.bind(example), false);

        example.loadXHR('shaders/blackAndWhite.json');
        example.loadXHR('shaders/blackAndWhite.glsl');

        example.loadXHR('shaders/colorBalance.json');
        example.loadXHR('shaders/colorBalance.glsl');
        example.loadXHR('shaders/colorBalanceLUT.glsl');

        example.loadXHR('shaders/colorCorrection.json');
        example.loadXHR('shaders/colorCorrection.glsl');

        // necessary for both colorBalance and colorCorrection
        example.loadXHR('shaders/sampleLUT.glsl');

        example.loadXHR('shaders/vignette.json');
        example.loadXHR('shaders/vignette.glsl');
    };

    window.addEventListener('load', initExample, true);
})();
