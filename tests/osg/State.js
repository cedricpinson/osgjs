define( [
    'qunit',
    'osg/State',
    'osg/StateSet',
    'osg/Material',
    'osg/StateAttribute',
    'osg/Texture',
    'osgShader/ShaderGeneratorProxy',
    'tests/mockup/mockup'
], function ( QUnit, State, StateSet, Material, StateAttribute, Texture, ShaderGeneratorProxy, mockup ) {

    'use strict';

    return function () {

        QUnit.module( 'osg' );

        QUnit.test( 'State', function () {

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

        QUnit.test( 'State setGlobalDefaultTextureAttribute', function () {

            var state = new State( new ShaderGeneratorProxy() );

            var texture = new Texture();
            state.setGlobalDefaultTextureAttribute( 0, texture );

            equal( state.getGlobalDefaultTextureAttribute( 0, 'Texture' ), texture, 'check texture object' );

        } );

        QUnit.test( 'State applyStateSet', function () {

            ( function () {
                var state = new State( new ShaderGeneratorProxy() );
                var fakeRenderer = mockup.createFakeRenderer();
                var id = 0;
                fakeRenderer.createProgram = function () {
                    return id++;
                };
                fakeRenderer.getProgramParameter = function () {
                    return true;
                };

                var textureBindCall = new Map();

                fakeRenderer.bindTexture = function ( target, texture ) {
                    var value = textureBindCall.get( texture );
                    if ( value === undefined )
                        value = 0;
                    value++;
                    textureBindCall.set( texture, value );
                };
                state.setGraphicContext( fakeRenderer );

                var stateSet0 = new StateSet();
                var stateSet1 = new StateSet();
                var stateSet2 = new StateSet();

                stateSet0.setAttributeAndModes( new Material() );

                var texture0 = new Texture();
                texture0.setName('My name is 0');
                texture0.setTextureSize(1,1);
                texture0._textureObject = {
                    bind: function ( gl ) {
                        gl.bindTexture( 0, 1 );
                    }
                };

                stateSet1.setTextureAttributeAndModes( 0, texture0 );

                stateSet2.setTextureAttributeAndModes( 0, texture0 );
                stateSet2.setTextureAttributeAndModes( 1, new Texture() );


                state.pushStateSet( stateSet0 );
                state.applyStateSet( stateSet1 );
                state.applyStateSet( stateSet2 );

                equal( state.getStateSetStackSize(), 1, 'check stateSet stack length' );
                QUnit.notEqual( state.getLastProgramApplied(), undefined, 'check last program applied' );
                equal( state.attributeMap.Program.values().length, 0, 'check program stack length' );

                // check that texture 0 is applied only once
                equal( textureBindCall.get(1), 1, 'check that texture 0 is applied only once');

            } )();
        } );

    };
} );
