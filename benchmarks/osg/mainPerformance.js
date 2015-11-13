'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );
var Depth = require( 'osg/Depth' );
var BlendFunc = require( 'osg/BlendFunc' );
var Light = require( 'osg/Light' );
var LightSource = require( 'osg/LightSource' );
var Material = require( 'osg/Material' );
var Matrix = require( 'osg/Matrix' );
var MatrixTransform = require( 'osg/MatrixTransform' );
var Node = require( 'osg/Node' );
var Shape = require( 'osg/Shape' );
var StateAttribute = require( 'osg/StateAttribute' );
var Timer = require( 'osg/Timer' );
var ShadowedScene = require( 'osgShadow/ShadowedScene' );
var ShadowSettings = require( 'osgShadow/ShadowSettings' );
var ShadowMap = require( 'osgShadow/ShadowMap' );
var Vec4 = require( 'osg/Vec4' );
var Viewer = require( 'osgViewer/Viewer' );
var reportStats = require( 'benchmarks/reportStats' );


module.exports = function () {

    QUnit.module( 'osg Main Loop' );

    var addScene = function ( rootNode, count, shadows, culling ) {

        var groundSubNode;
        var groundSize = 75 / count;

        var root = new Node();
        var ground = Shape.createTexturedQuadGeometry( 0, 0, 0, groundSize, 0, 0, 0, groundSize, 0 );
        for ( var wG = 0; wG < count; wG++ ) {

            for ( var wH = 0; wH < count; wH++ ) {

                var groundSubNodeTrans = new MatrixTransform();
                groundSubNodeTrans.setMatrix(
                    Matrix.makeTranslate( wG * groundSize - 100, wH * groundSize - 100, -5.0, groundSubNodeTrans.getMatrix() ) );
                // only node are culled in CullVisitor frustum culling
                groundSubNode = new Node();
                groundSubNode.setCullingActive( culling );
                groundSubNode.setName( 'groundSubNode_' + wG + '_' + wH );
                groundSubNodeTrans.addChild( ground );
                groundSubNodeTrans.setCullingActive( culling );
                groundSubNode.addChild( groundSubNodeTrans );

                // Material changes, always the same but not same instance
                var material = new Material();
                material.setEmission( Vec4.create( 0., 0., 0., 0. ) );
                material.setDiffuse( Vec4.create( 0., 0., 0., 0. ) );
                material.setSpecular( Vec4.create( 0., 0., 0., 0. ) );
                material.setAmbient( Vec4.create( 0., 0., 0., 0. ) );
                material.setShininess( 1.1 );
                groundSubNode.getOrCreateStateSet().setAttributeAndModes( material );
                // Material Attributes Combinatory changes
                if ( wH % 2 ) {
                    groundSubNode.getOrCreateStateSet().setRenderingHint( 'TRANSPARENT_BIN' );
                    groundSubNode.getOrCreateStateSet().setAttributeAndModes( new BlendFunc( 'ONE', 'ONE_MINUS_SRC_ALPHA' ) );
                }
                var depth;
                if ( wG % 3 ) {

                    depth = new Depth( 'EQUAL' );
                    depth.setWriteMask( false );
                    groundSubNode.getOrCreateStateSet().setAttributeAndModes( depth, StateAttribute.OVERRIDE );
                }

                if ( wG % 2 ) {
                    depth = new Depth( 'LESS' );

                    groundSubNode.getOrCreateStateSet().setAttributeAndModes( depth, StateAttribute.OVERRIDE );
                }
                if ( depth ) depth.setWriteMask( wH % 3 );

                root.addChild( groundSubNode );

            }
        }
        root.setCullingActive( culling );

        if ( shadows ) {

            var lightNew = new Light( 0 );
            lightNew._enabled = true;
            // light source is a node handling the light
            var lightSourcenew = new LightSource();
            lightSourcenew.setLight( lightNew );
            var lightNodeModelNodeParent = new MatrixTransform();
            lightNodeModelNodeParent.addChild( lightSourcenew );
            rootNode.getOrCreateStateSet().setAttributeAndModes( lightNew );
            rootNode.addChild( lightNodeModelNodeParent );
            // setting light, each above its cube
            lightNodeModelNodeParent.setMatrix( Matrix.makeTranslate( -10, -10, 10, Matrix.create() ) );
            var shadowedScene = new ShadowedScene();
            shadowedScene.addChild( root );
            var shadowSettings = new ShadowSettings();
            shadowSettings.setLight( lightNew );
            var shadowMap = new ShadowMap( shadowSettings );
            shadowedScene.addShadowTechnique( shadowMap );
            shadowMap.setShadowSettings( shadowSettings );
            rootNode.addChild( shadowedScene );

        } else {
            rootNode.addChild( root );
        }
    };


    test( 'CullVisitor Heavy Static Scene', function () {

        var canvas = mockup.createCanvas( true );
        var viewer = new Viewer( canvas );
        viewer.setupManipulator();
        viewer.init();
        viewer.frame();
        var cullVisitor = viewer.getCamera().getRenderer().getCullVisitor();
        var root = new Node();

        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );

        addScene( root, 20, false, false );

        var fake = Matrix.create();
        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );

        console.profile();
        console.time( 'time' );
        var timed = Timer.instance().tick();

        var nCount = 10;
        for ( var n = 0; n < nCount; n++ ) {

            cullVisitor.apply( root );
        }

        timed = Timer.instance().tick() - timed;
        console.timeEnd( 'time' );
        console.profileEnd();


        reportStats( timed, 'Main CullVisitor Loop scene' );

    } );

    test( 'CullVisitor Heavy Static Scene with Frustum culling (Worst Cases as Scene is Flat) ', function () {

        var canvas = mockup.createCanvas( true );
        var viewer = new Viewer( canvas );
        viewer.setupManipulator();
        viewer.init();
        viewer.frame();
        var cullVisitor = viewer.getCamera().getRenderer().getCullVisitor();
        var root = new Node();

        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );

        addScene( root, 20, false, true );

        var fake = Matrix.create();
        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );

        console.profile();
        console.time( 'time' );
        var timed = Timer.instance().tick();

        var nCount = 10;
        for ( var n = 0; n < nCount; n++ ) {
            //
            cullVisitor.apply( root );
        }


        timed = Timer.instance().tick() - timed;
        console.timeEnd( 'time' );
        console.profileEnd();

        reportStats( timed, 'Main CullVisitor Loop scene + culling' );

    } );

    test( 'CullVisitor Heavy Static Scene with 1 light And Shadows ', function () {

        var canvas = mockup.createCanvas( true );
        var viewer = new Viewer( canvas );
        viewer.setupManipulator();
        viewer.init();
        viewer.frame();
        var cullVisitor = viewer.getCamera().getRenderer().getCullVisitor();
        var root = new Node();

        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );

        addScene( root, 20, true, true );

        var fake = Matrix.create();
        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );
        //            viewer.setSceneData( root );
        //          viewer.getCamera().addChild( root );
        // dreaded camera no modelview end


        console.profile();
        console.time( 'time' );
        var timed = Timer.instance().tick();

        var nCount = 10;
        for ( var n = 0; n < nCount; n++ ) {
            //
            cullVisitor.apply( root );
        }

        timed = Timer.instance().tick() - timed;
        console.timeEnd( 'time' );
        console.profileEnd();


        reportStats( timed, 'Main CullVisitor Loop scene + shadow Loop' );

    } );

    test( 'Draw Pass ', function () {

        var canvas = mockup.createCanvas( true );
        var viewer = new Viewer( canvas );
        viewer.setupManipulator();
        viewer.init();
        viewer.frame();
        var cullVisitor = viewer.getCamera().getRenderer().getCullVisitor();
        var root = new Node();


        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );

        addScene( root, 20, true, true );

        viewer.setSceneData( root );

        var fake = Matrix.create();
        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );

        // first frame for warm start
        // shadercompil and averaged stuff
        for ( var k = 0; k < 10; k++ ) {
            viewer.frame();
        }



        viewer.beginFrame();

        viewer.advance();
        viewer._updateVisitor.setFrameStamp( viewer.getFrameStamp() );

        viewer.getCamera().getRenderer().cull();

        console.profile();
        console.time( 'time' );
        var timed = Timer.instance().tick();


        var nCount = 20;
        for ( var n = 0; n < nCount; n++ ) {
            viewer.getCamera().getRenderer().draw();
        }

        timed = Timer.instance().tick() - timed;
        console.timeEnd( 'time' );
        console.profileEnd();

        reportStats( timed, 'Draw' );
    } );

    test( 'Full Frame ', function () {

        var canvas = mockup.createCanvas( true );
        var viewer = new Viewer( canvas );
        viewer.setupManipulator();
        viewer.init();
        viewer.frame();
        var cullVisitor = viewer.getCamera().getRenderer().getCullVisitor();
        var root = new Node();


        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );
        cullVisitor.pushModelViewMatrix( Matrix.create() );

        addScene( root, 20, true, true );

        viewer.setSceneData( root );

        var fake = Matrix.create();
        // dreaded camera no modelview
        cullVisitor.pushProjectionMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );
        cullVisitor.pushModelViewMatrix( fake );

        // first frame for warm start
        // shadercompil and averaged stuff
        for ( var k = 0; k < 10; k++ ) {
            viewer.frame();
        }

        console.profile();
        console.time( 'time' );

        var nCount = 20;
        for ( var n = 0; n < nCount; n++ ) {
            viewer.frame();
        }

        console.timeEnd( 'time' );
        console.profileEnd();

        var frameNum = viewer.getFrameStamp().getFrameNumber();

        reportStats( viewer.getViewerStats().getAveragedAttribute( frameNum - nCount, frameNum, 'Update duration' ) * 1000.0, 'perf Only Update' );
        reportStats( viewer.getViewerStats().getAveragedAttribute( frameNum - nCount, frameNum, 'Cull duration' ) * 1000.0, 'perf Only Cull' );
        reportStats( viewer.getViewerStats().getAveragedAttribute( frameNum - nCount, frameNum, 'Draw duration' ) * 1000.0, 'perf Only Draw' );
        reportStats( viewer.getViewerStats().getAveragedAttribute( frameNum - nCount, frameNum, 'Frame duration' ) * 1000.0, 'perf Frame' );

    } );
};
