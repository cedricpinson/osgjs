import utils from 'osg/utils';
import P from 'bluebird';
import notify from 'osg/notify';

var DefaultFont = 'Courier New';

var determineFontHeight = function(fontStyle) {
    var body = document.getElementsByTagName('body')[0];
    var dummy = document.createElement('div');
    var dummyText = document.createTextNode('M');
    dummy.appendChild(dummyText);
    dummy.setAttribute('style', fontStyle);
    body.appendChild(dummy);
    var result = dummy.offsetHeight;
    body.removeChild(dummy);
    return result;
};

var loadFont = function(fontFamily) {
    return new P(function(resolve, reject) {
        window.WebFontConfig = {
            google: {
                families: [fontFamily + ':200']
            },
            active: function() {
                resolve(fontFamily);
            },
            inactive: function(error) {
                reject('loadFont error:' + error);
            }
        };
        var wf = document.createElement('script'),
            s = document.scripts[0];
        wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
        wf.async = true;
        wf.onerror = function() {
            reject();
        };
        s.parentNode.insertBefore(wf, s);
    });
};

var TextGenerator = function() {
    this._canvas = undefined;
    this._characterHeight = 0;
    this._characterWidth = 0;
    this._fontSize = 16;
    this._fontFamily = 'Source Code Pro';
    this._characterFirstCode = ' '.charCodeAt();
    this._characterLastCode = 'z'.charCodeAt();
    this._characterSizeUV = 0;
    this._backgroundColor = 'rgba(0,0,0,0.0)';
    this._createCanvas();
};

utils.createPrototypeObject(TextGenerator, {
    setFontSize: function(size) {
        this._fontSize = size;
    },
    getCharacterWidth: function() {
        return this._characterWidth;
    },
    getCharacterHeight: function() {
        return this._characterHeight;
    },
    getCanvas: function() {
        return this._promise;
    },
    getCharacterUV: function(characterCode) {
        var index = characterCode - this._characterFirstCode;
        return index * this._characterSizeUV;
    },
    _fillCanvas: function(fontFamily, fontSize) {
        // get font height
        var size = fontSize + 'px';
        var style = 'font-family: ' + fontFamily + '; font-size: ' + size + ';';
        var pixelHeight = determineFontHeight(style);
        notify.debug(fontFamily + ' ' + size + ' ==> ' + pixelHeight + ' pixels high.');

        this._characterHeight = Math.ceil(pixelHeight);
        var font = fontSize + "px '" + fontFamily + "'";
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        this._canvas = canvas;
        ctx.font = font;
        ctx.textBaseline = 'middle';

        this._characterWidth = ctx.measureText(' ').width;
        this._characterWidth = Math.ceil(this._characterWidth);

        var nbCharacters = this._characterLastCode - this._characterFirstCode + 1;
        notify.info(
            'Stats character size ' +
                this._characterWidth +
                ' x ' +
                this._characterHeight +
                ' texture width ' +
                this._characterWidth * nbCharacters
        );

        canvas.width = Math.ceil(this._characterWidth * nbCharacters);
        canvas.height = this._characterHeight;

        this._characterSizeUV = this._characterWidth / canvas.width;

        ctx.font = font;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgb(255,255,255)';
        for (var i = this._characterFirstCode, j = 0; i <= this._characterLastCode; i++, j++) {
            var code = String.fromCharCode(i);
            var x = j * this._characterWidth;
            var y = this._characterHeight / 2;
            ctx.fillText(code, x, y);
        }
        return canvas;
    },
    _createCanvas: function() {
        this._promise = loadFont(this._fontFamily)
            .then(
                function(fontFamily) {
                    return this._fillCanvas(fontFamily, this._fontSize);
                }.bind(this)
            )
            .catch(
                function() {
                    return this._fillCanvas(DefaultFont, this._fontSize);
                }.bind(this)
            );
    }
});

export default TextGenerator;
