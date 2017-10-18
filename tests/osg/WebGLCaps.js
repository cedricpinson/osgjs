import { assert } from 'chai';
import Texture from 'osg/Texture';
import WebGLCaps from 'osg/WebGLCaps';
import mockup from 'tests/mockup/mockup';

export default function() {
    test('WebGLCaps', function() {
        var canvas = mockup.createCanvas(true);
        var gl = canvas.getContext();
        var webglCaps = WebGLCaps.instance(gl);

        webglCaps.getWebGLExtensions().OES_texture_float = true; // eslint-disable-line
        webglCaps._checkRTT[Texture.FLOAT + ',' + Texture.NEAREST] = true;

        var hFloat = webglCaps.hasFloatRTT(gl);
        assert.isOk(hFloat, 'float detect');
    });
}
