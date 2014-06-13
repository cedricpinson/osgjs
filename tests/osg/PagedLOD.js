define( [
    'osg/Node',
    'osg/PagedLOD',
], function ( Node, PagedLOD ) {

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
    };
} );
