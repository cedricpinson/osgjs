'use strict';
var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;

var createScene = function() {
    // We create a box which will be lighted
    var group = new osg.Node();
    var size = 5;
    var ground = osg.createTexturedBoxGeometry(0, 0, 0, size, size, size);
    group.addChild(ground);
    group.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));

    var mainNode = new osg.Node();
    mainNode.addChild(group);
    return mainNode;
};

var onLoad = function() {
    // The 3D canvas.
    var canvas = document.getElementById('View');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // we create a Callback
    var LightUpdateCallback = function() {};
    LightUpdateCallback.prototype = {
        update: function(node, nv) {
            //every 5 seconds
            var currentTime = nv.getFrameStamp().getSimulationTime();
            currentTime = (currentTime % 5) / 5;
            // light goes from black to red
            node.getLight().setDiffuse(osg.vec4.fromValues(currentTime, 0.0, 0.0, 0.0));
            node.traverse(nv);
        }
    };
    // Lights
    var lightSource = new osg.LightSource();
    var lightNew = new osg.Light();
    lightSource.addUpdateCallback(new LightUpdateCallback());
    lightSource.setLight(lightNew);

    var root = createScene();
    root.addChild(lightSource);
    // The viewer
    var viewer = new osgViewer.Viewer(canvas);
    viewer.init();
    viewer.setLightingMode(osgViewer.View.LightingMode.NO_LIGHT);
    viewer.setLight(lightNew);

    viewer.setSceneData(root);
    viewer.setupManipulator();
    viewer.run();
};

// Wait for it
window.addEventListener('load', onLoad, true);
