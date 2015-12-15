window.EnvironmentPanorama = ( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgShader = OSG.osgShader;

    var shaderProcessor = new osgShader.ShaderProcessor();

    var PanoramaEnv = function ( file, size, options ) {
        this._options = options || {};
        this._file = file;
        this._size = size;
    };

    PanoramaEnv.prototype = {
        getFile: function () {
            return this._file;
        },

        createShaderPanorama: function ( defines ) {

            if ( this._shaderPanorama === undefined ) {

                var vertexshader = shaderProcessor.getShader( 'panoramaVertex.glsl' );
                var fragmentshader = shaderProcessor.getShader( 'panoramaFragment.glsl', defines );

                var program = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                    new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                this._shaderPanorama = program;
            }

            return this._shaderPanorama;
        },

        getTexture: function () {
            return this._texture;
        },

        deinterleaveImage4: function ( size, src, dst ) {
            var npixel = size * size;
            var npixel2 = 2 * npixel;
            var npixel3 = 3 * npixel;
            var idx = 0;
            for ( var i = 0; i < npixel; i++ ) {
                dst[ idx++ ] = src[ i ];
                dst[ idx++ ] = src[ i + npixel ];
                dst[ idx++ ] = src[ i + npixel2 ];
                dst[ idx++ ] = src[ i + npixel3 ];
            }
        },

        deinterleaveImage3: function ( size, src, dst ) {
            var npixel = size * size;
            var idx = 0;
            for ( var i = 0; i < npixel; i++ ) {
                dst[ idx++ ] = src[ i ];
                dst[ idx++ ] = src[ i + npixel ];
                dst[ idx++ ] = src[ i + 2 * npixel ];
            }
        },

        loadPacked: function ( type ) {
            var defer = P.defer();

            var xhr = new XMLHttpRequest();

            var error = function () {};
            var load = function () {
                var data = xhr.response;

                var size = this._size;

                var imageData, deinterleave;
                if ( type === 'FLOAT' ) {
                    imageData = new Float32Array( data );
                    deinterleave = new Float32Array( data.byteLength / 4 );
                    this.deinterleaveImage3( size, imageData, deinterleave );
                } else {
                    imageData = new Uint8Array( data );
                    deinterleave = new Uint8Array( data.byteLength );
                    this.deinterleaveImage4( size, imageData, deinterleave );
                }
                imageData = deinterleave;

                var image = new osg.Image();
                image.setImage( imageData );
                image.setWidth( size );
                image.setHeight( size );

                if ( type === 'FLOAT' )
                    this.createFloatPacked( image );
                else
                    this.createRGBA8Packed( image );

                defer.resolve();

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
        },

        createFloatPacked: function ( image ) {

            var texture = new osg.Texture();

            texture.setMinFilter( 'LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            texture.setWrapS( 'REPEAT' );
            texture.setType( 'FLOAT' );
            texture.setFlipY( true );

            texture.setImage( image, 'RGB' );
            this._texture = texture;
            return texture;
        },

        createRGBA8Packed: function ( image ) {

            var texture = new osg.Texture();

            texture.setMinFilter( 'LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            texture.setWrapS( 'REPEAT' );
            texture.setFlipY( true );

            texture.setImage( image, 'RGBA' );
            this._texture = texture;
            return texture;
        },
        createRGB: function ( image ) {

            var texture = new osg.Texture();

            texture.setMinFilter( 'LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            texture.setWrapS( 'REPEAT' );
            texture.setFlipY( true );

            texture.setImage( image, 'RGB' );
            this._texture = texture;
            return texture;
        }

    };

    return PanoramaEnv;
} )();
