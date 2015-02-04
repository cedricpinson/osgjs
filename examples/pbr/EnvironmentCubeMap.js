window.EnvironmentCubeMap = ( function () {
    'use strict';

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgShader = OSG.osgShader;

    var shaderProcessor = new osgShader.ShaderProcessor();

    var CubeMapEnv = function ( file, size, options ) {
        this._options = options || {};
        this._size = size[0];
        this._file = file; // abandoned_sanatorium_staircase_%d.png
    };

    CubeMapEnv.prototype = {

        createTexture: function ( image ) {
            var texture = new osg.Texture();
            texture.setImage( image );
            texture.setMinFilter( this._options.minFilter || 'NEAREST' );
            texture.setMagFilter( this._options.magFilter || 'NEAREST' );
            return texture;
        },

        createTextureCubemap: function () {

            var texture = new osg.TextureCubeMap();
            texture.setMinFilter( this._options.minFilter || 'NEAREST' );
            texture.setMagFilter( this._options.magFilter || 'NEAREST' );

            for ( var i = 0; i < 6; i++ )
                texture.setImage( osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + i, this._images[ i ] );

            return texture;
        },

        createShader: function ( defines ) {

            var vertexshader = shaderProcessor.getShader( 'cubemapVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'cubemapFragment.glsl', defines );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;

        },

        createFloatCubeMapDebugGeometry: function () {

            var scene = new osg.Node();

            var size = 10;
            var geom = osg.createTexturedSphereGeometry( size, 20, 20 );

            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setTextureAttributeAndModes( 0, this._texture );
            geom.getOrCreateStateSet().setAttributeAndModes( this.createShader( [ '#define FLOAT_CUBEMAP_LOD' ] ) );

            scene.addChild( geom );
            return scene;
        },

        loadPacked: function ( type0 ) {
            var type = type0;
            if ( type === undefined )
                type = 'FLOAT';

            var defer = Q.defer();

            var xhr = new XMLHttpRequest();

            var error = function() {};
            var load = function() {
                var data = xhr.response;

                var maxLevel = Math.log(this._size)/Math.LN2;
                var offset = 0;
                var images = { };
                for ( var i = 0; i <= maxLevel; i++ ) {
                    var size = Math.pow(2, maxLevel - i );
                    var byteSize;
                    if ( offset >= data.byteLength )
                        break;
                    for ( var face = 0; face < 6; face++ ) {

                        // add entry if does not exist
                        if (!images[osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + face])
                            images[osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + face] = [];

                        var imageData;
                        if ( type === 'FLOAT' ) {
                            byteSize = size*size*4*3;
                            imageData = new Float32Array( data, offset, byteSize/4 );
                         } else {
                            byteSize = size*size*4;
                            imageData = new Uint8Array( data, offset, byteSize );
                         }

                        var image = new osg.Image();
                        image.setImage( imageData );

                        image.setWidth( size );
                        image.setHeight( size );
                        images[osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + face].push(image);
                        offset += byteSize;
                    }
                }

                this._packedImages = images;

                if ( type === 'FLOAT' )
                    this.createFloatPacked();
                else
                    this.createRGBA8Packed();


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

        getTexture: function() {
            return this._texture;
        },

        createFloatPacked: function() {

            var texture = new osg.TextureCubeMap();
            texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            // texture.setMinFilter( 'NEAREST_MIPMAP_NEAREST' );
            // texture.setMagFilter( 'NEAREST' );
            texture.setType('FLOAT');
            texture.setFlipY(false);

            for ( var j = 0 ; j < 6 ; j++ ) {
                var f = osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + j;
                texture.setImage( f , this._packedImages[f], 'RGB' );
            }
            this._texture = texture;
            return texture;
        },

        createRGBA8Packed: function() {

            var texture = new osg.TextureCubeMap();
            texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            // texture.setMinFilter( 'NEAREST_MIPMAP_NEAREST' );
            // texture.setMagFilter( 'NEAREST' );
            texture.setFlipY(false);

            for ( var j = 0 ; j < 6 ; j++ ) {
                var f = osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + j;
                texture.setImage( f , this._packedImages[f], 'RGBA' );
            }
            this._texture = texture;
            return texture;
        },

        createFloatCubeMapPackedDebugGeometry: function () {

            var scene = new osg.Node();

            var size = 10;
            var geom = osg.createTexturedSphereGeometry( size, 20, 20 );

            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setTextureAttributeAndModes( 0, this._texture );
            geom.getOrCreateStateSet().setAttributeAndModes( this.createShader( [ '#define FLOAT',
                                                                                  '#define CUBEMAP_LOD',
                                                                                  '#define CUBEMAP_SEAMLESS'] ) );

            scene.addChild( geom );
            return scene;
        }


    };

    return CubeMapEnv;
} )();
