define( [
    'osg/State',
    'osg/StateSet',
    'osg/Material',
    'osg/StateAttribute',
    'osg/Texture',
    'osgShader/ShaderGeneratorProxy',
    'tests/mockup/mockup'
], function ( State, StateSet, Material, StateAttribute, Texture, ShaderGeneratorProxy, mockup ) {

    return function () {

        module( 'osg' );

        test( 'State', function () {

            ( function () {
                var state = new State( new ShaderGeneratorProxy() );

                var stateSet0 = new StateSet();
                var stateSet1 = new StateSet();
                var stateSet2 = new StateSet();
                stateSet0.setAttributeAndModes( new Material() );
                stateSet1.setAttributeAndModes( new Material(), StateAttribute.OVERRIDE );
                stateSet2.setAttributeAndModes( new Material(), StateAttribute.OFF );

                state.pushStateSet( stateSet0 );
                state.pushStateSet( stateSet1 );
                state.pushStateSet( stateSet2 );
                var materialStack = state.attributeMap.Material;
                ok( materialStack[ materialStack.length - 1 ] === materialStack[ materialStack.length - 2 ], 'check Override in state' );
            } )();
        } );


        test( 'State applyStateSet', function () {

            ( function () {
                var state = new State( new ShaderGeneratorProxy() );
                var fakeRenderer = mockup.createFakeRenderer();
                var id = 0;
                fakeRenderer.createProgram = function() { return id++; };
                fakeRenderer.getProgramParameter = function() { return true; };
                state.setGraphicContext( fakeRenderer );

                var stateSet0 = new StateSet();
                var stateSet1 = new StateSet();
                var stateSet2 = new StateSet();

                stateSet0.setAttributeAndModes( new Material() );
                stateSet1.setTextureAttributeAndModes( 0, new Texture() );
                stateSet2.setTextureAttributeAndModes( 1, new Texture() );


                state.pushStateSet( stateSet0 );
                state.applyStateSet( stateSet1 );
                state.applyStateSet( stateSet2 );

                equal( state.getStateSetStackSize(), 1, 'check stateSet stack length' );
                notEqual( state.getLastProgramApplied(), undefined, 'check last program applied' );
                equal( state.attributeMap.Program.values().length, 0, 'check program stack length' );
            } )();
        } );


    };
} );
