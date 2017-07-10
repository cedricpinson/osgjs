'use strict';

var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;

var onLoad = function() {
    // The 3D canvas.
    var canvas = document.getElementById('View');
    // Here we create a MatrixTransform Node
    // that holds the transformation.
    var group = new osg.MatrixTransform();
    group.setMatrix(osg.mat4.fromTranslation(osg.mat4.create(), osg.vec3.fromValues(-5, 10, -5)));
    var size = 5;
    // ground node is the geometry
    var ground = osg.createTexturedBoxGeometry(0, 0, 0, size, size, size);
    // We add geometry as child of the transform
    // and now it's transformed magically
    group.addChild(ground);
    group.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));

    var mainNode = new osg.Node();
    var lightnew = new osg.Light();
    mainNode.light = lightnew;
    mainNode.addChild(group);

    // The viewer
    var viewer = new osgViewer.Viewer(canvas);
    viewer.init();
    viewer.setSceneData(mainNode);
    viewer.setupManipulator();
    viewer.run();
};

// Wait for it
window.addEventListener('load', onLoad, true);
