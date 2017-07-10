'use strict';

var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;

function getShader() {
    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'uniform mat4 uModelViewMatrix;',
        'uniform mat4 uProjectionMatrix;',
        'varying vec4 vModelVertex;',
        'void main(void) {',
        '  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(Vertex,1.0);',
        '  vModelVertex = uModelViewMatrix * vec4(Vertex,1.0);',
        '}'
    ].join('\n');

    // notice the comment allowing for automatic UI shader binding
    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec4 vModelVertex;',
        'uniform float density; //  { "min": 0.0,  "max": 0.8, "step": 0.01, "value": 0.2 } ',
        'void main(void) {',
        '  float d = density; //0.001;',
        '  float f = gl_FragCoord.z/gl_FragCoord.w;',
        '  f = clamp(exp2(-d*d * f*f * 1.44), 0.0, 1.0);',
        '  gl_FragColor = f * vec4(1.0, 0.0, 0.0, 1.0);',
        '}',
        ''
    ].join('\n');

    var program = new osg.Program(
        new osg.Shader('VERTEX_SHADER', vertexshader),
        new osg.Shader('FRAGMENT_SHADER', fragmentshader)
    );
    return program;
}

function createScene() {
    var root = new osg.Node();

    var target = new osg.MatrixTransform();
    var targetModel1 = osg.createTexturedBoxGeometry(0, 0, 0, 2, 2, 2);

    var targetModel2 = osg.createTexturedBoxGeometry(4, 0, 0, 2, 2, 2);
    target.addChild(targetModel1);
    target.addChild(targetModel2);
    var material = new osg.Material();
    material.setDiffuse([1, 0, 0, 1]);
    material.setAmbient([1, 0, 0, 1]);
    target.getOrCreateStateSet().setAttributeAndModes(getShader());

    var density = osg.Uniform.createFloat1(0.0, 'density');
    target.getOrCreateStateSet().addUniform(density);

    //automatic UI shader binding
    var gui = new window.dat.GUI();
    // config to let dat.gui change the scale
    var densityController = gui.add(
        {
            density: 0.5
        },
        'density',
        0.0,
        0.81
    );
    densityController.onChange(function(value) {
        density.setFloat(value);
    });

    root.addChild(target);
    root.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));
    return root;
}

var main = function() {
    // The 3D canvas.
    var canvas = document.getElementById('View');
    var viewer;
    viewer = new osgViewer.Viewer(canvas, {
        antialias: true,
        alpha: true
    });
    viewer.init();
    var rotate = new osg.MatrixTransform();
    rotate.addChild(createScene());
    viewer.setSceneData(rotate);
    viewer.setupManipulator();
    viewer.getManipulator().computeHomePosition();

    viewer.run();
};

window.addEventListener('load', main, true);
