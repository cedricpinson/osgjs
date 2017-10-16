import { assert } from 'chai';
import Image from 'osg/Image';
import mockup from 'tests/mockup/mockup';

export default function() {
    test('Image.isGreyScale grey image', function(done) {
        var test = function(img) {
            var n = new Image(img);

            assert.equal(n.isGreyscale(2), true, 'check image is grey');
            done();
        };

        var img = new window.Image();
        img.onload = function() {
            test(this);
        };

        img.src = 'mockup/greyscale.png';

        if (mockup.isNodeContext()) {
            img.onload();
        }
    });

    test('Image.isGreyScale color image', function(done) {
        var test = function(img) {
            var n = new Image(img);

            assert.equal(n.isGreyscale(2), false, 'check image is not grey');
            done();
        };

        var img = new window.Image();
        img.onload = function() {
            test(this);
        };
        img.src = 'mockup/rgba32.png';
        if (mockup.isNodeContext()) {
            img.onload();
        }
    });

    test('Image.isReady', function() {
        var fakeImage = {
            complete: true,
            naturalWidth: 1024,
            isReady: function() {
                return true;
            }
        };
        var n = new Image(fakeImage);
        assert.isOk(n.isReady(), 'check wrapped HTML Image ');
    });
}
