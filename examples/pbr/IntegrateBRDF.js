window.IntegrateBRDFMap = ( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;

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

            var size = this._size;

            var input = new osgDB.Input();
            input.requestFile( this._file, {
                responseType: 'arraybuffer'
            } ).then( function ( inputArray ) {

                var data = input._unzipTypedArray( inputArray );

                var byteSize = size * size * 4;

                var imageData = new Uint8Array( data, 0, byteSize );
                var image = new osg.Image();
                image.setImage( imageData );

                image.setWidth( size );
                image.setHeight( size );

                this._texture = this.createTexture( image );
                this._texture.setFlipY( false );

                defer.resolve( this._texture );

            }.bind( this ) );

            return defer.promise;

        }

    };

    return IntegrateBRDFMap;
} )();
