'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var FrameBufferObject = require( 'osg/FrameBufferObject' );
var Texture = require( 'osg/Texture' );
var WebglCaps = require( 'osg/WebGLCaps' );


module.exports = function () {

    test( 'FrameBufferObject', function () {

        var maxRenderBufferSize = WebglCaps.instance().getWebGLParameter( 'MAX_RENDERBUFFER_SIZE' );
        if ( maxRenderBufferSize === undefined ) {
            WebglCaps.instance().getWebGLParameters()[ 'MAX_RENDERBUFFER_SIZE' ] = 1;
            maxRenderBufferSize = 1;
        }

        ( function () {
            var gl = mockup.createFakeRenderer();
            var state = {
                getGraphicContext: function () {
                    return gl;
                },
                applyTextureAttribute: function () {}
            };


            var b = new FrameBufferObject();
            b.setAttachment( {
                texture: {
                    isDirty: function () {
                        return false;
                    },
                    getTextureObject: function () {
                        return {
                            id: function () {}
                        };
                    },
                    getWidth: function () {
                        return 1;
                    },
                    getHeight: function () {
                        return 1;
                    }
                },
                textureTarget: 'textureTarget'
            } );
            b.setAttachment( {
                format: 'texture',
                width: 1,
                height: 1
            } );

            b.dirty();
            b.apply( state );

            assert.isOk( b.getFrameBufferObject() !== undefined, 'Check we created gl framebuffer' );
            b.releaseGLObjects();
            assert.isOk( b.getFrameBufferObject() === undefined, 'Check we released gl famebuffer' );

            // check wrong frame buffer sizes
            b.setAttachment( {
                texture: {
                    isDirty: function () {
                        return false;
                    },
                    getTextureObject: function () {
                        return {
                            id: function () {}
                        };
                    },
                    getWidth: function () {
                        return maxRenderBufferSize + 1;
                    },
                    getHeight: function () {
                        return maxRenderBufferSize + 1;
                    }
                },
                textureTarget: 'textureTarget'
            } );
            b.setAttachment( {
                format: 'texture',
                width: maxRenderBufferSize + 1,
                height: maxRenderBufferSize + 1
            } );

            b.dirty();
            b.apply( state );
            assert.isOk( b.getFrameBufferObject() === undefined, 'Check we did not created gl framebuffer' );


        } )();

        ( function () {
            var gl = mockup.createFakeRenderer();
            var state = {
                getGraphicContext: function () {
                    return gl;
                },
                applyTextureAttribute: function () {}
            };


            var fbo = new FrameBufferObject();

            fbo.createFrameBufferObject( state );
            fbo.bindFrameBufferObject();
            var renderBuffer = fbo.createRenderBuffer( FrameBufferObject.DEPTH_COMPONENT16, 800, 600 );
            fbo.framebufferRenderBuffer( FrameBufferObject.DEPTH_ATTACHMENT, renderBuffer );

            var texture = new Texture();
            // mockup texture
            texture.getTextureObject = function () {
                return {
                    id: function () {
                        return 1;
                    }
                };
            };

            fbo.framebufferTexture2D( state, FrameBufferObject.COLOR_ATTACHMENT0, Texture.TEXTURE_2D, texture );

            fbo.apply( state );

            assert.isOk( fbo.isDirty() === false, 'Check that applied set dirty false even with no attachement' );
            assert.isOk( fbo.getFrameBufferObject() !== undefined, 'Check fbo' );

        } )();
    } );
};
