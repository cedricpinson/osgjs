define( [
    'osg/Utils',
    'tests/mockup/mockup',
    'osgUtil/IntersectionVisitor',
    'osgUtil/PolytopeIntersector',
    'osg/Camera',
    'osg/Viewport',
    'osg/Matrix',
    'osgViewer/View',
    'osgDB/ReaderParser',
    'osg/Shape',
    'osg/Geometry',
    'osg/BufferArray',
    'osg/DrawElements',
    'osg/PrimitiveSet',
    'vendors/Q'
], function ( MACROUTILS, mockup, IntersectionVisitor, PolytopeIntersector, Camera, Viewport, Matrix, View, ReaderParser, Shape, Geometry, BufferArray, DrawElements, PrimitiveSet, Q ) {
 
 return function () {

        module( 'osgUtil' );

        test( 'PolytopeIntersector intersectPoints', function () {

            var camera = new Camera();
            camera.setViewport( new Viewport() );
            camera.setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], [] ) );
            camera.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );

            var scene = createPoints();
            camera.addChild( scene );
            var pi = new PolytopeIntersector();

            //pi.setPolytope( [ [ 1.0 , 0.0, 0.0, -395 ], [-1.0, 0.0 , 0.0, 405 ], [ 0.0, 1.0, 0.0, -295 ], [ 0.0, -1.0, 0.0, 305 ] , [ 0.0, 0.0, 1.0, 0.0 ] ] );
            // xMin, yMin, xMax, yMax
            pi.setPolytopeFromWindowCoordinates( 395, 295, 405, 305 );
            var iv = new IntersectionVisitor();
            iv.setIntersector( pi );
            camera.accept( iv );
            ok( pi._intersections.length === 1, 'Hits should be 1 and result is ' + pi._intersections.length );
            ok( pi._intersections[ 0 ].nodePath.length === 2, 'NodePath should be 2 and result is ' + pi._intersections[ 0 ].nodePath.length );
            pi.reset();
            pi.setPolytope( [ [ 1.0 , 0.0, 0.0, -350 ], [-1.0, 0.0 , 0.0, 450 ], [ 0.0, 1.0, 0.0, -250 ], [ 0.0, -1.0, 0.0, 350 ] , [ 0.0, 0.0, 1.0, 0.0 ] ] );
            camera.accept( iv );
            ok( pi._intersections.length === 3, 'Hits should be 3 and result is ' + pi._intersections.length );
            ok( pi._intersections[ 0 ].nodePath.length === 2, 'NodePath should be 2 and result is ' + pi._intersections[ 0 ].nodePath.length );
        } );
    
    var createPoints = function ( ) {

        var g = new Geometry();

        var vertexes = new MACROUTILS.Float32Array( 9 );
        vertexes[ 0 ] = 0;
        vertexes[ 1 ] = 0;
        vertexes[ 2 ] = 0;

        vertexes[ 3 ] = 0.2;
        vertexes[ 4 ] = 0.0;
        vertexes[ 5 ] = 0.0;

        vertexes[ 6 ] = -0.2;
        vertexes[ 7 ] =  0.0;
        vertexes[ 8 ] =  0.0;

        var normal = new MACROUTILS.Float32Array( 9 );
        normal[ 0 ] = 0;
        normal[ 1 ] = 0;
        normal[ 2 ] = 1;

        normal[ 3 ] = 0;
        normal[ 4 ] = 0;
        normal[ 5 ] = 1;

        normal[ 6 ] = 0;
        normal[ 7 ] = 0;
        normal[ 8 ] = 1;

        var indexes = new MACROUTILS.Uint16Array( 6 );
        indexes[ 0 ] = 0;
        indexes[ 1 ] = 1;
        indexes[ 2 ] = 2;

        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
        g.getAttributes().Normal = new BufferArray( BufferArray.ARRAY_BUFFER, normal, 3 );

        var primitive = new DrawElements( PrimitiveSet.POINTS , new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ) );
        g.getPrimitives().push( primitive );
        return g;
    };
    };
} );