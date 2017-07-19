(function() {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgUtil = OSG.osgUtil;
    var osgShader = OSG.osgShader;
    var $ = window.$;
    var JSZip = window.JSZip;
    var Object = window.Object;

    var Environment = window.Environment;

    var PredefinedMaterials = {
        Silver: [0.971519, 0.959915, 0.915324],
        Aluminium: [0.913183, 0.921494, 0.924524],
        Gold: [1, 0.765557, 0.336057],
        Copper: [0.955008, 0.637427, 0.538163],
        Chromium: [0.549585, 0.556114, 0.554256],
        Nickel: [0.659777, 0.608679, 0.525649],
        Titanium: [0.541931, 0.496791, 0.449419],
        Cobalt: [0.662124, 0.654864, 0.633732],
        Platinum: [0.672411, 0.637331, 0.585456]
    };

    var CameraPresets = {
        CameraGold: {
            target: [80.0, 0.0, 80.0],
            eye: [80.0, -155.0, 120.0]
        },
        CameraMetal: {
            target: [80.0, 0.0, 40.0],
            eye: [80.0, -155.0, 80.0]
        },
        CameraCenter: {
            target: [80.0, 0.0, 20.0],
            eye: [80.0, -215.0, 20.0]
        },
        CameraPBR: {
            target: [160.0, 0.0, 80.0],
            eye: [160.0, -100.0, 80.0]
        },
        CameraSamples: {
            target: [46.0, 20.0, 80.0],
            eye: [46.0, -62.5, 80.0]
        }
    };

    var isMobileDevice = function() {
        if (navigator.userAgent.match(/Mobile/i)) return true;
        if (navigator.userAgent.match(/Android/i)) return true;
        if (navigator.userAgent.match(/iPhone/i)) return true;
        if (navigator.userAgent.match(/iPad/i)) return true;
        if (navigator.userAgent.match(/iPod/i)) return true;
        if (navigator.userAgent.match(/BlackBerry/i)) return true;
        if (navigator.userAgent.match(/Windows Phone/i)) return true;

        return false;
    };

    var optionsURL = {};
    (function(options) {
        var vars = [],
            hash;
        var indexOptions = window.location.href.indexOf('?');
        if (indexOptions < 0) return;

        var hashes = window.location.href.slice(indexOptions + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            var element = hash[0];
            vars.push(element);
            var result = hash[1];
            if (result === undefined) {
                result = '1';
            }
            options[element] = result;
        }
    })(optionsURL);

    var linear2Srgb = function(value, gammaIn) {
        var gamma = gammaIn;
        if (!gamma) gamma = 2.2;
        var result = 0.0;
        if (value < 0.0031308) {
            if (value > 0.0) result = value * 12.92;
        } else {
            result = 1.055 * Math.pow(value, 1.0 / gamma) - 0.055;
        }
        return result;
    };

    var PBRWorkflowVisitor = function() {
        this._workflow = [];
        osg.NodeVisitor.call(this);
    };

    PBRWorkflowVisitor.prototype = osg.objectInherit(osg.NodeVisitor.prototype, {
        apply: function(node) {
            var data = node.getUserData();
            var vertexColor;
            if (data && data.pbrWorklow) {
                var stateSetWorkflow = {
                    stateSet: node.getOrCreateStateSet(),
                    workflow: data.pbrWorklow
                };
                // Need to store if model has vertexColors
                if (node instanceof osg.Geometry) {
                    vertexColor = node.getAttributes().Color !== undefined;
                    stateSetWorkflow.vertexColor = vertexColor;
                }
                this._workflow.push(stateSetWorkflow);
            }
            this.traverse(node);
        },
        getWorkflows: function() {
            return this._workflow;
        }
    });

    var shaderProcessor = new osgShader.ShaderProcessor();

    window.ALBEDO_TEXTURE_UNIT = 2;
    window.DIFFUSE_TEXTURE_UNIT = 2;
    window.METALLIC_ROUGHNESS_TEXTURE_UNIT = 3;
    window.SPECULAR_TEXTURE_UNIT = 4;
    window.NORMAL_TEXTURE_UNIT = 5;

    window.GLTF_PBR_SPEC_MODE = 'PBR_specular_glossiness';

    var modelList = ['sphere', 'model'];

    var defaultEnvironment = 'textures/parking.zip';
    var envURL = defaultEnvironment;
    if (optionsURL.env) {
        if (optionsURL.env.indexOf('http') !== -1) envURL = optionsURL.env;
        else envURL = 'textures/' + optionsURL.env;
    }
    var environment = envURL;
    var environmentList = [];
    var environmentMap = {};

    var Example = function() {
        this._gui = new window.dat.GUI();

        this._shaderPath = 'shaders/';

        this._config = {
            envRotation: Math.PI,
            lod: 0.01,
            albedo: '#c8c8c8',
            environmentType: 'cubemapSeamless',
            brightness: 1.0,
            normalAA: Boolean(optionsURL.normalAA === undefined ? true : optionsURL.normalAA),
            specularPeak: Boolean(
                optionsURL.specularPeak === undefined ? true : optionsURL.specularPeak
            ),
            occlusionHorizon: Boolean(
                optionsURL.occlusionHorizon === undefined ? true : optionsURL.occlusionHorizon
            ),
            cameraPreset: optionsURL.camera
                ? Object.keys(CameraPresets)[optionsURL.camera]
                : 'CameraCenter',

            roughness: 0.5,
            material: 'Gold',

            format: '',
            model: modelList[0],
            environment: '',
            mobile: isMobileDevice(),
            nb: 8,
            offset: 160
        };

        this.updateAlbedo();

        this._uniformHammersleySequence = {};
        this._integrateBRDFTextureUnit = 14;
        this._materialDefines = [];
        this._shaderDefines = [];
        this._modelDefines = [];

        this._modelsLoaded = {};

        this._environmentTransformUniform = osg.Uniform.createMatrix4(
            osg.mat4.create(),
            'uEnvironmentTransform'
        );

        this._cubemapUE4 = {};

        this._shaders = [];

        this._currentEnvironment = undefined;

        // node that will contains models
        this._proxyRealModel = new osg.Node();
        this._proxyRealModel.setName('ProxyRealModel');

        // rotation of the environment geometry
        this._environmentTransformMatrix = undefined;

        this._envBrightnessUniform = osg.Uniform.createFloat1(1.0, 'uBrightness');

        this._normalAA = osg.Uniform.createInt1(0, 'uNormalAA');
        this._specularPeak = osg.Uniform.createInt1(
            this._config.specularPeak ? 1 : 0,
            'uSpecularPeak'
        );

        this._occlusionHorizon = osg.Uniform.createInt1(0, 'uOcclusionHorizon');

        // background stateSet
        this._backgroundStateSet = new osg.StateSet();
        // Keep a reference to update it from the GUI
        this._rowMetalic = undefined;

        window.printCurrentCamera = function() {
            var eye = osg.vec3.create();
            var target = osg.vec3.create();
            console.log('target ' + this._viewer.getManipulator().getTarget(target).toString());
            console.log('eye ' + this._viewer.getManipulator().getEyePosition(eye).toString());
        }.bind(this);
    };

    Example.prototype = {
        createEnvironment: function(urlOrZip, zipFileName) {
            var env = new Environment();

            var registerEnvironment = function(envReady) {
                var name = envReady.name;
                environmentMap[name] = envReady;
                environmentList.push(name);

                var controllers = this._gui.__controllers;
                var controller = controllers.filter(function(cont) {
                    return cont.property === 'environment';
                })[0];

                this._config.environment = name;
                controller = controller.options(environmentList);
                controller.onChange(this.setEnvironment.bind(this));
            }.bind(this);

            if (typeof urlOrZip === 'string') {
                var url = urlOrZip;
                return env.loadPackage(url).then(function() {
                    registerEnvironment(env);
                    return env;
                });
            }

            var zip = urlOrZip;
            return env.readZipContent(zip, zipFileName).then(function() {
                registerEnvironment(env);
                return env;
            });
        },

        updateConfigFromEnvironment: function(formatList) {
            if (formatList.indexOf(this._config.format) === -1) this._config.format = formatList[0];

            var controllers = this._gui.__controllers;
            var controller = controllers.filter(function(cont) {
                return cont.property === 'format';
            })[0];
            controller = controller.options(formatList);
            controller.onChange(this.updateEnvironment.bind(this));
        },

        setEnvironment: function(name) {
            if (environmentMap[name]) {
                this._currentEnvironment = environmentMap[name];
                this.updateConfigFromEnvironment(this._currentEnvironment.getFormatList());
                this.updateEnvironment();
            }
        },

        loadZipFile: function(fileOrBlob, zipFileName) {
            return JSZip.loadAsync(fileOrBlob).then(
                function(zip) {
                    var gltfFormat;
                    var environmentFormat;
                    Object.keys(zip.files).forEach(function(path) {
                        var filename = path.split('/').pop();
                        var ext = filename.split('.').pop();
                        if (ext === 'gltf') gltfFormat = true;
                        if (filename === 'config.json') environmentFormat = true;
                    });

                    if (gltfFormat) {
                        var self = this;
                        var filesMap = new window.Map();
                        filesMap.set(zipFileName, fileOrBlob);
                        osgDB
                            .readNodeURL(zipFileName, {
                                filesMap: filesMap
                            })
                            .then(function(node) {
                                return self.loadNode(node);
                            });
                    } else if (environmentFormat) {
                        var name = zipFileName;
                        return this.createEnvironment(zip, name).then(
                            function(env) {
                                return this.setEnvironment(env.name);
                            }.bind(this)
                        );
                    }

                    return false;
                }.bind(this)
            );
        },

        handleDroppedFiles: function(files) {
            var self = this;
            $('#loading').show();

            if (files.length === 1 && files[0].name.split('.').pop().toLowerCase() === 'zip') {
                return this.loadZipFile(files[0], files[0].name).then(function() {
                    $('#loading').hide();
                });
            }

            return osgDB.FileHelper
                .readFileList(files)
                .then(function(root) {
                    self.loadNode(root);
                })
                .catch(function(fails) {
                    $('#loading').hide();
                    osg.error("cant't read file " + fails);
                });
        },

        loadNode: function(node) {
            $('#loading').hide();
            if (!node) return;
            var gltfFileName = node.getName();
            //osg.mat4.scale( root.getMatrix(), root.getMatrix(), [ 20, 20, 20 ] );

            this._modelsLoaded[gltfFileName] = node;

            this._config.model = gltfFileName;
            this.updateModel();
            console.timeEnd('time');
            // Updates the dropdown list
            modelList.push(gltfFileName);

            var controllers = this._gui.__controllers;
            var controller = controllers.filter(function(cont) {
                return cont.property === 'model';
            })[0];
            controller = controller.options(modelList);
            controller.onChange(this.updateModel.bind(this));
        },

        handleDroppedURL: function(url) {
            $('#loading').show();
            return osgDB
                .requestFile(url, {
                    responseType: 'blob'
                })
                .then(
                    function(blob) {
                        return this.loadZipFile(blob, url).then(function() {
                            $('#loading').hide();
                        });
                    }.bind(this)
                );
        },

        loadFiles: function() {
            var self = this;

            var input = $(document.createElement('input'));
            input.attr('type', 'file');
            input.attr('multiple', '');
            input.trigger('click');
            input.on('change', function() {
                self.handleDroppedFiles(this.files);
            });

            return false;
        },

        setMaterial: function(stateSet, albedo, metalRoughness, specular) {
            stateSet.setTextureAttributeAndModes(window.ALBEDO_TEXTURE_UNIT, albedo);
            stateSet.setTextureAttributeAndModes(
                window.METALLIC_ROUGHNESS_TEXTURE_UNIT,
                metalRoughness
            );
            if (specular)
                stateSet.setTextureAttributeAndModes(window.SPECULAR_TEXTURE_UNIT, specular);
            if (this._stateSetPBR) this.updateShaderPBR();
        },

        getTexture0000: function() {
            if (!this._texture0000)
                this._texture0000 = this.createTextureFromColor(osg.vec4.fromValues(0, 0, 0, 1));
            return this._texture0000;
        },

        getTexture1111: function() {
            if (!this._texture1111) this._texture1111 = this.createTextureFromColor(osg.vec4.ONE);
            return this._texture1111;
        },

        createTextureFromColor: function(colorArg, srgb, textureOutput) {
            var colorInput = colorArg;
            var albedo = new osg.Uint8Array(4);

            if (typeof colorInput === 'number') {
                colorInput = [colorInput];
            }
            var color = colorInput.slice(0);

            if (color.length === 3) color.push(1.0);

            if (color.length === 1) {
                color.push(color[0]);
                color.push(color[0]);
                color.push(1.0);
            }

            color.forEach(function(value, index) {
                if (srgb) albedo[index] = Math.floor(255 * linear2Srgb(value));
                else albedo[index] = Math.floor(255 * value);
            });

            var texture = textureOutput;
            if (!texture) texture = new osg.Texture();
            texture.setTextureSize(1, 1);
            texture.setImage(albedo);
            return texture;
        },

        createMetalRoughnessTextureFromColors: function(
            metalColor,
            roughnessColor,
            srgb,
            textureOutput
        ) {
            var albedo = new osg.Uint8Array(4);
            var color = new Float32Array(4);
            color[1] = roughnessColor;
            color[2] = metalColor;
            color.forEach(function(value, index) {
                if (srgb) albedo[index] = Math.floor(255 * linear2Srgb(value));
                else albedo[index] = Math.floor(255 * value);
            });

            var texture = textureOutput;
            if (!texture) texture = new osg.Texture();
            texture.setTextureSize(1, 1);
            texture.setImage(albedo);
            return texture;
        },

        readShaders: function() {
            var shaderNames = [
                'math.glsl',
                'cubemapVertex.glsl',
                'cubemapFragment.glsl',
                'cubemapSampler.glsl',
                'panoramaVertex.glsl',
                'panoramaFragment.glsl',
                'panoramaSampler.glsl',

                'pbrReferenceFragment.glsl',
                'pbrReferenceVertex.glsl',
                'colorSpace.glsl',

                'pbr_ue4.glsl',

                'sphericalHarmonics.glsl',
                'sphericalHarmonicsVertex.glsl',
                'sphericalHarmonicsFragment.glsl'
            ];

            var shaders = shaderNames.map(
                function(arg) {
                    return this._shaderPath + arg;
                }.bind(this)
            );

            var promises = [];
            shaders.forEach(function(shader) {
                promises.push(P.resolve($.get(shader)));
            });

            return P.all(promises).then(function(args) {
                var shaderNameContent = {};
                shaderNames.forEach(function(name, idx) {
                    shaderNameContent[name] = args[idx];
                });

                shaderProcessor.addShaders(shaderNameContent);
            });
        },

        // config = {
        //     normalMap: false,
        //     glossinessMap: false,
        //     specularMap: false
        //     aoMap: false
        // }
        createShaderPBR: function(config) {
            var defines = [];

            this._materialDefines.forEach(function(d) {
                defines.push(d);
            });

            this._modelDefines.forEach(function(d) {
                defines.push(d);
            });

            if (config && config.noTangent === true) defines.push('#define NO_TANGENT');

            if (config && config.normalMap === true) defines.push('#define NORMAL');

            if (config && config.vertexColor === true) defines.push('#define VERTEX_COLOR');

            if (config && config.specularGlossinessMap === true)
                defines.push('#define SPECULAR_GLOSSINESS');

            if (config && config.emissiveMap === true) defines.push('#define EMISSIVE');

            if (config && config.specularMap === true) defines.push('#define SPECULAR');

            if (config && config.aoMap === true) defines.push('#define AO');

            if (config && config.environmentType === 'cubemapSeamless') {
                defines.push('#define CUBEMAP_LOD ');
            } else {
                defines.push('#define PANORAMA ');
            }

            defines.push('#define ' + config.format);

            if (config && config.mobile) {
                defines.push('#define MOBILE');
            }

            if (!this._shaderCache) this._shaderCache = {};

            var hash = defines.join();
            if (!this._shaderCache[hash]) {
                var vertexshader = shaderProcessor.getShader('pbrReferenceVertex.glsl');
                var fragmentshader = shaderProcessor.getShader(
                    'pbrReferenceFragment.glsl',
                    defines
                );

                var program = new osg.Program(
                    new osg.Shader('VERTEX_SHADER', vertexshader),
                    new osg.Shader('FRAGMENT_SHADER', fragmentshader)
                );

                this._shaderCache[hash] = program;
            }

            return this._shaderCache[hash];
        },

        updateEnvironmentBrightness: function() {
            var b = this._config.brightness;
            this._envBrightnessUniform.setFloat(b);
        },

        updateNormalAA: function() {
            var aa = this._config.normalAA ? 1 : 0;
            this._normalAA.setInt(aa);
        },

        updateSpecularPeak: function() {
            var aa = this._config.specularPeak ? 1 : 0;
            this._specularPeak.setInt(aa);
        },

        updateOcclusionHorizon: function() {
            var aa = this._config.occlusionHorizon ? 1 : 0;
            this._occlusionHorizon.setInt(aa);
        },

        updateCameraPreset: function() {
            var preset = CameraPresets[this._config.cameraPreset];
            if (!preset) {
                preset = CameraPresets[Object.keys(CameraPresets)[0]];
                osg.warn('Camera preset not found, use default');
            }
            this._viewer.getManipulator().setTarget(preset.target);
            this._viewer.getManipulator().setEyePosition(preset.eye);
        },

        updateEnvironmentRotation: function() {
            if (!this._environmentTransformMatrix) return;
            var rotation = this._config.envRotation;
            osg.mat4.fromRotation(this._environmentTransformMatrix, rotation, [0, 0, 1]);
        },

        createEnvironmentNode: function() {
            var scene = new osg.Node();

            // create the environment sphere
            var size = 500;
            //var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );

            // to use the same shader panorama
            var geom = osg.createTexturedSphereGeometry(size / 2, 20, 20);
            var ss = geom.getOrCreateStateSet();
            geom.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));
            geom.getOrCreateStateSet().setAttributeAndModes(new osg.Depth('DISABLE'));
            geom.setBound(new osg.BoundingBox());

            ss.setRenderBinDetails(-1, 'RenderBin');

            var environmentTransform = this._environmentTransformUniform;

            var mt = new osg.MatrixTransform();
            mt.addChild(geom);

            var CullCallback = function() {
                this.cull = function(node, nv) {
                    // overwrite matrix, remove translate so environment is always at camera origin
                    osg.mat4.setTranslation(nv.getCurrentModelViewMatrix(), [0, 0, 0]);
                    var m = nv.getCurrentModelViewMatrix();

                    // add a rotation, because environment has the convention y up
                    var rotateYtoZ = osg.mat4.fromRotation(osg.mat4.create(), Math.PI / 2, [
                        1,
                        0,
                        0
                    ]);

                    osg.mat4.mul(environmentTransform.getInternalArray(), m, rotateYtoZ);
                    //osg.mat4.copy( environmentTransform.get() , m );
                    return true;
                };
            };
            mt.setCullCallback(new CullCallback());
            this._environmentTransformMatrix = mt.getMatrix();

            var cam = new osg.Camera();
            cam.setClearMask(0x0);
            cam.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
            cam.addChild(mt);
            cam.setCullCallback(new CullCallback());

            var self = this;
            // the update callback get exactly the same view of the camera
            // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
            var info = {};
            var proj = [];
            var UpdateCallback = function() {
                this.update = function() {
                    var rootCam = self._viewer.getCamera();

                    osg.mat4.getPerspective(info, rootCam.getProjectionMatrix());
                    osg.mat4.perspective(
                        proj,
                        Math.PI / 180 * info.fovy,
                        info.aspectRatio,
                        1.0,
                        1000.0
                    );

                    cam.setProjectionMatrix(proj);
                    cam.setViewMatrix(rootCam.getViewMatrix());

                    return true;
                };
            };
            cam.addUpdateCallback(new UpdateCallback());

            scene.addChild(cam);
            return scene;
        },

        createModelMaterialSample: function() {
            this._proxyModel = new osg.Node();

            var request = osgDB.readNodeURL('../media/models/material-test/file.osgjs');

            request.then(
                function(model) {
                    var mt = new osg.MatrixTransform();
                    osg.mat4.fromRotation(mt.getMatrix(), -Math.PI / 2, [1, 0, 0]);
                    var bb = model.getBound();
                    osg.mat4.mul(
                        mt.getMatrix(),
                        osg.mat4.fromTranslation(osg.mat4.create(), [0, -bb.radius() / 2, 0]),
                        mt.getMatrix()
                    );
                    mt.addChild(model);

                    this._modelMaterial = mt;

                    this._proxyModel.addChild(this._modelMaterial);
                    this._modelMaterial.setNodeMask(0);

                    var tangentVisitor = new osgUtil.TangentSpaceGenerator();
                    model.accept(tangentVisitor);
                }.bind(this)
            );

            this._modelSphere = osg.createTexturedSphereGeometry(20 / 2, 40, 40);
            this._proxyModel.addChild(this._modelSphere);

            return request;
        },

        updateModel: function() {
            if (!this._modelSphere || !this._modelMaterial) return;

            this._modelSphere.setNodeMask(0x0);
            this._modelMaterial.setNodeMask(0x0);
            this._proxyRealModel.setNodeMask(0x0);

            var node;
            if (this._config.model === 'sphere') {
                node = this._modelSphere;
            } else if (this._config.model === 'model') {
                node = this._modelMaterial;
            } else {
                var model = null;
                if (
                    this._config.model.indexOf('.gltf') !== -1 ||
                    this._config.model.indexOf('.zip') !== -1
                ) {
                    model = this._modelsLoaded[this._config.model];

                    var visitorWorkflow = new PBRWorkflowVisitor();
                    model.accept(visitorWorkflow);

                    var workflows = visitorWorkflow.getWorkflows();
                    var tex1 = this.getTexture1111();
                    for (var i = 0; i < workflows.length; ++i) {
                        var normalMap = true;
                        var emissive = true;
                        var vertexColor = false;
                        var stateSet = workflows[i].stateSet;
                        var specularWorkflow = workflows[i].workflow === window.GLTF_PBR_SPEC_MODE;
                        // Check we have textures, else generate 1x1 texture

                        // From the spec:  If a texture is not given, all respective texture components
                        // within this material model are assumed to have a value of 1.0.
                        // If both factors and textures are present the factor value acts
                        // as a linear multiplier for the corresponding texture values.
                        if (stateSet.getTextureAttribute(2, 'Texture') === undefined) {
                            stateSet.setTextureAttributeAndModes(2, tex1);
                        }
                        if (stateSet.getTextureAttribute(3, 'Texture') === undefined) {
                            stateSet.setTextureAttributeAndModes(3, tex1);
                        }
                        if (stateSet.getTextureAttribute(5, 'Texture') === undefined) {
                            normalMap = false;
                        }
                        if (stateSet.getTextureAttribute(7, 'Texture') === undefined) {
                            emissive = false;
                        }
                        // Search for vertex colors in the model
                        if (workflows[i].vertexColor === true) {
                            vertexColor = true;
                        }
                        var shaderConfig = {
                            normalMap: normalMap,
                            vertexColor: vertexColor,
                            noTangent: false,
                            specularGlossinessMap: specularWorkflow,
                            emissiveMap: emissive
                        };

                        var config = {
                            stateSet: workflows[i].stateSet,
                            config: shaderConfig
                        };

                        this._shaders.push(config);
                        this.updateShaderPBR();
                    }
                }

                if (model) {
                    this._proxyRealModel.removeChildren();
                    this._proxyRealModel.addChild(model);
                    node = this._proxyRealModel;
                }
            }

            if (node) {
                node.setNodeMask(~0x0);
                node.dirtyBound();
                this._viewer.getManipulator().computeHomePosition();
            }
        },

        registerModel: function(model) {
            var modelNode = model.getNode();

            var config = {
                stateSet: modelNode.getOrCreateStateSet(),
                config: model.getConfig()
            };

            this._shaders.push(config);
            this.updateShaderPBR();
            return config;
        },

        getModelTestInstance: function() {
            var mt = new osg.MatrixTransform();

            mt.addChild(this._proxyModel);

            return mt;
        },

        updateRowModelsSpecularMetal: function() {
            var specularTexture = (this._specularMetalTexture = this.createTextureFromColor(
                PredefinedMaterials[this._config.material],
                true,
                this._specularMetalTexture
            ));
            return specularTexture;
        },

        createRowModelsSpecularMetal: function() {
            var albedo = this.getTexture0000();

            var specularTexture = this.updateRowModelsSpecularMetal();

            var group = new osg.MatrixTransform();

            for (var j = 0; j < this._config.nb; j++) {
                var roughness = j / (this._config.nb - 1);

                var sample = this.getModelTestInstance();
                var x = roughness * this._config.offset;
                osg.mat4.fromTranslation(sample.getMatrix(), [x, 0, 0]);

                var metalRoughnessTexture = this.createMetalRoughnessTextureFromColors(
                    0,
                    roughness,
                    false
                );

                this.setMaterial(
                    sample.getOrCreateStateSet(),
                    albedo,
                    metalRoughnessTexture,
                    specularTexture
                );
                group.addChild(sample);
            }
            return group;
        },

        updateRowModelsMetalic: function() {
            this._rowMetalic.removeChildren();
            this._rowMetalic.addChild(this.createRowModelsMetalic());
        },

        createRowModelsMetalic: function() {
            var albedo = this._albedoTexture;
            var roughness = this._config.roughness;

            var group = new osg.MatrixTransform();

            for (var j = 0; j < this._config.nb; j++) {
                var metal = j / (this._config.nb - 1);

                var sample = this.getModelTestInstance();
                var x = metal * this._config.offset;
                osg.mat4.fromTranslation(sample.getMatrix(), [x, 0, 0]);

                var metallicRoughnessTexture = this.createMetalRoughnessTextureFromColors(
                    metal,
                    roughness,
                    false
                );

                this.setMaterial(sample.getOrCreateStateSet(), albedo, metallicRoughnessTexture);
                group.addChild(sample);
            }
            return group;
        },

        createRowModelsRoughness: function() {
            var group = new osg.MatrixTransform();
            var albedo = this._albedoTexture;
            var metal, roughness;
            var metalRoughnessTexture;
            var sample;

            for (var i = 0; i < 2; i++) {
                metal = i;

                for (var j = 0; j < this._config.nb; j++) {
                    roughness = j / (this._config.nb - 1);

                    sample = this.getModelTestInstance();

                    var x = roughness * this._config.offset;
                    var y = metal * this._config.offset * 0.2;
                    osg.mat4.fromTranslation(sample.getMatrix(), [x, -y * 1.2, 0]);

                    metalRoughnessTexture = this.createMetalRoughnessTextureFromColors(
                        metal,
                        roughness,
                        false
                    );

                    this.setMaterial(sample.getOrCreateStateSet(), albedo, metalRoughnessTexture);

                    group.addChild(sample);
                }
            }

            return group;
        },

        createSampleModels: function() {
            var group = new osg.Node();

            var stateSet;
            var config;

            var rowRoughness = this.createRowModelsRoughness();
            stateSet = rowRoughness.getOrCreateStateSet();
            config = {
                stateSet: stateSet,
                config: {
                    noTangent: true
                }
            };
            this._shaders.push(config);
            group.addChild(rowRoughness);
            osg.mat4.fromTranslation(rowRoughness.getMatrix(), [0, 0, 0]);
            // Keep a reference to update it from the GUI
            this._rowMetalic = new osg.MatrixTransform();
            this._rowMetalic.addChild(this.createRowModelsMetalic());
            stateSet = this._rowMetalic.getOrCreateStateSet();
            config = {
                stateSet: stateSet,
                config: {
                    noTangent: true
                }
            };
            this._shaders.push(config);
            group.addChild(this._rowMetalic);
            osg.mat4.fromTranslation(this._rowMetalic.getMatrix(), [0, 40, 0]);

            var rowSpecular = this.createRowModelsSpecularMetal();
            stateSet = rowSpecular.getOrCreateStateSet();
            config = {
                stateSet: stateSet,
                config: {
                    specularMap: true,
                    noTangent: true
                }
            };
            this._shaders.push(config);
            group.addChild(rowSpecular);
            osg.mat4.fromTranslation(rowSpecular.getMatrix(), [0, 80, 0]);

            this.updateShaderPBR();

            group.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace());
            return group;
        },

        createSampleScene: function() {
            var group = this._mainSceneNode;

            group.addChild(this._environmentGeometry);

            group.addChild(this.createSampleModels());

            // add node that contains model loaded
            group.addChild(this._proxyRealModel);

            return group;
        },

        createShaderPanorama: function(defines) {
            var vertexshader = shaderProcessor.getShader('panoramaVertex.glsl');
            var fragmentshader = shaderProcessor.getShader('panoramaFragment.glsl', defines);

            var program = new osg.Program(
                new osg.Shader('VERTEX_SHADER', vertexshader),
                new osg.Shader('FRAGMENT_SHADER', fragmentshader)
            );

            return program;
        },

        createShaderCubemap: function(defines) {
            var vertexshader = shaderProcessor.getShader('cubemapVertex.glsl');
            var fragmentshader = shaderProcessor.getShader('cubemapFragment.glsl', defines);

            var program = new osg.Program(
                new osg.Shader('VERTEX_SHADER', vertexshader),
                new osg.Shader('FRAGMENT_SHADER', fragmentshader)
            );

            return program;
        },

        updateGlobalUniform: function(stateSet) {
            stateSet.addUniform(this._environmentTransformUniform);
            stateSet.addUniform(this._envBrightnessUniform);
            stateSet.addUniform(this._normalAA);
            stateSet.addUniform(this._specularPeak);
            stateSet.addUniform(this._occlusionHorizon);
        },

        setPanorama: function() {
            // set the stateSet of the environment geometry
            this.setSphericalEnv();

            var texture;

            texture = this._currentEnvironment.getPanoramaUE4()[this._config.format].getTexture();

            var stateSet = this._mainSceneNode.getOrCreateStateSet();
            var w = texture.getWidth();
            stateSet.addUniform(osg.Uniform.createFloat2([w, w / 2], 'uEnvironmentSize'));

            // x4 because the base is for cubemap
            var textures = this._currentEnvironment.getTextures('specular_ue4', 'luv', 'panorama');
            var textureConfig = textures[0];
            var minTextureSize = textureConfig.limitSize;

            var nbLod = Math.log(w) / Math.LN2;
            var maxLod = nbLod - Math.log(minTextureSize) / Math.LN2;

            stateSet.addUniform(osg.Uniform.createFloat2([nbLod, maxLod], 'uEnvironmentLodRange'));
            stateSet.addUniform(osg.Uniform.createInt1(0, 'uEnvironment'));

            this.updateGlobalUniform(stateSet);

            stateSet.setTextureAttributeAndModes(0, texture);
        },

        setCubemapSeamless: function() {
            this.setSphericalEnv();

            var envCubemap = this._currentEnvironment.getCubemapUE4();
            var texture = envCubemap[this._config.format].getTexture();

            var stateSet = this._mainSceneNode.getOrCreateStateSet();
            var w = texture.getWidth();

            var textures = this._currentEnvironment.getTextures('specular_ue4', 'luv', 'cubemap');
            var textureConfig = textures[0];
            var minTextureSize = textureConfig.limitSize;

            var nbLod = Math.log(w) / Math.LN2;
            var maxLod = nbLod - Math.log(minTextureSize) / Math.LN2;

            stateSet.addUniform(osg.Uniform.createFloat2([nbLod, maxLod], 'uEnvironmentLodRange'));
            stateSet.addUniform(osg.Uniform.createFloat2([w, w], 'uEnvironmentSize'));
            stateSet.addUniform(osg.Uniform.createInt1(0, 'uEnvironmentCube'));

            this.updateGlobalUniform(stateSet);

            stateSet.setTextureAttributeAndModes(0, texture);
        },

        setBackgroundEnvironment: function() {
            // set the stateSet of the environment geometry
            this._environmentStateSet.setAttributeAndModes(
                this.createShaderCubemap(['#define ' + this._config.format])
            );

            var backgroundCubemap = this._currentEnvironment.getBackgroundCubemap();
            var textureBackground = backgroundCubemap[this._config.format].getTexture();

            var w = textureBackground.getWidth();
            this._environmentStateSet.addUniform(
                osg.Uniform.createFloat2([w, w], 'uEnvironmentSize')
            );
            this._environmentStateSet.addUniform(osg.Uniform.createInt1(0, 'uEnvironmentCube'));
            this._environmentStateSet.setTextureAttributeAndModes(0, textureBackground);
        },

        setSphericalEnv: function() {
            this._environmentStateSet.addUniform(
                this._currentEnvironment.getSpherical()._uniformSpherical
            );
        },

        createScene: function() {
            this._environmentGeometry = this.createEnvironmentNode();
            this._environmentStateSet = this._environmentGeometry.getOrCreateStateSet();

            this._mainSceneNode = new osg.Node();

            var root = new osg.Node();

            var group = new osg.MatrixTransform();
            root.addChild(group);

            // add lod controller to debug
            this._lod = osg.Uniform.createFloat1(0.0, 'uLod');
            group.getOrCreateStateSet().addUniform(this._lod);

            if (!isMobileDevice()) {
                var integrateBRDFUniform = osg.Uniform.createInt1(
                    this._integrateBRDFTextureUnit,
                    'uIntegrateBRDF'
                );
                group.getOrCreateStateSet().addUniform(integrateBRDFUniform);
                this._stateSetBRDF = group.getOrCreateStateSet();
            }

            var promises = [];

            // precompute panorama
            P.all(promises).then(
                function() {
                    group.addChild(this.createSampleScene());

                    this.updateEnvironment();
                    // y up
                    osg.mat4.fromRotation(group.getMatrix(), -Math.PI / 2, [-1, 0, 0]);
                    var stateSet = root.getOrCreateStateSet();
                    stateSet.addUniform(
                        osg.Uniform.createInt(
                            window.METALLIC_ROUGHNESS_TEXTURE_UNIT,
                            'metallicRoughnessMap'
                        )
                    );
                    stateSet.addUniform(
                        osg.Uniform.createInt(window.NORMAL_TEXTURE_UNIT, 'normalMap')
                    );
                    stateSet.addUniform(
                        osg.Uniform.createInt(window.SPECULAR_TEXTURE_UNIT, 'specularMap')
                    );
                    stateSet.addUniform(
                        osg.Uniform.createInt(window.ALBEDO_TEXTURE_UNIT, 'albedoMap')
                    );

                    //PBR default uniforms
                    stateSet.addUniform(
                        osg.Uniform.createFloat4(
                            osg.vec4.fromValues(1.0, 1.0, 1.0, 1.0),
                            'uBaseColorFactor'
                        )
                    );
                    stateSet.addUniform(osg.Uniform.createFloat1(1.0, 'uMetallicFactor'));
                    stateSet.addUniform(osg.Uniform.createFloat1(1.0, 'uRoughnessFactor'));

                    //PBR default specular/glossiness
                    stateSet.addUniform(osg.Uniform.createFloat1(1.0, 'uGlossinessFactor'));
                    stateSet.addUniform(
                        osg.Uniform.createFloat3(osg.vec3.fromValues(1, 1, 1), 'uSpecularFactor')
                    );

                    this._viewer.getManipulator().computeHomePosition();
                    this.updateCameraPreset();
                }.bind(this)
            );

            return root;
        },

        readEnvConfig: function(file) {
            var d = P.defer();
            var p = P.resolve($.get(file));

            p.then(function(text) {
                var config = text;
                d.resolve(config);
            });

            return d.promise;
        },

        setEnableInput: function(enable) {
            this._viewer.getEventProxy().StandardMouseKeyboard.setEnable(enable);
        },

        createGUI: function() {
            var gui = this._gui;

            var controller;

            controller = gui.add(this._config, 'envRotation', -Math.PI, Math.PI).step(0.1);
            controller.onChange(this.updateEnvironmentRotation.bind(this));

            controller = gui.add(this._config, 'brightness', 0.0, 25.0).step(0.01);
            controller.onChange(this.updateEnvironmentBrightness.bind(this));

            controller = gui.add(this._config, 'normalAA');
            controller.onChange(this.updateNormalAA.bind(this));

            controller = gui.add(this._config, 'specularPeak');
            controller.onChange(this.updateSpecularPeak.bind(this));

            controller = gui.add(this._config, 'occlusionHorizon');
            controller.onChange(this.updateOcclusionHorizon.bind(this));

            controller = gui.add(this._config, 'cameraPreset', Object.keys(CameraPresets));
            controller.onChange(this.updateCameraPreset.bind(this));

            controller = gui.add(this._config, 'lod', 0.0, 15.01).step(0.1);
            controller.onChange(
                function(value) {
                    this._lod.getInternalArray()[0] = value;
                }.bind(this)
            );

            controller = gui.add(this._config, 'format', []);

            controller = gui.add(this._config, 'environmentType', ['cubemapSeamless', 'panorama']);
            controller.onChange(this.updateEnvironment.bind(this));

            controller = gui.add(this._config, 'material', Object.keys(PredefinedMaterials));
            controller.onChange(this.updateRowModelsSpecularMetal.bind(this));

            controller = gui.add(this._config, 'roughness', 0, 1.0);
            controller.onChange(this.updateRowModelsMetalic.bind(this));

            controller = gui.addColor(this._config, 'albedo');
            controller.onChange(this.updateAlbedo.bind(this));

            controller = gui.add(
                {
                    loadModel: function() {}
                },
                'loadModel'
            );
            controller.onChange(this.loadFiles.bind(this));

            controller = gui.add(this._config, 'model', modelList);
            controller.onChange(this.updateModel.bind(this));

            controller = gui.add(this._config, 'environment', environmentList);
            controller.onChange(this.updateEnvironment.bind(this));
        },

        run: function(canvas) {
            var viewer = (this._viewer = new osgViewer.Viewer(canvas, {
                preserveDrawingBuffer: true,
                premultipliedAlpha: false
            }));

            viewer.init();

            var gl = viewer.getState().getGraphicContext();
            console.log(gl.getSupportedExtensions());
            console.log(gl.getExtension('OES_texture_float'));
            var hasFloatLinear = gl.getExtension('OES_texture_float_linear');
            console.log(hasFloatLinear);
            var hasTextureLod = gl.getExtension('EXT_shader_texture_lod');
            console.log(hasTextureLod);

            this.createGUI();

            var ready = [];

            var promise = this.createEnvironment(environment);
            ready.push(this.readShaders());
            ready.push(promise);
            ready.push(this.createModelMaterialSample());

            P.all(ready).then(
                function() {
                    var root = this.createScene();
                    viewer.setSceneData(root);

                    viewer.setupManipulator();
                    viewer.getManipulator()._boundStrategy =
                        OSG.osgGA.Manipulator.COMPUTE_HOME_USING_BBOX;
                    viewer.getManipulator().computeHomePosition();
                    viewer.getManipulator().setComputeBoundNodeMaskOverride(0x0);

                    viewer.run();

                    osg.mat4.perspective(
                        viewer.getCamera().getProjectionMatrix(),
                        Math.PI / 180 * 30,
                        canvas.width / canvas.height,
                        0.1,
                        1000
                    );

                    if (!hasTextureLod) this._config.environmentType = 'panorama';

                    this.updateModel();
                    this.setEnvironment(environmentList[0]);

                    // Iterate over all controllers
                    for (var i in this._gui.__controllers) {
                        this._gui.__controllers[i].updateDisplay();
                    }
                }.bind(this)
            );
        },

        updateAlbedo: function() {
            this._albedoTexture = this.createTextureFromColor(
                this.convertColor(this._config.albedo),
                true,
                this._albedoTexture
            );
        },

        updateShaderPBR: function() {
            this._shaders.forEach(
                function(config) {
                    var stateSet = config.stateSet;

                    var shaderConfig = osg.objectMix(
                        {
                            environmentType: this._config.environmentType,
                            format: this._config.format,
                            mobile: this._config.mobile
                        },
                        config.config
                    );

                    var program = this.createShaderPBR(shaderConfig);

                    stateSet.setAttributeAndModes(program);
                }.bind(this)
            );
        },

        updateEnvironment: function() {
            if (!this._currentEnvironment) return;

            if (this._config.environmentType === 'cubemapSeamless') {
                this.setCubemapSeamless();
            } else {
                this.setPanorama();
            }

            if (!isMobileDevice())
                this._stateSetBRDF.setTextureAttributeAndModes(
                    this._integrateBRDFTextureUnit,
                    this._currentEnvironment.getIntegrateBRDF().getTexture()
                );

            this.setBackgroundEnvironment();
            this.updateEnvironmentRotation();
            this.updateShaderPBR();
        },

        convertColor: function(color) {
            var r, g, b;

            // rgb [255, 255, 255]
            if (color.length === 3) {
                r = color[0];
                g = color[1];
                b = color[2];
            } else if (color.length === 7) {
                // hex (24 bits style) '#ffaabb'
                var intVal = parseInt(color.slice(1), 16);
                r = intVal >> 16;
                g = (intVal >> 8) & 0xff;
                b = intVal & 0xff;
            }

            var result = [0, 0, 0, 1];
            result[0] = r / 255.0;
            result[1] = g / 255.0;
            result[2] = b / 255.0;
            return result;
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
        if (files.length) this.handleDroppedFiles(files);
        else {
            var url = evt.dataTransfer.getData('text');
            if (url.indexOf('.zip') !== -1 || url.indexOf('.gltf') !== -1)
                this.handleDroppedURL(url);
            else osg.warn('url ' + url + ' not supported, drag n drop only valid zip files');
        }
    };

    window.addEventListener(
        'load',
        function() {
            var example = new Example();
            var canvas = $('#View')[0];
            example.run(canvas);

            $('#loading').hide();

            window.addEventListener('dragover', dragOverEvent.bind(example), false);
            window.addEventListener('drop', dropEvent.bind(example), false);

            var lastMousePosition = {
                x: 0
            };
            window.example = example;
            window.addEventListener(
                'mousemove',
                function(evt) {
                    var button = evt.which || evt.button;

                    if (evt.altKey && button) {
                        evt.stopPropagation();
                        var deltaX = evt.clientX - lastMousePosition.x;
                        example._config.envRotation += deltaX * 0.01;
                        example.updateEnvironmentRotation();
                    }

                    lastMousePosition.x = evt.clientX;
                },
                true
            );
        },
        true
    );
})();
