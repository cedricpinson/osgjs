import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import Texture from 'osg/Texture';
import State from 'osg/State';
import ShaderGeneratorProxy from 'osgShader/ShaderGeneratorProxy';
import Input from 'osgDB/Input';

export default function() {
    test('Texture', function(done) {
        this.timeout(20000);

        var input = new Input();
        var textureFromURL = new Texture();
        input
            .readImageURL(
                '"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII="'
            )
            .then(function(image) {
                textureFromURL.setImage(image);
            });
        assert.isOk(textureFromURL !== undefined, 'Check textureFromURL');
        var ready;
        var loadingComplete = function() {
            loadingComplete.nbLoad--;
            if (loadingComplete.nbLoad === 0) {
                ready();
            }
        };
        loadingComplete.nbLoad = 0;
        loadingComplete.addRessource = function() {
            loadingComplete.nbLoad++;
        };
        var image;
        var loadTexture = function(name, format) {
            loadingComplete.addRessource();
            var texture = new Texture();
            image = new Image();
            image.onload = function() {
                texture.setImage(image, format);
                loadingComplete();
            };
            image.src = name;
            return texture;
        };

        var greyscale;
        ready = function() {
            var cnv = document.createElement('canvas');
            cnv.setAttribute('width', 128);
            cnv.setAttribute('height', 128);
            var tcanvas = new Texture();
            tcanvas.setImage(cnv);

            var gl = mockup.createFakeRenderer();
            gl.createTexture = function() {
                return 1;
            }; // simulate texture creation
            var state = new State(new ShaderGeneratorProxy());
            state.setGraphicContext(gl);

            // check is ready api
            var texture = new Texture();
            texture.setImage(greyscale._image);
            assert.isOk(texture.getImage().isReady() === true, 'Image is ready');

            texture = new Texture();
            texture.setImage(cnv);
            assert.isOk(texture.getImage().isReady() === true, 'Image is ready because of canvas');
            assert.isOk(greyscale.isDirty() === true, 'dirty is true');

            greyscale.apply(state);

            assert.isOk(
                greyscale._image === undefined,
                'image should be undefined because of unrefAfterApply'
            );
            assert.isOk(greyscale._textureObject !== undefined, 'texture object');
            assert.isOk(greyscale.isDirty() === false, 'dirty is false');
            done();
        };
        loadTexture('mockup/rgb24.png', Texture.RGB);
        loadTexture('mockup/rgba32.png', Texture.RGBA);
        greyscale = loadTexture('mockup/greyscale.png', Texture.ALPHA);
        greyscale.setUnrefImageDataAfterApply(true);
        if (mockup.isNodeContext()) {
            image.onload();
            image.onload();
            image.onload();
        }
    });
}
