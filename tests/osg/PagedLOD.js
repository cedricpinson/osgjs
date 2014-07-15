define( [
    'tests/mockup/mockup',
    'osg/Node',
    'osg/Lod',
    'osg/PagedLOD',
    'osg/Shape'
], function ( mockup, Node, Lod, PagedLOD, Shape ) {

    return function () {
        module( 'osg' );

        test( 'PagedLOD', function () {

            var plod = new PagedLOD();
            ok( plod.children.length === 0, 'number of children must be 0' );
            ok( plod.parents.length === 0, 'number of parents must be 0' );
            var n = new Node();
            plod.addChild( n, 0, 200 );
            ok( plod.children.length === 1, 'number of children must be 1' );
            ok( plod._range[ 0 ][ 0 ] === 0, 'range min should be 0' );
            ok( plod._range[ 0 ][ 1 ] === 200, ' range max should be 200' );
        } );

        asyncTest( 'PagedLOD.loadNode', function () {

            var plod = new PagedLOD();
            var fn = function createNode( parent ) {
                var n = new Node();
                return n;
            }
            plod.setFunction( 0, fn );
            plod.setRange( 0, 0, 200 );
            Q.when( plod.loadNode( plod._perRangeDataList[ 0 ], plod ) ).then( function () {
                start();
                ok( plod.children.length === 1, 'node added to plod, must be 1' );
            } ).fail( function ( error ) {
                Notify.error( error );
            } );
        } );

        asyncTest( 'PagedLOD.UserDefinedBound', function () {

            var plod = new PagedLOD();
            // Create a quad of 2x2 with center in 0,0,0
            var fn = function createNode( parent ) {
                var n = Shape.createTexturedQuadGeometry( -1, -1, 0, 2 , 0, 0, 0, 2, 0 );
                return n;
            }
            plod.setFunction( 0, fn );
            plod.setRange( 0, 0, 200 );

            Q.when( plod.loadNode( plod._perRangeDataList[ 0 ], plod ) ).then( function () {
                start();
                console.log( plod.getBound().radius());
                mockup.near( plod.getBound().radius(), 1.4142135623730951, 0.0000001 );
                // Set a USER_DEFINED_CENTER/radius and try again
                plod.setCenter( [ 0, 0, 0 ] );
                plod.setRadius( 10.0 );
                plod.dirtyBound();
                mockup.near( plod.getBound().radius(), 10.0, 0.0000001 );
                // Now test UNION_OF_BOUNDING_SPHERE_AND_USER_DEFINED
                plod.setCenterMode ( Lod.UNION_OF_BOUNDING_SPHERE_AND_USER_DEFINED );
                // move the center, so the user defined bs does not contain the default bs
                plod.setCenter ( [ 10, 10, 10 ] );
                plod.dirtyBound();
                mockup.near ( plod.getBound().radius(), 14.367360819, 0.0000001 );
            } ).fail( function ( error ) {
                Notify.error( error );
            } );
        } );
    };
} );
