/** -*- compile-command: "jslint-cli View.js" -*- */
osgViewer.View = function() {
    this._graphicContext = undefined;
    this._camera = new osg.Camera();
    this._scene = new osg.Node();
    this._sceneData = undefined;
    this._frameStamp = new osg.FrameStamp();
    this._lightingMode = undefined;
    this._manipulator = undefined;

    this.setLightingMode(osgViewer.View.LightingMode.HEADLIGHT);

    this._scene.getOrCreateStateSet().setAttributeAndMode(new osg.Material());
    this._scene.getOrCreateStateSet().setAttributeAndMode(new osg.Depth());
    this._scene.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc());
    this._scene.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace());
};

osgViewer.View.LightingMode = {
    NO_LIGHT:  0,
    HEADLIGHT: 1,
    SKY_LIGHT: 2
};

osgViewer.View.prototype = {
    setGraphicContext: function(gc) { this._graphicContext = gc; },
    getGraphicContext: function() { return this._graphicContext; },
    setUpView: function (canvas) {
        var ratio = canvas.width/canvas.height;
        this._camera.setViewport(new osg.Viewport(0,0, canvas.width, canvas.height));
        osg.Matrix.makeLookAt([0,0,-10], [0,0,0], [0,1,0], this._camera.getViewMatrix());
        osg.Matrix.makePerspective(60, ratio, 1.0, 1000.0, this._camera.getProjectionMatrix());
    },
    computeIntersections: function (x, y, traversalMask) {
        if (traversalMask === undefined) {
            traversalMask = ~0;
        }
        
        var iv = new osgUtil.IntersectVisitor();
        iv.setTraversalMask(traversalMask);
        iv.addLineSegment([x,y,0.0], [x,y,1.0]);
        iv.pushCamera(this._camera);
        this._sceneData.accept(iv);
        return iv.hits;
    },

    setFrameStamp: function(frameStamp) { this._frameStamp = frameStamp;},
    getFrameStamp: function() { return this._frameStamp; },
    setCamera: function(camera) { this._camera = camera; },
    getCamera: function() { return this._camera; },

    setSceneData: function(node) {
        this._scene.removeChildren();
        this._scene.addChild( node );
        this._sceneData = node;
    },
    getSceneData: function() { return this._sceneData; },
    getScene: function() { return this._scene;},

    getManipulator: function() { return this._manipulator; },
    setManipulator: function(manipulator) { this._manipulator = manipulator; },

    getLight: function() { return this._light; },
    setLight: function(light) { 
        this._light = light;
        if (this._lightingMode !== osgViewer.View.LightingMode.NO_LIGHT) {
            this._scene.getOrCreateStateSet().setAttributeAndMode(this._light);
        }
    },
    getLightingMode: function() { return this._lightingMode; },
    setLightingMode: function(lightingMode) {
        if (this._lightingMode !== lightingMode) {
            this._lightingMode = lightingMode;
            if (this._lightingMode !== osgViewer.View.LightingMode.NO_LIGHT) {
                if (! this._light) {
                    this._light = new osg.Light();
                    this._light.setAmbient([0.2,0.2,0.2,1.0]);
                    this._light.setDiffuse([0.8,0.8,0.8,1.0]);
                    this._light.setSpecular([0.5,0.5,0.5,1.0]);
                }
            } else {
                this._light = undefined;
            }
        }
    }

};
