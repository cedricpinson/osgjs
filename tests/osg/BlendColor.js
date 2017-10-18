import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import BlendColor from 'osg/BlendColor';
import State from 'osg/State';
import ShaderGeneratorProxy from 'osgShader/ShaderGeneratorProxy';

export default function() {
    test('BlendColor', function() {
        var n = new BlendColor();
        assert.isOk(
            n.getConstantColor()[0] === 1.0 &&
                n.getConstantColor()[1] === 1.0 &&
                n.getConstantColor()[2] === 1.0 &&
                n.getConstantColor()[3] === 1.0,
            'Check default constantColor'
        );

        n.setConstantColor([0, 0.5, 0, 0.5]);
        assert.isOk(
            n.getConstantColor()[0] === 0.0 &&
                n.getConstantColor()[1] === 0.5 &&
                n.getConstantColor()[2] === 0.0 &&
                n.getConstantColor()[3] === 0.5,
            'Check set constant color'
        );

        var state = new State(new ShaderGeneratorProxy());
        state.setGraphicContext(mockup.createFakeRenderer());

        n.apply(state);
    });
}
