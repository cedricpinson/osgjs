'use strict';

var Q = window.Q;
var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;
var osgDB = OSG.osgDB;

var getShader = function () {
    var precision = [ '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
    ].join( '\n' );

    var vertexshader = [
        precision,
        'attribute vec3 Vertex;',
        'attribute vec2 TexCoord0;',

        'varying vec2 vTexCoord;',

        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',

        'void main( void ) {',
        '  vTexCoord = TexCoord0;',
        '  gl_Position = ProjectionMatrix * (ModelViewMatrix * vec4( Vertex, 1.0 ) );',
        '}'
    ].join( '\n' );

    var fragmentshader = [
        precision,
        'varying vec2 vTexCoord;',
        'uniform sampler2D uTexture0;',
        'void main( void ) {',
        '    gl_FragColor = texture2D(uTexture0, vTexCoord);',
        '}'
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( osg.Shader.VERTEX_SHADER, vertexshader ),
        new osg.Shader( osg.Shader.FRAGMENT_SHADER, fragmentshader ) );

    return program;
};

var createFromCrn = function ( url, noDxt ) {
    var texture = new osg.Texture();
    Q( osgDB.readBinaryArrayURL( url ) ).then( function ( data ) {
        window.loadCRN( data, texture, noDxt );
    } ).fail( function () {
        console.error( 'fail download or uncompress : ' + url );
    } );
    return texture;
};

var createFromImg = function ( url ) {
    var texture = new osg.Texture();
    Q( osgDB.readImage( url ) ).then( function ( img ) {
        texture.setImage( img );
        texture.setMinFilter( osg.Texture.LINEAR_MIPMAP_LINEAR );
        texture.setMagFilter( osg.Texture.LINEAR );
    } );
    return texture;
};

var createScene = function () {
    var root = new osg.Node();
    var rs = root.getOrCreateStateSet();
    rs.setAttributeAndModes( new osg.CullFace( osg.CullFace.DISABLE ) );
    rs.setAttributeAndModes( new osg.BlendFunc( osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA ) );
    rs.setAttributeAndModes( getShader() );

    var node = osg.createTexturedQuadGeometry( -0.5, 0, -0.5, 1, 0, 0, 0, 0, 1 );
    var offset = node.getBound().radius() * 2;
    var nbGeo = 5;
    var mid = Math.round( nbGeo / 2 );
    for ( var i = 0; i < nbGeo; ++i ) {
        var mt = new osg.MatrixTransform();
        osg.Matrix.makeTranslate( -mid + i * offset, 0, 0, mt.getMatrix() );
        mt.addChild( node );
        root.addChild( mt );

        var texture = null;
        switch ( i ) {
        case 0: // crn dxt1
            texture = createFromCrn( '../media/textures/seamless/dxt1mip.crn' );
            break;
        case 1: // crn dxt1 -> no dxt               
            texture = createFromCrn( '../media/textures/seamless/dxt1mip.crn', true );
            break;
        case 2: // crn dxt5
            texture = createFromCrn( '../media/textures/seamless/dxt5mip.crn' );
            break;
        case 3: // crn dxt5 -> no dxt 
            texture = createFromCrn( '../media/textures/seamless/dxt5mip.crn', true );
            break;
        case 4: // original 
            texture = createFromImg( '../media/textures/seamless/dice.png' );
            break;
        }
        mt.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );
    }

    return root;
};

var onLoad = function () {
    OSG.globalify();

    var canvas = document.getElementById( 'View' );

    var viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    viewer.setSceneData( createScene() );
    viewer.setupManipulator();
    viewer.getManipulator().computeHomePosition();
    viewer.run();
};

window.addEventListener( 'load', onLoad, true );
