define( [
    'osg/Utils',
    'osg/Texture',
    'osg/Image',
    'osg/Utils'

], function ( MACROUTILS, Texture, Image ) {
    /**
     * TextureCubeMap
     * @class TextureCubeMap
     * @inherits Texture
     */
    var TextureCubeMap = function () {
        Texture.call( this );
        this._images = {};
    };

    /** @lends TextureCubeMap.prototype */
    TextureCubeMap.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Texture.prototype, {
        setDefaultParameters: function () {
            Texture.prototype.setDefaultParameters.call( this );
            this._textureTarget = Texture.TEXTURE_CUBE_MAP;
        },
        cloneType: function () {
            var t = new TextureCubeMap();
            t.defaultType = true;
            return t;
        },
        setImage: function ( face, img, imageFormat ) {

            if ( typeof ( face ) === 'string' ) {
                face = Texture[ face ];
            }

            if ( this._images[ face ] === undefined ) {
                this._images[ face ] = {};
            }

            if ( typeof ( imageFormat ) === 'string' ) {
                imageFormat = Texture[ imageFormat ];
            }
            if ( imageFormat === undefined ) {
                imageFormat = Texture.RGBA;
            }

            var image = img;
            if ( image instanceof( Image ) === false ) {
                image = new Image( img );
            }

            this._images[ face ].image = image;
            this._images[ face ].format = imageFormat;
            this._images[ face ].dirty = true;
            this.dirty();
        },
        getImage: function ( face ) {
            return this._images[ face ].image;
        },

        applyTexImage2DLoad: function ( gl, target, level, internalFormat, format, type, image ) {
            if ( !image ) {
                return false;
            }

            if ( !image.isReady() ) {
                return false;
            }


            this.setTextureSize( image.getWidth(), image.getHeight() );

            MACROUTILS.timeStamp( 'osgjs.metrics:texImage2d' );
            gl.texImage2D( target, 0, internalFormat, internalFormat, type, image.getImage() );
            return true;
        },

        _applyImageTarget: function ( gl, internalFormat, target ) {
            var imgObject = this._images[ target ];
            if ( !imgObject ) {
                return 0;
            }

            if ( !imgObject.dirty ) {
                return 1;
            }

            if ( this.applyTexImage2DLoad( gl,
                target,
                0,
                internalFormat,
                internalFormat,
                gl.UNSIGNED_BYTE,
                imgObject.image ) ) {
                imgObject.dirty = false;
                if ( this._unrefImageDataAfterApply ) {
                    delete this._images[ target ];
                }
                return 1;
            }
            return 0;
        },

        apply: function ( state ) {
            var gl = state.getGraphicContext();

            if ( this._textureObject !== undefined && !this.isDirty() ) {
                this._textureObject.bind( gl );

            } else if ( this.defaultType ) {
                gl.bindTexture( this._textureTarget, null );

            } else {
                if ( !this._textureObject ) {

                    // must be called before init
                    this.computeTextureFormat();

                    this.init( gl );
                }
                this._textureObject.bind( gl );

                var internalFormat = this._internalFormat;

                var valid = 0;
                valid += this._applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_X );
                valid += this._applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_X );

                valid += this._applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_Y );
                valid += this._applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y );

                valid += this._applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_Z );
                valid += this._applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z );
                if ( valid === 6 ) {
                    this.setDirty( false );
                    this.applyFilterParameter( gl, this._textureTarget );
                    this.generateMipmap( gl, this._textureTarget );
                }
            } // render to cubemap not yet implemented
        }
    } ), 'osg', 'TextureCubeMap' );

    return TextureCubeMap;
} );
