// from require to global var
var OSG = window.OSG;
OSG.globalify();
var osg = window.osg;
var osgViewer = window.osgViewer;
var osgUtil = window.osgUtil;


function getShader() {
    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'varying vec4 position;',
        'void main(void) {',
        '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
        '  position = ModelViewMatrix * vec4(Vertex,1.0);',
        '}'
    ].join( '\n' );

    // notice the comment allowing for automatic UI shader binding
    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec4 position;',
        'uniform float density; //  { \"min\": 0.0,  \"max\": 0.8, \"step\": 0.01, \"value\": 0.2 } ',
        'void main(void) {',
        '  float d = density; //0.001;',
        '  float f = gl_FragCoord.z/gl_FragCoord.w;',
        '  f = clamp(exp2(-d*d * f*f * 1.44), 0.0, 1.0);',
        '  gl_FragColor = f * vec4(1.0, 0.0, 0.0, 1.0);',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

    program.trackAttributes = {};
    program.trackAttributes.attributeKeys = [];
    program.trackAttributes.attributeKeys.push( 'Material' );

    return program;
}

function createScene() {

    var root = new osg.Node();

    var target = new osg.MatrixTransform();
    var targetModel1 = osg.createTexturedBoxGeometry( 0,
        0,
        0,
        2,
        2,
        2 );

    var targetModel2 = osg.createTexturedBoxGeometry( 4,
        0,
        0,
        2,
        2,
        2 );
    target.addChild( targetModel1 );
    target.addChild( targetModel2 );
    var material = new osg.Material();
    material.setDiffuse( [ 1, 0, 0, 1 ] );
    material.setAmbient( [ 1, 0, 0, 1 ] );
    target.getOrCreateStateSet().setAttributeAndModes( getShader() );

    var density = osg.Uniform.createFloat1( 0.0, 'density' );
    target.getOrCreateStateSet().addUniform( density );

    //automatic UI shader binding
    var parameterVisitor = new osgUtil.ParameterVisitor();
    parameterVisitor.setTargetHTML( document.getElementById( 'Parameters' ) );
    target.accept( parameterVisitor );

    root.addChild( target );
    root.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
    return root;
}

var main = function () {

    // The 3D canvas.
    var canvas = document.getElementById( '3DView' );
    var viewer;
    viewer = new osgViewer.Viewer( canvas, {
        antialias: true,
        alpha: true
    } );
    viewer.init();
    var rotate = new osg.MatrixTransform();
    rotate.addChild( createScene() );
    viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
    viewer.setSceneData( rotate );
    viewer.setupManipulator();
    viewer.getManipulator().computeHomePosition();

    viewer.run();

};



window.addEventListener( 'load', main, true );