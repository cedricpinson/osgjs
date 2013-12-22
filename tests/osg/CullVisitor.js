define( [
    'tests/mockup/mockup',
    'osg/CullVisitor',
    'osg/Node',
    'osg/Camera',
    'osg/RenderStage',
    'osg/StateGraph',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osg/State',
    'osg/StateSet',
    'osg/Viewport',
    'osg/Shape',
    'osg/CullSettings',
    'osg/BoundingBox',
    'osg/Vec3',
    'osg/RenderBin'
], function ( mockup, CullVisitor, Node, Camera, RenderStage, StateGraph, Matrix, MatrixTransform, State, StateSet, Viewport, Shape, CullSettings, BoundingBox, Vec3, RenderBin ) {

    return function () {

        module( 'osg' );

        test( 'CullVisitor', function () {

            var uv = new CullVisitor();

            var root = new Node();
            root.setName( 'a' );
            var b = new Node();
            b.setName( 'b' );
            var c = new Node();
            c.setName( 'c' );
            root.addChild( b );
            b.addChild( c );

            var callb = 0;
            var callc = 0;

            var fb = function () {};
            fb.prototype = {
                cull: function ( node, nv ) {
                    callb = 1;
                    return false;
                }
            };

            var fc = function () {};
            fc.prototype = {
                cull: function ( node, nv ) {
                    callc = 1;
                    return true;
                }
            };

            b.setCullCallback( new fb() );
            c.setCullCallback( new fc() );

            uv.apply( root );

            ok( callb === 1, 'Called b cull callback' );
            ok( callc === 0, 'Did not Call c cull callback as expected' );

            root.setNodeMask( ~0 );
            ok( callb === 1, 'Called b cull callback' );
            ok( callc === 0, 'Did not Call c cull callback as expected' );
        } );


        test( 'CullVisitor 2', function () {

            // check render stage and render bin
            ( function () {
                var camera0 = new Camera();
                camera0.setRenderOrder( Camera.NESTED_RENDER );
                var node0 = new Node();
                var node1 = new Node();
                camera0.addChild( node0 );
                camera0.addChild( node1 );

                var camera1 = new Camera();
                camera1.setRenderOrder( Camera.NESTED_RENDER );
                var node00 = new Node();
                var node10 = new Node();
                camera1.addChild( node00 );
                camera1.addChild( node10 );

                camera0.addChild( camera1 );

                var cull = new CullVisitor();
                var rs = new RenderStage();
                var sg = new StateGraph();
                cull.setRenderStage( rs );
                cull.setStateGraph( sg );

                cull.pushProjectionMatrix( Matrix.makeIdentity( [] ) );
                cull.pushModelviewMatrix( Matrix.makeIdentity( [] ) );
                camera0.accept( cull );

                ok( cull.rootRenderStage === cull.currentRenderBin, 'renderStage should stay the render bin and id ' ); //+ cull.rootRenderStage === cull.currentRenderBin
            } )();


            // check render stage and render bin
            ( function () {
                var state = new State();
                var fakeRenderer = mockup.createFakeRenderer();
                fakeRenderer.validateProgram = function() { return true; };
                fakeRenderer.getProgramParameter = function() { return true; };
                fakeRenderer.isContextLost = function() { return false; };

                state.setGraphicContext( fakeRenderer );
                var camera0 = new Camera();
                camera0.setViewport( new Viewport() );
                camera0.setRenderOrder( Camera.NESTED_RENDER );
                var geom = Shape.createTexturedQuadGeometry( -10 / 2.0, 0, -10 / 2.0,
                    20, 0, 0,
                    0, 0, 20,
                    1, 1 );
                camera0.addChild( geom );


                var cull = new CullVisitor();
                var rs = new RenderStage();
                var sg = new StateGraph();
                rs.setViewport( camera0.getViewport() );

                cull.setRenderStage( rs );
                cull.setStateGraph( sg );

                cull.pushProjectionMatrix( Matrix.makeIdentity( [] ) );
                cull.pushModelviewMatrix( Matrix.makeIdentity( [] ) );
                cull.pushStateSet( new StateSet() );

                camera0.accept( cull );

                ok( cull.rootRenderStage === cull.currentRenderBin, 'renderStage should stay the render bin and id ' ); // + cull.rootRenderStage === cull.currentRenderBin);

                rs.draw( state );
            } )();


            // check the computation of nearfar
            ( function () {
                var camera0 = new Camera();

                var mt = new MatrixTransform();
                mt.setMatrix( Matrix.makeTranslate( 0, 0, 10 ) );
                var geom = Shape.createTexturedQuadGeometry( -5.0, -5, 0,
                    10, 0, 0,
                    0, 10, 0,
                    1, 1 );
                mt.addChild( geom );
                camera0.addChild( mt );

                camera0.setViewMatrix( Matrix.makeLookAt( [ -10, 0, 10 ], [ 0, 0, 10 ], [ 0, 1, 0 ], [] ) );
                camera0.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 1.0, 1000.0, [] ) );

                var stack = [];

                function setCullSettings( settings ) {
                    if ( this._computedNear !== undefined ) {
                        stack.push( [ this._computedNear, this._computedFar ] );
                    }
                    CullSettings.prototype.setCullSettings.call( this, settings );
                }
                var resultProjection;

                function popProjectionMatrix() {
                    resultProjection = this._projectionMatrixStack[ this._projectionMatrixStack.length - 1 ];
                    CullVisitor.prototype.popProjectionMatrix.call( this );
                }
                CullVisitor.prototype.setCullSettings = setCullSettings;
                var cull = new CullVisitor();
                var rs = new RenderStage();
                var sg = new StateGraph();
                cull.popProjectionMatrix = popProjectionMatrix;
                cull.setRenderStage( rs );
                cull.setStateGraph( sg );

                cull.pushProjectionMatrix( Matrix.makeIdentity( [] ) );
                cull.pushModelviewMatrix( Matrix.makeIdentity( [] ) );

                camera0.accept( cull );
                var supposedProjection = [ 1.299038105676658, 0, 0, 0, 0, 1.7320508075688774, 0, 0, 0, 0, -1.9423076923076918, -1, 0, 0, -14.417307692307686, 0 ];
                ok( mockup.check_near( stack[ 1 ][ 0 ], 5 ), 'near should be 5.0 and is ' + stack[ 1 ][ 0 ] );
                ok( mockup.check_near( stack[ 1 ][ 1 ], 15 ), 'near should be 15.0 and is ' + stack[ 1 ][ 1 ] );
                ok( mockup.check_near( resultProjection, supposedProjection ), 'check projection matrix [' + resultProjection.toString() + '] [' + supposedProjection.toString() + ']' );
            } )();

            // check the computation of nearfar with camera in position that it reverses near far
            ( function () {
                var camera0 = new Camera();

                var mt = new MatrixTransform();
                mt.setMatrix( Matrix.makeTranslate( 0, 0, 10 ) );
                var geom = Shape.createTexturedQuadGeometry( -5.0, -5, 0,
                    10, 0, 0,
                    0, 10, 0,
                    1, 1 );
                mt.addChild( geom );
                camera0.addChild( mt );

                camera0.setViewMatrix( Matrix.makeLookAt( [ 0, 0, 20 ], [ 0, 0, 10 ], [ 0, 1, 0 ], [] ) );
                camera0.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 1.0, 1000.0 ) );

                var stack = [];

                function setCullSettings( settings ) {
                    if ( this._computedNear !== undefined ) {
                        stack.push( [ this._computedNear, this._computedFar ] );
                    }
                    CullSettings.prototype.setCullSettings.call( this, settings );
                }
                CullVisitor.prototype.setCullSettings = setCullSettings;

                var resultProjection;

                function popProjectionMatrix() {
                    resultProjection = this._projectionMatrixStack[ this._projectionMatrixStack.length - 1 ];
                    CullVisitor.prototype.popProjectionMatrix.call( this );
                }

                var supposedProjection = [ 1.299038105676658, 0, 0, 0, 0, 1.7320508075688774, 0, 0, 0, 0, -49.999750101250868, -1, 0, 0, -499.79750101250352, 0 ];
                var cull = new CullVisitor();
                var rs = new RenderStage();
                var sg = new StateGraph();
                cull.popProjectionMatrix = popProjectionMatrix;
                cull.setRenderStage( rs );
                cull.setStateGraph( sg );

                cull.pushProjectionMatrix( Matrix.makeIdentity( [] ) );
                cull.pushModelviewMatrix( Matrix.makeIdentity( [] ) );

                camera0.accept( cull );
                ok( mockup.check_near( stack[ 1 ][ 0 ], 10 ), 'near should be 10 and is ' + stack[ 1 ][ 0 ] );
                ok( mockup.check_near( stack[ 1 ][ 1 ], 10 ), 'near should be 10 and is ' + stack[ 1 ][ 1 ] );
                ok( mockup.check_near( resultProjection, supposedProjection ), 'check projection matrix [' + resultProjection.toString() + '] [' + supposedProjection.toString() + ']' );

            } )();


            ( function () {
                var camera0 = new Camera();

                var geom = Shape.createTexturedQuadGeometry( -5.0, -5, 0,
                    10, 0, 0,
                    0, 10, 0,
                    1, 1 );
                geom.getBoundingBox = function () {
                    var bb = new BoundingBox();
                    bb._min = [ -6131940, -6297390, -6356750 ];
                    bb._max = [ 6353000, 6326310, 6317430 ];
                    return bb;
                };
                camera0.addChild( geom );


                var eye = [ -8050356.805171473, 5038241.363464848, 5364184.10053209 ];
                var target = [ 110530, 14460, -19660 ];

                //        var d_far = 15715646.446620844;
                //        var d_near = 6098715.042224069;

                //var matrixOffset = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 9520443.940837447, 0, 0, 0, -9539501.699646605, 1];
                // var projectionResult = [
                //      0.9742785792574936, 0, 0, 0,
                //      0, 1.7320508075688774, 0, 0,
                //      0, 0, -2.1890203449875116, -1,
                //      0, 0, -19059947.8295044, 0];

                // osg
                //      var projectionResult = [0.9742785792574936, 0, 0, 0, 0, 1.7320508075688774, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -2.0020020020020022, 0]


                var d_far = 21546781.959391922;
                var d_near = 267579.84430311248;
                //      var bbmax = [6353000, 6326310, 6317430];
                //      var bbmin = [-6131940, -6297390, -6356750];
                //      var bbCornerFar = 1;
                //      var bbCornerNear = 6;

                camera0.setViewMatrix( Matrix.makeLookAt( Vec3.add( eye, target, [] ), target, [ 0, 0, 1 ], [] ) );
                camera0.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 450, 1.0, 1000.0, [] ) );

                var stack = [];

                function setCullSettings( settings ) {
                    if ( this._computedNear !== undefined ) {
                        stack.push( [ this._computedNear, this._computedFar ] );
                    }
                    CullSettings.prototype.setCullSettings.call( this, settings );
                }
                CullVisitor.prototype.setCullSettings = setCullSettings;

                var resultProjection;

                function popProjectionMatrix() {
                    resultProjection = this._projectionMatrixStack[ this._projectionMatrixStack.length - 1 ];
                    CullVisitor.prototype.popProjectionMatrix.call( this );
                }

                var supposedProjection = [
                    0.97427857925749362, 0, 0, 0,
                    0, 1.7320508075688774, 0, 0,
                    0, 0, -1.0241512629639544, -1,
                    0, 0, -530789.63819638337, 0
                ];
                var cull = new CullVisitor();
                var rs = new RenderStage();
                var sg = new StateGraph();
                cull.popProjectionMatrix = popProjectionMatrix;
                cull.setRenderStage( rs );
                cull.setStateGraph( sg );

                cull.pushProjectionMatrix( Matrix.makeIdentity( [] ) );
                cull.pushModelviewMatrix( Matrix.makeIdentity( [] ) );

                camera0.accept( cull );
                ok( mockup.check_near( stack[ 1 ][ 0 ], d_near, 0.8 ), 'near should be ' + d_near + ' and is ' + stack[ 1 ][ 0 ] );
                ok( mockup.check_near( stack[ 1 ][ 1 ], d_far, 0.8 ), 'near should be ' + d_far + ' and is ' + stack[ 1 ][ 1 ] );
                ok( mockup.check_near( resultProjection, supposedProjection, 0.8 ), 'check projection matrix [' + resultProjection.toString() + '] [' + supposedProjection.toString() + ']' );

            } )();


            ( function () {

                var q = Shape.createTexturedBoxGeometry( 0, 0, 0, 1, 1, 1 );

                var node3 = new MatrixTransform();
                node3.setMatrix( Matrix.makeTranslate( 0, 0, 20, [] ) );
                node3.getOrCreateStateSet().setRenderBinDetails( 1, '' );
                node3.getOrCreateStateSet().setName( 'Node3' );
                node3.addChild( q );

                var node0 = new MatrixTransform();
                node0.setMatrix( Matrix.makeTranslate( 0, 0, -10, [] ) );
                node0.getOrCreateStateSet().setRenderBinDetails( 0, 'DepthSortedBin' );
                node0.getOrCreateStateSet().setName( 'Node0' );
                node0.addChild( q );

                var node1 = new MatrixTransform();
                node1.setMatrix( Matrix.makeTranslate( 0, 0, 5, [] ) );
                node1.getOrCreateStateSet().setName( 'Node1' );
                node1.addChild( q );

                var node2 = new MatrixTransform();
                node2.setMatrix( Matrix.makeTranslate( 0, 0, -20, [] ) );
                node2.getOrCreateStateSet().setRenderBinDetails( 0, 'RenderBin' );
                node2.getOrCreateStateSet().setName( 'Node2' );
                node2.addChild( q );

                node3.addChild( node0 );
                node0.addChild( node1 );
                node1.addChild( node2 );

                var cull = new CullVisitor();
                var rs = new RenderStage();
                var sg = new StateGraph();
                cull.pushProjectionMatrix( Matrix.makeIdentity( [] ) );
                cull.pushModelviewMatrix( Matrix.makeIdentity( [] ) );
                cull.setRenderStage( rs );
                cull.setStateGraph( sg );
                cull.setComputeNearFar( false );

                node3.accept( cull );
                rs.sort();

                ok( rs._bins[ '0' ]._leafs[ 2 ].depth === -15, 'Check depth of leaf 0' );
                ok( rs._bins[ '0' ]._leafs[ 1 ].depth === -10, 'Check depth of leaf 1' );
                ok( rs._bins[ '0' ]._leafs[ 0 ].depth === 5, 'Check depth of leaf 2' );
                ok( rs._bins[ '0' ]._sortMode === RenderBin.SORT_BACK_TO_FRONT, 'Check RenderBin sort mode' );

            } )();


            ( function () {

                var q = Shape.createTexturedBoxGeometry( 0, 0, 0, 1, 1, 1 );

                var node0 = new MatrixTransform();
                node0.setMatrix( Matrix.makeTranslate( 0, 0, -10, [] ) );
                node0.getOrCreateStateSet().setRenderingHint( 'OPAQUE_BIN' );
                node0.getOrCreateStateSet().setName( 'Node0' );
                node0.addChild( q );

                var node1 = new MatrixTransform();
                node1.setMatrix( Matrix.makeTranslate( 0, 0, 5, [] ) );
                node0.getOrCreateStateSet().setRenderingHint( 'TRANSPARENT_BIN' );
                node1.getOrCreateStateSet().setName( 'Node1' );
                node1.addChild( q );

                var root = new Node();
                root.addChild( node1 );
                root.addChild( node0 );

                var cull = new CullVisitor();
                var rs = new RenderStage();
                var sg = new StateGraph();
                cull.pushProjectionMatrix( Matrix.makeIdentity( [] ) );
                cull.pushModelviewMatrix( Matrix.makeIdentity( [] ) );
                cull.setRenderStage( rs );
                cull.setStateGraph( sg );
                cull.setComputeNearFar( false );

                root.accept( cull );
                rs.sort();

                ok( rs._bins[ '10' ]._leafs[ 0 ].depth === 10, 'Check transparent bin' );
                ok( rs._bins[ '10' ].getStateGraphList().length === 0, 'Check transparent bin StateGraphList' );
                ok( rs._leafs.length === 0, 'Check leafs for normal rendering bin' );
                ok( rs.getStateGraphList().length === 1, 'Check StateGraphList for normal rendering bin' );

            } )();


            ( function () {

                var q = Shape.createTexturedBoxGeometry( 0, 0, 0, 1, 1, 1 );

                var node0 = new MatrixTransform();
                node0.setMatrix( Matrix.makeTranslate( 0, 0, -10, [] ) );
                node0.getOrCreateStateSet().setRenderingHint( 'OPAQUE_BIN' );
                node0.getOrCreateStateSet().setName( 'Node0' );
                node0.addChild( q );

                var node1 = new MatrixTransform();
                node1.setMatrix( Matrix.makeTranslate( 0, 0, 5, [] ) );
                node0.getOrCreateStateSet().setRenderingHint( 'TRANSPARENT_BIN' );
                node1.getOrCreateStateSet().setName( 'Node1' );
                node1.addChild( q );

                var root = new Node();
                root.addChild( node1 );
                root.addChild( node0 );

                var cull = new CullVisitor();
                var rs = new RenderStage();
                var sg = new StateGraph();
                rs.setViewport( new Viewport() );
                cull.pushProjectionMatrix( Matrix.makeIdentity( [] ) );
                cull.pushModelviewMatrix( Matrix.makeIdentity( [] ) );
                cull.setRenderStage( rs );
                cull.setStateGraph( sg );
                cull.setComputeNearFar( false );

                root.accept( cull );
                rs.sort();

                var state = new State();
                var fakeRenderer = mockup.createFakeRenderer();
                fakeRenderer.validateProgram = function() { return true; };
                fakeRenderer.getProgramParameter = function() { return true; };
                fakeRenderer.isContextLost = function() { return false; };
                state.setGraphicContext( fakeRenderer );

                rs.draw( state );

            } )();
        } );
    };
} );
