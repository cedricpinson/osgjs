define( [
    'tests/mockup/mockup',
    'osg/State',
    'osg/StateSet',
    'osg/Material',
    'osg/Texture'
], function ( mockup, State, StateSet, Material, Texture ) {

    return function () {

        module( 'osg' );

        test( 'ShaderGenerator', function () {
            var state = new State();
            var fakeRenderer = mockup.createFakeRenderer();
            fakeRenderer.validateProgram = function() { return true; };
            fakeRenderer.getProgramParameter = function() { return true; };
            fakeRenderer.isContextLost = function() { return false; };
            state.setGraphicContext( fakeRenderer );

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
