(function() {
    'use strict';

    var OSG = window.OSG;
    var osgViewer = OSG.osgViewer;
    var osgUtil = OSG.osgUtil;

    var osg = OSG.osg;

    var Example = function() {};

    Example.prototype = {
        run: function() {
            this._viewer = new osgViewer.Viewer(document.getElementById('View'));
            this._viewer.init();
            this._viewer.setSceneData(this.createScene());
            this._viewer.setupManipulator();
            this._viewer.getManipulator().computeHomePosition();
            this._viewer.run();
        },

        createScene: function() {
            this._composer = this.createComposer();

            this._rootNode = new osg.Node();
            this._rootNode.addChild(this._composer);

            // resize stuff
            this._canvasWidth = this._viewer.getCanvasWidth();
            this._canvasHeight = this._viewer.getCanvasHeight();
            this._rootNode.addUpdateCallback(this);
            return this._rootNode;
        },

        createComposer: function() {
            var viewer = this._viewer;
            var width = viewer.getCanvasWidth();
            var height = viewer.getCanvasHeight();

            var composer = new osgUtil.ComposerPostProcess();
            composer.setScreenSize(width, height);

            var shaders = {};
            shaders['first.glsl'] = 'vec4 first() { return vec4(1.0, 0.0, 0.0, 1.0); }';
            shaders['second.glsl'] = 'vec4 second() { return texture2D(TextureTest, gl_FragCoord.xy / 1024.0); }';
            composer._shaderProcessor.addShaders(shaders);

            var passes = [];
            passes.push({ func: 'first', textures: [], out: { name: 'TextureTest' } });
            passes.push({ func: 'second', textures: ['TextureTest'], out: { name: '%next' } });

            composer.build(passes);

            return composer;
        },

        update: function() {
            var viewer = this._viewer;
            var width = viewer.getCanvasWidth();
            var height = viewer.getCanvasHeight();

            if (width !== this._canvasWidth || height !== this._canvasHeight) {
                this._canvasWidth = width;
                this._canvasHeight = height;
                this._composer.resize(width, height);
            }

            return true;
        }
    };

    var initExample = function() {
        var example = new Example();
        example.run();
    };

    window.addEventListener('load', initExample, true);
})();
