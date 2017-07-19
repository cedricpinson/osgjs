window.IntegrateBRDFMap = (function() {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;

    var IntegrateBRDFMap = function(urlOrData, size) {
        this._size = size;
        if (typeof urlOrData === 'string') this._file = urlOrData;
        else this._data = urlOrData;
    };

    IntegrateBRDFMap.prototype = {
        createTexture: function(image) {
            var texture = new osg.Texture();
            texture.setImage(image);
            texture.setMinFilter('NEAREST');
            texture.setMinFilter('NEAREST');
            return texture;
        },

        getTexture: function() {
            return this._texture;
        },

        loadPacked: function() {
            var size = this._size;

            var readInputArray = function(inputArray) {
                var data = inputArray;
                if (osgDB.isGunzipBuffer(data)) data = osgDB.gunzip(data);

                var byteSize = size * size * 4;

                var imageData = new Uint8Array(data, 0, byteSize);
                var image = new osg.Image();
                image.setImage(imageData);

                image.setWidth(size);
                image.setHeight(size);

                this._texture = this.createTexture(image);
                this._texture.setFlipY(false);

                return this._texture;
            }.bind(this);

            if (this._data) {
                return readInputArray(this._data);
            } else {
                var input = new osgDB.Input();
                return input
                    .requestFile(this._file, {
                        responseType: 'arraybuffer'
                    })
                    .then(readInputArray);
            }
        }
    };

    return IntegrateBRDFMap;
})();
