import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import Depth from 'osg/Depth';
import State from 'osg/State';
import ShaderGeneratorProxy from 'osgShader/ShaderGeneratorProxy';

export default function() {
    test('Depth', function() {
        var n = new Depth();
        assert.isOk(n._near === 0.0, 'Check near');
        assert.isOk(n._far === 1.0, 'Check far');
        assert.isOk(n._func === Depth.LESS, 'Check function');
        assert.isOk(n._writeMask === true, 'Check write mask');

        var state = new State(new ShaderGeneratorProxy());
        state.setGraphicContext(mockup.createFakeRenderer());

        n.apply(state);

        n = new Depth(Depth.DISABLE);
        n.apply(state);
    });
}
