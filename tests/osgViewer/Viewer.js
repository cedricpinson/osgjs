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
                viewer.frame();

                // Notify.log( viewer.getCamera().getProjectionMatrix() );
                // without auto compute near far
                // [1.7320508075688774, 0, 0, 0, 0, 1.7320508075688774, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -2.002002002002002, 0]

                // with auto compute near far

                ok( mockup.check_near( viewer.getCamera().getProjectionMatrix(), [ 0.960491063485583, 0, 0, 0, 0, 1.920982126971166, 0, 0, 0, 0, -3.6948013697711914, -1, 0, 0, -86.03523882425281, 0 ] ), 'check near / far computation' );

                viewer._cullVisitor.reset();
                ok( viewer._cullVisitor._computedNear === Number.POSITIVE_INFINITY, 'Check near after reset' );
                ok( viewer._cullVisitor._computedFar === Number.NEGATIVE_INFINITY, 'Check far after reset' );

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
                console.log( list );
                ok( list.LeapMotion !== undefined, 'detected leapmotion' );
                ok( list.StandardMouseKeyboard !== undefined, 'detected mouse' );

                viewer.updateEventProxy( list, undefined );
                //ok(true, 'detected mouse');

                mockup.removeCanvas( canvas );

            } )();
        } );
    };
} );
