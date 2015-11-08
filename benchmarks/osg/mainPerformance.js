'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );
var Matrix = require( 'osg/Matrix' );
var Node = require( 'osg/Node' );
var Timer = require( 'osg/Timer' );
var Viewer = require( 'osgViewer/Viewer' );
var reportStats = require( 'benchmarks/reportStats' );
var mockupBench = require( 'benchmarks/mockupBench' );

module.exports = function () {

    QUnit.module( 'osg Main Loop' );

    test( 'CullVisitor Heavy Static Scene', function () {

        var canvas = mockup.createCanvas();
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
        //            viewer.setSceneData( root );
        //          viewer.getCamera().addChild( root );
        // dreaded camera no modelview end



        var timed = Timer.instance().tick();

        console.profile();
        console.time( 'time' );

        var nCount = 10;
        for ( var n = 0; n < nCount; n++ ) {
            //
            cullVisitor.apply( root );
        }

        console.timeEnd( 'time' );
        console.profileEnd();

        timed = Timer.instance().tick() - timed;

        reportStats( timed, 'Main CullVisitor Loop scene' );

    } );

    test( 'CullVisitor Heavy Static Scene with Frustum culling (Worst Cases as Scene is Flat) ', function () {

        var canvas = mockup.createCanvas();
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
        //            viewer.setSceneData( root );
        //          viewer.getCamera().addChild( root );
        // dreaded camera no modelview end



        var timed = Timer.instance().tick();

        console.profile();
        console.time( 'time' );

        var nCount = 10;
        for ( var n = 0; n < nCount; n++ ) {
            //
            cullVisitor.apply( root );
        }

        console.timeEnd( 'time' );
        console.profileEnd();

        timed = Timer.instance().tick() - timed;

        reportStats( timed, 'Main CullVisitor Loop scene + culling' );

    } );
    test( 'CullVisitor Heavy Static Scene with 1 light And Shadows ', function () {

        var canvas = mockup.createCanvas();
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



        var timed = Timer.instance().tick();

        console.profile();
        console.time( 'time' );

        var nCount = 10;
        for ( var n = 0; n < nCount; n++ ) {
            //
            cullVisitor.apply( root );
        }

        console.timeEnd( 'time' );
        console.profileEnd();

        timed = Timer.instance().tick() - timed;

        reportStats( timed, 'Main CullVisitor Loop scene + shadow Loop' );

    } );
};
