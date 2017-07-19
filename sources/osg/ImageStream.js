'use strict';
var P = require('bluebird');
var MACROUTILS = require('osg/Utils');
var Image = require('osg/Image');

var ImageStream = function(video) {
    Image.call(this, video);
    this._canPlayDefered = undefined;
};

ImageStream.PAUSE = 0;
ImageStream.PLAYING = 1;

MACROUTILS.createPrototypeObject(
    ImageStream,
    MACROUTILS.objectInherit(Image.prototype, {
        isDirty: function() {
            return this._status === ImageStream.PLAYING; // video is dirty if playing
        },

        setImage: function(video) {
            Image.prototype.setImage.call(this, video);

            this._status = ImageStream.STOP;

            // event at the end of the stream
            video.addEventListener(
                'ended',
                function() {
                    if (!this._imageObject.loop) this.stop();
                }.bind(this),
                true
            );

            this.dirty();
        },

        setLooping: function(bool) {
            this._imageObject.loop = bool;
        },

        play: function() {
            this._imageObject.play();
            this._status = ImageStream.PLAYING;
        },

        stop: function() {
            this._imageObject.pause();
            this._status = ImageStream.PAUSE;
        },

        whenReady: function() {
            if (!this._imageObject) {
                return P.reject();
            }
            var that = this;
            return new P(function(resolve) {
                if (!that._canPlayDefered) {
                    that._canPlayDefered = resolve;
                    // resolve directly if the event is already fired
                    if (that._imageObject.readyState > 3) that._canPlayDefered(that);
                    else
                        that._imageObject.addEventListener(
                            'canplaythrough',
                            that._canPlayDefered.bind(that._canPlayDefered, that),
                            true
                        );
                }
            });
        }
    }),
    'osg',
    'ImageStream'
);

module.exports = ImageStream;
