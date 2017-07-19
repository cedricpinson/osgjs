'use strict';

var MACROUTILS = require('osg/Utils');
var Input = require('osgDB/Input');
var P = require('bluebird');
var fs = require('fs');
var notify = require('osg/notify');

var InputMockup = function(json, identifier) {
    Input.call(this, json, identifier);
};

MACROUTILS.createPrototypeObject(
    InputMockup,
    MACROUTILS.objectInherit(Input.prototype, {
        requestFile: function(url, options) {
            var nurl = url.replace('file://', '');
            var data;
            if (options && options.responseType) {
                var content = fs.readFileSync(nurl);
                var ab = new ArrayBuffer(content.length);
                var view = new Uint8Array(ab);
                for (var i = 0; i < content.length; ++i) {
                    view[i] = content[i];
                }
                data = ab;
            } else {
                data = fs.readFileSync(nurl, 'utf8');
            }
            if (options && options.progress) options.progress();

            return P.resolve(data);
        },

        fetchImage: function(image, url, options) {
            var checkInlineImage = 'data:image/';
            // crossOrigin does not work for inline data image
            var isInlineImage = url.substring(0, checkInlineImage.length) === checkInlineImage;
            var img = new window.Image();

            image.setURL(url);
            image.setImage(img);
            img.src = url;

            return new P(function(resolve) {
                img.onerror = function() {
                    notify.warn('warning use white texture as fallback instead of ' + url);
                    image.setImage(Input.imageFallback);
                    image.setImage(Input.imageFallback);
                    image.getImage().crossOrigin = options.imageCrossOrigin;
                    resolve(image);
                };

                img.onload = function() {
                    if (options.imageOnload) options.imageOnload.call(image);
                    resolve(image);
                };
                if (!isInlineImage && options.imageCrossOrigin) {
                    img.onerror();
                } else {
                    img.onload();
                }
            });
        }
    })
);

module.exports = InputMockup;
