(function() {
    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var Object = window.Object;

    var EnvironmentPanorama = window.EnvironmentPanorama;
    var EnvironmentCubeMap = window.EnvironmentCubeMap;
    var EnvironmentSphericalHarmonics = window.EnvironmentSphericalHarmonics;
    var IntegrateBRDFMap = window.IntegrateBRDFMap;

    var Environment = function() {
        this._config = undefined;
        this._promises = [];
        this._panoramaUE4 = {};
        this._cubemapUE4 = {};
        this._backgroundCubemap = {};
        this._backgroundPanorama = {};
        this._files = {};
    };

    Environment.prototype = {
        loadPackage: function(urlOfFile) {
            var self = this;

            return osgDB.fileHelper.unzip(urlOfFile).then(function(filesMap) {
                return self.readZipContent(filesMap, urlOfFile);
            });
        },

        readZipContent: function(filesMap, url) {
            var envName = url
                .split('/')
                .pop()
                .split('.zip')[0];
            this.name = envName;

            var promises = [];
            for (var filename in filesMap) {
                var data = filesMap[filename];
                var name = filename.split('/').pop();
                this._files[name] = data;
            }
            return P.all(promises).then(
                function() {
                    return this.init(null, this._files['config.json']);
                }.bind(this)
            );
        },

        getImage: function(type, encoding, format) {
            var results = this.getTextures(type, encoding, format);

            if (!results.length) return undefined;

            return results[0].images[0];
        },

        getTextures: function(type, encoding, format) {
            var textures = this._config.textures;
            var results = textures.filter(function(texture) {
                return (
                    texture.encoding === encoding &&
                    texture.format === format &&
                    texture.type === type
                );
            });

            return results;
        },

        getFormatList: function() {
            return Object.keys(this._cubemapUE4);
        },

        init: function(url, config) {
            var formatList = ['FLOAT', 'RGBE', 'RGBM', 'LUV'];

            this._config = config;

            var ready = this._promises;

            // var mipmapTexture;
            // if ( formatList.FLOAT ) {
            //     ( function () {
            //         mipmapTexture = this.getImage( 'mipmap', 'float', 'cubemap' );
            //         var file = mipmapTexture.file;
            //         var urlOrData = this._files[ file ] || ( url + file );
            //         var size = mipmapTexture.width;
            //         this._cubemapPackedFloat = new EnvironmentCubeMap( urlOrData, size, config );
            //     }.bind( this ) )();
            // }

            // read all panorama format U4
            formatList.forEach(
                function(key) {
                    var str = key.toLowerCase();

                    var texture = this.getImage('specular_ue4', str, 'panorama');

                    if (texture === undefined) return;

                    var file = texture.file;
                    var size = texture.width;
                    var urlOrData = this._files[file] || url + file;
                    this._panoramaUE4[key] = new EnvironmentPanorama(urlOrData, size, config);
                    ready.push(this._panoramaUE4[key].loadPacked(key));
                }.bind(this)
            );

            // read all cubemap format U4
            formatList.forEach(
                function(key) {
                    var str = key.toLowerCase();
                    var texture = this.getImage('specular_ue4', str, 'cubemap');
                    if (texture === undefined) return;

                    var file = texture.file;
                    var size = texture.width;
                    var urlOrData = this._files[file] || url + file;
                    this._cubemapUE4[key] = new EnvironmentCubeMap(urlOrData, size, config);
                    ready.push(this._cubemapUE4[key].loadPacked(key));
                }.bind(this)
            );

            (function() {
                var texture = this.getImage('brdf_ue4', 'rg16', 'lut');

                var file = texture.file;
                var size = texture.width;
                var urlOrData = this._files[file] || url + file;
                this._integrateBRDF = new IntegrateBRDFMap(urlOrData, size);
            }.bind(this)());

            // read all background cubemap
            formatList.forEach(
                function(key) {
                    var str = key.toLowerCase();
                    var texture = this.getImage('background', str, 'cubemap');
                    if (texture === undefined) return;
                    var file = texture.file;
                    var size = texture.width;
                    var urlOrData = this._files[file] || url + file;
                    this._backgroundCubemap[key] = new EnvironmentCubeMap(urlOrData, size, {
                        minFilter: 'LINEAR',
                        magFilter: 'LINEAR'
                    });
                    ready.push(this._backgroundCubemap[key].loadPacked(key));
                }.bind(this)
            );

            if (!this._config.diffuseSPH) osg.error('cant find shCoefs in environment config');

            this._spherical = new EnvironmentSphericalHarmonics(config.diffuseSPH);

            if (this._cubemapPackedFloat) ready.push(this._cubemapPackedFloat.loadPacked());

            ready.push(this._integrateBRDF.loadPacked());

            return this.getPromise();
        },

        getPromise: function() {
            return P.all(this._promises);
        },

        getIntegrateBRDF: function() {
            return this._integrateBRDF;
        },
        getPanoramaUE4: function() {
            return this._panoramaUE4;
        },
        getCubemapUE4: function() {
            return this._cubemapUE4;
        },
        getCubemapMipMapped: function() {
            return this._cubemapPackedFloat;
        },
        getSpherical: function() {
            return this._spherical;
        },
        getCubemapIrradiance: function() {
            return this._cubemapIrradiance;
        },
        getBackgroundCubemap: function() {
            return this._backgroundCubemap;
        },
        getBackgroundPanorama: function() {
            return this._backgroundPanorama;
        },
        getConfig: function() {
            return this._config;
        }
    };

    window.Environment = Environment;
})();
