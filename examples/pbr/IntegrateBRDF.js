window.IntegrateBRDFMap = ( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgShader = OSG.osgShader;

    var IntegrateBRDFMap = function ( file, size ) {
        this._file = file;
        this._size = size;
    };

    IntegrateBRDFMap.prototype = {

        createTexture: function ( image ) {
            var texture = new osg.Texture();
            texture.setImage( image );
            texture.setMinFilter( 'NEAREST' );
            texture.setMinFilter( 'NEAREST' );
            return texture;
        },

        getTexture: function () {
            return this._texture;
        },

        loadPacked: function () {
            var defer = P.defer();

            var xhr = new XMLHttpRequest();
            var size = this._size;
            var error = function () {};
            var load = function () {
                var data = xhr.response;

                var byteSize = size * size * 4;

                var imageData = new Uint8Array( data, 0, byteSize );
                var image = new osg.Image();
                image.setImage( imageData );

                image.setWidth( size );
                image.setHeight( size );

                this._texture = this.createTexture( image );
                this._texture.setFlipY( false );

                defer.resolve( this._texture );

            }.bind( this );

            xhr.addEventListener( 'error', error, false );
            xhr.addEventListener( 'load', function ( event ) {
                if ( xhr.status !== 200 ) {
                    error( event );
                    return;
                }
                load.call( event );

            }, false );

            xhr.open( 'GET', this._file, true );
            xhr.responseType = 'arraybuffer';
            xhr.send( null );

            return defer.promise;

        }



    };

    return IntegrateBRDFMap;
} )();
