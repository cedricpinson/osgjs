(function() {

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;


    var EnvironmentPanorama = window.EnvironmentPanorama;
    var EnvironmentCubeMap = window.EnvironmentCubeMap;
    var EnvironmentSphericalHarmonics = window.EnvironmentSphericalHarmonics;
    var IntegrateBRDFMap = window.IntegrateBRDFMap;

    var Environment = function () {
        this._promises = [];
        this._panoramaUE4 = {};
        this._cubemapUE4 = {};
        this._backgroundCubemap = {};
        this._backgroundPanorama = {};
    };

    Environment.prototype = {

        init: function ( environment, config ) {
            var formatList = window.formatList;

            this._config = config;

            var ready = this._promises;


            //var spherical = environment + 'spherical';
            var cubemapPackedFloat = environment + config['mipmapCubemap_float'];
            var integrateBRDF = environment + config['brdfUE4'];

            //this._cubemapIrradiance = new EnvironmentCubeMap( cubemapIrradiance );
            this._cubemapPackedFloat = new EnvironmentCubeMap( cubemapPackedFloat, config['mipmapCubemapSize'], config );


            // read all panorama format U4
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();
                var file = config['specularPanoramaUE4_' + str];
                var size = config['specularPanoramaUE4Size'];
                if ( file === undefined || size === undefined ) return;
                this._panoramaUE4[ key ] = new EnvironmentPanorama( environment + file, size , config );
                ready.push( this._panoramaUE4[ key ].loadPacked( key ) );

            }.bind( this ) );


            // read all cubemap format U4
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();
                var file = config['specularCubemapUE4_' + str];
                var size = config['specularCubemapUE4Size'];
                if ( file === undefined || size === undefined ) return;
                this._cubemapUE4[ key ] = new EnvironmentCubeMap( environment + file, size, config );
                ready.push( this._cubemapUE4[ key ].loadPacked( key ) );

            }.bind( this ) );

            this._integrateBRDF = new IntegrateBRDFMap( integrateBRDF, config['brdfUE4Size'] );

            // read all cubemap format U4
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();
                var file = config['backgroundCubemap_' + str];
                var size = config['backgroundCubemapSize'];
                if ( file === undefined || size === undefined ) return;
                this._backgroundCubemap[ key ] = new EnvironmentCubeMap( environment + file, size, config );
                ready.push( this._backgroundCubemap[ key ].loadPacked( key ) );

            }.bind( this ) );

            // read background srgb panorama
            var file = config['backgroundPanorama_srgb'];
            var size = config['backgroundPanoramaSize'];
            if ( !(file === undefined || size === undefined) ) {
                this._backgroundPanorama[ 'srgb' ] = new EnvironmentPanorama( environment + file, size, config );
                //ready.push( this._backgroundPanorama[ 'srgb' ].load() );
            }

            if ( !this._config.diffuseSPH )
                osg.error( 'cant find shCoefs in environment config' );

            this._spherical = new EnvironmentSphericalHarmonics( config.diffuseSPH );

            ready.push( this._cubemapPackedFloat.loadPacked() );
            ready.push( this._integrateBRDF.loadPacked() );

            return this.getPromise();
        },

        getPromise: function () {
            return Q.all( this._promises );
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
        getBackgroundCubemap: function() {
            return this._backgroundCubemap;
        },
        getBackgroundPanorama: function() {
            return this._backgroundPanorama;
        },
        getConfig: function () {
            return this._config;
        }

    };

    window.Environment = Environment;
})();
