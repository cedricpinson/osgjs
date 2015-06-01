define( [
    'osg/Notify',
    'osg/Utils',
    'osg/GLObject',
    'osg/StateAttribute',
    'osg/Timer'

], function ( Notify, MACROUTILS, GLObject, StateAttribute, Timer ) {

    'use strict';

    /**
     * FrameBufferObject manage fbo / rtt
     * @class FrameBufferObject
     */
    var FrameBufferObject = function () {
        GLObject.call( this );
        StateAttribute.call( this );
        this._fbo = undefined;
        this._attachments = [];
        this.dirty();
    };

    FrameBufferObject.COLOR_ATTACHMENT0 = 0x8CE0;
    FrameBufferObject.DEPTH_ATTACHMENT = 0x8D00;
    FrameBufferObject.DEPTH_COMPONENT16 = 0x81A5;

    // static cache of glFrameBuffer flagged for deletion, which will actually
    // be deleted in the correct GL context.
    FrameBufferObject._sDeletedGLFrameBufferCache = new Map();

    // static method to delete FrameBuffers 
    FrameBufferObject.deleteGLBufferArray = function ( gl, fb ) {
        if ( !FrameBufferObject._sDeletedGLFrameBufferCache.has( gl ) )
            FrameBufferObject._sDeletedGLFrameBufferCache.set( gl, [] );
        FrameBufferObject._sDeletedGLFrameBufferCache.get( gl ).push( fb );
    };


    // static method to flush all the cached glFrameBuffers which need to be deleted in the GL context specified
    FrameBufferObject.flushDeletedGLFrameBuffers = function ( gl, availableTime ) {
        // if no time available don't try to flush objects.
        if ( availableTime <= 0.0 ) return availableTime;
        if ( !FrameBufferObject._sDeletedGLFrameBufferCache.has( gl ) ) return availableTime;
        var elapsedTime = 0.0;
        var beginTime = Timer.instance().tick();
        var deleteList = FrameBufferObject._sDeletedGLFrameBufferCache.get( gl );
        var numBuffers = deleteList.length;
        for ( var i = numBuffers - 1; i >= 0 && elapsedTime < availableTime; i-- ) {
            gl.deleteFrameBuffer( deleteList[ i ] );
            deleteList.splice( i, 1 );
            elapsedTime = Timer.instance().deltaS( beginTime, Timer.instance().tick() );
        }
        availableTime -= elapsedTime;
        return availableTime;
    };

    FrameBufferObject.flushAllDeletedGLFrameBuffers = function ( gl ) {
        if ( !FrameBufferObject._sDeletedGLFrameBufferCache.has( gl ) ) return;
        var deleteList = FrameBufferObject._sDeletedGLFrameBufferCache.get( gl );
        var numBuffers = deleteList.length;
        for ( var i = numBuffers - 1; i >= 0; i-- ) {
            gl.deleteFrameBuffer( deleteList[ i ] );
            deleteList.splice( i, 1 );
        }
    };

    /** @lends FrameBufferObject.prototype */
    FrameBufferObject.prototype = MACROUTILS.objectInherit( GLObject.prototype, MACROUTILS.objectInherit( StateAttribute.prototype, {
        attributeType: 'FrameBufferObject',
        cloneType: function () {
            return new FrameBufferObject();
        },
        setAttachment: function ( attachment ) {
            this._attachments.push( attachment );
        },
        releaseGLObjects: function () {
            if ( this._fbo !== undefined && this._gl !== undefined ) {
                FrameBufferObject.deleteGLFrameBuffer( this._gl, this._fbo );
            }
            this._fbo = undefined;
            // TODO: we probably need to delete also the renderBuffer
        },
        _reportFrameBufferError: function ( code ) {
            switch ( code ) {
            case 0x8CD6:
                Notify.debug( 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT' );
                break;
            case 0x8CD7:
                Notify.debug( 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT' );
                break;
            case 0x8CD9:
                Notify.debug( 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS' );
                break;
            case 0x8CDD:
                Notify.debug( 'FRAMEBUFFER_UNSUPPORTED' );
                break;
            default:
                Notify.debug( 'FRAMEBUFFER unknown error ' + code.toString( 16 ) );
            }
        },

        apply: function ( state ) {

            if ( !this._gl ) {
                this.setGraphicContext( state.getGraphicContext() );
            }
            var gl = this._gl;
            var status;

            var attachments = this._attachments;

            if ( attachments.length > 0 ) {

                if ( this.isDirty() ) {

                    if ( !this._fbo ) {
                        this._fbo = gl.createFramebuffer();
                    }

                    gl.bindFramebuffer( gl.FRAMEBUFFER, this._fbo );
                    var hasRenderBuffer = false;

                    for ( var i = 0, l = attachments.length; i < l; ++i ) {

                        var attachment = attachments[ i ];

                        // render buffer
                        if ( attachment.texture === undefined ) {

                            var rb = gl.createRenderbuffer();
                            gl.bindRenderbuffer( gl.RENDERBUFFER, rb );
                            gl.renderbufferStorage( gl.RENDERBUFFER, attachment.format, attachment.width, attachment.height );
                            gl.framebufferRenderbuffer( gl.FRAMEBUFFER, attachment.attachment, gl.RENDERBUFFER, rb );
                            hasRenderBuffer = true;

                        } else {

                            // use texture
                            var texture = attachment.texture;
                            // apply on unit 0 to init it
                            state.applyTextureAttribute( 1, texture );

                            gl.framebufferTexture2D( gl.FRAMEBUFFER, attachment.attachment, attachment.textureTarget, texture.getTextureObject().id(), 0 );

                        }

                    }

                    status = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
                    if ( status !== 0x8CD5 ) {
                        this._reportFrameBufferError( status );
                    }

                    if ( hasRenderBuffer ) { // set it to null only if used renderbuffer
                        gl.bindRenderbuffer( gl.RENDERBUFFER, null );
                    }

                    this.setDirty( false );

                } else {

                    gl.bindFramebuffer( gl.FRAMEBUFFER, this._fbo );

                    if ( Notify.reportWebGLError === true ) {

                        status = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
                        if ( status !== 0x8CD5 ) {
                            this._reportFrameBufferError( status );
                        }
                    }

                }

            } else {
                gl.bindFramebuffer( gl.FRAMEBUFFER, null );
            }
        }
    } ) );

    return FrameBufferObject;
} );
