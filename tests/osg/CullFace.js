define( [
    'tests/mockup/mockup',
    'osg/CullFace',
    'osg/State',
    'osgShader/ShaderGeneratorProxy'
], function ( mockup, CullFace, State, ShaderGeneratorProxy ) {

    return function () {

        module( 'osg' );

        test( 'CullFace', function () {

            var n = new CullFace();
            ok( n.getMode() === CullFace.BACK, "Check default mode" );

            var state = new State( new ShaderGeneratorProxy() );
            state.setGraphicContext( mockup.createFakeRenderer() );

            n.apply( state );

            n = new CullFace( CullFace.DISABLE );
            n.apply( state );

            var n2 = new CullFace( 'FRONT' );
            ok( n2.getMode() === CullFace.FRONT, "Check string parameter" );
        } );
    };
} );
