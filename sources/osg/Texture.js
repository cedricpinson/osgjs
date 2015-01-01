define( [
    'Q',
    'osg/Notify',
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Uniform',
    'osg/Image',
    'osgDB/ReaderParser',
    'osg/Map'
], function ( Q, Notify, MACROUTILS, StateAttribute, Uniform, Image, ReaderParser, Map ) {

    'use strict';

    // helper
    var isPowerOf2 = function ( x ) {
        /*jshint bitwise: false */
        return ( ( x !== 0 ) && ( ( x & ( ~x + 1 ) ) === x ) );
        /*jshint bitwise: true */
    };


    var checkAndFixEnum = function ( mode, fallback ) {
        var value = Texture[ mode ];
        if ( value === undefined ) {
            Notify.warn( 'bad Texture enum argument ' + mode + '\n' + 'fallback to ' + fallback );
            return fallback;
        }
        return value;
    };


    /**
     * Texture encapsulate webgl texture object
     * @class Texture
     * Not that dirty here is mainly for texture binding
     * any dirty will cause re-bind
     * hint: don't dirty a texture attached to a camera/framebuffer
     * it will end blank
     * @inherits StateAttribute
     */
    var Texture = function () {
        StateAttribute.call( this );
        this.setDefaultParameters();
        this._dirtyMipmap = true;
        this._applyTexImage2DCallbacks = [];
        this._textureObject = undefined;

        this._textureNull = true;
    };

    Texture.UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;
    Texture.UNPACK_FLIP_Y_WEBGL = 0x9240;
    Texture.BROWSER_DEFAULT_WEBGL = 0x9244;
    Texture.NONE = 0x0;

    Texture.DEPTH_COMPONENT = 0x1902;
    Texture.ALPHA = 0x1906;
    Texture.RGB = 0x1907;
    Texture.RGBA = 0x1908;
    Texture.LUMINANCE = 0x1909;
    Texture.LUMINANCE_ALPHA = 0x190A;

    // filter mode
    Texture.LINEAR = 0x2601;
    Texture.NEAREST = 0x2600;
    Texture.NEAREST_MIPMAP_NEAREST = 0x2700;
    Texture.LINEAR_MIPMAP_NEAREST = 0x2701;
    Texture.NEAREST_MIPMAP_LINEAR = 0x2702;
    Texture.LINEAR_MIPMAP_LINEAR = 0x2703;
    // filter anisotropy
    Texture.TEXTURE_MAX_ANISOTROPY_EXT = 0x84FE;
    Texture.MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF;

    // wrap mode
    Texture.CLAMP_TO_EDGE = 0x812F;
    Texture.REPEAT = 0x2901;
    Texture.MIRRORED_REPEAT = 0x8370;

    // target
    Texture.TEXTURE_2D = 0x0DE1;
    Texture.TEXTURE_CUBE_MAP = 0x8513;
    Texture.TEXTURE_BINDING_CUBE_MAP = 0x8514;
    Texture.TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
    Texture.TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
    Texture.TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
    Texture.TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
    Texture.TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
    Texture.TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851A;
    Texture.MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;

    Texture.UNSIGNED_BYTE = 0x1401;
    Texture.FLOAT = 0x1406;
    Texture.HALF_FLOAT_OES = Texture.HALF_FLOAT = 0x8D61;

    Texture.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {
        attributeType: 'Texture',

        // clone a default instance of that attribute type
        cloneType: function () {
            return new Texture();
        },

        getOrCreateUniforms: function ( unit ) {
            if ( Texture.uniforms === undefined ) {
                Texture.uniforms = [];
            }
            if ( Texture.uniforms[ unit ] === undefined ) {
                var name = this.getType() + unit;
                var uniformMap = new Map();
                var uniform = Uniform.createInt1( unit, name );
                uniformMap.setMap( {
                    texture: uniform
                } );

                uniform.dirty();
                Texture.uniforms[ unit ] = uniformMap;
            }

            // uniform for an texture attribute should directly in Texture.uniforms[unit]
            // and not in Texture.uniforms[unit][Texture0]

            // Why it's in Texture.uniforms[unit]['texture'] :
            // a 'texture' is a texture attribute but you also have old texenv
            //  that are texture attribute because  they are applied on a texture unit.
            // I admit that currently we dont have this or we used to but we dont have it anymore.
            // It's the same design than osg.
            // We could imagine for example a TextureGreyScale texture attributes,
            // that would transform the input texture
            // on unit X into greyscale used in the shader.

            return Texture.uniforms[ unit ];
        },

        setDefaultParameters: function () {
            this._image = undefined;
            this._magFilter = Texture.LINEAR;
            this._minFilter = Texture.LINEAR;
            this._maxAnisotropy = 1.0;
            this._wrapS = Texture.CLAMP_TO_EDGE;
            this._wrapT = Texture.CLAMP_TO_EDGE;
            this._textureWidth = 0;
            this._textureHeight = 0;
            this._unrefImageDataAfterApply = false;
            this._internalFormat = undefined;
            this._dirtyMipmap = true;
            this._textureTarget = Texture.TEXTURE_2D;
            this._type = Texture.UNSIGNED_BYTE;

            this._flipY = true;
            this._colorSpaceConversion = Texture.NONE; //Texture.BROWSER_DEFAULT_WEBGL;
        },

        // check https://www.khronos.org/registry/webgl/specs/latest/1.0/#PIXEL_STORAGE_PARAMETERS
        setColorSpaceConversion: function ( enumValue ) {
            this._colorSpaceConversion = enumValue;
        },

        setFlipY: function ( bool ) {
            this._flipY = bool;
        },


        getTextureTarget: function () {
            return this._textureTarget;
        },
        getTextureObject: function () {
            return this._textureObject;
        },
        setTextureSize: function ( w, h ) {
            if ( w !== undefined ) this._textureWidth = w;
            if ( h !== undefined ) this._textureHeight = h;

            this._textureNull = false;
        },

        init: function ( state ) {
            if ( !this._textureObject ) {
                this._textureObject = state.getTextureManager().generateTextureObject( state.getGraphicContext(),
                    this,
                    this._textureTarget,
                    this._internalFormat,
                    this._textureWidth,
                    this._textureHeight );

                this.dirty();
                this._dirtyTextureObject = false;
                this._textureNull = false;
            }
        },

        addApplyTexImage2DCallback: function ( callback ) {
            var index = this._applyTexImage2DCallbacks.indexOf( callback );
            if ( index < 0 ) {
                this._applyTexImage2DCallbacks.push( callback );
            }
        },
        removeApplyTexImage2DCallback: function ( callback ) {
            var index = this._applyTexImage2DCallbacks.indexOf( callback );
            if ( index >= 0 ) {
                this._applyTexImage2DCallbacks.splice( index, 1 );
            }
        },
        getWidth: function () {
            return this._textureWidth;
        },
        getHeight: function () {
            return this._textureHeight;
        },

        releaseGLObjects: function ( state ) {
            if ( this._textureObject !== undefined && this._textureObject !== null ) {
                state.getTextureManager().releaseTextureObject( this._textureObject );
                this._textureObject = undefined;
            }
        },


        getWrapT: function () {
            return this._wrapT;
        },
        getWrapS: function () {
            return this._wrapS;
        },

        setWrapS: function ( value ) {

            if ( typeof ( value ) === 'string' ) {

                this._wrapS = checkAndFixEnum( value, Texture.CLAMP_TO_EDGE );

            } else {

                this._wrapS = value;
            }

            this.dirtyTextureParameters();

        },

        setWrapT: function ( value ) {

            if ( typeof ( value ) === 'string' ) {

                this._wrapT = checkAndFixEnum( value, Texture.CLAMP_TO_EDGE );

            } else {

                this._wrapT = value;
            }

            this.dirtyTextureParameters();
        },

        // TODO CP:
        // we should split dirty texture object of parameters
        // dirty parameters only regenarate parameter
        // dirty texture object needs to release a texture and
        // re allocate one
        dirtyTextureParameters: function () {
            this.dirty(); // make everything dirty for now
            this.dirtyMipmap();
            this.dirtyTextureObject();
        },

        dirtyTextureObject: function () {
            this._dirtyTextureObject = true;
            this.dirtyMipmap();
            this.dirty(); // make everything dirty for now
        },


        getMinFilter: function () {
            return this._minFilter;
        },
        getMagFilter: function () {
            return this._magFilter;
        },

        // https://www.opengl.org/registry/specs/EXT/texture_filter_anisotropic.txt
        setMaxAnisotropy: function ( multiplier ) {
            this._maxAnisotropy = multiplier;
            this.dirtyTextureParameters();
        },

        getMaxAnisotropy: function () {
            return this._maxAnisotropy;
        },

        // some value enable mipmapping
        setMinFilter: function ( value ) {
            if ( typeof ( value ) === 'string' ) {
                this._minFilter = checkAndFixEnum( value, Texture.LINEAR );
            } else {
                this._minFilter = value;
            }
            this.dirtyTextureParameters();
        },

        // Either Linear or nearest.
        setMagFilter: function ( value ) {

            if ( typeof ( value ) === 'string' ) {
                this._magFilter = checkAndFixEnum( value, Texture.LINEAR );
            } else {
                this._magFilter = value;
            }
            this.dirtyTextureParameters();
        },

        setImage: function ( img, imageFormat ) {

            var image = img;
            if ( img instanceof window.Image ||
                img instanceof HTMLCanvasElement ||
                img instanceof Uint8Array ) {
                image = new Image( img );
            }

            this._image = image;
            this.setImageFormat( imageFormat );
            if ( image ) {
                if ( image.getWidth && image.getHeight ) {
                    this.setTextureSize( image.getWidth(), image.getHeight() );
                } else if ( image.width && image.height ) {
                    this.setTextureSize( image.width, image.height );
                }
            }
            this._textureNull = false;
            this.dirty();
        },

        getImage: function () {
            return this._image;
        },

        setImageFormat: function ( imageFormat ) {
            if ( imageFormat ) {
                if ( typeof ( imageFormat ) === 'string' ) {
                    imageFormat = Texture[ imageFormat ];
                }
                this._imageFormat = imageFormat;
            } else {
                this._imageFormat = Texture.RGBA;
            }
        },

        setType: function ( value ) {
            Notify.log( 'Texture.setType is deprecated, use instead Texture.setInternalFormatType' );
            this.setInternalFormatType( value );
        },

        setInternalFormatType: function ( value ) {
            if ( typeof ( value ) === 'string' ) {
                this._type = Texture[ value ];
            } else {
                this._type = value;
            }
        },
        getInternalFormatType: function () {
            return this._type;
        },

        setUnrefImageDataAfterApply: function ( bool ) {
            this._unrefImageDataAfterApply = bool;
        },

        setInternalFormat: function ( formatSource ) {
            var format = formatSource;
            if ( format ) {
                if ( typeof ( format ) === 'string' ) {
                    format = Texture[ format ];
                }
            } else {
                format = Texture.RGBA;
            }

            this._internalFormat = format;
        },

        getInternalFormat: function () {
            return this._internalFormat;
        },

        isDirtyMipmap: function () {
            return this._dirtyMipmap;
        },
        // Will cause the mipmaps to be regenerated on the next bind of the texture
        // Nothing will be done if the minFilter is not of the form XXX_MIPMAP_XXX
        dirtyMipmap: function () {
            this._dirtyMipmap = true;
        },

        applyFilterParameter: function ( gl, target ) {


            var powerOfTwo = isPowerOf2( this._textureWidth ) && isPowerOf2( this._textureHeight );
            if ( !powerOfTwo ) {
                // NPOT non support in webGL explained here
                // https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
                // so disabling mipmap...
                this._wrapT = Texture.CLAMP_TO_EDGE;
                this._wrapS = Texture.CLAMP_TO_EDGE;

                if ( this._minFilter === Texture.LINEAR_MIPMAP_LINEAR ||
                    this._minFilter === Texture.LINEAR_MIPMAP_NEAREST ) {
                    this._minFilter = Texture.LINEAR;
                }
            }
            gl.texParameteri( target, gl.TEXTURE_MAG_FILTER, this._magFilter );
            gl.texParameteri( target, gl.TEXTURE_MIN_FILTER, this._minFilter );


            // handle extension EXT_texture_filter_anisotropic
            if ( this._maxAnisotropy > 1.0 && Texture.ANISOTROPIC_SUPPORT_EXT ) {
                var multiplier = this._maxAnisotropy < Texture.ANISOTROPIC_SUPPORT_MAX ? this._maxAnisotropy : Texture.ANISOTROPIC_SUPPORT_MAX;
                gl.texParameterf( target, Texture.TEXTURE_MAX_ANISOTROPY_EXT, multiplier );
            }

            gl.texParameteri( target, gl.TEXTURE_WRAP_S, this._wrapS );
            gl.texParameteri( target, gl.TEXTURE_WRAP_T, this._wrapT );

        },

        generateMipmap: function ( gl, target ) {

            if ( this.hasMipmapFilter() ) {
                gl.generateMipmap( target );
                this._dirtyMipmap = false;
            }
        },

        // return true if contains a mipmap filter
        hasMipmapFilter: function () {
            return ( this._minFilter === Texture.NEAREST_MIPMAP_NEAREST ||
                this._minFilter === Texture.LINEAR_MIPMAP_NEAREST ||
                this._minFilter === Texture.NEAREST_MIPMAP_LINEAR ||
                this._minFilter === Texture.LINEAR_MIPMAP_LINEAR );
        },

        applyTexImage2D: function ( gl ) {
            var args = Array.prototype.slice.call( arguments, 1 );
            MACROUTILS.timeStamp( 'osgjs.metrics:Texture.texImage2d' );

            // use parameters of pixel store
            gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, this._flipY );
            gl.pixelStorei( gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this._colorSpaceConversion );

            gl.texImage2D.apply( gl, args );

            // call a callback when upload is done if there is one
            var numCallback = this._applyTexImage2DCallbacks.length;
            if ( numCallback > 0 ) {
                for ( var i = 0, l = numCallback; i < l; i++ ) {
                    this._applyTexImage2DCallbacks[ i ].call( this );
                }
            }
        },
        computeTextureFormat: function () {
            if ( !this._internalFormat ) {
                this._internalFormat = this._imageFormat || Texture.RGBA;
                this._imageFormat = this._internalFormat;
            } else {
                this._imageFormat = this._internalFormat;
            }

        },
        apply: function ( state ) {

            // if need to release the texture
            if ( this._dirtyTextureObject ) {
                this.releaseGLObjects( state );
                this._dirtyTextureObject = false;
            }

            var gl = state.getGraphicContext();

            if ( this._textureObject !== undefined && !this.isDirty() ) {
                this._textureObject.bind( gl );
                // If we have modified the texture via Rtt or texSubImage2D and _need_ updated mipmaps,
                // then we must regenerate the mipmaps explicitely.
                // In all other cases, don't set this flag because it can be costly
                if ( this.isDirtyMipmap() ) {
                    this.generateMipmap( gl, this._textureTarget );
                }

            } else if ( this._textureNull ) {

                gl.bindTexture( this._textureTarget, null );

            } else {

                var image = this._image;
                if ( image !== undefined ) {

                    // when data is ready we will upload it to the gpu
                    if ( image.isReady() ) {

                        // must be called before init
                        this.computeTextureFormat();

                        var imgWidth = image.getWidth() || this._textureWidth;
                        var imgHeight = image.getHeight() || this._textureHeight;

                        this.setTextureSize( imgWidth, imgHeight );

                        if ( !this._textureObject ) {
                            this.init( state );
                        }

                        this._textureObject.bind( gl );

                        if ( image.isTypedArray() ) {
                            this.applyTexImage2D( gl,
                                this._textureTarget,
                                0,
                                this._internalFormat,
                                this._textureWidth,
                                this._textureHeight,
                                0,
                                this._internalFormat,
                                this._type,
                                this._image.getImage() );
                        } else {
                            this.applyTexImage2D( gl,
                                this._textureTarget,
                                0,
                                this._internalFormat,
                                this._internalFormat,
                                this._type,
                                image.getImage() );
                        }

                        this.applyFilterParameter( gl, this._textureTarget );
                        this.generateMipmap( gl, this._textureTarget );

                        if ( this._unrefImageDataAfterApply ) {
                            this._image = undefined;
                        }

                        this.setDirty( false );

                    } else {
                        gl.bindTexture( this._textureTarget, null );
                    }

                } else if ( this._textureHeight !== 0 && this._textureWidth !== 0 ) {

                    // must be called before init
                    this.computeTextureFormat();

                    if ( !this._textureObject ) {
                        this.init( state );
                    }
                    this._textureObject.bind( gl );
                    this.applyTexImage2D( gl, this._textureTarget, 0, this._internalFormat, this._textureWidth, this._textureHeight, 0, this._internalFormat, this._type, null );

                    this.applyFilterParameter( gl, this._textureTarget );
                    this.generateMipmap( gl, this._textureTarget );
                    this.setDirty( false );
                }
            }
        }
    } ), 'osg', 'Texture' );

    MACROUTILS.setTypeID( Texture );

    Texture.createFromImage = function ( image, format ) {
        var a = new Texture();
        a.setImage( image, format );
        return a;
    };

    Texture.createFromCanvas = function ( canvas, format ) {
        return Texture.createFromImage( canvas, format );
    };

    Texture.create = function ( url ) {
        Notify.log( 'Texture.create is deprecated, use Texture.createFromURL instead' );
        return Texture.createFromURL( url );
    };

    Texture.createFromURL = function ( imageSource, format ) {
        Notify.log( 'Texture.createFromURL is deprecated, use instead osgDB.readImageURL' );
        var texture = new Texture();
        Q.when( ReaderParser.readImage( imageSource ) ).then(
            function ( img ) {
                texture.setImage( img, format );
            }
        );
        return texture;
    };


    return Texture;
} );
