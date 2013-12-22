define( [
    'tests/mockup/mockup',
    'osg/Light',
    'osgViewer/Viewer',
    'osg/Shape',
    'osg/Node',
    'osg/CullVisitor',
    'osg/RenderStage',
    'osg/StateGraph',
    'osg/Matrix'
], function ( mockup, Light, Viewer, Shape, Node, CullVisitor, RenderStage, StateGraph, Matrix ) {

    return function () {

        module( 'osg' );

        test( 'Light', function () {

            ( function () {
                var canvas = mockup.createCanvas();
                var viewer = new Viewer( canvas );
                viewer.init();

                var l0 = new Light();
                l0.setLightNumber( 0 );
                var l1 = new Light();
                l1.setLightNumber( 1 );

                var q = Shape.createTexturedQuadGeometry( -25, -25, 0,
                    50, 0, 0,
                    0, 50, 0 );

                q.getOrCreateStateSet().setAttributeAndMode( l0 );
                q.getOrCreateStateSet().setAttributeAndMode( l1 );

                var state = viewer.getState();

                var fakeRenderer = mockup.createFakeRenderer();
                fakeRenderer.validateProgram = function() { return true; };
                fakeRenderer.getProgramParameter = function() { return true; };
                fakeRenderer.isContextLost = function() { return false; };
                state.setGraphicContext( fakeRenderer );

                viewer.setSceneData( q );
                viewer.frame();

                mockup.removeCanvas( canvas );
            } )();


            ( function () {

                var root = new Node();
                var node0 = new Node();
                var node1 = new Node();

                root.addChild( node0 );
                root.addChild( node1 );

                var l0 = new Light();
                l0.setLightNumber( 0 );
                l0.setName( 'enableLight0' );
                node0.getOrCreateStateSet().setAttributeAndMode( l0 );

                var l1 = new Light();
                l1.setLightNumber( 1 );
                l1.setName( 'enableLight1' );

                node1.getOrCreateStateSet().setAttributeAndMode( l1 );
                var q = Shape.createTexturedQuadGeometry( -25, -25, 0,
                    50, 0, 0,
                    0, 50, 0 );

                var ld0 = new Light();
                ld0.setLightNumber( 0 );
                ld0.setName( 'disableLight0' );

                var ld1 = new Light();
                ld1.setLightNumber( 1 );
                ld1.setName( 'disableLight1' );

                node0.addChild( q );
                node0.getOrCreateStateSet().setAttributeAndMode( ld1 );

                node1.addChild( q );
                node1.getOrCreateStateSet().setAttributeAndMode( ld0 );

                var cull = new CullVisitor();
                var rs = new RenderStage();
                var sg = new StateGraph();
                cull.pushProjectionMatrix( Matrix.makeIdentity( [] ) );
                cull.pushModelviewMatrix( Matrix.makeIdentity( [] ) );
                cull.setRenderStage( rs );
                cull.setStateGraph( sg );

                root.accept( cull );
            } )();

            ok( true, 'check no exception' );
        } );
    };
} );
