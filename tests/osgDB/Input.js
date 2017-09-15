'use strict';
var assert = require('chai').assert;
var P = require('bluebird');
var Input = require('osgDB/Input');
var mockup = require('tests/mockup/mockup');
if (mockup.isNodeContext()) {
    Input = require('tests/mockup/InputMockup');
}
var Notify = require('osg/notify');
var Image = require('osg/Image');

module.exports = function() {
    var ImageTest = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

    test('Input.readImageURL', function(done) {
        var input = new Input();
        input.setPrefixURL('testXtest');
        input
            .readImageURL(ImageTest)
            .then(function(image) {
                assert.isOk(image.getURL() === ImageTest, 'check image src');
                done();
            })
            .catch(function(error) {
                Notify.error(error);
            });
    });

    test('Input.readImageURL with readImageURL replacement', function(done) {
        var called = false;
        var input = new Input();
        var readImageURLReplacement = function(url /*, options*/) {
            called = true;
            return input.readImageURL(url);
        };
        input
            .readImageURL(ImageTest, {
                readImageURL: readImageURLReplacement
            })
            .then(
                function(/*image*/) {
                    assert.equal(called, true, 'check image src');
                    done();
                }
            )
            .catch(function(error) {
                Notify.error(error);
            });
    });

    test('Input.readImageURL inline dataimage with crossOrigin', function(done) {
        var input = new Input();
        var url = 'error-404';

        input
            .readImageURL('error-404', {
                imageCrossOrigin: 'Anonymous',
                imageLoadingUsePromise: true
            })
            .then(function(img) {
                assert.isOk(img instanceof Image, 'with promise : returned image');
                assert.isOk(
                    img.getImage().src.substr(-9) !== url,
                    'with promise : used fallback image'
                );

                done();
            })
            .catch(function(error) {
                Notify.error(error);
            });
    });

    test('Input.fetchImage', function() {
        var input = new Input();
        input.setPrefixURL('testXtest');

        (function() {
            var img = new Image();
            input.fetchImage(img, ImageTest, {
                imageCrossOrigin: 'anonymous'
            });
            assert.isOk(
                img.getImage().crossOrigin !== 'anonymous',
                'skip crossOrigin for inline image'
            );
        })();

        (function() {
            var img = new Image();
            input.fetchImage(img, 'http://osgjs.org/image.png', {
                imageCrossOrigin: 'anonymous'
            });
            assert.isOk(img.getImage().crossOrigin === 'anonymous', 'check crossOrigin');
        })();
    });

    test('Input.readArrayBuffer-old', function(done) {
        var ba = {
            Elements: [0.01727, -0.00262, 3.0],
            ItemSize: 3,
            Type: 'ARRAY_BUFFER',
            UniqueID: 10
        };
        var input = new Input(ba);
        input
            .readBufferArray()
            .then(
                function(/*value*/) {
                    return input
                        .setJSON({
                            UniqueID: 10
                        })
                        .readBufferArray();
                }
            )
            .then(function(o2) {
                assert.isOk(o2.getElements()[2] === 3.0, 'readBufferArray check same unique id');
                done();
            });
    });

    test('Input.readBinaryArrayURL with replacement option', function(done) {
        var calledBinaryArray = false;
        var readBinaryArrayURL = function(/*url, options*/) {
            calledBinaryArray = true;
            return P.resolve();
        };
        var input = new Input();
        input
            .readBinaryArrayURL('toto', {
                readBinaryArrayURL: readBinaryArrayURL
            })
            .then(
                function(/*value*/) {
                    assert.isOk(
                        calledBinaryArray,
                        true,
                        'readBinaryArray replacement has been called'
                    );
                    done();
                }
            );
    });

    test('Input.readNodeURL with replacement option', function(done) {
        var calledNodeURL = false;
        var readNodeURL = function(/*url, options*/) {
            calledNodeURL = true;
            return P.resolve();
        };
        var input = new Input();
        input
            .readNodeURL('toto', {
                readNodeURL: readNodeURL
            })
            .then(
                function(/*value*/) {
                    assert.isOk(calledNodeURL, true, 'readNodeURL replacement has been called');
                    done();
                }
            );
    });

    test('Input.getObjectWrapper', function() {
        (function() {
            var input = new Input();
            var obj = input.getObjectWrapper('osg.Node');
            assert.isOk(obj.getName() !== '', 'getObjectWrapper check osg.Node.getName');
            assert.isOk(obj.addChild !== undefined, 'getObjectWrapper check osg.addChild');
        })();

        (function() {
            var ProxyNode = function() {
                this._proxy = true;
            };
            var input = new Input();
            input.registerObject('osg.Node', ProxyNode);
            var obj = input.getObjectWrapper('osg.Node');
            assert.isOk(obj._proxy === true, 'getObjectWrapper with overridden');
        })();
    });

    test('Input.readObject - Material', function(done) {
        var obj = {
            'osg.Material': {
                UniqueID: 10,
                Name: 'FloorBorder1',
                Ambient: [0.5, 0.5, 0.5, 1],
                Diffuse: [0.1, 0.1, 0.1, 0.1],
                Emission: [0, 0, 0, 0.5],
                Shininess: 2.5,
                Specular: [0.5, 0.7, 0.5, 1]
            }
        };

        var input = new Input(obj);
        input
            .readObject()
            .then(function() {
                return input
                    .setJSON({
                        'osg.Material': {
                            UniqueID: 10
                        }
                    })
                    .readObject();
            })
            .then(function(o2) {
                assert.isOk(o2.getName() === 'FloorBorder1', 'readObject check same unique id');
                done();
            });
    });

    test('Input.computeURL use prefix', function(done) {
        var input = new Input();
        assert.isOk(input.computeURL('toto') === 'toto', 'check default computeURL');
        input.setPrefixURL(undefined);
        assert.isOk(input.computeURL('toto') === 'toto', 'check from undefined computeURL');
        input.setPrefixURL('/blah/');
        assert.isOk(input.computeURL('toto') === '/blah/toto', 'check computeURL');
        done();
    });

    test('Input.readPrimitiveSet', function(done) {
        var input = new Input({
            DrawArrays: {
                UniqueID: 10,
                count: 3540,
                first: 10,
                mode: 'TRIANGLES'
            }
        });
        input
            .readPrimitiveSet()
            .then(
                function(/*value */) {
                    return input
                        .setJSON({
                            DrawArrays: {
                                UniqueID: 10
                            }
                        })
                        .readPrimitiveSet();
                }
            )
            .then(function(o2) {
                assert.isOk(o2.getCount() === 3540, 'readPrimitiveSet check same unique id');
                done();
            });
    });

    test('Input.readBufferArray - inline', function(done) {
        var ba = {
            Array: {
                Uint16Array: {
                    Elements: [0.01727, -0.00262, 3.0],
                    Size: 3
                }
            },
            ItemSize: 3,
            Type: 'ARRAY_BUFFER',
            UniqueID: 10
        };
        var input = new Input(ba);
        input
            .readBufferArray()
            .then(function() {
                return input
                    .setJSON({
                        UniqueID: 10
                    })
                    .readBufferArray();
            })
            .then(function(o2) {
                assert.isOk(
                    o2.getElements()[2] === 3.0,
                    'readBufferArray with new array typed inlined'
                );
                done();
            });
    });

    test('Input.readBufferArray - external', function(done) {
        var ba = {
            Array: {
                Uint16Array: {
                    File: 'mockup/stream.bin',
                    Size: 3
                }
            },
            ItemSize: 1,
            Type: 'ARRAY_BUFFER',
            UniqueID: 10
        };

        var a = (function() {
            var input = new Input(ba);
            return input.readBufferArray().then(function(buffer) {
                assert.isOk(
                    buffer.getElements()[2] === 10,
                    'readBufferArray with new array typed external file'
                );
                return P.resolve();
            });
        })();

        var b = (function() {
            var calledProgress = false;
            var progress = function() {
                calledProgress = true;
            };
            var input = new Input(ba);
            input.setProgressXHRCallback(progress);
            return input.readBufferArray().then(
                function(/*buffer*/) {
                    assert.isOk(calledProgress === true, 'readBufferArray check progress callback');
                    return P.resolve();
                }
            );
        })();

        P.all([a, b]).then(function() {
            done();
        });
    });

    test('Input.readBufferArray - external offset', function(done) {
        var ba = {
            TexCoord0: {
                UniqueID: 202,
                Array: {
                    Float32Array: {
                        File: 'mockup/multistream.bin',
                        Offset: 0,
                        Size: 3
                    }
                },
                ItemSize: 2,
                Type: 'ARRAY_BUFFER'
            },
            Tangent: {
                UniqueID: 204,
                Array: {
                    Float32Array: {
                        File: 'mockup/multistream.bin',
                        Offset: 24,
                        Size: 3
                    }
                },
                ItemSize: 3,
                Type: 'ARRAY_BUFFER'
            }
        };
        (function() {
            var input = new Input(ba);
            var arraysPromise = [];
            var buffers = {};

            var createVertexAttribute = function(name, jsonAttribute) {
                var promise = input.setJSON(jsonAttribute).readBufferArray();
                arraysPromise.push(promise);
                promise.then(function(buffer) {
                    if (buffer !== undefined) {
                        buffers[name] = buffer;
                    }
                    return buffer;
                });
            };

            createVertexAttribute('Tangent', ba.Tangent);
            createVertexAttribute('TexCoord0', ba.TexCoord0);

            P.all(arraysPromise).then(function() {
                var tc = buffers.TexCoord0.getElements();
                var tcl = tc.length;
                assert.equal(
                    tc[2],
                    2,
                    'readBufferArray with new array typed external file with offset'
                );
                assert.equal(
                    tc[1],
                    1,
                    'readBufferArray with new array typed external file with offset'
                );
                assert.equal(
                    tcl,
                    6,
                    'readBufferArray with new array typed external file with offset'
                );
                var tg = buffers.Tangent.getElements();
                var tgl = tg.length;
                assert.equal(
                    tg[2],
                    8,
                    'readBufferArray with new array typed external file with offset'
                );
                assert.equal(
                    tg[1],
                    7,
                    'readBufferArray with new array typed external file with offset'
                );
                assert.equal(
                    tgl,
                    9,
                    'readBufferArray with new array typed external file with offset'
                );
                done();
            });
        })();
    });
};
