define( [
    'tests/mockup/mockup',
    'osg/State',
    'osg/StateSet',
    'osg/Material',
    'osg/Shader',
    'osg/Program',
    'osg/Texture',
    'osgShader/ShaderGeneratorProxy'
], function ( mockup, State, StateSet, Material, Shader, Program, Texture, ShaderGeneratorProxy ) {

    return function () {

        module( 'osgShader' );

        test( 'ShaderGenerator', function () {


            ( function () {
                var state = new State( new ShaderGeneratorProxy() );
                var fakeRenderer = mockup.createFakeRenderer();
                fakeRenderer.validateProgram = function () {
                    return true;
                };
                fakeRenderer.getProgramParameter = function () {
                    return true;
                };
                fakeRenderer.isContextLost = function () {
                    return false;
                };
                state.setGraphicContext( fakeRenderer );

                var stateSet0 = new StateSet();
                stateSet0.setAttributeAndModes( new Material() );

                var stateSet1 = new StateSet();
                stateSet1.setTextureAttributeAndModes( 0, new Texture( undefined ) );

                state.pushStateSet( stateSet0 );
                state.pushStateSet( stateSet1 );
                state.apply();
                ok( true, 'check not exception on material generator use' );

            } )();

            ( function () {
                var state = new State( new ShaderGeneratorProxy() );
                var fakeRenderer = mockup.createFakeRenderer();
                fakeRenderer.validateProgram = function () {
                    return true;
                };
                fakeRenderer.getProgramParameter = function () {
                    return true;
                };
                fakeRenderer.isContextLost = function () {
                    return false;
                };
                state.setGraphicContext( fakeRenderer );

                var stateSet = new StateSet();

                function getShader() {
                    var vertexshader = [
                        '',
                        'attribute vec3 Vertex;',
                        'varying vec4 position;',
                        'void main(void) {',
                        '  gl_Position = vec4(Vertex,1.0);',
                        '}'
                    ].join( '\n' );

                    var fragmentshader = [
                        '',
                        'precision highp float;',
                        'varying vec4 position;',
                        'void main(void) {',
                        '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
                        '}',
                        ''
                    ].join( '\n' );

                    var program = new Program(
                        new Shader( 'VERTEX_SHADER', vertexshader ),
                        new Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                    program.trackAttributes = {};
                    program.trackAttributes.attributeKeys = [];

                    return program;
                }
                stateSet.setAttributeAndModes( getShader() );


                state.pushStateSet( stateSet );
                state.apply();
                ok( true, 'check not exception on stateset generator use' );

            } )();

        } );
    };
} );
