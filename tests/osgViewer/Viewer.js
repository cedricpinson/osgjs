define( [
    'tests/mockup/mockup',
    'osgViewer/Viewer',
    'osg/Shape',
    'osg/Notify'
], function ( mockup, Viewer, Shape, Notify ) {

    return function () {

        module( 'osgViewer' );

        test( 'Viewer', function () {
            ( function () {
                var canvas = mockup.createCanvas();
                var viewer = new Viewer( canvas );
                ok( viewer.getCamera() !== undefined, 'Check camera creation' );
                ok( viewer.getCamera().getViewport() !== undefined, 'Check camera viewport' );

                viewer.init();
                ok( viewer._updateVisitor !== undefined, 'Check update visitor' );
                ok( viewer._cullVisitor !== undefined, 'Check cull visitor' );
                ok( viewer._state !== undefined, 'Check state' );
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
                viewer.draw = function() {}; // do nothing
                viewer.frame();

                // with auto compute near far
                var projection = viewer.getCamera().getProjectionMatrix();
                equal( projection[14] , -86.03523882425281, 'check far');
                equal( projection[10] , -3.6948013697711914, 'check near');

                viewer._cullVisitor.reset();
                equal( viewer._cullVisitor._computedNear, Number.POSITIVE_INFINITY, 'Check near after reset' );
                equal( viewer._cullVisitor._computedFar, Number.NEGATIVE_INFINITY, 'Check far after reset' );

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
        } );
    };
} );
