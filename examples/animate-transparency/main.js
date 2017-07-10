'use strict';

var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;

var SimpleUpdateCallback = function(material) {
    this.material = material;
};

SimpleUpdateCallback.prototype = {
    // rotation angle
    alpha: 0,

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        var dt = t - node._lastUpdate;
        if (dt < 0) {
            return true;
        }
        node._lastUpdate = t;
        document.getElementById('update').innerHTML = node._lastUpdate.toFixed(2);
        document.getElementById('alpha').innerHTML = this.alpha.toFixed(2);

        this.alpha += 0.01;
        if (this.alpha > 1.0) this.alpha = 0.0;
        var channel;

        channel = this.material.getDiffuse();
        channel[3] = this.alpha;

        return true;
    }
};

function createScene() {
    var root = new osg.Node();
    var cube = new osg.MatrixTransform();

    // create a cube in center of the scene(0, 0, 0) and set it's size to 7
    var size = 7;
    var cubeModel = osg.createTexturedBoxGeometry(0, 0, 0, size, size, size);
    cube.addChild(cubeModel);

    cube.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    cube
        .getOrCreateStateSet()
        .setAttributeAndModes(new osg.BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));
    cube.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));

    // add a stateSet of texture to cube
    var material = new osg.Material();
    material.setDiffuse([1.0, 1.0, 0.2, 0.0]);
    material.setAmbient([1.0, 1.0, 0.2, 0.0]);
    material.setSpecular([1.0, 1.0, 0.0, 0.0]);
    material.setEmission([0.0, 0.0, 0.0, 0.5]);
    cube.getOrCreateStateSet().setAttributeAndModes(material);

    // attache updatecallback function to cube
    var cb = new SimpleUpdateCallback(material);
    cube.addUpdateCallback(cb);

    // add to root and return
    root.addChild(cube);

    return root;
}

var main = function() {
    // The 3D canvas.
    var canvas = document.getElementById('View');
    var viewer;
    try {
        viewer = new osgViewer.Viewer(canvas, {
            antialias: true,
            alpha: true
        });
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild(createScene());
        viewer.setSceneData(rotate);

        viewer.setupManipulator();
        // set distance
        viewer.getManipulator().setDistance(20.0);

        viewer.run();
    } catch (er) {
        osg.log('exception in osgViewer ' + er);
        alert('exception in osgViewer ' + er);
    }
};

window.addEventListener('load', main, true);
