define( [
    'osg/Vec2'
], function ( Vec2 ) {

    return function () {

        module( 'osg' );

        test( 'Vec2', function () {

            ( function () {
                var a = [ 2, 3 ];
                var b = [];
                deepEqual( Vec2.copy( a, b ), a, 'test copy operation' );
            } )();

            ( function () {
                ok( Vec2.valid( [ 'a', 0 ] ) === false, 'is invalid' );
                ok( Vec2.valid( [ 0, 'a' ] ) === false, 'is invalid' );
                ok( Vec2.valid( [ 0, 2 ] ) === true, 'is invalid' );
            } )();

            ( function () {
                deepEqual( Vec2.mult( [ 2, 4 ], 2.0, [] ), [ 4, 8 ], 'test mult' );
            } )();

            ( function () {
                deepEqual( Vec2.length2( [ 2, 4 ] ), 20, 'test length2' );
            } )();

            ( function () {
                deepEqual( Vec2.length( [ 2, 4 ] ), Math.sqrt( 20 ), 'test length' );
            } )();

            ( function () {
                deepEqual( Vec2.normalize( [ 2, 4 ], [] ), [ 0.4472135954999579, 0.8944271909999159 ], 'test normalize' );
                deepEqual( Vec2.normalize( [ 0, 0 ], [] ), [ 0.0, 0.0 ], 'test normalize' );
            } )();

            ( function () {
                deepEqual( Vec2.dot( [ 2, 4 ], [ 2, 4 ] ), 20, 'test dot product' );
            } )();

            ( function () {
                deepEqual( Vec2.sub( [ 2, 4 ], [ 2, 4 ], [] ), [ 0, 0 ], 'test sub' );
            } )();

            ( function () {
                deepEqual( Vec2.add( [ -2, -4 ], [ 2, 4 ], [] ), [ 0, 0 ], 'test add' );
            } )();

            ( function () {
                deepEqual( Vec2.neg( [ -2, -4 ], [] ), [ 2, 4 ], 'test neg' );
            } )();
        } );
    };
} );
