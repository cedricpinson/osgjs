define( [
    'osg/Notify',
    'osg/Utils',
    'osg/StateAttribute'

], function ( Notify, MACROUTILS, StateAttribute ) {

    'use strict';

    /**
     * FrameBufferObject manage fbo / rtt
     * @class FrameBufferObject
     */
    var FrameBufferObject = function () {
        StateAttribute.call( this );
        this._fbo = undefined;
        this._attachments = [];
        this.dirty();
    };

    FrameBufferObject.COLOR_ATTACHMENT0 = 0x8CE0;
    FrameBufferObject.DEPTH_ATTACHMENT = 0x8D00;
    FrameBufferObject.DEPTH_COMPONENT16 = 0x81A5;

    /** @lends FrameBufferObject.prototype */
    FrameBufferObject.prototype = MACROUTILS.objectInherit( StateAttribute.prototype, {
        attributeType: 'FrameBufferObject',
        cloneType: function () {
            return new FrameBufferObject();
        },
        setAttachment: function ( attachment ) {
            this._attachments.push( attachment );
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

            var gl = state.getGraphicContext();
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
    } );

    return FrameBufferObject;
} );
