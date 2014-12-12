(function() {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    //var osgUtil = window.osgUtil;
    var osgViewer = window.osgViewer;
    var osgShader = window.osgShader;
    var $ = window.$;
    var Q = window.Q;
    var osgDB = window.osgDB;

    var viewer;
    var canvas;
    //var visitor;
    var shaderProcessor;

    var doAnimate = true;

    var currentTime = 0;
    var currentFrameSinceStop = 0;
    var currentEffectName;

    var root;
    var commonNode2, sceneTexture2, cameraRTT2;
    var commonNode, sceneTexture, cameraRTT;
    var currentCameraComposerEffect;
    //var factorRender;

    var sampleXUnif;
    var sampleYUnif;
    var frameNumUnif;
    var factorRenderUnif;

    var cache = {};
    var _rttDebugNode;
    var _rtt = [];

    function addModel() {

        //var model = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );
        var model = new osg.MatrixTransform();
        osg.Matrix.makeRotate(Math.PI, 0, 0, 1, model.getMatrix());
        var modelName = '../ssao/raceship.osgjs';
        var request = osgDB.readNodeURL(modelName);

        //        var groundTex = osg.Texture.createFromURL( '../media/textures/seamless/bricks1.jpg' );
        //        groundTex.setWrapT( 'MIRRORED_REPEAT' );
        //        groundTex.setWrapS( 'MIRRORED_REPEAT' );

        // copy tex coord 0 to tex coord1 for multi texture
        request.then(function(loadedModel) {
            model.addChild(loadedModel);

            //          model.getOrCreateStateSet().setTextureAttributeAndMode( 0, groundTex );
        });

        // add a node to animate the scene
        var rootModel = new osg.MatrixTransform();
        rootModel.setName('rootModel');
        rootModel.addChild(model);


        rootModel._name = 'UPDATED MODEL NODE';
        return rootModel;
    }


    function commonScene(rttSize, order, rootModel, doFloat) {

        var near = 0.1;
        var far = 100;

        var quadSize = [16 / 9, 1];


        // create the camera that render the scene
        var camera = new osg.Camera();
        camera.setName('scene');
        camera.setProjectionMatrix(osg.Matrix.makePerspective(50, quadSize[0], near, far, []));
        camera.setViewMatrix(osg.Matrix.makeLookAt([0, 10, 0], [0, 0, 0], [0, 0, 1], []));
        camera.setRenderOrder(order, 0);
        camera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
        camera.setViewport(new osg.Viewport(0, 0, rttSize[0], rttSize[1]));
        camera.setClearColor([0.5, 0.5, 0.5, 1]);

        // prevent projection matrix changes
        // after store in node
        camera.setComputeNearFar(false);

        // attach a texture to the camera to render the scene on
        var newSceneTexture = new osg.Texture();
        newSceneTexture.setTextureSize(rttSize[0], rttSize[1]);

        newSceneTexture.setMinFilter('LINEAR');
        newSceneTexture.setMagFilter('LINEAR');

        //newSceneTexture.setMinFilter( 'NEAREST' );
        //newSceneTexture.setMagFilter( 'NEAREST' );


        if (doFloat) {
            newSceneTexture.setType(osg.Texture.FLOAT);
            newSceneTexture.setInternalFormat(osg.Texture.RGBA);
        }
        camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, newSceneTexture, 0);
        camera.attachRenderBuffer(osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16);
        // add the scene to the camera
        camera.addChild(rootModel);


        // better view
        osg.Matrix.copy([1.3408910815142607, 0, 0, 0, 0, 1.920982126971166, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -2.002002002002002, 0], camera.getProjectionMatrix());
        //osg.Matrix.copy( [ -1, 0, -0, 0, 0, 1, -0, 0, 0, -0, -1, 0, 0, 0, -50, 1 ], camera.getViewMatrix() );

        // better view
        osg.Matrix.copy([0.9999999999999999, 3.979118659715591e-17, -1.2246467991473532e-16, 0, -1.2876698473377504e-16, 0.3090169943749474, -0.9510565162951535, 0, 0, 0.9510565162951536, 0.3090169943749474, 0, -2.465190328815662e-32, 0, -25.000000000000004, 1], camera.getViewMatrix());

        // attach camera to root
        var newRoot = new osg.MatrixTransform();
        newRoot.setName('CameraRTTFather');
        newRoot.addChild(camera);

        return [newRoot, newSceneTexture, camera, rootModel];
    }


    //http://www.ben-peck.com/articles/halton/
    function halton(index, base) {
        var result = 0.0;
        var f = 1.0 / base;
        var i = index;
        while (i > 0) {
            result = result + f * (i % base);
            i = Math.floor(i / base);
            f = f / base;
        }
        return result;
    }

    function readShaders() {
        var defer = Q.defer();
        shaderProcessor = new osgShader.ShaderProcessor();

        var shaders = [
            'baseVert',
            'baseFrag',
            'fxaa',
            'depthVert',
            'depthFrag',
            'reconstVert',
            'reconstFrag',
            'temporalAAVert',
            'temporalAAFrag',
            'temporalStaticAAVert',
            'temporalStaticAAFrag'
        ];

        var promises = [];
        var shadersLib = {};
        shaders.forEach(function(shader) {
            var promise = Q($.get('shaders/' + shader + '.glsl?' + Math.random()));
            promise.then(function(shaderText) {
                if (shader && shaderText) {
                    shadersLib[shader] = shaderText;
                }
            });
            promises.push(promise);
        });

        Q.all(promises).then(function() {
            shaderProcessor.addShaders(shadersLib);
            defer.resolve();
        });

        return defer.promise;
    }



    var getShaderProgram = function(vs, ps, defines, useCache) {

        var hash;
        if (useCache) {
            hash = vs + ps + defines.join('');
            if (cache[hash])
                return cache[hash];
        }

        var vertexshader = shaderProcessor.getShader(vs, defines);
        var fragmentshader = shaderProcessor.getShader(ps, defines);

        var program = new osg.Program(
            new osg.Shader('VERTEX_SHADER', vertexshader), new osg.Shader('FRAGMENT_SHADER', fragmentshader));

        if (useCache) {
            cache[hash] = program;
        }

        return program;
    };

    // show the shadowmap as ui quad on left bottom screen
    // in fact show all texture inside this._rtt
    function showFrameBuffers(optionalArgs) {


        var _ComposerdebugNode = new osg.Node();
        _ComposerdebugNode.setName('debugComposerNode');
        _ComposerdebugNode.setCullingActive(false);
        var _ComposerdebugCamera = new osg.Camera();
        _ComposerdebugCamera.setName('_ComposerdebugCamera');
        _rttDebugNode.addChild(_ComposerdebugCamera);

        var optionsDebug = {
            x: 0,
            y: 100,
            w: 100,
            h: 80,
            horizontal: true,
            screenW: 1024,
            screenH: 768,
            fullscreen: false
        };
        if (optionalArgs)
            osg.extend(optionsDebug, optionalArgs);


        var matrixDest = _ComposerdebugCamera.getProjectionMatrix();
        osg.Matrix.makeOrtho(0, optionsDebug.screenW, 0, optionsDebug.screenH, -5, 5, matrixDest);
        _ComposerdebugCamera.setProjectionMatrix(matrixDest); //not really needed until we do matrix caches

        matrixDest = _ComposerdebugCamera.getViewMatrix();
        osg.Matrix.makeTranslate(0, 0, 0, matrixDest);
        _ComposerdebugCamera.setViewMatrix(matrixDest);
        _ComposerdebugCamera.setRenderOrder(osg.Camera.NESTED_RENDER, 0);
        _ComposerdebugCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
        _ComposerdebugCamera.addChild(_ComposerdebugNode);

        var texture;
        var xOffset = optionsDebug.x;
        var yOffset = optionsDebug.y;
        _ComposerdebugNode.removeChildren();

        var stateset;
        var program = getShaderProgram('baseVert', 'baseFrag', [], true);
        stateset = _ComposerdebugNode.getOrCreateStateSet();
        if (!optionsDebug.fullscreen)
            stateset.setAttributeAndModes(new osg.Depth('DISABLE'));
        stateset.setAttributeAndModes(program);
        for (var i = 0, l = _rtt.length; i < l; i++) {
            texture = _rtt[i];
            if (texture) {
                var quad = osg.createTexturedQuadGeometry(xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0);

                stateset = quad.getOrCreateStateSet();

                quad.setName('debugCompoGeom');

                stateset.setTextureAttributeAndMode(0, texture);
                stateset.setAttributeAndModes(program);
                // stateset.setAttributeAndModes(new osg.Depth('DISABLE'));

                _ComposerdebugNode.addChild(quad);

                if (optionsDebug.horizontal) xOffset += optionsDebug.w + 2;
                else yOffset += optionsDebug.h + 2;
            }
        }
    }

    function updateDebugRtt() {
        // show the shadowmap as ui quad on left bottom screen
        if (_rttDebugNode) {
            _rttDebugNode.removeChildren();
        } else {
            _rttDebugNode = new osg.Node();
            _rttDebugNode.setName('_rttDebugNode');
        }
        showFrameBuffers({
            screenW: canvas.width,
            screenH: canvas.height
        });
    }


    function createScene(width, height, gui) {

        var rttSize = [width, height];
        // cannot add same model multiple in same grap
        // it would break previousframe matrix saves

        var model = addModel(); // "current frame model" added twise if no model2

        //////////////////////////////
        // create First RTTed Scene for ping pong
        var result2 = commonScene(rttSize, osg.Camera.PRE_RENDER, model, false);
        commonNode2 = result2[0];
        sceneTexture2 = result2[1];
        cameraRTT2 = result2[2];

        //////////////////////////////////////////////
        // render Second RTTed Scene for ping pong
        var result = commonScene(rttSize, osg.Camera.PRE_RENDER, model, false);
        commonNode = result[0];
        sceneTexture = result[1];
        cameraRTT = result[2];

        root = new osg.Node();
        root.setName('rootcreateScene');

        sampleXUnif = osg.Uniform.createFloat1(0.0, 'SampleX');
        sampleYUnif = osg.Uniform.createFloat1(0.0, 'SampleY');
        frameNumUnif = osg.Uniform.createFloat1(0.0, 'FrameNum');
        factorRenderUnif = osg.Uniform.createFloat1(1.0, 'FactorRender');

        root.getOrCreateStateSet().addUniform(sampleXUnif);
        root.getOrCreateStateSet().addUniform(sampleYUnif);
        root.getOrCreateStateSet().addUniform(frameNumUnif);
        root.getOrCreateStateSet().addUniform(factorRenderUnif);


        var texW = osg.Uniform.createFloat1(rttSize[0], 'tex_w');
        var texH = osg.Uniform.createFloat1(rttSize[1], 'tex_h');

        root.getOrCreateStateSet().addUniform(texW);
        root.getOrCreateStateSet().addUniform(texH);

        // create a quad on which will be applied the postprocess effects
        var quadSize = [16 / 9, 1];
        var quad = osg.createTexturedQuadGeometry(-quadSize[0] / 2.0, 0, -quadSize[1] / 2.0,
            quadSize[0], 0, 0,
            0, 0, quadSize[1]);
        quad.getOrCreateStateSet().setAttributeAndMode(getShaderProgram('baseVert', 'baseFrag', [], true));
        quad.setName('TextureFinalTV');

        var scene = new osg.MatrixTransform();
        scene.setName('sceneFinalTV');

        // create a texture to render one of the ping pong texture
        var finalTexture = new osg.Texture();
        finalTexture.setTextureSize(rttSize[0], rttSize[1]);
        finalTexture.setMinFilter(osg.Texture.LINEAR);
        finalTexture.setMagFilter(osg.Texture.LINEAR);

        // Set the final texture on the quad
        quad.getOrCreateStateSet().setTextureAttributeAndMode(0, finalTexture);


        var postScenes = [
            getFxaa(),
            getTemporalStaticAA()
        ];

        var effects = [];
        for (var i = 0; i < postScenes.length; i++)
            effects[postScenes[i].name] = postScenes[i];

        var globalGui = {
            'filter': postScenes[0].name,
            'factor': 1.0,
            'animate': function() {
                doAnimate = !doAnimate;
                currentFrameSinceStop = 0;
            },
            'reload': function() {
                readShaders().then(function() {
                    if (console.clear) console.clear();
                    setComposer(globalGui.filter, parseFloat(globalGui.factor));

                    currentFrameSinceStop = 0;
                });

            },

            'camera': function() {
                viewer._manipulator._target = model;

            }
        };

        function addSceneController() {
            gui.add(globalGui, 'filter', Object.keys(effects)).onChange(function(value) {
                setComposer(value, parseFloat(globalGui.factor));
            });
            gui.add(globalGui, 'factor', 0.125, 3.0).onChange(function(value) {
                factorRenderUnif.set(value);
                setComposer(globalGui.filter, parseFloat(value));
            });

            gui.add(globalGui, 'animate');

            gui.add(globalGui, 'reload');
        }

        var prg, st;
        currentCameraComposerEffect = cameraRTT;
        if (postScenes[0].getSceneProgram) {
            prg = postScenes[0].getSceneProgram();

            st = cameraRTT.getOrCreateStateSet();
            st.setAttributeAndMode(prg, osg.StateAttribute.ON || osg.StateAttribute.OVERRIDE);
            st.setTextureAttributeAndMode(2, sceneTexture2, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
            st.addUniform(osg.Uniform.createInt1(2, 'Texture2'));

            st = cameraRTT2.getOrCreateStateSet();
            st.setAttributeAndMode(prg, osg.StateAttribute.ON || osg.StateAttribute.OVERRIDE);
            st.setTextureAttributeAndMode(2, sceneTexture, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
            st.addUniform(osg.Uniform.createInt1(2, 'Texture2'));

        } else {
            cameraRTT.setStateSet(undefined);
            cameraRTT2.setStateSet(undefined);
        }

        var currentComposer = postScenes[0].buildComposer(sceneTexture, finalTexture, quad, scene);
        addSceneController();
        postScenes[0].buildGui(gui);

        var cachedComposers = [];
        cachedComposers[postScenes[0].name] = currentComposer;
        currentEffectName = postScenes[0].name;

        function setComposer(effectName, textureScale) {

            currentEffectName = effectName;

            // recreate the rtt
            //
            root.removeChild(commonNode);
            root.removeChild(commonNode2);

            //if ( rttSize[ 0 ] !== width * textureScale || rttSize[ 1 ] !== height * textureScale ) {

            rttSize = [width * textureScale, height * textureScale];

            // new scene Textures
            //////////////////////////////
            // create First RTTed Scene for ping pong
            var result2 = commonScene(rttSize, osg.Camera.PRE_RENDER, model, false);
            commonNode2 = result2[0];
            sceneTexture2 = result2[1];
            cameraRTT2 = result2[2];

            //////////////////////////////////////////////
            // render Second RTTed Scene for ping pong
            var result = commonScene(rttSize, osg.Camera.PRE_RENDER, model, false);
            commonNode = result[0];
            sceneTexture = result[1];
            cameraRTT = result[2];

            if (effects[effectName].getSceneProgram) {
                prg = effects[effectName].getSceneProgram();

                st = cameraRTT.getOrCreateStateSet();
                st.setAttributeAndMode(prg, osg.StateAttribute.ON || osg.StateAttribute.OVERRIDE);
                st.setTextureAttributeAndMode(2, sceneTexture2, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
                st.addUniform(osg.Uniform.createInt1(2, 'Texture2'));

                st = cameraRTT2.getOrCreateStateSet();
                st.setAttributeAndMode(prg, osg.StateAttribute.ON || osg.StateAttribute.OVERRIDE);
                st.setTextureAttributeAndMode(2, sceneTexture, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
                st.addUniform(osg.Uniform.createInt1(2, 'Texture2'));
            } else {
                cameraRTT.setStateSet(undefined);
                cameraRTT2.setStateSet(undefined);
            }


            // new final Texture
            finalTexture = new osg.Texture();
            finalTexture.setTextureSize(rttSize[0], rttSize[1]);
            texW.set(rttSize[0]);
            texH.set(rttSize[1]);

            finalTexture.setMinFilter(osg.Texture.LINEAR);
            finalTexture.setMagFilter(osg.Texture.LINEAR);

            quad.getOrCreateStateSet().setTextureAttributeAndMode(0, finalTexture);
            //}

            //
            //
            // Put the composer in cache at first utilization
            //if ( cachedComposers[ effectName ] === undefined ) {
            cachedComposers[effectName] = effects[effectName].buildComposer(sceneTexture, finalTexture, quad, scene);
            //}


            // Recreate the whole gui
            gui.destroy();
            gui = new dat.GUI();
            addSceneController();
            effects[effectName].buildGui(gui);

            // Change the composer
            scene.removeChild(currentComposer);
            currentComposer = cachedComposers[effectName];
            scene.addChild(currentComposer);

            if (effectName.indexOf('static') !== -1) {
                if (effects[effectName].needPreviousDepth) {
                    root.addChild(commonNode2);
                }
                if (effects[effectName].needCommonCube) {
                    root.addChild(commonNode);
                }
            } else {
                currentFrameSinceStop = 0;
                root.addChild(commonNode);
            }
            _rtt = [];
            _rtt.push(sceneTexture2);
            _rtt.push(sceneTexture);
            _rtt.push(finalTexture);

            updateDebugRtt();

        }

        scene.addChild(quad);
        scene.addChild(currentComposer);


        _rtt = [];
        _rtt.push(sceneTexture2);
        _rtt.push(sceneTexture);
        _rtt.push(finalTexture);
        updateDebugRtt();

        scene.addChild(_rttDebugNode);

        root.addChild(scene);
        root.addChild(commonNode);
        root.addChild(commonNode2);


        // update once a frame
        var UpdateCallback = function() {
            this.update = function(node, nv) {
                if (doAnimate) {
                    currentTime = nv.getFrameStamp().getSimulationTime();
                    var x = Math.cos(currentTime);
                    osg.Matrix.makeRotate(x, 0, 0, 1, model.getMatrix());

                }
                if (currentEffectName.indexOf('Static') !== -1) {
                    currentFrameSinceStop++;
                    var frameNum = currentFrameSinceStop;

                    if (frameNum >= 100) {
                        sampleXUnif.set(halton(frameNum - 100, 2));
                        sampleYUnif.set(halton(frameNum - 100, 3));
                    }
                    frameNumUnif.set(frameNum);
                    //                    factorRenderUnif.set( factorRender );

                    // should be composer node switching,
                    // but it's a mess.
                    //var sceneTexture, sceneTexture2;

                    //currentCameraComposerEffect;
                    if (currentFrameSinceStop % 2 === 0) {

                        if (root.hasChild(commonNode)) root.removeChild(commonNode);
                        if (!root.hasChild(commonNode2)) root.addChild(commonNode2);
                    } else {

                        if (root.hasChild(commonNode2)) root.removeChild(commonNode2);
                        if (!root.hasChild(commonNode)) root.addChild(commonNode);

                    }
                }

                // making sure here.
                osg.Matrix.copy(cameraRTT.getProjectionMatrix(), cameraRTT2.getProjectionMatrix());
                osg.Matrix.copy(cameraRTT.getViewMatrix(), cameraRTT2.getViewMatrix());
                osg.Matrix.copy(cameraRTT2.getProjectionMatrix(), cameraRTT2.getProjectionMatrix());
                osg.Matrix.copy(cameraRTT2.getViewMatrix(), cameraRTT2.getViewMatrix());

                node.traverse(nv);
            };
        };
        root.setUpdateCallback(new UpdateCallback());

        return root;
    }

    var main = function() {

        // osg.ReportWebGLError = true;

        canvas = document.getElementById('View');
        canvas.style.width = canvas.width = window.innerWidth;
        canvas.style.height = canvas.height = window.innerHeight;

        var gui = new dat.GUI();
        viewer = new osgViewer.Viewer(canvas);
        viewer.init();

        readShaders().then(function() {
            viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);

            var rotate = new osg.MatrixTransform();
            rotate.addChild(createScene(canvas.width, canvas.height, gui));
            rotate.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
            viewer.setSceneData(rotate);
            /*
        visitor = new osgUtil.DisplayNodeGraphVisitor();
        rotate.accept( visitor );
        visitor.createGraph();
*/
            viewer.setupManipulator();

            viewer.getManipulator().computeHomePosition();
            viewer.run();
        });
    };

    window.addEventListener('load', main, true);

})();
