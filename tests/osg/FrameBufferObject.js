'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );
var FrameBufferObject = require( 'osg/FrameBufferObject' );


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

            ok( b._fbo !== undefined, 'Check we created gl framebuffer' );
            b.releaseGLObjects();
            ok( b._fbo === undefined, 'Check we released gl famebuffer' );


        } )();
    } );
};
