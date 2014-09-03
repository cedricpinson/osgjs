define( [
    'tests/mockup/mockup',
    'osgUtil/IntersectionVisitor',
    'osgUtil/LineSegmentIntersector',
    'osg/KdTreeBuilder',
    'osg/Camera',
    'osg/Viewport',
    'osg/Matrix',
    'osg/Shape',
    'osgViewer/View',
    'osgDB/ReaderParser',
    'vendors/Q'
], function ( mockup, IntersectionVisitor, LineSegmentIntersector, KdTreeBuilder, Camera, Viewport, Matrix, Shape, View, ReaderParser, Q ) {

    return function () {

        module( 'osgUtil' );

        test( 'LineSegmentIntersector without kdtree', function () {

            var camera = new Camera();
            camera.setViewport( new Viewport() );
            camera.setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], [] ) );
            camera.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );
            var scene = Shape.createTexturedQuadGeometry( -0.5, -0.5, 0, 1, 0, 0, 0, 1, 0, 1, 1 );
            camera.addChild( scene );
            var lsi = new LineSegmentIntersector();
            lsi.set ( [ 400, 300, 0.0 ], [ 400, 300, 1.0 ] );
            var iv = new IntersectionVisitor();
            iv.setIntersector( lsi );
            camera.accept( iv );
            ok( lsi._intersections.length === 1, 'Hits should be 1 and result is ' + lsi._intersections.length );
            ok( lsi._intersections[ 0 ].nodepath.length === 2, 'NodePath should be 2 and result is ' + lsi._intersections[ 0 ].nodepath.length );

        } );

        asyncTest( 'LineSegmentIntersector without kdtree', function () {

            var view = new View();
            view.getCamera().setViewport( new Viewport() );
            view.getCamera().setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ] ), [] );
            view.getCamera().setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );
            var promise = ReaderParser.parseSceneGraph( mockup.getScene() );
            Q.when( promise ).then( function ( quad ) {
                view.setSceneData( quad );

                var result = view.computeIntersections( 400, 300 );
                ok( result.length === 1, 'Hits should be 1 and result is ' + result.length );
                start();
            } );
        } );

        test( 'LineSegmentIntersector with kdtree', function () {
            // This test will never work with kdtree
            var camera = new Camera();
            camera.setViewport( new Viewport() );
            camera.setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], [] ) );
            camera.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );
            var scene = Shape.createTexturedQuadGeometry( -0.5, -0.5, 0, 1, 0, 0, 0, 1, 0, 1, 1 );
            camera.addChild( scene );
            var treeBuilder = new KdTreeBuilder( {
                _numVerticesProcessed: 0,
                _targetNumTrianglesPerLeaf: 1,
                _maxNumLevels: 20
            } );
            treeBuilder.apply( scene );

            var lsi = new LineSegmentIntersector();
            lsi.set ( [ 400, 300, 0.0 ], [ 400, 300, 1.0 ] );
            var iv = new IntersectionVisitor();
            iv.setIntersector( lsi );
            camera.accept( iv );
            ok( lsi._intersections.length === 1, 'Intersections should be 1 and result is ' + lsi._intersections.length );
            ok( lsi._intersections[ 0 ].nodepath.length === 2, 'NodePath should be 2 and result is ' + lsi._intersections[ 0 ].nodepath.length );
        } );

        asyncTest( 'LineSegmentIntersector with kdtree', function () {

            var view = new View();
            view.getCamera().setViewport( new Viewport() );
            view.getCamera().setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ] ), [] );
            view.getCamera().setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );
            var promise = ReaderParser.parseSceneGraph( mockup.getScene() );
            Q.when( promise ).then( function ( mockup ) {
                view.setSceneData( mockup );

                var treeBuilder = new KdTreeBuilder( {
                    _numVerticesProcessed: 0,
                    _targetNumTrianglesPerLeaf: 50,
                    _maxNumLevels: 20
                } );
                treeBuilder.apply( mockup );

                var result = view.computeIntersections( 400, 300 );
                ok( result.length === 1, 'Hits should be 1 and result is ' + result.length );
                start();
            } );
        } );

    };
} );