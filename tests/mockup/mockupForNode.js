/*eslint-env node*/
var _jsdom = require('jsdom');
var jsdom = new _jsdom.JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');

var MockupImage = function(src) {
    // mock/fake Image object as jsdom lacks one and we need it to pass get the correct URL to the material translator
    this.src = src; // real image
    this.complete = true;
    this.width = this.height = 4;
    this.isReady = function() {
        return true;
    };
};

var MockupCanvas = function() {
    // we mockup the canvas because the one provided by jsdom+canvas package is too slow
    return {
        getContext: function(dimension) {
            if (dimension === '2d') {
                return {
                    createImageData: function() {
                        return {
                            data: [0, 0, 0, 0]
                        };
                    },
                    putImageData: function() {},
                    measureText: function() {},
                    drawImage: function() {}
                };
            } else {
                // if webgl context return nothing (if it became an issue, we can return createMockupRenderer)
                return undefined;
            }
        }
    };
};

var createWindowVars = function(window) {
    global.HTMLCanvasElement = window.HTMLCanvasElement = MockupCanvas;
    global.self = global; // https://github.com/petkaantonov/bluebird/issues/478
    global.window = window;
    global.document = window.document;
    global.Image = window.Image = MockupImage;

    global.Blob = window.Blob;
    global.navigator = {
        userAgent: 'node.js',
        vendor: ''
    };
    window.console = global.console;
    window.Map = global.Map;
    window.Set = global.Set;
    window.Object = global.Object;
    window.decodeURI = global.decodeURI;
    window.encodeURI = global.encodeURI;
    console.profile = console.profileEnd = function() {};
};

createWindowVars(jsdom.window);
