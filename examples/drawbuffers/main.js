(function() {
    'use strict';

    // various osg shortcuts
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var ExampleOSGJS = window.ExampleOSGJS;

    var NUM_TEXTURES = 4;

    var Example = function() {
        // main variables

        this._viewer = undefined;
        this._canvas = undefined;
        this._textureList = [];
        this._root = new osg.Node();
        this._root.setName('root');

        this._debugNodeRTT = new osg.Node();
        this._debugNodeRTT.setName('debugNodeRTT');
        this._debugNodeRTT.getOrCreateStateSet().setRenderBinDetails(1000, 'RenderBin');
        this._root.addChild(this._debugNodeRTT);
    };

    Example.prototype = osg.objectInherit(ExampleOSGJS.prototype, {
        run: function() {
            this._canvas = document.getElementById('View');

            this._viewer = new osgViewer.Viewer(this._canvas);
            this._viewer.init();
            this._viewer.getCamera().setClearColor(osg.vec4.create());

            this._extDrawBuffers = osg.WebGLCaps.instance().getWebGLExtension('WEBGL_draw_buffers');
            // add all nodes under this._root
            this._root.addChild(this.createScene());

            // basic setup
            this._viewer.setSceneData(this._root);
            this._viewer.setupManipulator();

            // TODO: only run after textures and shaders loaded ?
            this._viewer.run();
        },

        createColorTexture: function(width, height) {
            var texture = new osg.Texture();
            texture.setTextureSize(width, height);
            texture.setMinFilter(osg.Texture.LINEAR);
            texture.setMagFilter(osg.Texture.LINEAR);
            return texture;
        },

        createDephTexture: function(width, height) {
            var depthTexture = new osg.Texture();
            depthTexture.setTextureSize(width, height);
            depthTexture.setMinFilter(osg.Texture.NEAREST);
            depthTexture.setMagFilter(osg.Texture.NEAREST);
            depthTexture.setInternalFormat(osg.Texture.DEPTH_COMPONENT);
            depthTexture.setInternalFormatType(osg.Texture.UNSIGNED_SHORT);
            return depthTexture;
        },

        createHUDCamera: function(width, height) {
            var camera = new osg.Camera();
            camera.setEnableFrustumCulling(true);
            camera.setName('finalPass');
            osg.mat4.ortho(camera.getProjectionMatrix(), 0, width, 0, height, -5, 5);
            camera.setViewMatrix(osg.mat4.create());
            camera.setRenderOrder(osg.Camera.NESTED_RENDER, 0);
            camera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
            camera.setViewport(new osg.Viewport(0, 0, width, height));
            camera.setClearColor(osg.vec4.create());
            camera.setClearMask(osg.Camera.DEPTH_BUFFER_BIT);
            return camera;
        },

        createPreRenderCamera: function(width, height) {
            var camera = new osg.Camera();
            camera.setEnableFrustumCulling(true);
            camera.setName('scene');
            camera.setProjectionMatrix(osg.mat4.create());
            camera.setViewMatrix(osg.mat4.create());
            camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
            camera.setReferenceFrame(osg.Transform.RELATIVE_RF);
            camera.setViewport(new osg.Viewport(0, 0, width, height));
            camera.setClearColor(osg.vec4.create());
            return camera;
        },

        createRTTQuad: function(width, height) {
            var quad = osg.createTexturedQuadGeometry(0, 0, 0, width, 0, 0, 0, height, 0);
            var stateSet = quad.getOrCreateStateSet();
            stateSet.setAttributeAndModes(this.generateFinalPassProgram());
            return quad;
        },

        createRTTScene: function() {
            var that = this;
            return osgDB
                .readNodeURL('../media/models/material-test/file.osgjs')
                .then(function(node) {
                    var stateSet = node.getOrCreateStateSet();
                    stateSet.setAttributeAndModes(that.generateProgram());
                    that._viewer.getManipulator().setTarget(node.getBoundingSphere().center());
                    that._viewer
                        .getManipulator()
                        .setDistance(node.getBoundingSphere().radius() * 2.0);
                    return node;
                });
        },

        generateProgram: function() {
            var vertexShader = [
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',
                'attribute vec3 Vertex;',
                'attribute vec2 TexCoord0;',
                'varying vec2 vTexCoord0;',
                'uniform mat4 uModelViewMatrix;',
                'uniform mat4 uProjectionMatrix;',
                'void main(void) {',
                '  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(Vertex,1.0);',
                '  vTexCoord0 = TexCoord0;',
                '}',
                ''
            ].join('\n');
            var fragmentShader = [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                '#extension GL_EXT_draw_buffers : require',
                'void main (void)',
                '{',
                '  gl_FragData[0] = vec4(1.0,1.0,0.0,1.0);',
                '  gl_FragData[1] = vec4(0.0,1.0,1.0,1.0);',
                '  gl_FragData[2] = vec4(0.0,0.0,1.0,1.0);',
                '  gl_FragData[3] = vec4(1.0,1.0,1.0,1.0);',
                '}',
                ''
            ].join('\n');
            var program = new osg.Program(
                new osg.Shader('VERTEX_SHADER', vertexShader),
                new osg.Shader('FRAGMENT_SHADER', fragmentShader)
            );
            return program;
        },

        generateFinalPassProgram: function() {
            var vertexShader = [
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',
                'attribute vec3 Vertex;',
                'attribute vec2 TexCoord0;',
                'varying vec2 vTexCoord0;',
                'uniform mat4 uModelViewMatrix;',
                'uniform mat4 uProjectionMatrix;',
                'void main(void) {',
                '  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(Vertex,1.0);',
                '  vTexCoord0 = TexCoord0;',
                '}',
                ''
            ].join('\n');
            var fragmentShader = [
                '',
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                '#extension GL_EXT_draw_buffers : require',
                'varying vec2 vTexCoord0;',
                'uniform sampler2D Texture0;',
                'uniform sampler2D Texture1;',
                'uniform sampler2D Texture2;',
                'uniform sampler2D Texture3;',
                'uniform sampler2D DepthTexture;',
                'void main (void)',
                '{',
                '  vec3 color = texture2D( Texture0, vTexCoord0.xy).xyz;',
                '  gl_FragData[0] = vec4( color * texture2D( DepthTexture, vTexCoord0.xy).xyz, 1.0 );',
                '}',
                ''
            ].join('\n');
            var program = new osg.Program(
                new osg.Shader('VERTEX_SHADER', vertexShader),
                new osg.Shader('FRAGMENT_SHADER', fragmentShader)
            );
            return program;
        },

        createScene: function() {
            var mrtGroup = new osg.Node();

            var width = this._canvas.width;
            var height = this._canvas.height;

            var camera = this.createPreRenderCamera(width, height);
            this.createRTTScene().then(function(scene) {
                camera.addChild(scene);
            });

            var gl = this._viewer.getGraphicContext();
            // createColorTextures
            for (var i = 0; i < NUM_TEXTURES; i++) {
                this._textureList[i] = this.createColorTexture(width, height);
                this._textureList[i]._name = 'texturecolor' + i;
            }
            var depthTexture = this.createDephTexture(width, height);
            this._textureList.push(depthTexture);
            // attach textures
            camera.attachTexture(gl.COLOR_ATTACHMENT0, this._textureList[0], 0);
            camera.attachTexture(gl.COLOR_ATTACHMENT1, this._textureList[1], 0);
            camera.attachTexture(gl.COLOR_ATTACHMENT2, this._textureList[2], 0);
            camera.attachTexture(gl.COLOR_ATTACHMENT3, this._textureList[3], 0);
            camera.attachTexture(osg.FrameBufferObject.DEPTH_ATTACHMENT, depthTexture, 0);

            mrtGroup.addChild(camera);

            this.createDebugTextureList(this._textureList, {
                horizontal: true,
                y: 100,
                w: this._canvas.width * 0.2,
                h: this._canvas.height * 0.2
            });

            var finalPass = new osg.Node();
            var hudCamera = this.createHUDCamera(width, height);
            var finalQuad = this.createRTTQuad(width, height);

            hudCamera.addChild(finalQuad);

            var stateSet = finalQuad.getOrCreateStateSet();
            for (i = 0; i < this._textureList.length; i++) {
                stateSet.setTextureAttributeAndModes(i, this._textureList[i]);
                stateSet.addUniform(osg.Uniform.createInt1(i, 'Texture' + i));
            }
            stateSet.setTextureAttributeAndModes(this._textureList.length, depthTexture);
            stateSet.addUniform(osg.Uniform.createInt1(this._textureList.length, 'DepthTexture'));
            finalPass.addChild(hudCamera);
            mrtGroup.addChild(finalPass);

            return mrtGroup;
        }
    });

    window.addEventListener(
        'load',
        function() {
            var example = new Example();
            example.run();
        },
        true
    );
})();
