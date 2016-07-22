'use strict';

// from require to global var
var OSG = window.OSG;
OSG.globalify();
var osg = window.osg;
var osgViewer = window.osgViewer;

// Idea by WestLangley

var viewer;
var targetNode, lightNode;
var t = 0;

var getShader = function () {

    var vertexshader = document.getElementById( 'vertex-vs' ).text;
    var fragmentshader = document.getElementById( 'fragment-fs' ).text;

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

    program.trackAttributes = {};
    program.trackAttributes.attributeKeys = [];
    program.trackAttributes.attributeKeys.push( 'Material' );

    return program;
};

function createScene() {

    var root = new osg.Node();

    targetNode = new osg.MatrixTransform();
    var QuadSizeX = 100;
    var QuadSizeY = QuadSizeX * 9 / 16.0;
    var targetModel1 = osg.createTexturedQuadGeometry( -QuadSizeX / 2.0, -QuadSizeY / 2.0, 0,
        QuadSizeX, 0, 0,
        0, QuadSizeY, 0 );
    targetNode.addChild( targetModel1 );

    var targetNode2 = new osg.MatrixTransform();
    var targetModel2 = osg.createTexturedSphere( 10, 30, 30 );
    var m = targetNode2.getMatrix();
    osg.Matrix.setTrans( m, -25.0, 0.0, 0.0, 0.0 );
    targetNode2.setMatrix( m );
    targetNode2.addChild( targetModel2 );
    targetNode.addChild( targetNode2 );
    root.addChild( targetNode );




    lightNode = new osg.MatrixTransform();
    QuadSizeX = 25;
    QuadSizeY = QuadSizeX * 9 / 16.0;
    var lightModel = osg.createTexturedQuadGeometry(
        0.0, -QuadSizeX / 2.0, 10.0,
        0, 0, QuadSizeY,
        0, QuadSizeX, 0 );

    //var lightNodeRotate = new osg.MatrixTransform();
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    lightNode.addChild( lightModel );
    root.addChild( lightNode );

    var material = new osg.Material();
    material.setAmbient( [ 1, 1, 1, 1 ] );
    material.setDiffuse( [ 1, 1, 1, 1 ] );
    material.setSpecular( [ 1, 1, 1, 1 ] );
    material.setEmission( [ 1, 1, 1, 1 ] );
    lightNode.getOrCreateStateSet().setAttribute( material );
    lightNode.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'BACK' ) );

    root.addChild( osg.createAxisGeometry( 20 ) );


    root.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );


    targetNode.getOrCreateStateSet().setAttributeAndModes( getShader() );

    var viewMatrixArr = viewer.getCamera().getViewMatrix();
    var ViewMatrix = osg.Uniform.createMatrix4( viewMatrixArr, 'ViewMatrix' );
    targetNode.getOrCreateStateSet().addUniform( ViewMatrix );

    var lightMatrixWorldArr = lightNode.getMatrix();
    var lightMatrixWorld = osg.Uniform.createMatrix4( lightMatrixWorldArr, 'lightMatrixWorld' );
    targetNode.getOrCreateStateSet().addUniform( lightMatrixWorld );

    var lightVertsArr = lightModel.getAttributes().Vertex.getElements();
    var lightVerts = osg.Uniform.createFloat3( lightVertsArr, 'lightverts' );
    targetNode.getOrCreateStateSet().addUniform( lightVerts );

    var color = osg.Uniform.createFloat3( [ 0.6666, 0.6666, 0.865 ], 'color' );
    targetNode.getOrCreateStateSet().addUniform( color );
    var lightColor = osg.Uniform.createFloat3( [ 1.0, 1.0, 1.0 ], 'lightColor' );
    targetNode.getOrCreateStateSet().addUniform( lightColor );
    var lightIntensity = osg.Uniform.createFloat( 1.0, 'lightIntensity' );
    targetNode.getOrCreateStateSet().addUniform( lightIntensity );



    // That's where we update lights direction at each frame
    var LightUpdateCallback = function () {};
    LightUpdateCallback.prototype = {
        lastTime: 0.0,
        update: function ( node, nv ) {
            var currentTime = nv.getFrameStamp().getSimulationTime();
            var mdelta = ( currentTime - this.lastTime );
            this.lastTime = currentTime;
            var m = lightNode.getMatrix();
            osg.Matrix.setTrans( m, 25 + 25 * Math.sin( t ), 0.0, Math.min( 25 * Math.cos( t ) ), 0.0 );
            osg.Matrix.makeRotate( -Math.min( t, Math.PI * 2 ), 0.0, 1.0, 0.0, m );

            lightNode.setMatrix( m );


            t += mdelta;
            if ( t > ( Math.PI * 2 ) || t < 0 ) t = 0;

            var matrixList = lightNode.getWorldMatrices();
            var worldMatrix = matrixList[ 0 ];
            lightMatrixWorld.set( worldMatrix );

            ViewMatrix.set( viewer.getCamera().getViewMatrix() );

            node.traverse( nv );
        }
    };

    // branch the callback
    root.addUpdateCallback( new LightUpdateCallback() );

    return root;
}

var main = function () {
    // from require to global var
    OSG.globalify();
    // The 3D canvas.
    var canvas = document.getElementById( '3DView' );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    viewer = new osgViewer.Viewer( canvas, {
        antialias: true,
        alpha: false
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
