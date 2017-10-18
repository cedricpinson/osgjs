import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import TextureCubeMap from 'osg/TextureCubeMap';
import Texture from 'osg/Texture';
import State from 'osg/State';
import ReaderParser from 'osgDB/readerParser';
import ShaderGeneratorProxy from 'osgShader/ShaderGeneratorProxy';

export default function() {
    test('TextureCubeMap', function() {
        var greyscale = ReaderParser.readImage('mockup/greyscale.png', {
            promise: false
        });

        var state = new State(new ShaderGeneratorProxy());
        state.setGraphicContext(mockup.createFakeRenderer());

        var texture = new TextureCubeMap();
        texture.setImage('TEXTURE_CUBE_MAP_POSITIVE_X', greyscale, Texture.ALPHA);
        texture.setImage('TEXTURE_CUBE_MAP_NEGATIVE_X', greyscale, Texture.ALPHA);
        texture.setImage('TEXTURE_CUBE_MAP_POSITIVE_Y', greyscale, Texture.ALPHA);
        texture.setImage('TEXTURE_CUBE_MAP_NEGATIVE_Y', greyscale, Texture.ALPHA);
        texture.setImage('TEXTURE_CUBE_MAP_POSITIVE_Z', greyscale, Texture.ALPHA);
        texture.setImage('TEXTURE_CUBE_MAP_NEGATIVE_Z', greyscale, Texture.ALPHA);

        texture.apply(state);

        assert.isOk(
            texture.getImage(Texture.TEXTURE_CUBE_MAP_POSITIVE_X) !== undefined,
            'Check positive x'
        );
        assert.isOk(
            texture.getImage(Texture.TEXTURE_CUBE_MAP_NEGATIVE_X) !== undefined,
            'Check negative x'
        );

        assert.isOk(
            texture.getImage(Texture.TEXTURE_CUBE_MAP_POSITIVE_Y) !== undefined,
            'Check positive y'
        );
        assert.isOk(
            texture.getImage(Texture.TEXTURE_CUBE_MAP_NEGATIVE_Y) !== undefined,
            'Check negative y'
        );

        assert.isOk(
            texture.getImage(Texture.TEXTURE_CUBE_MAP_POSITIVE_Z) !== undefined,
            'Check positive z'
        );
        assert.isOk(
            texture.getImage(Texture.TEXTURE_CUBE_MAP_NEGATIVE_Z) !== undefined,
            'Check negative z'
        );
    });
}
