import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import CullFace from 'osg/CullFace';
import State from 'osg/State';
import ShaderGeneratorProxy from 'osgShader/ShaderGeneratorProxy';

export default function() {
    test('CullFace', function() {
        var n = new CullFace();
        assert.isOk(n.getMode() === CullFace.BACK, 'Check default mode');

        var state = new State(new ShaderGeneratorProxy());
        state.setGraphicContext(mockup.createFakeRenderer());

        n.apply(state);

        n = new CullFace(CullFace.DISABLE);
        n.apply(state);

        var n2 = new CullFace('FRONT');
        assert.isOk(n2.getMode() === CullFace.FRONT, 'Check string parameter');
    });
}
