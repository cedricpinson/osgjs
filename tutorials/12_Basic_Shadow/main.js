'use strict';

// from require to global var
var OSG = window.OSG;
OSG.globalify();
var osg = window.osg;
var osgViewer = window.osgViewer;
var osgShadow = window.osgShadow;


// Wait for it

window.addEventListener( 'load', function () {
    // The 3D canvas.
    var canvas = document.getElementById( '3DView' );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var viewer;

    // We create  boxes and ground which will be lighted
    var scene = new osg.MatrixTransform();
    var size = 5;
    var ground = osg.createTexturedBoxGeometry( 0, 0, -5, 400, 400, 0.1 );
    scene.addChild( ground );

    ground = osg.createTexturedBoxGeometry( -10, -10, 0, size, size, size );
    scene.addChild( ground );
    ground = osg.createTexturedBoxGeometry( 10, -10, 0, size, size, size );
    scene.addChild( ground );
    ground = osg.createTexturedBoxGeometry( -10, 10, 0, size, size, size );
    scene.addChild( ground );
    ground = osg.createTexturedBoxGeometry( 10, 10, 0, size, size, size );
    scene.addChild( ground );

    // 1 light for 4 boxes and a ground
    var mainNode = new osg.Node();
    var lightNew = new osg.Light( 0 );

    // pretty spotlight fallof showing
    // clearly directions
    var spot = false;
    if ( spot ) {
        lightNew.setSpotCutoff( 25 );
        lightNew.setSpotBlend( 1.0 );
        lightNew.setPosition( [ 0, 0, 0, 1 ] );
        lightNew.setLightType( osg.Light.SPOT );
    } else {
        lightNew.setSpotCutoff( 190 );
        lightNew.setPosition( [ 0, 0, 0.0, 0 ] );
        lightNew.setLightType( osg.Light.DIRECTION );
    }

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


    // The viewer
    viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    // we'll do it ourself
    viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );
    viewer.getCamera().setClearColor( [ 0.3, 0.3, 0.3, 0.3 ] );
    viewer.setSceneData( mainNode );
    viewer.setupManipulator();
    viewer.run();



}, true );
