window.EnvironmentCubeMap = (function() {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgShader = OSG.osgShader;

    var shaderProcessor = new osgShader.ShaderProcessor();

    var CubeMapEnv = function(urlOrData, size, options) {
        this._options = options || {};
        this._size = size;
        if (typeof urlOrData === 'string') this._file = urlOrData;
        else this._data = urlOrData;
    };

    CubeMapEnv.prototype = {
        createTexture: function(image) {
            var texture = new osg.Texture();
            texture.setImage(image);
            texture.setMinFilter(this._options.minFilter || 'NEAREST');
            texture.setMagFilter(this._options.magFilter || 'NEAREST');
            return texture;
        },

        createTextureCubemap: function() {
            var texture = new osg.TextureCubeMap();
            texture.setMinFilter(this._options.minFilter || 'NEAREST');
            texture.setMagFilter(this._options.magFilter || 'NEAREST');

            for (var i = 0; i < 6; i++)
                texture.setImage(osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + i, this._images[i]);

            return texture;
        },

        createShader: function(defines) {
            var vertexshader = shaderProcessor.getShader('cubemapVertex.glsl');
            var fragmentshader = shaderProcessor.getShader('cubemapFragment.glsl', defines);

            var program = new osg.Program(
                new osg.Shader('VERTEX_SHADER', vertexshader),
                new osg.Shader('FRAGMENT_SHADER', fragmentshader)
            );

            return program;
        },

        createFloatCubeMapDebugGeometry: function() {
            var scene = new osg.Node();

            var size = 10;
            var geom = osg.createTexturedSphereGeometry(size, 20, 20);

            geom.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));
            geom.getOrCreateStateSet().setTextureAttributeAndModes(0, this._texture);
            geom
                .getOrCreateStateSet()
                .setAttributeAndModes(this.createShader(['#define FLOAT_CUBEMAP_LOD']));

            scene.addChild(geom);
            return scene;
        },

        deinterleaveImage4: function(size, src, dst) {
            var npixel = size * size;
            var npixel2 = 2 * size * size;
            var npixel3 = 3 * size * size;
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

        loadPacked: function(type0) {
            var type = type0;
            if (type === undefined) type = 'FLOAT';

            var readInputArray = function(inputArray) {
                var data = inputArray;
                if (osgDB.isGunzipBuffer(data)) data = osgDB.gunzip(data);

                var maxLevel = Math.log(this._size) / Math.LN2;
                var offset = 0;
                var images = {};
                for (var i = 0; i <= maxLevel; i++) {
                    var size = Math.pow(2, maxLevel - i);
                    var byteSize;
                    if (offset >= data.byteLength) break;
                    for (var face = 0; face < 6; face++) {
                        // add entry if does not exist
                        if (!images[osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + face])
                            images[osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + face] = [];

                        var imageData;
                        var deinterleave;
                        if (type === 'FLOAT') {
                            byteSize = size * size * 4 * 3;
                            imageData = new Float32Array(data, offset, byteSize / 4);
                            deinterleave = new Float32Array(byteSize / 4);
                            this.deinterleaveImage3(size, imageData, deinterleave);
                        } else {
                            byteSize = size * size * 4;
                            imageData = new Uint8Array(data, offset, byteSize);
                            deinterleave = new Uint8Array(byteSize);
                            this.deinterleaveImage4(size, imageData, deinterleave);
                        }
                        imageData = deinterleave;

                        var image = new osg.Image();
                        image.setImage(imageData);

                        image.setWidth(size);
                        image.setHeight(size);
                        images[osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + face].push(image);
                        offset += byteSize;
                    }
                }

                this._packedImages = images;

                if (type === 'FLOAT') this.createFloatPacked();
                else this.createRGBA8Packed();
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

        getTexture: function() {
            return this._texture;
        },

        createFloatPacked: function() {
            var texture = new osg.TextureCubeMap();
            texture.setMinFilter(this._options.minFilter || 'LINEAR_MIPMAP_LINEAR');
            texture.setMagFilter(this._options.magFilter || 'LINEAR');
            texture.setType('FLOAT');
            texture.setFlipY(false);

            for (var j = 0; j < 6; j++) {
                var f = osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + j;
                texture.setImage(f, this._packedImages[f], 'RGB');
            }
            this._texture = texture;
            return texture;
        },

        createRGBA8Packed: function() {
            var texture = new osg.TextureCubeMap();
            texture.setMinFilter('LINEAR_MIPMAP_LINEAR');
            texture.setMagFilter('LINEAR');
            texture.setFlipY(false);

            for (var j = 0; j < 6; j++) {
                var f = osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + j;
                texture.setImage(f, this._packedImages[f], 'RGBA');
            }
            this._texture = texture;
            return texture;
        },

        createFloatCubeMapPackedDebugGeometry: function() {
            var scene = new osg.Node();

            var size = 10;
            var geom = osg.createTexturedSphereGeometry(size, 20, 20);

            geom.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));
            geom.getOrCreateStateSet().setTextureAttributeAndModes(0, this._texture);
            geom
                .getOrCreateStateSet()
                .setAttributeAndModes(
                    this.createShader([
                        '#define FLOAT',
                        '#define CUBEMAP_LOD',
                        '#define CUBEMAP_SEAMLESS'
                    ])
                );

            scene.addChild(geom);
            return scene;
        }
    };

    return CubeMapEnv;
})();
