'use strict';

var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;
var osgGA = OSG.osgGA;

var SimpleUpdateCallback = function() {};

SimpleUpdateCallback.prototype = {
    // rotation angle
    angle: 0,

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        var dt = t - node._lastUpdate;
        if (dt < 0) {
            return true;
        }
        node._lastUpdate = t;
        document.getElementById('update').innerHTML = node._lastUpdate.toFixed(2);
        document.getElementById('angle').innerHTML = this.angle.toFixed(2);

        // rotation
        var m = node.getMatrix();
        osg.mat4.fromRotation(m, -this.angle, osg.vec3.fromValues(0.0, 0.0, 1.0));

        osg.mat4.setTranslation(m, osg.vec3.create());

        this.angle += 0.1;

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

    // add a stateSet of texture to cube
    var material = new osg.Material();
    material.setDiffuse(osg.vec4.fromValues(1.0, 1.0, 0.2, 1.0));
    cube.getOrCreateStateSet().setAttributeAndModes(material);

    // attache updatecallback function to cube
    var cb = new SimpleUpdateCallback();
    cube.addUpdateCallback(cb);

    // add to root and return
    root.addChild(cube);

    return root;
}

var main = function() {
    // from require to global var
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

        viewer.setupManipulator(new osgGA.OrbitManipulator());
        // set distance
        viewer.getManipulator().setDistance(20.0);

        viewer.run();
    } catch (er) {
        osg.log('exception in osgViewer ' + er);
        alert('exception in osgViewer ' + er);
    }
};
window.addEventListener('load', main, true);
