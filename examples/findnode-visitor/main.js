'use strict';

// from require to global var
var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;

var onLoad = function() {
    // The 3D canvas.
    var canvas = document.getElementById('View');
    var viewer;

    var group = new osg.MatrixTransform();
    group.setName('BoxRotate');
    group.setMatrix(osg.mat4.fromTranslation(osg.mat4.create(), [-5, 10, -5]));
    var size = 5;
    var ground = osg.createTexturedBoxGeometry(0, 0, 0, size, size, size);
    group.addChild(ground);
    group.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));

    var mainNode = new osg.Node();
    mainNode.setName('Light.003');
    var lightnew = new osg.Light();
    mainNode.light = lightnew;
    mainNode.addChild(group);

    // Here we create a new form of
    // Scene Graph Visitor
    var FindByNameVisitor = function(name) {
        osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN);
        this._name = name;
    };

    FindByNameVisitor.prototype = osg.objectInherit(osg.NodeVisitor.prototype, {
        // in found we'll store our resulting matching node
        init: function() {
            this.found = undefined;
        },
        // the crux of it
        apply: function(node) {
            if (node.getName() === this._name) {
                this.found = node;
                return;
            }
            this.traverse(node);
        }
    });

    // we look for a node named 'Light.003'
    var finder = new FindByNameVisitor('Light.003');
    mainNode.accept(finder);
    document.getElementById('result_1').firstChild.data =
        finder.found === undefined ? 'No Light.003' : ' found a Light.003 Node';
    console.log(finder.found);

    // we look for a node named 'BoxRotate'
    var finder2 = new FindByNameVisitor('BoxRotate');
    mainNode.accept(finder2);
    document.getElementById('result_2').firstChild.data =
        finder2.found === undefined ? 'No BoxRotate' : ' found a BoxRotate Node';
    console.log(finder2.found);

    // we look for a node named 'sdf'
    var finder3 = new FindByNameVisitor('sdf');
    mainNode.accept(finder3);
    document.getElementById('result_3').firstChild.data =
        finder3.found === undefined ? 'No sdf' : ' found a sdf Node';
    console.log(finder3.found);

    // The viewer
    viewer = new osgViewer.Viewer(canvas);
    viewer.init();
    viewer.setSceneData(mainNode);
    viewer.setupManipulator();
    viewer.setLightingMode(osgViewer.View.LightingMode.NO_LIGHT);

    viewer.setLight(lightnew);
    viewer.run();
};

// Wait for it
window.addEventListener('load', onLoad, true);
