define( [
    'osg/Depth',
    'osg/State'
], function ( Depth, State ) {

    return function () {

        module( 'Depth' );

        test( 'Test Depth', function () {

            var n = new Depth();
            ok( n._near === 0.0, 'Check near' );
            ok( n._far === 1.0, 'Check far' );
            ok( n._func === Depth.LESS, 'Check function' );
            ok( n._writeMask === true, 'Check write mask' );

            var state = new State();
            state.setGraphicContext( createFakeRenderer() );

            n.apply( state );

            n = new Depth( Depth.DISABLE );
            n.apply( state );
        } );
    };
} );