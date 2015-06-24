( function () {

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;


    var EnvironmentPanorama = window.EnvironmentPanorama;
    var EnvironmentCubeMap = window.EnvironmentCubeMap;
    var EnvironmentSphericalHarmonics = window.EnvironmentSphericalHarmonics;
    var IntegrateBRDFMap = window.IntegrateBRDFMap;

    var Environment = function () {
        this._config = undefined;
        this._promises = [];
        this._panoramaUE4 = {};
        this._cubemapUE4 = {};
        this._backgroundCubemap = {};
        this._backgroundPanorama = {};
    };

    Environment.prototype = {

        getFirstImage: function ( type, encoding, format ) {

            var results = this.getTextures( type, encoding, format );

            if ( !results.length )
                return undefined;

            return results[ 0 ].images[ 0 ];
        },

        getTextures: function ( type, encoding, format ) {

            var textures = this._config.textures;
            var results = textures.filter( function ( texture ) {
                return texture.encoding === encoding && texture.format === format && texture.type === type;
            } );

            return results;
        },

        init: function ( environment, config ) {
            var formatList = window.formatList;

            this._config = config;

            var ready = this._promises;


            //var spherical = environment + 'spherical';
            var mipmapTexture = this.getFirstImage( 'mipmap', 'float', 'cubemap' );
            var cubemapPackedFloat = environment + mipmapTexture.file;
            var size = mipmapTexture.width;

            var brdfTexture = this.getFirstImage( 'brdf_ue4', 'rg16', 'lut' );
            var integrateBRDF = environment + brdfTexture.file;

            //this._cubemapIrradiance = new EnvironmentCubeMap( cubemapIrradiance );
            this._cubemapPackedFloat = new EnvironmentCubeMap( cubemapPackedFloat, size, config );


            // read all panorama format U4
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();

                var texture = this.getFirstImage( 'specular_ue4', str, 'panorama' );

                if ( texture === undefined ) return;

                var file = texture.file;
                var size = texture.width;
                this._panoramaUE4[ key ] = new EnvironmentPanorama( environment + file, size, config );
                ready.push( this._panoramaUE4[ key ].loadPacked( key ) );

            }.bind( this ) );


            // read all cubemap format U4
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();
                var texture = this.getFirstImage( 'specular_ue4', str, 'cubemap' );
                if ( texture === undefined ) return;

                var file = texture.file;
                var size = texture.width;
                this._cubemapUE4[ key ] = new EnvironmentCubeMap( environment + file, size, config );
                ready.push( this._cubemapUE4[ key ].loadPacked( key ) );

            }.bind( this ) );

            this._integrateBRDF = new IntegrateBRDFMap( integrateBRDF, brdfTexture.width );

            // read all background cubemap
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();
                var texture = this.getFirstImage( 'background', str, 'cubemap' );
                if ( texture === undefined ) return;
                var file = texture.file;
                var size = texture.width;
                this._backgroundCubemap[ key ] = new EnvironmentCubeMap( environment + file, size, {
                    'minFilter': 'LINEAR',
                    'magFilter': 'LINEAR'
                } );
                ready.push( this._backgroundCubemap[ key ].loadPacked( key ) );

            }.bind( this ) );

            if ( !this._config.diffuseSPH )
                osg.error( 'cant find shCoefs in environment config' );

            this._spherical = new EnvironmentSphericalHarmonics( config.diffuseSPH );

            ready.push( this._cubemapPackedFloat.loadPacked() );
            ready.push( this._integrateBRDF.loadPacked() );

            return this.getPromise();
        },

        getPromise: function () {
            return P.all( this._promises );
        },

        getIntegrateBRDF: function () {
            return this._integrateBRDF;
        },
        getPanoramaUE4: function () {
            return this._panoramaUE4;
        },
        getCubemapUE4: function () {
            return this._cubemapUE4;
        },
        getCubemapMipMapped: function () {
            return this._cubemapPackedFloat;
        },
        getSpherical: function () {
            return this._spherical;
        },
        getCubemapIrradiance: function () {
            return this._cubemapIrradiance;
        },
        getBackgroundCubemap: function () {
            return this._backgroundCubemap;
        },
        getBackgroundPanorama: function () {
            return this._backgroundPanorama;
        },
        getConfig: function () {
            return this._config;
        }

    };

    window.Environment = Environment;
} )();
