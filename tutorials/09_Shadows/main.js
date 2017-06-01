'use strict';

// from require to global var
var OSG = window.OSG;
OSG.globalify();
var osg = window.osg;
var osgViewer = window.osgViewer;
var osgShadow = window.osgShadow;


var convertColor = function ( color ) {

    var r, g, b;

    if ( color.length === 3 ) { // rgb [255, 255, 255]
        r = color[ 0 ];
        g = color[ 1 ];
        b = color[ 2 ];

    } else if ( color.length === 7 ) { // hex (24 bits style) '#ffaabb'
        var intVal = parseInt( color.slice( 1 ), 16 );
        r = ( intVal >> 16 );
        g = ( intVal >> 8 & 0xff );
        b = ( intVal & 0xff );
    }

    var result = [ 0, 0, 0, 1 ];
    result[ 0 ] = r / 255.0;
    result[ 1 ] = g / 255.0;
    result[ 2 ] = b / 255.0;
    //console.log( result );
    return result;
};


// Wait for it

window.addEventListener( 'load', function () {
    // The 3D canvas.
    var canvas = document.getElementById( '3DView' );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var viewer;
    var root = new osg.Node();

    // We create  boxes and ground which will be lighted
    var scene = new osg.MatrixTransform();
    var size = 5;
    var ground = osg.createTexturedBoxGeometry( 0, 0, -5, 400, 400, 0.1 );
    scene.addChild( ground );

    ground = osg.createTexturedBoxGeometry( -10, -10, 0, size, size, size );
    scene.addChild( ground );
    var material = new osg.Material();
    var config = {
        materialEmission: '#0909ff',
        materialAmbient: '#3b2fff',
        materialDiffuse: '#f0f0ff',
        materialSpecular: '#5050ff',
        materialShininess: 0.5,
    };
    material.setEmission( convertColor( config.materialEmission ) );
    material.setDiffuse( convertColor( config.materialDiffuse ) );
    material.setSpecular( convertColor( config.materialSpecular ) );
    material.setAmbient( convertColor( config.materialAmbient ) );
    material.setShininess( Math.exp( config.materialShininess * 13.0 - 4.0 ) );
    ground.getOrCreateStateSet().setAttributeAndModes( material );


    // 1 light for 4 boxes and a ground
    var mainNode = new osg.Node();
    var lightNew = new osg.Light( 0 );

    // pretty spotlight fallof showing
    // clearly directions

    lightNew.setSpotCutoff( 190 );
    lightNew.setPosition( [ 0, 0, 0.0, 0 ] );
    lightNew.setLightType( osg.Light.DIRECTION );


    lightNew.setConstantAttenuation( 0 );
    lightNew.setLinearAttenuation( 0.005 );
    lightNew.setQuadraticAttenuation( 0 );

    lightNew.setName( 'light0' );
    lightNew._enabled = true;

    // light source is a node handling the light
    var lightSourcenew = new osg.LightSource();
    lightSourcenew.setName( 'lightNode0' );
    lightSourcenew.setLight( lightNew );

    // node helping position the light
    var lightNodeModelNodeParent = new osg.MatrixTransform();

    lightNodeModelNodeParent.addChild( lightSourcenew );
    // Important: set the light as attribute so that it's inhered by all node under/attached the mainNode

    mainNode.getOrCreateStateSet().setAttributeAndModes( lightNew );
    mainNode.addChild( lightNodeModelNodeParent );

    // setting light, each above its cube
    lightNodeModelNodeParent.setMatrix( osg.mat4.fromTranslation( osg.mat4.create(), [ -10, -10, 10 ] ) );

    // red light
    lightNew.setAmbient( [ 0.0, 0, 0.0, 1.0 ] );
    lightNew.setDiffuse( [ 1.0, 0, 0.0, 1.0 ] );
    lightNew.setSpecular( [ 1.0, 0, 0.0, 1.0 ] );

    /////////////////// Shadow
    var shadowedScene = new osgShadow.ShadowedScene();
    shadowedScene.addChild( scene );

    var shadowSettings = new osgShadow.ShadowSettings();

    shadowSettings.setLight( lightNew );

    var shadowMap = new osgShadow.ShadowMap( shadowSettings );
    shadowedScene.addShadowTechnique( shadowMap );
    shadowMap.setShadowSettings( shadowSettings );

    mainNode.addChild( shadowedScene );
    /////////////////// Shadow end

    var shadowSceneContainer = new osg.Node();


    // before and above shadow scene
    // !!! not in shadow &light Scene
    var groundBefore = osg.createTexturedBoxGeometry( 10, -10, 0, size, size, size );
    root.addChild( groundBefore );

    // add the shadow Scene
    root.addChild( shadowSceneContainer );

    // sibling to shadow scene
    var groundSibling = osg.createTexturedBoxGeometry( -10, 10, 0, size, size, size );
    shadowSceneContainer.addChild( groundSibling );
    // !!!!!!! start Shadow & light Scene
    // now add light and shadow
    shadowSceneContainer.addChild( mainNode );
    // !!!!! end Shadow & light Scene

    // !!!!! not in shadow &light Scene
    // after and above shadow Scene
    var groundAfter = osg.createTexturedBoxGeometry( 10, 10, 0, size, size, size );
    root.addChild( groundAfter );

    // add Texture
    var texturePath = '../../examples/media/textures/seamless/wood2.jpg';
    window.osgDB.readImageURL( texturePath ).then( function ( groundImage ) {
        var groundTex = osg.Texture.createFromImage( groundImage );
        groundTex.setWrapT( 'MIRRORED_REPEAT' );
        groundTex.setWrapS( 'MIRRORED_REPEAT' );

        ground.getOrCreateStateSet().setTextureAttributeAndModes( 0, groundTex );
        groundBefore.getOrCreateStateSet().setTextureAttributeAndModes( 0, groundTex );
        groundAfter.getOrCreateStateSet().setTextureAttributeAndModes( 0, groundTex );
        groundSibling.getOrCreateStateSet().setTextureAttributeAndModes( 0, groundTex );



    } );


    // The viewer
    viewer = new osgViewer.Viewer( canvas );
    viewer.init();

    // we'll do it ourself
    viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );
    viewer.getCamera().setClearColor( [ 0.3, 0.3, 0.3, 0.3 ] );
    viewer.setSceneData( root );
    viewer.setupManipulator();
    viewer.run();



}, true );
