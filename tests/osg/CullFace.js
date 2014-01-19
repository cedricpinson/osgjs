define( [
    'tests/mockup/mockup',
    'osg/CullFace',
    'osg/State'
], function ( mockup, CullFace, State ) {

    return function () {

        module( 'osg' );

        test( 'CullFace', function () {

            var n = new CullFace();
            ok( n.getMode() === CullFace.BACK, "Check default mode" );

            var state = new State();
            state.setGraphicContext( mockup.createFakeRenderer() );

            n.apply( state );

            n = new CullFace( CullFace.DISABLE );
            n.apply( state );

            var n2 = new CullFace( 'FRONT' );
            ok( n2.getMode() === CullFace.FRONT, "Check string parameter" );
        } );
    };
} );
