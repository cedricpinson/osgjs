( function () {

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var Object = window.Object;

    var JSZip = window.JSZip;

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
        this._files = {};
    };

    Environment.prototype = {

        loadPackage: function ( urlOfFile ) {

            var loadZip = function ( file ) {
                return JSZip.loadAsync( file ).then( function ( zip ) {
                    return this.readZipContent( zip, urlOfFile );
                }.bind( this ) );
            }.bind( this );

            var file = urlOfFile;

            if ( typeof urlOfFile === 'string' ) {
                return osgDB.requestFile( urlOfFile, {
                    responseType: 'blob'
                } ).then( function ( blob ) {
                    return loadZip( blob );
                } );
            }

            return loadZip( file );
        },

        readZipContent: function ( zip, url ) {

            var promisesArray = [];

            var envName = url.split( '/' ).pop().split( '.zip' )[ 0 ];
            this.name = envName;

            Object.keys( zip.files ).forEach( function ( filename ) {

                var ext = filename.split( '.' ).pop();
                var type = null;

                if ( ext === 'json' ) type = 'string';
                if ( ext === 'bin' || ext === 'gz' ) type = 'arraybuffer';
                if ( !type ) return;

                var p = zip.files[ filename ].async( type ).then( function ( fileData ) {

                    var data = fileData;
                    var name = filename.split( '/' ).pop();

                    if ( name.split( '.' ).pop() === 'json' ) data = JSON.parse( data );

                    return {
                        name: name,
                        data: data
                    };

                } );

                promisesArray.push( p );

            } );

            return P.all( promisesArray ).then( function ( fileArray ) {

                fileArray.forEach( function ( entry ) {
                    this._files[ entry.name ] = entry.data;
                }.bind( this ) );

                return this.init( null, this._files[ 'config.json' ] );

            }.bind( this ) );
        },

        getImage: function ( type, encoding, format ) {

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

        getFormatList: function () {
            return Object.keys( this._cubemapUE4 );
        },

        init: function ( url, config ) {
            var formatList = [ 'FLOAT', 'RGBE', 'RGBM', 'LUV' ];

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
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();

                var texture = this.getImage( 'specular_ue4', str, 'panorama' );

                if ( texture === undefined ) return;

                var file = texture.file;
                var size = texture.width;
                var urlOrData = this._files[ file ] || ( url + file );
                this._panoramaUE4[ key ] = new EnvironmentPanorama( urlOrData, size, config );
                ready.push( this._panoramaUE4[ key ].loadPacked( key ) );

            }.bind( this ) );


            // read all cubemap format U4
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();
                var texture = this.getImage( 'specular_ue4', str, 'cubemap' );
                if ( texture === undefined ) return;

                var file = texture.file;
                var size = texture.width;
                var urlOrData = this._files[ file ] || ( url + file );
                this._cubemapUE4[ key ] = new EnvironmentCubeMap( urlOrData, size, config );
                ready.push( this._cubemapUE4[ key ].loadPacked( key ) );

            }.bind( this ) );


            ( function () {

                var texture = this.getImage( 'brdf_ue4', 'rg16', 'lut' );

                var file = texture.file;
                var size = texture.width;
                var urlOrData = this._files[ file ] || ( url + file );
                this._integrateBRDF = new IntegrateBRDFMap( urlOrData, size );

            }.bind( this ) )();

            // read all background cubemap
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();
                var texture = this.getImage( 'background', str, 'cubemap' );
                if ( texture === undefined ) return;
                var file = texture.file;
                var size = texture.width;
                var urlOrData = this._files[ file ] || ( url + file );
                this._backgroundCubemap[ key ] = new EnvironmentCubeMap( urlOrData, size, {
                    minFilter: 'LINEAR',
                    magFilter: 'LINEAR'
                } );
                ready.push( this._backgroundCubemap[ key ].loadPacked( key ) );

            }.bind( this ) );

            if ( !this._config.diffuseSPH )
                osg.error( 'cant find shCoefs in environment config' );

            this._spherical = new EnvironmentSphericalHarmonics( config.diffuseSPH );

            if ( this._cubemapPackedFloat )
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
