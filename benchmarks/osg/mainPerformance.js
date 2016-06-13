'use strict';
var mockup = require( 'tests/mockup/mockup' );
var Matrix = require( 'osg/Matrix' );
var Node = require( 'osg/Node' );
var Timer = require( 'osg/Timer' );
var Viewer = require( 'osgViewer/Viewer' );
var reportStats = require( 'benchmarks/reportStats' );
var mockupBench = require( 'benchmarks/mockupBench' );

module.exports = function () {

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

        mockupBench.addScene( root, 20, false, false );

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

        mockupBench.addScene( root, 20, false, true );

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

        mockupBench.addScene( root, 20, true, true );

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

        mockupBench.addScene( root, 20, true, true );

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

        mockupBench.addScene( root, 20, true, true );

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
        var s = Timer.instance().tick();
        for ( var n = 0; n < nCount; n++ ) {
            viewer.frame();
        }
        var result = Timer.instance().tick() - s;

        console.timeEnd( 'time' );
        console.profileEnd();

        reportStats( result, 'perf Frame' );

    } );
};
