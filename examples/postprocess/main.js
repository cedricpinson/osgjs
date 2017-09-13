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
        this._rotateSpeed = 0.00025;
        this._showGeometry = true;
        this._showQuad = true;

        // composer node
        this._cameraColor = undefined;
        this._cameraDepth = undefined;
        this._composer = undefined;

        this._composerConfigNames = [];
        this._composerConfigFiles = {};
        this._shaderProcessor = new osgShader.ShaderProcessor();
        this._params = { composer: 'passthrough.json' };

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

        createPassthrough: function() {
            // add passtrough effect
            var str =
                'vec4 passthrough() { return vec4(TEXTURE_2D_TextureInput(gTexCoord).rgb, 1.0);}';
            var json = { func: 'passthrough', textures: ['%last'], out: { name: '%next' } };

            this.addPostProcessEffect([{ name: 'passthrough.json' }], [json]);
            this.addPostProcessEffect([{ name: 'passthrough.glsl' }], [str]);
        },

        createScene: function() {
            this._scene = this.createSceneGeometryGroup();

            this._composer = this.createComposer();
            this.createPassthrough();
            this.rebuildComposer('passthrough.json');

            this._cameraDepth = this.createCameraDepth();
            this._cameraColor = this.createCameraColor();

            this.loadLutTextures();

            this._cameraDepth.addChild(this._scene);
            this._cameraColor.addChild(this._scene);

            this._rootNode = new osg.Node();
            this._rootNode.addChild(this._cameraDepth);
            this._rootNode.addChild(this._cameraColor);
            this._rootNode.addChild(this._composer);

            // resize stuff
            this._canvasWidth = this._viewer.getCanvasWidth();
            this._canvasHeight = this._viewer.getCanvasHeight();
            this._rootNode.addUpdateCallback(this);

            // for ssao : correct near/far and projection matrix
            this.bindProjectionUpdateCallback(this._cameraDepth);

            // lequal everywhere
            var override = osg.StateAttribute.OVERRIDE;
            var lequal = new osg.Depth(osg.Depth.LEQUAL, 0.0, 1.0, true);
            this._cameraColor.getOrCreateStateSet().setAttributeAndModes(lequal, override);
            this._cameraDepth.getOrCreateStateSet().setAttributeAndModes(lequal, override);

            var rootSt = this._rootNode.getOrCreateStateSet();
            rootSt.addUniform(osg.Uniform.createFloat2(osg.vec2.fromValues(0.0, 1.0), 'uNearFar'));

            return this._rootNode;
        },

        createRandomMatrixTransform: function() {
            var trans = osg.vec3.create();
            trans[0] = Math.random() - 0.5;
            trans[1] = Math.random() - 0.5;
            trans[2] = Math.random() - 0.5;
            osg.vec3.scale(trans, trans, 10.0);

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
            var fac = 13.0;
            var texMat = mtTexQuad.getMatrix();
            osg.mat4.translate(texMat, texMat, osg.vec3.fromValues(fac, 0.0, 0));
            osg.mat4.scale(texMat, texMat, osg.vec3.fromValues(fac, fac, fac));

            return mtTexQuad;
        },

        createSceneGeometryGroup: function() {
            var group = new osg.Node();
            var primitives = this.createRandomPrimitives();
            group.addChild(primitives);

            var quad = this.createTexturedQuad();
            group.addChild(quad);

            // rotate primitives
            var axis = osg.vec3.fromValues(0.4, 0.6, 0.8);
            osg.vec3.normalize(axis, axis);

            var self = this;
            group.addUpdateCallback({
                update: function() {
                    var matrix = primitives.getMatrix();
                    osg.mat4.rotate(matrix, matrix, self._rotateSpeed, axis);

                    primitives.setNodeMask(self._showGeometry ? ~0x0 : 0x0);
                    quad.setNodeMask(self._showQuad ? ~0x0 : 0x0);

                    return true;
                }
            });

            return group;
        },

        getOrCreateDepthShader: function() {
            if (this._depthShader) return this._depthShader;

            var vertexshader = [
                ' #ifdef GL_ES',
                ' precision highp float;',
                ' #endif',
                '',
                ' attribute vec3 Vertex;',
                '',
                ' uniform mat4 uModelViewMatrix;',
                ' uniform mat4 uProjectionMatrix;',
                '',
                ' varying vec4 vViewVertex;',
                '',
                ' void main( void ) {',
                ' vViewVertex = uModelViewMatrix * vec4( Vertex, 1.0);',
                ' gl_Position = uProjectionMatrix * vViewVertex;',
                ' }'
            ].join('\n');

            var fragmentshader = [
                ' #ifdef GL_ES',
                ' precision highp float;',
                ' #endif',
                '',
                ' uniform vec2 uNearFar;',
                '',
                ' varying vec4 vViewVertex;',
                '',
                ' vec4 encodeFloatRGBA( float v ) {',
                '    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;',
                '    enc = fract(enc);',
                '    enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);',
                '    return enc;',
                ' }',
                '',
                ' void main( void ) {',
                '    gl_FragColor = encodeFloatRGBA((-vViewVertex.z * vViewVertex.w - uNearFar.x) / (uNearFar.y - uNearFar.x));',
                ' }'
            ].join('\n');

            this._depthShader = new osg.Program(
                new osg.Shader(osg.Shader.VERTEX_SHADER, vertexshader),
                new osg.Shader(osg.Shader.FRAGMENT_SHADER, fragmentshader)
            );

            return this._depthShader;
        },

        bindProjectionUpdateCallback: function(camera) {
            var self = this;
            camera.setClampProjectionMatrixCallback(function(m, near, far, nearFarRatio) {
                this.clampProjectionMatrix(m, near, far, nearFarRatio);

                osg.mat4.copy(self._viewer.getCamera().getProjectionMatrix(), m);

                if (self._params.composer === 'ssao.json') {
                    self.updateSsao(near, far);
                }
            });
        },

        updateSsao: function(near, far) {
            if (near > far) return;

            var rootSt = this._rootNode.getOrCreateStateSet();
            var nearFar = rootSt.getUniform('uNearFar').getInternalArray();
            nearFar[0] = near;
            nearFar[1] = far;

            var camera = this._viewer.getCamera();
            var vp = camera.getViewport();
            var projMat = camera.getProjectionMatrix();

            var vFov = projMat[15] === 1 ? 1.0 : 2.0 / projMat[5];
            var scale = -2.0 * Math.tan(vFov * 0.5);
            var st = this._composer.getOrCreateStateSet();
            st.getUniform('uSsaoProjectionScale').setFloat(vp.height() / scale);

            var projectionInfo = st.getUniform('uSsaoProjectionInfo').getInternalArray();
            projectionInfo[0] = -2.0 / (vp.width() * projMat[0]);
            projectionInfo[1] = -2.0 / (vp.height() * projMat[5]);
            projectionInfo[2] = (1.0 - projMat[8]) / projMat[0];
            projectionInfo[3] = (1.0 - projMat[9]) / projMat[5];
        },

        _createCameraRtt: function(texture) {
            var camera = new osg.Camera();

            camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
            camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, texture);

            camera.attachRenderBuffer(
                osg.FrameBufferObject.DEPTH_ATTACHMENT,
                osg.FrameBufferObject.DEPTH_COMPONENT16
            );

            return camera;
        },

        createCameraColor: function() {
            var texture = this._composer.getInternalTexture('TextureColor');
            var camera = this._createCameraRtt(texture);
            camera.setName('CameraColor');
            camera.setClearColor([0.5, 0.5, 0.5, 1.0]);
            return camera;
        },

        createCameraDepth: function() {
            var texture = this._composer.getInternalTexture('TextureDepth');
            var camera = this._createCameraRtt(texture);
            camera.setName('CameraDepth');
            camera.setClearColor([1.0, 1.0, 1.0, 1.0]);

            // depth shader
            var dst = camera.getOrCreateStateSet();
            dst.setAttributeAndModes(this.getOrCreateDepthShader(), osg.StateAttribute.OVERRIDE);
            return camera;
        },

        addInternalTextures: function() {
            this._composer.addInternalTexture({
                name: 'TextureColor',
                immuable: true,
                srgb: true,
                rgbm: false
            });

            this._composer.addInternalTexture({
                name: 'TextureDepth',
                filter: 'nearest',
                immuable: true,
                srgb: false,
                rgbm: false
            });

            this._composer.setInputTexture('TextureColor');
        },

        createComposer: function() {
            var viewer = this._viewer;
            var width = viewer.getCanvasWidth();
            var height = viewer.getCanvasHeight();

            var composer = new osgUtil.ComposerPostProcess();
            composer.setName('ComposerPostProcess');
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

        _resetCameraAttachements: function(camera) {
            var texture = camera.getAttachments()[osg.FrameBufferObject.COLOR_ATTACHMENT0].texture;
            // reset attachment and redo them (because of render buffer)
            // camera should have a resize attachments function for helper
            camera.resetAttachments();
            camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, texture);
            camera.attachRenderBuffer(
                osg.FrameBufferObject.DEPTH_ATTACHMENT,
                osg.FrameBufferObject.DEPTH_COMPONENT16
            );
        },

        update: function() {
            var viewer = this._viewer;
            var width = viewer.getCanvasWidth();
            var height = viewer.getCanvasHeight();

            if (width !== this._canvasWidth || height !== this._canvasHeight) {
                this._canvasWidth = width;
                this._canvasHeight = height;
                this._composer.resize(width, height);

                this._resetCameraAttachements(this._cameraColor);
                this._resetCameraAttachements(this._cameraDepth);
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

            var isPassthrough = fileName === 'passthrough.json';
            var passes = isPassthrough ? configFile : JSON.parse(configFile).passes;

            composer.build(passes);

            var vec2 = osg.vec2;
            var Uniform = osg.Uniform;
            var radius = this._scene.getBound().radius();
            this._uniforms = {
                // vignette
                uLensRadius: Uniform.createFloat2(vec2.fromValues(0.8, 0.25), 'uLensRadius'),

                // color curve
                uRedControl1: Uniform.createFloat2(vec2.fromValues(0.25, 0.25), 'uRedControl1'),
                uRedControl2: Uniform.createFloat2(vec2.fromValues(0.75, 0.75), 'uRedControl2'),
                uGreenControl1: Uniform.createFloat2(vec2.fromValues(0.25, 0.5), 'uGreenControl1'),
                uGreenControl2: Uniform.createFloat2(vec2.fromValues(0.5, 0.75), 'uGreenControl2'),
                uBlueControl1: Uniform.createFloat2(vec2.fromValues(0.25, 0.75), 'uBlueControl1'),
                uBlueControl2: Uniform.createFloat2(vec2.fromValues(0.5, 0.875), 'uBlueControl2'),

                // ssao
                uSsaoRadius: Uniform.createFloat(radius * 0.06, 'uSsaoRadius'),
                uSsaoBias: Uniform.createFloat(radius * 0.005, 'uSsaoBias'),
                uSsaoIntensity: Uniform.createFloat(0.3, 'uSsaoIntensity'),
                uSsaoCrispness: Uniform.createFloat(0.2, 'uSsaoCrispness'),
                uSsaoProjectionInfo: Uniform.createFloat4('uSsaoProjectionInfo'),
                uSsaoProjectionScale: Uniform.createFloat(1.0, 'uSsaoProjectionScale'),
                uSsaoOnly: Uniform.createInt(1, 'uSsaoOnly'),
                uSsaoMipmap: Uniform.createInt(1, 'uSsaoMipmap')
            };

            var st = this._composer.getOrCreateStateSet();
            for (var unif in this._uniforms) {
                st.addUniform(this._uniforms[unif]);
            }
        },

        rebuildGUI: function(name) {
            if (this._gui) {
                this._gui.destroy();
            }

            var self = this;
            this._gui = new window.dat.GUI();

            var cb = this._gui.add(this._params, 'composer', this._composerConfigNames).listen();

            var radius = this._scene.getBound().radius();
            var uniforms = this._uniforms;

            this._gui.add(this, '_rotateSpeed', 0.0, 0.01).name('Rotate speed');
            this._gui.add(this, '_showQuad').name('Show quad');
            this._gui.add(this, '_showGeometry').name('Show geometry');

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
                    if (value <= lensArray[1]) innerCtrl.setValue(value - eps);
                });

                innerCtrl.onChange(function(value) {
                    lensArray[1] = value;
                    if (value >= lensArray[0]) outerCtrl.setValue(value + eps);
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
                var r1array = uniforms.uRedControl1.getInternalArray();
                var r2array = uniforms.uRedControl2.getInternalArray();
                folder.add(r1array, 0, 0, 1).name('Red pt-1 x');
                folder.add(r1array, 1, 0, 1).name('Red pt-1 y');
                folder.add(r2array, 0, 0, 1).name('Red pt-2 x');
                folder.add(r2array, 1, 0, 1).name('Red pt-2 y');

                var g1array = uniforms.uGreenControl1.getInternalArray();
                var g2array = uniforms.uGreenControl2.getInternalArray();
                folder.add(g1array, 0, 0, 1).name('Green pt-1 x');
                folder.add(g1array, 1, 0, 1).name('Green pt-1 y');
                folder.add(g2array, 0, 0, 1).name('Green pt-2 x');
                folder.add(g2array, 1, 0, 1).name('Green pt-2 y');

                var b1array = uniforms.uBlueControl1.getInternalArray();
                var b2array = uniforms.uBlueControl2.getInternalArray();
                folder.add(b1array, 0, 0, 1).name('Blue pt-1 x');
                folder.add(b1array, 1, 0, 1).name('Blue pt-1 y');
                folder.add(b2array, 0, 0, 1).name('Blue pt-2 x');
                folder.add(b2array, 1, 0, 1).name('Blue pt-2 y');
            } else if (name === 'ssao.json') {
                folder.add(uniforms.uSsaoIntensity.getInternalArray(), 0, 0, 1).name('Intensity');
                folder
                    .add(uniforms.uSsaoRadius.getInternalArray(), 0, 0.01 * radius, 0.1 * radius)
                    .name('Radius');

                folder
                    .add(uniforms.uSsaoBias.getInternalArray(), 0, 0.002 * radius, 0.01 * radius)
                    .name('Bias');

                folder
                    .add(uniforms.uSsaoCrispness.getInternalArray(), 0, 0.0, 1.0)
                    .name('Crispness');

                var only = uniforms.uSsaoOnly.getInternalArray();
                folder
                    .add({ bool: only[0] ? true : false }, 'bool')
                    .name('Ssao only')
                    .onChange(function(bool) {
                        only[0] = bool ? 1 : 0;
                    });

                var mip = uniforms.uSsaoMipmap.getInternalArray();
                folder
                    .add({ bool: mip[0] ? true : false }, 'bool')
                    .name('Use mipmap')
                    .onChange(function(bool) {
                        mip[0] = bool ? 1 : 0;
                    });
            }
            this._currentComposer = name;
        },

        addComposerConfig: function(name, content) {
            this._composerConfigNames.push(name);
            this._composerConfigFiles[name] = content;

            // dat.GUI doesn't have an easy way to add elements into the combobox
            // so we just rebuild the whole GUI
            this.rebuildGUI(this._currentComposer);
        },

        addPostProcessEffect: function(files, fileContents) {
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

                this.addPostProcessEffect([{ name: shaderName }], [xhr.responseText]);
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

        example.loadXHR('shaders/ssao.json');
        example.loadXHR('shaders/ssaoExtract.glsl');
        example.loadXHR('shaders/ssaoBlur.glsl');
    };

    window.addEventListener('load', initExample, true);
})();
