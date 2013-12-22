define( [
    'osg/State',
    'osg/StateSet',
    'osg/Material',
    'osg/StateAttribute'
], function ( State, StateSet, Material, StateAttribute ) {

    return function () {

        module( 'osg' );

        test( 'State', function () {

            ( function () {
                var state = new State();

                var stateSet0 = new StateSet();
                var stateSet1 = new StateSet();
                var stateSet2 = new StateSet();
                stateSet0.setAttributeAndMode( new Material() );
                stateSet1.setAttributeAndMode( new Material(), StateAttribute.OVERRIDE );
                stateSet2.setAttributeAndMode( new Material(), StateAttribute.OFF );

                state.pushStateSet( stateSet0 );
                state.pushStateSet( stateSet1 );
                state.pushStateSet( stateSet2 );
                ok( state.attributeMap.Material[ state.attributeMap.Material.length - 1 ] === state.attributeMap.Material[ state.attributeMap.Material.length - 2 ], 'check Override in state' );
            } )();
        } );
    };
} );
