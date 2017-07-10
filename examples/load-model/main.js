'use strict';

var OSG = window.OSG;
var osg = OSG.osg;
var osgDB = OSG.osgDB;
var osgViewer = OSG.osgViewer;

var main = function() {
    // The 3D canvas.
    var canvas = document.getElementById('View');
    var viewer;

    // The viewer
    viewer = new osgViewer.Viewer(canvas);
    viewer.init();
    var rootNode = new osg.Node();
    viewer.setSceneData(rootNode);
    viewer.setupManipulator();
    viewer.run();

    var modelURL = 'http://osgjs.org/examples/media/models/material-test/file.osgjs';
    var request = osgDB.readNodeURL(modelURL);

    request
        .then(function(model) {
            var mt = new osg.MatrixTransform();
            osg.mat4.rotateZ(mt.getMatrix(), mt.getMatrix(), -Math.PI);

            mt.addChild(model);

            rootNode.addChild(mt);
            viewer.getManipulator().computeHomePosition();

            var loading = document.getElementById('loading');
            document.body.removeChild(loading);
        })
        .catch(function() {
            osg.warn('cant load ' + modelURL);
        });
};

window.addEventListener('load', main, true);
