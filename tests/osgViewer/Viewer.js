'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );
var Viewer = require( 'osgViewer/Viewer' );
var Shape = require( 'osg/Shape' );

module.exports = function () {

    QUnit.module( 'osgViewer' );

    QUnit.test( 'Viewer', function () {
        ( function () {
            var canvas = mockup.createCanvas();
            var viewer = new Viewer( canvas );
            ok( viewer.getCamera() !== undefined, 'Check camera creation' );
            ok( viewer.getCamera().getViewport() !== undefined, 'Check camera viewport' );
            ok( viewer.getCamera().getRenderer() !== undefined, 'Check camera Renderer' );

            viewer.init();
            ok( viewer._updateVisitor !== undefined, 'Check update visitor' );
            ok( viewer.getState().getGraphicContext() !== undefined, 'Check state graphic context' );
            mockup.removeCanvas( canvas );
        } )();

        ( function () {
            var canvas = mockup.createCanvas();
            var viewer = new Viewer( canvas );
            var createScene = function () {
                return Shape.createTexturedBoxGeometry( 0, 0, 0,
                    10, 10, 10 );
            };
            viewer.init();
            viewer.setupManipulator();

            viewer.setSceneData( createScene() );
            viewer.getCamera().getRenderer().draw = function () {}; // do nothing
            viewer.frame();

            var cullvisitor = viewer.getCamera().getRenderer().getCullVisitor();
            // with auto compute near far
            equal( cullvisitor._computedFar, 31.300367553350508, 'check far' );
            equal( cullvisitor._computedNear, 18.6996324466495, 'check near' );

            cullvisitor.reset();
            equal( cullvisitor._computedNear, Number.POSITIVE_INFINITY, 'Check near after reset' );
            equal( cullvisitor._computedFar, Number.NEGATIVE_INFINITY, 'Check far after reset' );

            mockup.removeCanvas( canvas );

        } )();

        // test device
        ( function () {
            var canvas = mockup.createCanvas();
            var viewer = new Viewer( canvas );
            var args = {
                'devices': {
                    'Mouse': {
                        'eventNode': canvas
                    }
                }
            };
            var list = viewer.initEventProxy( args );

            QUnit.notEqual( list.LeapMotion, undefined, 'detected leapmotion' );
            QUnit.notEqual( list.StandardMouseKeyboard, undefined, 'detected mouse' );

            viewer.updateEventProxy( list, undefined );
            //ok(true, 'detected mouse');

            mockup.removeCanvas( canvas );

        } )();


        // test context lost
        ( function () {

            var canvas = mockup.createCanvas();
            var viewer = new Viewer( canvas );

            viewer.setContextLostCallback( function () {
                ok( true, 'detected contextLost Lost' );
            } );

            window.cancelAnimationFrame = function () {
                ok( true, 'context lost does cancel render loop' );
            };

            viewer.init();

            var createScene = function () {
                return Shape.createTexturedBoxGeometry( 0, 0, 0,
                    10, 10, 10 );
            };
            viewer.setupManipulator();
            viewer.setSceneData( createScene() );
            viewer.getCamera().getRenderer().draw = function () {}; // do nothing

            var renderCount = 0;

            viewer.beginFrame = function () {
                renderCount++;
            };

            viewer.setDone( false );
            viewer.requestRedraw();
            viewer.frame();

            viewer.contextLost();

            viewer.frame();
            ok( renderCount === 1, 'no render after context Lost' );

        } )();




    } );

};
