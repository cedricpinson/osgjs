window.EnvironmentPanorama = ( function () {
    'use strict';

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgShader = OSG.osgShader;

    var shaderProcessor = new osgShader.ShaderProcessor();

    var PanoramaEnv = function ( file, size, options ) {
        this._options = options || {};
        this._file = file;
        this._size = size[0];
    };

    PanoramaEnv.prototype = {

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

        getTexture: function() {
            return this._texture;
        },

        loadPacked: function ( type ) {
            var defer = Q.defer();

            var xhr = new XMLHttpRequest();

            var error = function() {};
            var load = function() {
                var data = xhr.response;

                var size = this._size;

                var imageData;
                if ( type === 'FLOAT' )
                    imageData = new Float32Array( data );
                else
                    imageData = new Uint8Array( data );

                var image = new osg.Image();
                image.setImage( imageData );
                image.setWidth( size );
                image.setHeight( size );

                if ( type === 'FLOAT' )
                    this.createFloatPacked( image );
                else
                    this.createRGBA8Packed( image );

                defer.resolve();

            }.bind(this);

            xhr.addEventListener( 'error', error, false );
            xhr.addEventListener( 'load', function ( event ) {
                if ( xhr.status !== 200 ) {
                    error( event );
                    return;
                }
                load.call( event );

            },false);

            xhr.open( 'GET', this._file, true );
            xhr.responseType = 'arraybuffer';
            xhr.send( null );

            return defer.promise;
        },

        createFloatPacked: function( image ) {

            var texture = new osg.Texture();

            texture.setMinFilter( 'LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            texture.setWrapS( 'REPEAT' );
            texture.setType('FLOAT');
            texture.setFlipY(true);

            texture.setImage( image, 'RGB' );
            this._texture = texture;
            return texture;
        },

        createRGBA8Packed: function( image ) {

            var texture = new osg.Texture();

            texture.setMinFilter( 'LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            texture.setWrapS( 'REPEAT' );
            texture.setFlipY(true);

            texture.setImage( image, 'RGBA' );
            this._texture = texture;
            return texture;
        }

    };

    return PanoramaEnv;
} )();
