window.EnvironmentPanorama = (function() {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgShader = OSG.osgShader;

    var shaderProcessor = new osgShader.ShaderProcessor();

    var PanoramaEnv = function(urlOrData, size, options) {
        this._options = options || {};
        this._size = size;
        if (typeof urlOrData === 'string') this._file = urlOrData;
        else this._data = urlOrData;
    };

    PanoramaEnv.prototype = {
        getFile: function() {
            return this._file;
        },

        createShaderPanorama: function(defines) {
            if (this._shaderPanorama === undefined) {
                var vertexshader = shaderProcessor.getShader('panoramaVertex.glsl');
                var fragmentshader = shaderProcessor.getShader('panoramaFragment.glsl', defines);

                var program = new osg.Program(
                    new osg.Shader('VERTEX_SHADER', vertexshader),
                    new osg.Shader('FRAGMENT_SHADER', fragmentshader)
                );

                this._shaderPanorama = program;
            }

            return this._shaderPanorama;
        },

        getTexture: function() {
            return this._texture;
        },

        deinterleaveImage4: function(size, src, dst) {
            var npixel = size * size;
            var npixel2 = 2 * npixel;
            var npixel3 = 3 * npixel;
            var idx = 0;
            for (var i = 0; i < npixel; i++) {
                dst[idx++] = src[i];
                dst[idx++] = src[i + npixel];
                dst[idx++] = src[i + npixel2];
                dst[idx++] = src[i + npixel3];
            }
        },

        deinterleaveImage3: function(size, src, dst) {
            var npixel = size * size;
            var idx = 0;
            for (var i = 0; i < npixel; i++) {
                dst[idx++] = src[i];
                dst[idx++] = src[i + npixel];
                dst[idx++] = src[i + 2 * npixel];
            }
        },

        loadPacked: function(type) {
            var readInputArray = function(inputArray) {
                var data = inputArray;
                if (osgDB.isGunzipBuffer(data)) data = osgDB.gunzip(data);

                var size = this._size;

                var imageData, deinterleave;
                if (type === 'FLOAT') {
                    imageData = new Float32Array(data);
                    deinterleave = new Float32Array(data.byteLength / 4);
                    this.deinterleaveImage3(size, imageData, deinterleave);
                } else {
                    imageData = new Uint8Array(data);
                    deinterleave = new Uint8Array(data.byteLength);
                    this.deinterleaveImage4(size, imageData, deinterleave);
                }
                imageData = deinterleave;

                var image = new osg.Image();
                image.setImage(imageData);
                image.setWidth(size);
                image.setHeight(size);

                if (type === 'FLOAT') this.createFloatPacked(image);
                else this.createRGBA8Packed(image);
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
        },

        createFloatPacked: function(image) {
            var texture = new osg.Texture();

            texture.setMinFilter('LINEAR');
            texture.setMagFilter('LINEAR');
            texture.setWrapS('REPEAT');
            texture.setType('FLOAT');
            texture.setFlipY(true);

            texture.setImage(image, 'RGB');
            this._texture = texture;
            return texture;
        },

        createRGBA8Packed: function(image) {
            var texture = new osg.Texture();

            texture.setMinFilter('LINEAR');
            texture.setMagFilter('LINEAR');
            texture.setWrapS('REPEAT');
            texture.setFlipY(true);

            texture.setImage(image, 'RGBA');
            this._texture = texture;
            return texture;
        },
        createRGB: function(image) {
            var texture = new osg.Texture();

            texture.setMinFilter('LINEAR');
            texture.setMagFilter('LINEAR');
            texture.setWrapS('REPEAT');
            texture.setFlipY(true);

            texture.setImage(image, 'RGB');
            this._texture = texture;
            return texture;
        }
    };

    return PanoramaEnv;
})();
