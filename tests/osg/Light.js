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
    'use strict';

    return function () {

        module( 'osg' );

        test( 'Light', function () {

            ( function () {

                var l0 = new Light();
                l0.setLightNumber( 0 );

                l0.setLightAsPoint();
                deepEqual( l0.getPosition(), [ 0, 0, 0, 1 ] );
                equal( l0.getSpotCutoff(), 180);
                equal( l0.getLightType(), Light.POINT );

                l0.setLightAsDirection();
                deepEqual( l0.getPosition(), [ 0, 0, 1, 0 ] );
                equal( l0.getLightType(), Light.DIRECTION );

                l0.setLightAsSpot();
                deepEqual( l0.getPosition(), [ 0, 0, 0, 1 ] );
                deepEqual( l0.getDirection(), [ 0, 0, -1 ] );
                equal( l0.getSpotCutoff(), 90);
                equal( l0.getLightType(), Light.SPOT );

                deepEqual( l0.getAmbient(), [ 0.2, 0.2, 0.2, 1 ] );
                deepEqual( l0.getDiffuse(), [ 0.8, 0.8, 0.8, 1 ] );
                deepEqual( l0.getSpecular(), [ 0.2, 0.2, 0.2, 1 ] );


                equal( l0.getConstantAttenuation(), 1);
                equal( l0.getLinearAttenuation(), 0);
                equal( l0.getQuadraticAttenuation(), 0);


            } )();

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

                q.getOrCreateStateSet().setAttributeAndModes( l0 );
                q.getOrCreateStateSet().setAttributeAndModes( l1 );

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
                var canvas = mockup.createCanvas();
                var viewer = new Viewer( canvas );
                viewer.init();
                var root = new Node();
                var node0 = new Node();
                var node1 = new Node();

                root.addChild( node0 );
                root.addChild( node1 );

                var l0 = new Light();
                l0.setLightNumber( 0 );
                l0.setName( 'enableLight0' );
                node0.getOrCreateStateSet().setAttributeAndModes( l0 );

                var l1 = new Light();
                l1.setLightNumber( 1 );
                l1.setName( 'enableLight1' );

                node1.getOrCreateStateSet().setAttributeAndModes( l1 );
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
                node0.getOrCreateStateSet().setAttributeAndModes( ld1 );

                node1.addChild( q );
                node1.getOrCreateStateSet().setAttributeAndModes( ld0 );
                viewer.frame();

                var cull = viewer.getCamera().getRenderer()._cullVisitor;
                var rs = new RenderStage();
                var sg = new StateGraph();
                cull.pushProjectionMatrix( Matrix.create() );
                cull.pushModelViewMatrix( Matrix.create() );
                cull.setRenderStage( rs );
                cull.setStateGraph( sg );

                root.accept( cull );
                mockup.removeCanvas( canvas );
            } )();

            ok( true, 'check no exception' );
        } );
    };
} );
