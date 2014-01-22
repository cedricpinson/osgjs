define( [
    'tests/mockup/mockup',
    'osgUtil/IntersectVisitor',
    'osg/Matrix',
    'osg/Vec3',
    'osg/Shape',
    'osg/DrawElements',
    'osg/DrawArrays',
    'osg/PrimitiveSet',
    'osg/BufferArray',
    'osg/Geometry',
    'osg/KdTree'
], function ( mockup, IntersectVisitor, Matrix, Vec3, Shape, DrawElements, DrawArrays, PrimitiveSet, BufferArray, Geometry, KdTree ) {

    return function () {

        module( 'osg' );

        test( 'KdTree', function () {

            var createTrianglesIndexed = function () {
                // triangles
                var quad = Shape.createTexturedQuadGeometry( 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1 );

                return quad;
            };

            var createTriangleStripIndex = function () {
                var quad = Shape.createTexturedQuadGeometry( 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1 );

                var indexes = [];
                indexes[ 0 ] = 0;
                indexes[ 1 ] = 1;
                indexes[ 2 ] = 3;
                indexes[ 3 ] = 2;

                var primitive = new DrawElements( PrimitiveSet.TRIANGLE_STRIP, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ) );
                quad.getPrimitives()[ 0 ] = primitive;

                return quad;
            };

            var createTriangleFanIndexed = function () {
                var quad = Shape.createTexturedQuadGeometry( 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1 );

                var indexes = [];
                indexes[ 0 ] = 0;
                indexes[ 1 ] = 1;
                indexes[ 2 ] = 2;
                indexes[ 3 ] = 3;

                var primitive = new DrawElements( PrimitiveSet.TRIANGLE_FAN, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ) );
                quad.getPrimitives()[ 0 ] = primitive;

                return quad;
            };

            var createTrianglesNotIndexed = function () {
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

                return quad;
            };

            var createTriangleStripNotIndexed = function () {
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

                return quad;
            };

            var createTriangleFanNotIndexed = function () {
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

                return quad;
            };

            createGeometry = function () {
                var geom1 = createTrianglesIndexed();
                var geom2 = createTrianglesNotIndexed();
                var geom3 = createTriangleStripIndex();
                var geom4 = createTriangleStripNotIndexed();
                var geom5 = createTriangleFanIndexed();
                var geom6 = createTriangleFanNotIndexed();

                var geoms = [ geom1, geom2, geom3, geom4, geom5, geom6 ];
                var nbGeom = geoms.length;

                var geomTotal = new Geometry();
                var primitives = geomTotal.getPrimitives();
                var vertices = [];

                var i = 0;
                var j = 0;
                for ( var i = 0; i < nbGeom; ++i ) {
                    var geo = geoms[ i ];
                    var prim = geo.getPrimitives()[ 0 ];
                    var offset = vertices.length / 3;
                    if ( prim.getIndices ) {
                        var indices = prim.indices.getElements();
                        var nbPrim = indices.length;
                        for ( var j = 0; j < nbPrim; ++j )
                            indices[ j ] += offset;
                    } else
                        prim.first = offset;
                    primitives.push( geo.getPrimitives()[ 0 ] );

                    var verts = geo.getAttributes().Vertex.getElements();
                    var nbVerts = verts.length;
                    for ( var j = 0; j < nbVerts; ++j )
                        vertices.push( verts[ j ] );
                }
                geomTotal.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertices, 3 );
                return geomTotal;
            }

            var geomTotal = createGeometry();
            var nbPrimitives = geomTotal.getPrimitives().length;

            var kdTree = new KdTree();
            kdTree.build( {
                _numVerticesProcessed: 0,
                _targetNumTrianglesPerLeaf: 3,
                _maxNumLevels: 20
            }, geomTotal );
            var start = [ 0.4, 0.2, -2.0 ];
            var end = [ 0.4, 0.2, 0.5 ];

            var hits = [];
            kdTree.intersect( start, end, hits, [] );
            console.log( hits )

            ok( hits.length === nbPrimitives, ' Hits should be 1 and result is ' + hits.length );
            var result = [ 0.4, 0.2, 0 ];
            var dir = Vec3.sub( end, start, [] );
            var found = Vec3.add( start, Vec3.mult( dir, hits[ 0 ].ratio, [] ), [] );
            mockup.near( found, result, 1e-4 );

            hits.length = 0;
            kdTree.intersect( [ 1.5, 0.2, -0.5 ], [ 1.5, 0.2, 0.5 ], hits, [] );
            ok( hits.length === 0, ' Hits should be 0 ' + hits.length );
        } );
    };
} );