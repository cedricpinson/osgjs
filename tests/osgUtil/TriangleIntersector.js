'use strict';
var assert = require( 'chai' ).assert;
var TriangleIntersector = require( 'osgUtil/TriangleIntersector' );
var Vec3 = require( 'osg/Vec3' );
var Shape = require( 'osg/Shape' );
var DrawElements = require( 'osg/DrawElements' );
var DrawArrays = require( 'osg/DrawArrays' );
var PrimitiveSet = require( 'osg/PrimitiveSet' );
var BufferArray = require( 'osg/BufferArray' );
var Geometry = require( 'osg/Geometry' );


module.exports = function () {

    test( 'TriangleIntersector', function () {

        var checkPrimitive = function ( geom, msg ) {
            var ti = new TriangleIntersector();
            var start = [ 0.4, 0.2, -2.0 ];
            var end = [ 0.4, 0.2, 0.5 ];
            var dir = Vec3.sub( end, start, [] );
            ti.set( start, end );

            ti.apply( geom );
            assert.isOk( ti._intersections.length === 1, msg + ' Intersections should be 1 and result is ' + ti._intersections.length );
            var result = [ 0.4, 0.2, 0 ];
            var found = Vec3.add( start,
                Vec3.mult( dir, ti._intersections[ 0 ].ratio, [] ), [] );
            assert.equalVector( found, result, 1e-4 );

            var ti2 = new TriangleIntersector();
            ti2.set( [ 1.5, 0.2, -0.5 ], [ 1.5, 0.2, 0.5 ] );
            ti2.apply( geom );
            assert.isOk( ti2._intersections.length === 0, msg + ' Intersections should be 0 ' + ti2._intersections.length );
        };

        ( function () {
            // triangles
            var quad = Shape.createTexturedQuadGeometry( 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1 );
            checkPrimitive( quad, 'Triangles indexed' );
        } )();

        ( function () {
            var quad = Shape.createTexturedQuadGeometry( 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1 );

            var indexes = [];
            indexes[ 0 ] = 0;
            indexes[ 1 ] = 1;
            indexes[ 2 ] = 3;
            indexes[ 3 ] = 2;

            var primitive = new DrawElements( PrimitiveSet.TRIANGLE_STRIP, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ) );
            quad.getPrimitives()[ 0 ] = primitive;
            checkPrimitive( quad, 'TriangleStrip indexed' );
        } )();


        ( function () {
            var quad = Shape.createTexturedQuadGeometry( 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1 );

            var indexes = [];
            indexes[ 0 ] = 0;
            indexes[ 1 ] = 1;
            indexes[ 2 ] = 2;
            indexes[ 3 ] = 3;

            var primitive = new DrawElements( PrimitiveSet.TRIANGLE_FAN, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ) );
            quad.getPrimitives()[ 0 ] = primitive;
            checkPrimitive( quad, 'TriangleFan indexed' );
        } )();


        ( function () {
            var cornerx = 0,
                cornery = 0,
                cornerz = 0;
            var wx = 1,
                wy = 0,
                wz = 0;
            var hx = 0,
                hy = 1,
                hz = 0;
            var quad = new Geometry();

            var vertexes = [];
            vertexes[ 0 ] = cornerx + hx;
            vertexes[ 1 ] = cornery + hy;
            vertexes[ 2 ] = cornerz + hz;

            vertexes[ 3 ] = cornerx;
            vertexes[ 4 ] = cornery;
            vertexes[ 5 ] = cornerz;

            vertexes[ 6 ] = cornerx + wx;
            vertexes[ 7 ] = cornery + wy;
            vertexes[ 8 ] = cornerz + wz;

            vertexes[ 9 ] = cornerx + hx;
            vertexes[ 10 ] = cornery + hy;
            vertexes[ 11 ] = cornerz + hz;

            vertexes[ 12 ] = cornerx + wx;
            vertexes[ 13 ] = cornery + wy;
            vertexes[ 14 ] = cornerz + wz;

            vertexes[ 15 ] = cornerx + wx + hx;
            vertexes[ 16 ] = cornery + wy + hy;
            vertexes[ 17 ] = cornerz + wz + hz;

            quad.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
            var primitive = new DrawArrays( PrimitiveSet.TRIANGLES, 0, 6 );
            quad.getPrimitives().push( primitive );
            checkPrimitive( quad, 'Triangles not indexed' );
        } )();


        ( function () {
            var cornerx = 0,
                cornery = 0,
                cornerz = 0;
            var wx = 1,
                wy = 0,
                wz = 0;
            var hx = 0,
                hy = 1,
                hz = 0;
            var quad = new Geometry();

            var vertexes = [];
            vertexes[ 0 ] = cornerx + hx;
            vertexes[ 1 ] = cornery + hy;
            vertexes[ 2 ] = cornerz + hz;

            vertexes[ 3 ] = cornerx;
            vertexes[ 4 ] = cornery;
            vertexes[ 5 ] = cornerz;

            vertexes[ 6 ] = cornerx + wx + hx;
            vertexes[ 7 ] = cornery + wy + hy;
            vertexes[ 8 ] = cornerz + wz + hz;

            vertexes[ 9 ] = cornerx + wx;
            vertexes[ 10 ] = cornery + wy;
            vertexes[ 11 ] = cornerz + wz;

            quad.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
            var primitive = new DrawArrays( PrimitiveSet.TRIANGLE_STRIP, 0, 4 );
            quad.getPrimitives().push( primitive );
            checkPrimitive( quad, 'TriangleStrip not indexed' );
        } )();

        ( function () {
            var cornerx = 0,
                cornery = 0,
                cornerz = 0;
            var wx = 1,
                wy = 0,
                wz = 0;
            var hx = 0,
                hy = 1,
                hz = 0;
            var quad = new Geometry();

            var vertexes = [];
            vertexes[ 0 ] = cornerx + hx;
            vertexes[ 1 ] = cornery + hy;
            vertexes[ 2 ] = cornerz + hz;

            vertexes[ 3 ] = cornerx;
            vertexes[ 4 ] = cornery;
            vertexes[ 5 ] = cornerz;

            vertexes[ 6 ] = cornerx + wx;
            vertexes[ 7 ] = cornery + wy;
            vertexes[ 8 ] = cornerz + wz;

            vertexes[ 9 ] = cornerx + wx + hx;
            vertexes[ 10 ] = cornery + wy + hy;
            vertexes[ 11 ] = cornerz + wz + hz;

            quad.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
            var primitive = new DrawArrays( PrimitiveSet.TRIANGLE_FAN, 0, 4 );
            quad.getPrimitives().push( primitive );
            checkPrimitive( quad, 'TriangleFan not indexed' );
        } )();

    } );

};
