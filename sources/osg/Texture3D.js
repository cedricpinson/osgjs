'use strict';
var MACROUTILS = require( 'osg/Utils' );
var notify = require( 'osg/notify' );
var Texture = require( 'osg/Texture' );
var WebglCaps = require( 'osg/WebGLCaps' );
var ImageOSG = require( 'osg/Image' );

/**
 * @class Texture3D
 * @inherits Texture
 */
var Texture3D = function () {

    Texture.call( this );

    this._textureWidth = 0;
    this._textureHeight = 0;
    this._textureDepth = 0;
    this._textureTarget = Texture.TEXTURE_3D;
};

Texture3D.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Texture.prototype, {

    cloneType: function () {
        return new Texture3D();
    },

    getDepth: function () {
        return this._textureDepth;
    },

    init: function ( state ) {

        if ( !this._gl ) this.setGraphicContext( state.getGraphicContext() );

        if ( !this._textureObject ) {
            this._textureObject = Texture.getTextureManager( this._gl ).generateTextureObject( this._gl,
                this,
                this._textureTarget,
                this._internalFormat,
                this._textureWidth,
                this._textureHeight,
                this._textureDepth );

            this.dirty();
            this._dirtyTextureObject = false;
            this._textureNull = false;
        }
    },

    _checkSize: function ( size, str ) {
        var maxSize = WebglCaps.instance().getWebGLParameter( 'MAX_TEXTURE_SIZE' );

        if ( size > maxSize ) {
            notify.error( str + '(' + size + ') too big for GPU. Max Texture Size is "' + maxSize + '"' );
            return maxSize;
        }
        return size;
    },

    setTextureSize: function ( w, h, d ) {

        if ( w === undefined || h === undefined || d === undefined ) {
            notify.error( 'setTextureSize invalid arguments ' + w + ' ' + h + ' ' + d );
            return;
        }

        if ( w !== this._textureWidth || h !== this._textureHeight || d !== this._textureDepth )
            this.dirty();

        this._textureWidth = this._checkSize( w, 'width' );
        this._textureHeight = this._checkSize( h, 'height' );
        this._textureDepth = this._checkSize( d, 'depth' );

        this._textureNull = false;
    },

    applyTexImage3D: function ( gl ) {

        var args = Array.prototype.slice.call( arguments, 1 );
        MACROUTILS.timeStamp( 'osgjs.metrics:Texture.texImage3d' );

        // use parameters of pixel store
        gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, this._flipY );
        gl.pixelStorei( gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this._colorSpaceConversion );

        if ( this._isCompressed ) {
            notify.warn( 'compressed texture 3d not supported yet' );
            return;
        }

        gl.texImage3D.apply( gl, args );

        // call a callback when upload is done if there is one
        var numCallback = this._applyTexImageCallbacks.length;
        if ( numCallback > 0 ) {
            for ( var i = 0, l = numCallback; i < l; i++ ) {
                this._applyTexImageCallbacks[ i ].call( this );
            }
        }

    },

    setImage: function ( image, imageFormat ) {
        if ( image instanceof ImageOSG === false ) {
            notify.warn( 'Texture3d only support osg.Image type' );
            return;
        }
        this._image = image;
        this.setImageFormat( imageFormat );
        this.setTextureSize( image.getWidth(), image.getHeight(), image.getDepth() );
        this._textureNull = false;
        this.dirty();
    },

    applyFilterParameter: function ( gl, target ) {

        gl.texParameteri( target, gl.TEXTURE_MAG_FILTER, this._magFilter );
        gl.texParameteri( target, gl.TEXTURE_MIN_FILTER, this._minFilter );

        // handle extension EXT_texture_filter_anisotropic
        if ( this._maxAnisotropy > 1.0 && Texture.ANISOTROPIC_SUPPORT_EXT ) {
            var multiplier = this._maxAnisotropy < Texture.ANISOTROPIC_SUPPORT_MAX ? this._maxAnisotropy : Texture.ANISOTROPIC_SUPPORT_MAX;
            gl.texParameterf( target, Texture.TEXTURE_MAX_ANISOTROPY_EXT, multiplier );
        }

        gl.texParameteri( target, gl.TEXTURE_WRAP_S, this._wrapS );
        gl.texParameteri( target, gl.TEXTURE_WRAP_T, this._wrapT );
        gl.texParameteri( target, gl.TEXTURE_WRAP_R, this._wrapR );

    },

    applyImage: function ( gl, image ) {

        if ( this._isCompressed ) {
            notify.warn( 'compressed texture 3d not supported yet' );
            return;
        } else if ( image.isTypedArray() ) {
            this.applyTexImage3D( gl,
                this._textureTarget,
                0,
                this._internalFormat,
                this._textureWidth,
                this._textureHeight,
                this._textureDepth,
                0,
                this._internalFormat,
                this._type,
                this._image.getImage() );
        } else {
            notify.warn( 'Texture3D.applyImage only support osg.Image' );
            return;
        }
        image.setDirty( false );

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
            // If we have modified the texture via Rtt or texSubImage and _need_ updated mipmaps,
            // then we must regenerate the mipmaps explicitely.
            // In all other cases, don't set this flag because it can be costly
            if ( this.isDirtyMipmap() ) {
                this.generateMipmap( gl, this._textureTarget );
            }

            // image update like video
            if ( this._image !== undefined && this._image.isDirty() ) {
                this.applyImage( gl, this._image );
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
                    var imgDepth = image.getDepth() || this._textureDepth;

                    this.setTextureSize( imgWidth, imgHeight, imgDepth );

                    if ( !this._textureObject ) {
                        this.init( state );
                    }

                    this._textureObject.bind( gl );

                    this.applyImage( gl, this._image );
                    this.applyFilterParameter( gl, this._textureTarget );
                    this.generateMipmap( gl, this._textureTarget );

                    if ( this._unrefImageDataAfterApply ) {
                        this._image = undefined;
                    }

                    this._dirty = false;

                } else {
                    gl.bindTexture( this._textureTarget, null );
                }

            } else if ( this._textureHeight !== 0 && this._textureWidth !== 0 && this._textureDepth !== 0 ) {

                // must be called before init
                this.computeTextureFormat();

                if ( !this._textureObject ) {
                    this.init( state );
                }
                this._textureObject.bind( gl );
                this.applyTexImage3D( gl, this._textureTarget, 0, this._internalFormat, this._textureWidth, this._textureHeight, this._textureDepth, 0, this._internalFormat, this._type, null );

                this.applyFilterParameter( gl, this._textureTarget );
                this.generateMipmap( gl, this._textureTarget );
                this._dirty = false;
            }
        }
    }


} ), 'osg', 'Texture3D' );

MACROUTILS.setTypeID( Texture3D );

module.exports = Texture3D;
