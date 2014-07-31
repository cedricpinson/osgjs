define( [
    'tests/mockup/mockup',
    'osg/State',
    'osg/StateSet',
    'osg/Material',
    'osg/Shader',
    'osg/Program',
    'osg/Texture'
], function ( mockup, State, StateSet, Material, Shader, Program, Texture ) {

    return function () {

        module( 'osg' );

        test( 'ShaderGenerator', function () {


            ( function () {
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
                ok( true, 'check not exception on material generator use' );

            } )();

            ( function () {
                var state = new State();
                var fakeRenderer = mockup.createFakeRenderer();
                fakeRenderer.validateProgram = function() { return true; };
                fakeRenderer.getProgramParameter = function() { return true; };
                fakeRenderer.isContextLost = function() { return false; };
                state.setGraphicContext( fakeRenderer );

                var stateSet = new StateSet();

                function getShader()
                {
                    var vertexshader = [
                        '',
                        'attribute vec3 Vertex;',
                        'varying vec4 position;',
                        'void main(void) {',
                        '  gl_Position = vec4(Vertex,1.0);',
                        '}'
                    ].join('\n');

                    var fragmentshader = [
                        '',
                        'precision highp float;',
                        'varying vec4 position;',
                        'void main(void) {',
                        '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
                        '}',
                        ''
                    ].join('\n');

                    var program = new Program(
                        new Shader('VERTEX_SHADER', vertexshader),
                        new Shader('FRAGMENT_SHADER', fragmentshader));

                    program.trackAttributes = {};
                    program.trackAttributes.attributeKeys = [];

                    return program;
                }
                stateSet.setAttributeAndMode( getShader() );


                state.pushStateSet( stateSet );
                state.apply();
                ok( true, 'check not exception on stateset generator use' );

            } )();

            ( function () {
                var state = new State();
                var fakeRenderer = mockup.createFakeRenderer();
                fakeRenderer.validateProgram = function() { return true; };
                fakeRenderer.getProgramParameter = function() { return true; };
                fakeRenderer.isContextLost = function() { return false; };
                state.setGraphicContext( fakeRenderer );

                var stateSet = new StateSet();
                var material = new Material();

                stateSet.setAttributeAndMode( material );
                stateSet.setTextureAttributeAndMode( 0, new Texture( undefined ) );


                state.pushStateSet( stateSet );
                state.apply();

                var frag = state.programs[0].object.fragment.text;


                ok( frag.indexOf('vec4 tmp_7; vec3 tmp_8; vec4 tmp_9; vec3 normal; vec3 eyeVector; vec3 tmp_16; vec3 tmp_17; vec3 tmp_18; vec4 tmp_19; float tmp_20 = 2.4; vec3 tmp_21;') !== -1, 'check shader generated fragment for material' );
                var uniforms  = state.programs[0].object.foreignUniforms;

                 ok( uniforms.length === 0, 'check shader generated uniform for material' );
                // get and check shader generated

            } )();
        } );
    };
} );
