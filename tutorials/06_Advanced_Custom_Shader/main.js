// from require to global var
var OSG = window.OSG;
OSG.globalify();
var osg = window.osg;
var osgViewer = window.osgViewer;



function getShader() {
    var vertexshader = [
        '',
        'precision highp float;',
        'attribute vec3 Vertex;',
        'attribute vec3 Normal;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'uniform mat4 NormalMatrix;',
        'uniform vec4 lightPos;',
        'uniform vec4 eyePos;',
        'varying vec4 position;',
        'varying vec3 l;',
        'varying vec3 v;',
        'varying vec3 n;',
        'varying float alpha;',


        'float rand(vec2 n){  return 0.5 + 0.5 * fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);}',


        'void main(void) {',
        '  vec3 p = vec3(ModelViewMatrix * vec4(Vertex,1.0));',
        '  l = normalize (vec3(lightPos) - p);',

        '  v = normalize (vec3(eyePos) - p);',

        '  n = normalize( vec3(NormalMatrix * vec4(Normal, 1.0)));',
        '//Vertex.x = Vertex.x + rand(1.0); Vertex.y = Vertex.y + rand(1.0);',

        ' if(Vertex.x == 1.0 &&  Vertex.y == 1.0 && Vertex.z == 1.0){ gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex.x + 1.0, Vertex.y + 1.0, Vertex.z + 1.0,1.0); alpha = 0.0;}',
        'else {gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0); alpha = 1.0;}',
        '  position = ModelViewMatrix * vec4(Vertex.x  ,Vertex.y ,Vertex.z,1.0); ',
        '}'
    ].join( '\n' );

    var fragmentshader = [
        '',
        'precision highp float;',
        'uniform vec3 color;',
        'varying vec3 l;',
        'varying vec3 v;',
        'varying vec3 n;',
        'varying float alpha;',
        'void main(void) {',
        '  const vec4 diffColor  = vec4(0.5, 0.0, 0.0, 1.0);',
        '  const vec4 specColor  = vec4(0.7, 0.7, 0.0, 1.0);',
        '  const float specPower = 30.0;',

        '  vec3 n2 = normalize( n );',
        '  vec3 l2 = normalize( l );',
        '  vec3 v2 = normalize( v );',
        '  vec3 r = reflect( -v2, n2 );',
        '  vec4 diff = diffColor *  max(dot(n2,l2), 0.0);',
        '  vec4 spec = specColor *  pow(max(dot(l2, r), 0.0), specPower);',
        '  gl_FragColor = diff + spec;',
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

function getShaderVariant2() {
    var vertexshader = [
        '',
        'attribute vec3 Vertex;',
        'attribute vec3 Normal;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'uniform mat4 NormalMatrix;',
        'uniform vec4 lightPos;',
        'uniform vec4 eyePos;',
        'varying vec4 position;',
        'varying vec3 l;',
        'varying vec3 h;',
        'varying vec3 v;',
        'varying vec3 n;',
        'void main(void) {',
        '  vec3 p = vec3(ModelViewMatrix * vec4(Vertex,1.0));',
        '  l = normalize (vec3(lightPos) - p);',

        '  v = normalize (vec3(eyePos) - p);',
        '  h = normalize (l+ v);',

        '  n = normalize( vec3(NormalMatrix * vec4(Normal, 1.0)));',
        ' if(Vertex.x == 3.0 &&  Vertex.y == 1.0 && Vertex.z == 1.0){ }',
        'else {gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0); }',

        '  position = ModelViewMatrix * vec4(Vertex,1.0);',
        '}'
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'uniform vec3 color;',
        'varying vec3 l;',
        'varying vec3 h;',
        'varying vec3 v;',
        'varying vec3 n;',
        'void main(void) {',
        '  const vec4 diffColor  = vec4(0.2, 0.5, 1.0, 1.0);',
        '  const vec4 specColor  = vec4(0.7, 0.7, 0.7, 1.0);',
        '  const float specPower = 30.0;',

        '  const float kd = 1.0;',
        '  const float ka = 0.2;',
        '  vec3 n2 = normalize( n );',
        '  vec3 l2 = normalize( l );',
        '  vec3 h2 = normalize( h );',
        '  vec4 diff = diffColor *  max(dot(n2,l2), 0.0);',
        '  vec4 spec = specColor *  pow(max(dot(n2,l2), 0.0), specPower);',
        '  gl_FragColor = diff + spec;',
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
    var target2 = new osg.MatrixTransform();
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
    target2.addChild( targetModel2 );

    var material = new osg.Material();
    material.setDiffuse( [ 1, 0, 0, 1 ] );
    target.getOrCreateStateSet().setAttributeAndModes( getShader() );
    target2.getOrCreateStateSet().setAttributeAndModes( getShaderVariant2() );




    var density = osg.Uniform.createFloat1( 0.0, 'density' );
    target.getOrCreateStateSet().addUniform( density );
    target2.getOrCreateStateSet().addUniform( density );

    //color = osg.Uniform.createVec4(vec4(1,1,0,0),'color');
    var lightPos = osg.Uniform.createFloat3( [ 0, 0, -10 ], 'lightPos' );
    target.getOrCreateStateSet().addUniform( lightPos );
    target2.getOrCreateStateSet().addUniform( lightPos );

    //color = osg.Uniform.createVec4(vec4(1,1,0,0),'color');
    var eyePos = osg.Uniform.createFloat3( [ 0, 0, -1 ], 'eyePos' );
    target.getOrCreateStateSet().addUniform( eyePos );
    target2.getOrCreateStateSet().addUniform( eyePos );

    var color = osg.Uniform.createFloat3( [ 1, 0, 0 ], 'color' );
    target.getOrCreateStateSet().addUniform( color );
    target2.getOrCreateStateSet().addUniform( color );


    root.addChild( target );
    root.addChild( target2 );


    root.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

    /*
    var parameterVisitor = new osgUtil.ShaderParameterVisitor();
    parameterVisitor.setTargetHTML(document.getElementById('Parameters'));

    parameterVisitor.types.float.params['density'] = {
        min: 0,
        max: 200.0/10000.0,
        step: 1.0/10000.0,
        value: function() { return [0.002]; }
    };
    root.accept(parameterVisitor);
*/
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