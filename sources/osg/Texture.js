'use strict';
var Notify = require( 'osg/notify' );
var MACROUTILS = require( 'osg/Utils' );
var StateAttribute = require( 'osg/StateAttribute' );
var Uniform = require( 'osg/Uniform' );
var Image = require( 'osg/Image' );
var GLObject = require( 'osg/GLObject' );

var TextureManager = require( 'osg/TextureManager' );
var WebglCaps = require( 'osg/WebGLCaps' );

var ImageBitmap = window.ImageBitmap || function () {};

// helper
var isPowerOf2 = function ( x ) {
    /*jshint bitwise: false */
    return ( ( x !== 0 ) && ( ( x & ( ~x + 1 ) ) === x ) );
    /*jshint bitwise: true */
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
    GLObject.call( this );
    this.setDefaultParameters();
    this._dirty = true;
    this._dirtyMipmap = true;
    this._applyTexImage2DCallbacks = [];
    this._textureObject = undefined;

    this._textureNull = true;
};

var checkAndFixEnum = function ( mode, fallback ) {

    var value = Texture[ mode ];

    if ( value === undefined ) {
        Notify.warn( 'bad Texture enum argument ' + mode + '\n' + 'fallback to ' + fallback );
        return fallback;
    }

    return value;
};

Texture.UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;
Texture.UNPACK_FLIP_Y_WEBGL = 0x9240;
Texture.BROWSER_DEFAULT_WEBGL = 0x9244;
Texture.NONE = 0x0;

Texture.DEPTH_COMPONENT = 0x1902;
Texture.DEPTH_COMPONENT16 = 0x81A5;
Texture.DEPTH_STENCIL = 0x84F9;
// gl2
Texture.DEPTH24_STENCIL8 = 0x88F0;
Texture.DEPTH_COMPONENT24 = 0x81A6;
Texture.DEPTH_COMPONENT32F = 0x8CAC;

// DXT formats, from:
// http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
Texture.COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
Texture.COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
Texture.COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
Texture.COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

// ATC formats, from:
// http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_atc/
Texture.COMPRESSED_RGB_ATC_WEBGL = 0x8C92;
Texture.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 0x8C93;
Texture.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87EE;

// PVR formats, from:
// http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
Texture.COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
Texture.COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8C01;
Texture.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
Texture.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

// ETC1 format, from:
// http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc1/
Texture.COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

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

// https: //www.khronos.org/registry/webgl/specs/latest/2.0/#3.7.6
///////////
// TYPE GL1
///////////
Texture.UNSIGNED_BYTE = 0x1401;
Texture.UNSIGNED_SHORT = 0x1403;
Texture.UNSIGNED_SHORT_4_4_4_4 = 0x8033;
Texture.UNSIGNED_SHORT_5_5_5_1 = 0x8034;
Texture.UNSIGNED_SHORT_5_6_5 = 0x8363;
Texture.FLOAT = 0x1406;
Texture.HALF_FLOAT_OES = 0x8D61;
// TYPE GL2
Texture.HALF_FLOAT = 0x140B;
Texture.UNSIGNED_INT_10F_11F_11F_REV = 0x8C3B;
Texture.UNSIGNED_INT_24_8 = 0x84FA;

/////////////
// FORMAT GL1
/////////////
Texture.ALPHA = 0x1906;
Texture.RGB = 0x1907;
Texture.RGBA = 0x1908;
Texture.LUMINANCE = 0x1909;
Texture.LUMINANCE_ALPHA = 0x190A;
// format gl2
Texture.RED_INTEGER = 0x8D94;
Texture.RGB_INTEGER = 0x8D98;
Texture.RGBA_INTEGER = 0x8D99;
Texture.RG_INTEGER = 0x8228;
Texture.RED = 0x1903;

//////////////////////
// INTERNAL FORMAT GL2
//////////////////////
Texture.R8 = 0x8229;
Texture.R8UI = 0x8232;
Texture.RG8 = 0x822B;
Texture.RG8UI = 0x8238;
Texture.RGB8 = 0x8F96;
Texture.RGB565 = 0x8D62;
Texture.RGB9_E5 = 0x8C3D;
Texture.RGB8UI = 0x8D7D;
Texture.RGBA8 = 0x8058;
Texture.RGB5_A1 = 0x8057;
Texture.RGBA4 = 0x8056;
Texture.RGBA8UI = 0x8D7C;
Texture.SRGB8_ALPHA8 = 0x8C43;
Texture.SRGB8 = 0x8C41;

// HALF FLOAT - FLOAT
Texture.R16F = 0x822D;
Texture.RG16F = 0x822F;
Texture.RGB16F = 0x881B;
Texture.RGBA16F = 0x881A;
Texture.R11F_G11F_B10F = 0x8C3A; // and UNSIGNED_INT_10F_11F_11F_REV
// FLOAT
Texture.R32F = 0x822E;
Texture.RG32F = 0x8230;
Texture.RGB32F = 0x8815;
Texture.RGBA32F = 0x8814;

var createMapGl2ToGl1 = function () {
    var map = {};

    map[ Texture.R8 ] = Texture.LUMINANCE;
    map[ Texture.R8UI ] = Texture.LUMINANCE;
    map[ Texture.R16F ] = Texture.LUMINANCE;
    map[ Texture.R32F ] = Texture.LUMINANCE;
    map[ Texture.SRGB8 ] = Texture.LUMINANCE;
    map[ Texture.RG8 ] = Texture.RGB;
    map[ Texture.RG8UI ] = Texture.RGB;
    map[ Texture.RG16F ] = Texture.RGB;
    map[ Texture.RG32F ] = Texture.RGB;
    map[ Texture.RGB8 ] = Texture.RGB;
    map[ Texture.RGB565 ] = Texture.RGB;
    map[ Texture.RGB9_E5 ] = Texture.RGB;
    map[ Texture.RGB8UI ] = Texture.RGB;
    map[ Texture.RGB5_A1 ] = Texture.RGB;
    map[ Texture.RGB16F ] = Texture.RGB;
    map[ Texture.RGB32F ] = Texture.RGB;
    map[ Texture.RGBA8 ] = Texture.RGBA;
    map[ Texture.R11F_G11F_B10F ] = Texture.RGBA;
    map[ Texture.RGBA16F ] = Texture.RGBA;
    map[ Texture.RGBA32F ] = Texture.RGBA;
    map[ Texture.SRGB8_ALPHA8 ] = Texture.RGBA;

    return map;
};

var createMapGl1ToGl2 = function () {
    var map = {};

    var float = {};
    var halfFloat = {};
    var ushort = {};
    var uint = {};
    var uin24 = {};

    map[ Texture.FLOAT ] = float;
    map[ Texture.HALF_FLOAT ] = map[ Texture.HALF_FLOAT_OES ] = halfFloat;
    map[ Texture.UNSIGNED_SHORT ] = ushort;
    map[ Texture.UNSIGNED_INT ] = uint;
    map[ Texture.UNSIGNED_INT_24_8 ] = uin24;

    halfFloat[ Texture.LUMINANCE ] = Texture.R16F;
    halfFloat[ Texture.RGB ] = Texture.RGB16F;
    halfFloat[ Texture.RGBA ] = Texture.RGBA16F;

    float[ Texture.LUMINANCE ] = Texture.R32F;
    float[ Texture.RGB ] = Texture.RGB32F;
    float[ Texture.RGBA ] = Texture.RGBA32F;

    ushort[ Texture.DEPTH_COMPONENT ] = Texture.DEPTH_COMPONENT16;
    uint[ Texture.DEPTH_COMPONENT ] = Texture.DEPTH_COMPONENT32F;
    uin24[ Texture.DEPTH_STENCIL ] = Texture.DEPTH24_STENCIL8;

    return map;
};

var internalFormatGl2ToGl1 = createMapGl2ToGl1();
var internalFormatGl1ToGl2 = createMapGl1ToGl2();

Texture._sTextureManager = new window.Map();

// Getter for textureManager
Texture.getTextureManager = function ( gl ) {

    if ( !Texture._sTextureManager.has( gl ) )
        Texture._sTextureManager.set( gl, new TextureManager() );

    return Texture._sTextureManager.get( gl );
};

Texture.getEnumFromString = function ( v ) {

    var value = v;

    if ( typeof ( value ) === 'string' )
        value = checkAndFixEnum( value, v );

    return value;
};

MACROUTILS.createPrototypeStateAttribute( Texture, MACROUTILS.objectInherit( GLObject.prototype, MACROUTILS.objectInherit( StateAttribute.prototype, {

    attributeType: 'Texture',

    cloneType: function () {
        return new Texture();
    },

    dirty: function () {
        this._dirty = true;
    },

    isDirty: function () {
        return this._dirty;
    },

    isTextureNull: function () {
        return this._textureNull;
    },

    getOrCreateUniforms: function ( unit ) {

        if ( Texture.uniforms === undefined ) {
            Texture.uniforms = [];
        }
        if ( Texture.uniforms[ unit ] === undefined ) {
            var name = this.getType() + unit;
            Texture.uniforms[ unit ] = {
                texture: Uniform.createInt1( unit, name )
            };
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
        this._isCompressed = false;

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

        var maxSize = WebglCaps.instance().getWebGLParameter( 'MAX_TEXTURE_SIZE' );

        if ( w !== this._textureWidth || h !== this._textureHeight )
            this.dirty();

        if ( w !== undefined ) {
            if ( w > maxSize ) {
                Notify.error( 'width (' + w + ') too big for GPU. Max Texture Size is "' + maxSize + '"' );
                this._textureWidth = maxSize;
            } else {
                this._textureWidth = w;
            }
        }

        if ( h !== undefined ) {
            if ( h > maxSize ) {
                Notify.error( 'height (' + h + ') too big for GPU. Max Texture Size is "' + maxSize + '"' );
                this._textureHeight = maxSize;
            } else {
                this._textureHeight = h;
            }
        }

        this._textureNull = false;
    },

    init: function ( state ) {

        if ( !this._gl ) this.setGraphicContext( state.getGraphicContext() );

        if ( !this._textureObject ) {
            this._textureObject = Texture.getTextureManager( this._gl ).generateTextureObject( this._gl,
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

    releaseGLObjects: function () {

        if ( this._textureObject !== undefined && this._textureObject !== null && this._gl !== undefined ) {
            Texture.getTextureManager( this._gl ).releaseTextureObject( this._textureObject );
        }
        this._textureObject = undefined;
    },

    getWrapT: function () {
        return this._wrapT;
    },

    getWrapS: function () {
        return this._wrapS;
    },

    setWrapS: function ( value ) {

        if ( typeof value === 'string' ) {
            this._wrapS = checkAndFixEnum( value, Texture.CLAMP_TO_EDGE );
        } else {
            this._wrapS = value;
        }

        this.dirtyTextureParameters();

    },

    setWrapT: function ( value ) {

        if ( typeof value === 'string' ) {
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
            img instanceof ImageBitmap ||
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

    setImageFormat: function ( format ) {

        var imageFormat = format;
        if ( imageFormat ) {

            if ( typeof imageFormat === 'string' )
                imageFormat = Texture[ imageFormat ];

            this._imageFormat = imageFormat;
        } else {
            this._imageFormat = Texture.RGBA;
        }
    },

    setInternalFormatType: function ( value ) {
        // UNSIGNED_BYTE, HALF_FLOAT, FLOAT

        if ( typeof value === 'string' ) {
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

    checkIsCompressed: function ( format ) {

        var fo = format || this._internalFormat;
        switch ( fo ) {
        case Texture.COMPRESSED_RGB_S3TC_DXT1_EXT:
        case Texture.COMPRESSED_RGBA_S3TC_DXT1_EXT:
        case Texture.COMPRESSED_RGBA_S3TC_DXT3_EXT:
        case Texture.COMPRESSED_RGBA_S3TC_DXT5_EXT:
        case Texture.COMPRESSED_RGB_ATC_WEBGL:
        case Texture.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
        case Texture.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
        case Texture.COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
        case Texture.COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
        case Texture.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
        case Texture.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
        case Texture.COMPRESSED_RGB_ETC1_WEBGL:
            return true;
        default:
            return false;
        }
    },

    setInternalFormat: function ( formatSource ) {
        // RGB, RGBA, ALPHA, LUMINANCE, LUMINANCE_ALPHA
        // RGB16F, RGB32F, etc...
        // DEPTH_COMPONENT, DEPTH_STENCIL

        var format = formatSource;
        if ( format ) {

            if ( typeof format === 'string' )
                format = Texture[ format ];

            this._isCompressed = this.checkIsCompressed( format );

        } else {
            this._isCompressed = false;
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
    // TODO : not to be used if the texture is compressed !
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

        this._dirtyMipmap = false;
        if ( !this.hasMipmapFilter() ) return;

        // manual mipmap provided
        var img = this._image;
        if ( img && img.hasMipmap() ) {

            var internalFormat = this._getInternalFormatGL();
            var mips = img.getMipmap();
            for ( var level = 1, nbLevel = mips.length; level < nbLevel; level++ ) {
                var imi = mips[ level ];
                if ( this._isCompressed )
                    this.applyTexImage2D( gl, this._textureTarget, level, internalFormat, imi.getWidth(), imi.getHeight(), 0, imi.getImage() );
                else
                    this.applyTexImage2D( gl, this._textureTarget, level, internalFormat, imi.getWidth(), imi.getHeight(), 0, this._internalFormat, this._type, imi.getImage() );
            }

        } else {
            // automatic mipmap
            gl.generateMipmap( target );
        }
    },

    // return true if contains a mipmap filter
    hasMipmapFilter: function () {

        return this._minFilter === Texture.NEAREST_MIPMAP_NEAREST ||
            this._minFilter === Texture.LINEAR_MIPMAP_NEAREST ||
            this._minFilter === Texture.NEAREST_MIPMAP_LINEAR ||
            this._minFilter === Texture.LINEAR_MIPMAP_LINEAR;
    },

    applyTexImage2D: function ( gl ) {

        var args = Array.prototype.slice.call( arguments, 1 );
        MACROUTILS.timeStamp( 'osgjs.metrics:Texture.texImage2d' );

        // use parameters of pixel store
        gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, this._flipY );
        gl.pixelStorei( gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this._colorSpaceConversion );

        if ( this._isCompressed ) gl.compressedTexImage2D.apply( gl, args );
        else gl.texImage2D.apply( gl, args );

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

    applyImage: function ( gl ) {

        var internalFormat = this._getInternalFormatGL();
        var image = this._image || null;
        var data = image && this._image.getImage();

        var type = this._getTypeGL();

        if ( this._isCompressed ) {
            this.applyTexImage2D( gl, this._textureTarget, 0, internalFormat, this._textureWidth, this._textureHeight, 0, data );
        } else if ( !data || image.isTypedArray() ) {
            this.applyTexImage2D( gl, this._textureTarget, 0, internalFormat, this._textureWidth, this._textureHeight, 0, this._internalFormat, type, data );
        } else {
            this.applyTexImage2D( gl, this._textureTarget, 0, internalFormat, this._internalFormat, type, data );
        }

        if ( image ) image.setDirty( false );

    },

    apply: function ( state ) {

        var gl = state.getGraphicContext();
        // if need to release the texture
        if ( this._dirtyTextureObject ) {
            this.releaseGLObjects();
            this._dirtyTextureObject = false;
        }

        if ( this._textureObject !== undefined && !this.isDirty() ) {
            this._textureObject.bind( gl );
            // If we have modified the texture via Rtt or texSubImage2D and _need_ updated mipmaps,
            // then we must regenerate the mipmaps explicitely.
            // In all other cases, don't set this flag because it can be costly
            if ( this.isDirtyMipmap() ) {
                this.generateMipmap( gl, this._textureTarget );
            }

            // image update like video
            if ( this._image !== undefined && this._image.isDirty() ) {
                this.applyImage( gl );
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

                    this.applyImage( gl );
                    this.applyFilterParameter( gl, this._textureTarget );
                    this.generateMipmap( gl, this._textureTarget );

                    if ( this._unrefImageDataAfterApply ) {
                        this._image = undefined;
                    }

                    this._dirty = false;

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

                this.applyImage( gl );

                this.applyFilterParameter( gl, this._textureTarget );
                this.generateMipmap( gl, this._textureTarget );
                this._dirty = false;
            }
        }
    },

    _getInternalFormatGL: function () {
        var internalFormat = this._internalFormat;

        // gl1
        if ( !WebglCaps.instance().isWebGL2() ) {
            return internalFormatGl2ToGl1[ internalFormat ] || internalFormat;
        }

        // gl2
        var map = internalFormatGl1ToGl2[ this._type ];
        return ( map && map[ internalFormat ] ) || internalFormat;
    },

    _getTypeGL: function () {
        if ( this._type === Texture.HALF_FLOAT && !WebglCaps.instance().isWebGL2() )
            return Texture.HALF_FLOAT_OES;
        return this._type;
    }


} ) ), 'osg', 'Texture' );

Texture.textureNull = new Texture();

Texture.createFromImage = function ( image, format ) {
    var a = new Texture();
    a.setImage( image, format );
    return a;
};

Texture.createFromCanvas = function ( canvas, format ) {
    return Texture.createFromImage( canvas, format );
};

module.exports = Texture;
