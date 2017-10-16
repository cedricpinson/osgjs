import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import State from 'osg/State';
import StateSet from 'osg/StateSet';
import Material from 'osg/Material';
import Shader from 'osg/Shader';
import Program from 'osg/Program';
import Texture from 'osg/Texture';
import ShaderGeneratorProxy from 'osgShader/ShaderGeneratorProxy';

export default function() {
    test('ShaderGenerator', function() {
        (function() {
            var state = new State(new ShaderGeneratorProxy());
            var fakeRenderer = mockup.createFakeRenderer();
            fakeRenderer.validateProgram = function() {
                return true;
            };
            fakeRenderer.getProgramParameter = function() {
                return true;
            };
            fakeRenderer.isContextLost = function() {
                return false;
            };
            state.setGraphicContext(fakeRenderer);

            var stateSet0 = new StateSet();
            stateSet0.setAttributeAndModes(new Material());

            var stateSet1 = new StateSet();
            stateSet1.setTextureAttributeAndModes(0, new Texture(undefined));

            state.pushStateSet(stateSet0);

            state.applyStateSet(stateSet1);

            assert.isOk(true, 'check not exception on material generator use');
        })();

        (function() {
            var state = new State(new ShaderGeneratorProxy());
            var fakeRenderer = mockup.createFakeRenderer();
            fakeRenderer.validateProgram = function() {
                return true;
            };
            fakeRenderer.getProgramParameter = function() {
                return true;
            };
            fakeRenderer.isContextLost = function() {
                return false;
            };
            state.setGraphicContext(fakeRenderer);

            var stateSet = new StateSet();

            function getShader() {
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
                    new Shader('FRAGMENT_SHADER', fragmentshader)
                );

                program.setTrackAttributes({});
                program.getTrackAttributes().attributeKeys = [];

                return program;
            }
            stateSet.setAttributeAndModes(getShader());

            state.applyStateSet(stateSet);
            assert.isOk(true, 'check not exception on stateset generator use');
        })();
    });
}
