'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );
var FrameBufferObject = require( 'osg/FrameBufferObject' );
var Texture = require( 'osg/Texture' );


module.exports = function () {
    QUnit.module( 'osg' );

    QUnit.test( 'FrameBufferObject', function () {

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
                    getTextureObject: function () {
                        return {
                            id: function () {}
                        };
                    }
                },
                textureTarget: 'textureTarget'
            } );
            b.setAttachment( {
                format: 'texture',
                width: 512,
                height: 512
            } );

            b.dirty();
            b.apply( state );

            ok( b.getFrameBufferObject() !== undefined, 'Check we created gl framebuffer' );
            b.releaseGLObjects();
            ok( b.getFrameBufferObject() === undefined, 'Check we released gl famebuffer' );


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

            ok( fbo.isDirty() === false, 'Check that applied set dirty false even with no attachement' );
            ok( fbo.getFrameBufferObject() !== undefined, 'Check fbo' );

        } )();
    } );
};
