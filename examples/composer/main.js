'use strict';

window.OSG.globalify();

var osg = window.osg;
var osgViewer = window.osgViewer;
var osgUtil = window.osgUtil;

function commonScene( rttSize ) {

    var model = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );

    var near = 0.1;
    var far = 100;
    var root = new osg.MatrixTransform();

    var quadSize = [ 16 / 9, 1 ];

    // add a node to animate the scene
    var rootModel = new osg.MatrixTransform();
    rootModel.addChild( model );

    var UpdateCallback = function () {
        this.update = function ( node, nv ) {
            var currentTime = nv.getFrameStamp().getSimulationTime();
            var x = Math.cos( currentTime );
            osg.Matrix.makeRotate( x, 0, 0, 1, node.getMatrix() );
            node.traverse( nv );
        };
    };
    rootModel.setUpdateCallback( new UpdateCallback() );

    // create the camera that render the scene
    var camera = new osg.Camera();
    camera.setName( 'scene' );
    camera.setProjectionMatrix( osg.Matrix.makePerspective( 50, quadSize[ 0 ], near, far, [] ) );
    camera.setViewMatrix( osg.Matrix.makeLookAt( [ 0, -10, 0 ], [ 0, 0, 0 ], [ 0, 0, 1 ], [] ) );
    camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
    camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
    camera.setViewport( new osg.Viewport( 0, 0, rttSize[ 0 ], rttSize[ 1 ] ) );
    camera.setClearColor( [ 0.5, 0.5, 0.5, 1 ] );

    // attach a texture to the camera to render the scene on
    var sceneTexture = new osg.Texture();
    sceneTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
    sceneTexture.setMinFilter( 'LINEAR' );
    sceneTexture.setMagFilter( 'LINEAR' );
    camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, sceneTexture, 0 );
    camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );
    // add the scene to the camera
    camera.addChild( rootModel );

    // attach camera to root
    root.addChild( camera );
    return [ root, sceneTexture ];
}

function createScene(width, height, gui) {

    var rttSize = [ 1024, 1024 ];

    var result = commonScene( rttSize );
    var commonNode = result[ 0 ];
    var sceneTexture = result[ 1 ];

    var root = new osg.Node();

    var texW = osg.Uniform.createFloat1( rttSize[ 0 ], 'tex_w' );
    var texH = osg.Uniform.createFloat1( rttSize[ 1 ], 'tex_h' );

    root.getOrCreateStateSet().addUniform( texW );
    root.getOrCreateStateSet().addUniform( texH );

    // create a quad on which will be applied the postprocess effects
    var quadSize = [ 16 / 9, 1 ];
    var quad = osg.createTexturedQuadGeometry(  -quadSize[ 0 ] / 2.0, 0, -quadSize[ 1 ] / 2.0,
                                                quadSize[ 0 ]       , 0, 0,
                                                0                   , 0, quadSize[ 1 ] );
    quad.getOrCreateStateSet().setAttributeAndMode( getTextureShader() );

    root.addChild( commonNode );
    var scene;

    var effects = [
        // {effect: getPostSceneStitching(sceneTexture), matrix: osg.Matrix.makeTranslate( -2.0, 0.0, 0.0, [] )},
        // {effect: getPostSceneVignette(sceneTexture), matrix: osg.Matrix.makeTranslate( 0.0, 0.0, 0.0, [] )},
        // {effect: getPostSceneBloom(sceneTexture), matrix: osg.Matrix.makeTranslate( 2.0, 0.0, 0.0, [] )},
        // {effect: getPostSceneSharpen(sceneTexture), matrix: osg.Matrix.makeTranslate( 2.0, 0.0, -1.25, [] )},
        // {effect: getPostSceneChromaticAberration(), matrix: osg.Matrix.makeTranslate( 0.0, 0.0, -1.25, [] )},
        {effect: getPostSceneToneMapping(), matrix: osg.Matrix.makeTranslate( -2.0, 0.0, -1.25, [] )},
    ];

    for (var i = 0; i < effects.length; i++)
    {
        scene = createPostScene(effects[i].effect, quad, rttSize);
        scene.setMatrix(effects[i].matrix);
        root.addChild(scene);
        effects[i].effect.buildGui(gui);
    }

    return root;
}



function createPostScene(effect, quad, textureSize) {

    var scene = new osg.MatrixTransform();

    // create a texture to render the effect to
    var finalTexture = new osg.Texture();
    finalTexture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
    finalTexture.setMinFilter( 'LINEAR' );
    finalTexture.setMagFilter( 'LINEAR' );
    
    var composer = effect.buildComposer(finalTexture);

    // Set the final texture to the scene's StateSet so that 
    // it will be applied when rendering the quad
    scene.getOrCreateStateSet().setTextureAttributeAndMode( 0, finalTexture );

    scene.addChild( composer );
    scene.addChild( quad );

    return scene;

}

var main = function () {

    // osg.ReportWebGLError = true;

    var canvas = document.getElementById( '3DView' );
    canvas.style.width = canvas.width = window.innerWidth;
    canvas.style.height = canvas.height = window.innerHeight;

    var gui = new dat.GUI();

    var rotate = new osg.MatrixTransform();
    rotate.addChild( createScene( canvas.width, canvas.height, gui ) );
    rotate.getOrCreateStateSet().setAttributeAndMode( new osg.CullFace( 'DISABLE' ) );

    var viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
    viewer.setSceneData( rotate );
    viewer.setupManipulator();
    viewer.getManipulator().computeHomePosition();
    viewer.run();

};


function getTextureShader() {

    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec2 TexCoord0;',
        'varying vec2 FragTexCoord0;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'void main(void) {',
        '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
        '  FragTexCoord0 = TexCoord0;',
        '}',
        ''
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec2 FragTexCoord0;',
        'uniform sampler2D Texture0;',

        '',
        'void main (void)',
        '{',
        '  vec2 uv = FragTexCoord0;',
        '  gl_FragColor = vec4(texture2D(Texture0, uv));',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
    return program;
}


window.addEventListener( 'load', main, true );