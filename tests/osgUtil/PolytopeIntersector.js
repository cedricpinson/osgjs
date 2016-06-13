'use strict';
var assert = require( 'chai' ).assert;
var MACROUTILS = require( 'osg/Utils' );
var IntersectionVisitor = require( 'osgUtil/IntersectionVisitor' );
var PolytopeIntersector = require( 'osgUtil/PolytopeIntersector' );
var Camera = require( 'osg/Camera' );
var Viewport = require( 'osg/Viewport' );
var Matrix = require( 'osg/Matrix' );
var Geometry = require( 'osg/Geometry' );
var BufferArray = require( 'osg/BufferArray' );
var DrawElements = require( 'osg/DrawElements' );
var DrawArrays = require( 'osg/DrawArrays' );
var PrimitiveSet = require( 'osg/PrimitiveSet' );


module.exports = function () {

    test( 'PolytopeIntersector intersectPoints', function () {

        var camera = new Camera();
        camera.setViewport( new Viewport() );
        camera.setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], [] ) );
        camera.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );

        var scene = createPoints();
        camera.addChild( scene );
        var pi = new PolytopeIntersector();

        // xMin, yMin, xMax, yMax
        pi.setPolytopeFromWindowCoordinates( 395, 295, 405, 305 );
        var iv = new IntersectionVisitor();
        iv.setIntersector( pi );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 1, 'Hits should be 1 and result is ' + pi._intersections.length );
        assert.isOk( pi._intersections[ 0 ].nodePath.length === 2, 'NodePath should be 2 and result is ' + pi._intersections[ 0 ].nodePath.length );
        assert.isOk( pi._intersections[ 0 ]._numPoints === 1, 'numPoints should be 1 and result is ' + pi._intersections[ 0 ]._numPoints );
        assert.equalVector( pi._intersections[ 0 ]._points[ 0 ], [ 0.0, 0.0, 0.0 ] );
        pi.reset();
        // Test also setPolytope method, we do a bigger polytope so all the points should be inside
        pi.setPolytope( [
            [ 1.0, 0.0, 0.0, -350 ],
            [ -1.0, 0.0, 0.0, 450 ],
            [ 0.0, 1.0, 0.0, -250 ],
            [ 0.0, -1.0, 0.0, 350 ],
            [ 0.0, 0.0, 1.0, 0.0 ]
        ] );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 3, 'Hits should be 3 and result is ' + pi._intersections.length );
        assert.isOk( pi._intersections[ 0 ].nodePath.length === 2, 'NodePath should be 2 and result is ' + pi._intersections[ 0 ].nodePath.length );
        assert.equalVector( pi._intersections[ 0 ]._points[ 0 ], [ -0.2, 0.2, 0 ] );
        assert.equalVector( pi._intersections[ 1 ]._points[ 0 ], [ 0.0, 0.0, 0 ] );
        assert.equalVector( pi._intersections[ 2 ]._points[ 0 ], [ 0.2, 0.2, 0 ] );
        pi.reset();
        // Test also setPolytope method, we do a bigger polytope so all the points should be inside
        pi.setPolytope( [
            [ 1.0, 0.0, 0.0, -350 ],
            [ -1.0, 0.0, 0.0, 450 ],
            [ 0.0, 1.0, 0.0, -250 ],
            [ 0.0, -1.0, 0.0, 350 ],
            [ 0.0, 0.0, 1.0, 0.0 ]
        ] );
        pi.setIntersectionLimit( PolytopeIntersector.LIMIT_ONE );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 1, 'Hits should be 1 and result is ' + pi._intersections.length );
        // Test dimension mask
        pi.reset();
        pi.setDimensionMask( PolytopeIntersector.DimOne );
        pi.setIntersectionLimit( PolytopeIntersector.LIMIT_ONE );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 0, 'Hits should be 0 and result is ' + pi._intersections.length );

        pi.reset();
        pi.setDimensionMask( PolytopeIntersector.DimZero );
        pi.setIntersectionLimit( PolytopeIntersector.LIMIT_ONE );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 1, 'Hits should be 1 and result is ' + pi._intersections.length );

    } );

    test( 'PolytopeIntersector intersectLines', function () {

        var camera = new Camera();
        camera.setViewport( new Viewport() );
        camera.setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], [] ) );
        camera.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );

        var scene = createLines( PrimitiveSet.LINES );
        camera.addChild( scene );
        var pi = new PolytopeIntersector();

        pi.setPolytopeFromWindowCoordinates( 395, 295, 405, 305 );
        var iv = new IntersectionVisitor();
        iv.setIntersector( pi );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 1, 'Hits should be 1 and result is ' + pi._intersections.length );
        assert.isOk( pi._intersections[ 0 ].nodePath.length === 2, 'NodePath should be 2 and result is ' + pi._intersections[ 0 ].nodePath.length );
        assert.isOk( pi._intersections[ 0 ]._numPoints === 3, 'numPoints should be 3 and result is ' + pi._intersections[ 0 ]._numPoints );
        assert.equalVector( pi._intersections[ 0 ]._center, [ -0.06415, 0.06415, 0 ] );
        assert.equalVector( pi._intersections[ 0 ]._points[ 0 ], [ -0.096225, 0.096225, 0 ] );
        assert.equalVector( pi._intersections[ 0 ]._points[ 1 ], [ -0.096225, 0.096225, 0 ] );
        assert.equalVector( pi._intersections[ 0 ]._points[ 2 ], [ 0.0, 0.0, 0.0 ] );
        // Test dimension masks
        pi.reset();
        pi.setDimensionMask( PolytopeIntersector.DimZero );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 0, 'Hits should be 0 and result is ' + pi._intersections.length );
        pi.reset();
        pi.setDimensionMask( PolytopeIntersector.DimOne );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 1, 'Hits should be 1 and result is ' + pi._intersections.length );
    } );

    test( 'PolytopeIntersector intersectLineStrip', function () {

        var camera = new Camera();
        camera.setViewport( new Viewport() );
        camera.setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], [] ) );
        camera.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );

        var scene = createLines( PrimitiveSet.LINE_STRIP );
        camera.addChild( scene );
        var pi = new PolytopeIntersector();

        pi.setPolytopeFromWindowCoordinates( 395, 295, 405, 305 );
        var iv = new IntersectionVisitor();
        iv.setIntersector( pi );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 2, 'Hits should be 2 and result is ' + pi._intersections.length );
        assert.isOk( pi._intersections[ 0 ].nodePath.length === 2, 'NodePath should be 2 and result is ' + pi._intersections[ 0 ].nodePath.length );
        assert.equalVector( pi._intersections[ 0 ]._center, [ -0.06415, 0.06415, 0 ] );
    } );

    test( 'PolytopeIntersector intersectTriangle', function () {

        var camera = new Camera();
        camera.setViewport( new Viewport() );
        camera.setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], [] ) );
        camera.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );

        var scene = createTriangle();
        camera.addChild( scene );
        var pi = new PolytopeIntersector();

        pi.setPolytopeFromWindowCoordinates( 395, 295, 405, 305 );
        var iv = new IntersectionVisitor();
        iv.setIntersector( pi );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 1, 'Hits should be 1 and result is ' + pi._intersections.length );
        assert.isOk( pi._intersections[ 0 ].nodePath.length === 2, 'NodePath should be 2 and result is ' + pi._intersections[ 0 ].nodePath.length );
        assert.isOk( pi._intersections[ 0 ]._numPoints === 4, 'numPoints should be 4 and result is ' + pi._intersections[ 0 ]._numPoints );
        assert.equalVector( pi._intersections[ 0 ]._points[ 0 ], [ 0.096225, 0.096225, 0 ] );
        assert.equalVector( pi._intersections[ 0 ]._points[ 1 ], [ -0.096225, 0.096225, 0 ] );
        assert.equalVector( pi._intersections[ 0 ]._points[ 2 ], [ -0.096225, 0.096225, 0 ] );
        assert.equalVector( pi._intersections[ 0 ]._points[ 3 ], [ 0.096225, 0.096225, 0 ] );
        // Test dimension mask
        pi.reset();
        pi.setDimensionMask( PolytopeIntersector.DimZero );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 0, 'Hits should be 0 and result is ' + pi._intersections.length );
        // Test polytope going trough the triangle without containing any point of it
        pi.reset();
        pi.setDimensionMask( PolytopeIntersector.AllDims );
        pi.setPolytopeFromWindowCoordinates( 415, 305, 416, 306 );
        camera.accept( iv );
        assert.isOk( pi._intersections.length === 1, 'Hits should be 1 and result is ' + pi._intersections.length );
    } );

    var createPoints = function () {

        var g = new Geometry();

        var vertexes = new MACROUTILS.Float32Array( 9 );
        vertexes[ 0 ] = 0;
        vertexes[ 1 ] = 0;
        vertexes[ 2 ] = 0;

        vertexes[ 3 ] = 0.2;
        vertexes[ 4 ] = 0.2;
        vertexes[ 5 ] = 0.0;

        vertexes[ 6 ] = -0.2;
        vertexes[ 7 ] = 0.2;
        vertexes[ 8 ] = 0.0;

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

        var indexes = new MACROUTILS.Uint16Array( 3 );
        indexes[ 0 ] = 2;
        indexes[ 1 ] = 0;
        indexes[ 2 ] = 1;


        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
        g.getAttributes().Normal = new BufferArray( BufferArray.ARRAY_BUFFER, normal, 3 );

        //var primitive = new DrawArrays( PrimitiveSet.POINTS , 0, vertexes.length/3 );
        var primitive = new DrawElements( PrimitiveSet.POINTS, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ) );
        g.getPrimitives().push( primitive );
        return g;
    };

    var createLines = function ( lineType ) {
        var g = new Geometry();
        var vertexes = new MACROUTILS.Float32Array( 12 );
        vertexes[ 0 ] = -2.0;
        vertexes[ 1 ] = 2.0;
        vertexes[ 2 ] = 0.0;

        vertexes[ 3 ] = 0.0;
        vertexes[ 4 ] = 0.0;
        vertexes[ 5 ] = 0.0;

        vertexes[ 6 ] = 2.0;
        vertexes[ 7 ] = 2.0;
        vertexes[ 8 ] = 0.0;

        vertexes[ 9 ] = 4.0;
        vertexes[ 10 ] = 0.0;
        vertexes[ 11 ] = 0.0;

        var normal = new MACROUTILS.Float32Array( 12 );
        normal[ 0 ] = 0;
        normal[ 1 ] = 0;
        normal[ 2 ] = 1;

        normal[ 3 ] = 0;
        normal[ 4 ] = 0;
        normal[ 5 ] = 1;

        normal[ 6 ] = 0;
        normal[ 7 ] = 0;
        normal[ 8 ] = 1;

        normal[ 9 ] = 0;
        normal[ 10 ] = 0;
        normal[ 11 ] = 1;

        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
        g.getAttributes().Normal = new BufferArray( BufferArray.ARRAY_BUFFER, normal, 3 );

        var primitive = new DrawArrays( lineType, 0, vertexes.length / 3 );
        g.getPrimitives().push( primitive );
        return g;
    };

    var createTriangle = function () {
        var g = new Geometry();
        var vertexes = new MACROUTILS.Float32Array( 9 );
        vertexes[ 0 ] = -2.0;
        vertexes[ 1 ] = 2.0;
        vertexes[ 2 ] = 0.0;

        vertexes[ 3 ] = 0.0;
        vertexes[ 4 ] = 0.0;
        vertexes[ 5 ] = 0.0;

        vertexes[ 6 ] = 2.0;
        vertexes[ 7 ] = 2.0;
        vertexes[ 8 ] = 0.0;


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

        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
        g.getAttributes().Normal = new BufferArray( BufferArray.ARRAY_BUFFER, normal, 3 );

        var primitive = new DrawArrays( PrimitiveSet.TRIANGLES, 0, vertexes.length / 3 );
        g.getPrimitives().push( primitive );
        return g;
    };

};
