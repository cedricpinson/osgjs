'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var Viewer = require( 'osgViewer/Viewer' );
var Shape = require( 'osg/Shape' );

module.exports = function () {

    test( 'Viewer', function () {
        ( function () {
            var canvas = mockup.createCanvas();
            var viewer = new Viewer( canvas );
            assert.isOk( viewer.getCamera() !== undefined, 'Check camera creation' );
            assert.isOk( viewer.getCamera().getViewport() !== undefined, 'Check camera viewport' );
            assert.isOk( viewer.getCamera().getRenderer() !== undefined, 'Check camera Renderer' );

            viewer.init();
            assert.isOk( viewer._updateVisitor !== undefined, 'Check update visitor' );
            assert.isOk( viewer.getState().getGraphicContext() !== undefined, 'Check state graphic context' );
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
            assert.approximately( cullvisitor._computedFar, 31.30036755335, 1e-5, 'check far' );
            assert.approximately( cullvisitor._computedNear, 18.6996324495, 1e-5, 'check near' );

            cullvisitor.reset();
            assert.equal( cullvisitor._computedNear, Number.POSITIVE_INFINITY, 'Check near after reset' );
            assert.equal( cullvisitor._computedFar, Number.NEGATIVE_INFINITY, 'Check far after reset' );

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

            assert.notEqual( list.LeapMotion, undefined, 'detected leapmotion' );
            assert.notEqual( list.StandardMouseKeyboard, undefined, 'detected mouse' );

            viewer.updateEventProxy( list, undefined );
            //assert.isOk(true, 'detected mouse');

            mockup.removeCanvas( canvas );

        } )();


        // test context lost
        ( function () {

            var canvas = mockup.createCanvas();
            var viewer = new Viewer( canvas );

            viewer.setContextLostCallback( function () {
                assert.isOk( true, 'detected contextLost Lost' );
            } );

            window.cancelAnimationFrame = function () {
                assert.isOk( true, 'context lost does cancel render loop' );
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
            assert.isOk( renderCount === 1, 'no render after context Lost' );

        } )();

    } );

};
