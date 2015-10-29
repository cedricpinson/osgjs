define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/Light',
    'osg/LightSource',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osg/Node',
    'osg/Notify',
    'osg/Shape',
    'osg/Timer',
    'osgViewer/Viewer',
    'osgShadow/ShadowMap',
    'osgShadow/ShadowedScene',
    'osgShadow/ShadowSettings',
], function ( QUnit, mockup, Light, LightSource, Matrix, MatrixTransform, Node, Notify, Shape, Timer, Viewer, ShadowMap, ShadowedScene, ShadowSettings ) {

    'use strict';

    return function () {

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

            addScene( root, 20, false, false );

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
            console.log( 'perf Main Cullvisitor scene  Loop is: ' + ( timed / nCount ).toFixed() + ' ms' );
            ok( false, 'perf Main Loop CullVisitor is: ' + ( timed / nCount ).toFixed() + ' ms' );
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

            addScene( root, 20, false, true );

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

            console.log( 'perf Main CullVisitor Loop scene + culling is: ' + ( timed / nCount ).toFixed() + ' ms' );
            ok( false, 'perf is: ' + ( timed / nCount ).toFixed() + ' ms' );
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

            addScene( root, 20, true, true );

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

            console.log( 'perf Main CullVisitor Loop scene + shadow Loop is: ' + ( timed / nCount ).toFixed() + ' ms' );
            ok( false, 'perf is: ' + ( timed / nCount ).toFixed() + ' ms' );
        } );
    };
} );
