define( [
    'osg/State',
    'osg/StateSet',
    'osg/Material',
    'osg/Texture'
], function ( State, StateSet, Material, Texture ) {

    return function () {

        module( 'ShaderGenerator' );

        test( 'Test ShaderGenerator', function () {
            var state = new State();
            state.setGraphicContext( createFakeRenderer() );

            var stateSet0 = new StateSet();
            stateSet0.setAttributeAndMode( new Material() );

            var stateSet1 = new StateSet();
            stateSet1.setTextureAttributeAndMode( 0, new Texture( undefined ) );

            state.pushStateSet( stateSet0 );
            state.pushStateSet( stateSet1 );
            state.apply();
            ok( true, 'check not exception' );
        } );
    };
} );