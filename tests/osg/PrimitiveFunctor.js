define( [
    'osg/Utils',
    'tests/mockup/mockup',
    'osg/PrimitiveFunctor',
    'osg/PrimitiveSet',
    'osg/DrawElements',
    'osg/DrawArrays',
    'osg/Geometry',
    'osg/BufferArray',
    'osg/Vec3'
], function ( MACROUTILS, mockup, PrimitiveFunctor, PrimitiveSet, DrawElements, DrawArrays, Geometry, BufferArray, Vec3 ) {

    return function () {

        module( 'osg' );


        test( 'PrimitiveFunctor Points', function () {
            // Test DrawArrays
            var node = createGeometry( PrimitiveSet.POINTS, 0 ); 
            var vertices = node.getAttributes().Vertex.getElements();
            // The callback must be defined as a closure
            var vectors = [];
            var cb = function(  ) {
                    return {
                        operatorPoint : function ( v ) {
                           vectors.push ( v[ 0 ] );
                           vectors.push ( v[ 1 ] );
                           vectors.push ( v[ 2 ] );
                        }
                    }
            };
            var pf = new PrimitiveFunctor( node, cb , vertices );
            pf.apply();
            mockup.near ( vertices, vectors , 0.00001);
            // Test DrawElements
            node = createGeometry( PrimitiveSet.POINTS, 1 );
            pf = new PrimitiveFunctor( node, cb , vertices );
            vectors = [];
            pf.apply();
            ok( vectors[ 0 ] === -2.0, 'Vectors[ 0 ] should be -2 and result is ' + vectors[ 0 ] );
            ok( vectors[ 1 ] === 2.0, 'Vectors[ 1 ] should be 2 and result is ' + vectors[ 1 ] );
            ok( vectors[ 2 ] === 0.0, 'Vectors[ 2 ] should be 0 and result is ' + vectors[ 2 ] );
            ok( vectors[ 3 ] === 0.0, 'Vectors[ 3 ] should be 0 and result is ' + vectors[ 3 ] );
            ok( vectors[ 4 ] === 0.0, 'Vectors[ 4 ] should be 0 and result is ' + vectors[ 4 ] );
            ok( vectors[ 5 ] === 0.0, 'Vectors[ 5 ] should be 0 and result is ' + vectors[ 5 ] );
            ok( vectors[ 6 ] === 2.0, 'Vectors[ 6 ] should be 2 and result is ' + vectors[ 6 ] );
            ok( vectors[ 7 ] === 2.0, 'Vectors[ 7 ] should be 2 and result is ' + vectors[ 7 ] );
            ok( vectors[ 8 ] === 0.0, 'Vectors[ 8 ] should be 0 and result is ' + vectors[ 8 ] );
        } );


        test( 'PrimitiveFunctor Lines', function () {
            // Test DrawArrays
            var node = createGeometry( PrimitiveSet.LINES, 0 ); 
            var vertices = node.getAttributes().Vertex.getElements();
            // The callback must be defined as a closure
            var vectors = [];
            var cb = function(  ) {
                    return {
                        operatorLine : function ( v1, v2 ) {
                            vectors.push ( v1 );
                            vectors.push ( v2 );
                        }
                    }
            };
            var pf = new PrimitiveFunctor( node, cb , vertices );
            pf.apply();
            mockup.near ( vectors[ 0 ], [ 0, 0 ,0 ] );
            mockup.near ( vectors[ 1 ], [ 2, 2 ,0 ] );
            // Test DrawElements
            node = createGeometry( PrimitiveSet.LINES, 1 );
            pf = new PrimitiveFunctor( node, cb , vertices );

            vectors = [];
            pf.apply();
            mockup.near ( vectors[ 0 ], [ -2.0, 2.0 ,0 ] );
            mockup.near ( vectors[ 1 ], [ 0, 0 ,0 ] );
        } );

        test( 'PrimitiveFunctor LineStrip', function () {
            // Test DrawArrays
            var node = createGeometry( PrimitiveSet.LINE_STRIP, 0 ); 
            var vertices = node.getAttributes().Vertex.getElements();
            // The callback must be defined as a closure
            var vectors = [];
            var cb = function(  ) {
                    return {
                        operatorLine : function ( v1, v2 ) {
                            vectors.push ( Vec3.copy ( v1, Vec3.create() ) );
                            vectors.push ( Vec3.copy ( v2, Vec3.create() ) );
                        }
                    }
            };
            var pf = new PrimitiveFunctor( node, cb , vertices );
            pf.apply();
            mockup.near ( vectors[ 0 ], [ 0, 0 ,0 ] );
            mockup.near ( vectors[ 1 ], [ 2, 2 ,0 ] );
            mockup.near ( vectors[ 2 ], [ 2, 2 ,0 ] );
            mockup.near ( vectors[ 3 ], [ -2, 2 ,0 ] );
            // Test DrawElements
            node = createGeometry( PrimitiveSet.LINE_STRIP, 1 );
            pf = new PrimitiveFunctor( node, cb , vertices );

            vectors = [];
            pf.apply();
            mockup.near ( vectors[ 0 ], [ -2.0, 2.0 ,0 ] );
            mockup.near ( vectors[ 1 ], [ 0, 0 ,0 ] );
            mockup.near ( vectors[ 2 ], [ 0, 0 ,0 ] );
            mockup.near ( vectors[ 3 ], [ 2, 2 ,0 ] );
        } );

        test( 'PrimitiveFunctor LineLoop', function () {
            // Test DrawArrays
            var node = createGeometry( PrimitiveSet.LINE_LOOP, 0 ); 
            var vertices = node.getAttributes().Vertex.getElements();
            // The callback must be defined as a closure
            var vectors = [];
            var cb = function(  ) {
                    return {
                        operatorLine : function ( v1, v2 ) {
                            vectors.push ( Vec3.copy ( v1, Vec3.create() ) );
                            vectors.push ( Vec3.copy ( v2, Vec3.create() ) );
                        }
                    }
            };
            var pf = new PrimitiveFunctor( node, cb , vertices );
            pf.apply();
            mockup.near ( vectors[ 0 ], [ 0, 0 ,0 ] );
            mockup.near ( vectors[ 1 ], [ 2, 2 ,0 ] );
            mockup.near ( vectors[ 2 ], [ 2, 2 ,0 ] );
            mockup.near ( vectors[ 3 ], [ -2, 2 ,0 ] );
            mockup.near ( vectors[ 4 ], [ -2, 2 ,0 ] );
            mockup.near ( vectors[ 5 ], [ 0, 0 ,0 ] );
            // Test DrawElements
            node = createGeometry( PrimitiveSet.LINE_LOOP, 1 );
            pf = new PrimitiveFunctor( node, cb , vertices );

            vectors = [];
            pf.apply();
            mockup.near ( vectors[ 0 ], [ -2.0, 2.0 ,0 ] );
            mockup.near ( vectors[ 1 ], [ 0, 0 ,0 ] );
            mockup.near ( vectors[ 2 ], [ 0, 0 ,0 ] );
            mockup.near ( vectors[ 3 ], [ 2, 2 ,0 ] );
            mockup.near ( vectors[ 4 ], [ 2, 2 ,0 ] );
            mockup.near ( vectors[ 5 ], [ -2.0, 2.0 ,0 ] );
        } );

        test( 'PrimitiveFunctor Triangle', function () {
            // Test DrawArrays
            var node = createGeometry( PrimitiveSet.TRIANGLES, 0 ); 
            var vertices = node.getAttributes().Vertex.getElements();
            // The callback must be defined as a closure
            var vectors = [];
            var cb = function(  ) {
                    return {
                        operatorTriangle : function ( v1, v2, v3 ) {
                            vectors.push ( Vec3.copy ( v1, Vec3.create() ) );
                            vectors.push ( Vec3.copy ( v2, Vec3.create() ) );
                            vectors.push ( Vec3.copy ( v3, Vec3.create() ) );
                        }
                    }
            };
            var pf = new PrimitiveFunctor( node, cb , vertices );
            pf.apply();
            mockup.near ( vectors[ 0 ], [ 0, 0 ,0 ] );
            mockup.near ( vectors[ 1 ], [ 2, 2 ,0 ] );
            mockup.near ( vectors[ 2 ], [ -2, 2 ,0 ] );
            // Test DrawElements
            node = createGeometry( PrimitiveSet.TRIANGLES, 1 );
            pf = new PrimitiveFunctor( node, cb , vertices );

            vectors = [];
            pf.apply();
            mockup.near ( vectors[ 0 ], [ -2.0, 2.0 ,0 ] );
            mockup.near ( vectors[ 1 ], [ 0, 0 ,0 ] );
            mockup.near ( vectors[ 2 ], [ 2.0, 2.0 ,0 ] );
        } );


        var createGeometry = function( primitiveType, arraysOrElements )
        {
            var g = new Geometry();
            var vertexes = new MACROUTILS.Float32Array( 9 );
            vertexes[ 0 ] = 0;
            vertexes[ 1 ] = 0;
            vertexes[ 2 ] = 0;

            vertexes[ 3 ] = 2.0;
            vertexes[ 4 ] = 2.0;
            vertexes[ 5 ] = 0.0;

            vertexes[ 6 ] = -2.0;
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

            var indexes = new MACROUTILS.Uint16Array( 3 );
            indexes[ 0 ] = 2;
            indexes[ 1 ] = 0;
            indexes[ 2 ] = 1;


            g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
            g.getAttributes().Normal = new BufferArray( BufferArray.ARRAY_BUFFER, normal, 3 );
            var primitive;
            if ( arraysOrElements === 0 ) // Arrays
            {
                primitive = new DrawArrays( primitiveType , 0, vertexes.length/3 );
            } else {
                primitive = new DrawElements( primitiveType, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ) );
            }
            g.getPrimitives().push( primitive );
            return g;
        }

    };
} );
