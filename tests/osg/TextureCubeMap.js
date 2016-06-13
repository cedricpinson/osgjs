'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var TextureCubeMap = require( 'osg/TextureCubeMap' );
var Texture = require( 'osg/Texture' );
var State = require( 'osg/State' );
var ReaderParser = require( 'osgDB/ReaderParser' );
var ShaderGeneratorProxy = require( 'osgShader/ShaderGeneratorProxy' );


module.exports = function () {

    test( 'TextureCubeMap', function () {

        var greyscale = ReaderParser.readImage( 'mockup/greyscale.png', {
            promise: false
        } );

        var state = new State( new ShaderGeneratorProxy() );
        state.setGraphicContext( mockup.createFakeRenderer() );

        var texture = new TextureCubeMap();
        texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_X', greyscale, Texture.ALPHA );
        texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_X', greyscale, Texture.ALPHA );
        texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Y', greyscale, Texture.ALPHA );
        texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Y', greyscale, Texture.ALPHA );
        texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Z', greyscale, Texture.ALPHA );
        texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Z', greyscale, Texture.ALPHA );

        texture.apply( state );

        assert.isOk( texture.getImage( Texture.TEXTURE_CUBE_MAP_POSITIVE_X ) !== undefined, 'Check positive x' );
        assert.isOk( texture.getImage( Texture.TEXTURE_CUBE_MAP_NEGATIVE_X ) !== undefined, 'Check negative x' );

        assert.isOk( texture.getImage( Texture.TEXTURE_CUBE_MAP_POSITIVE_Y ) !== undefined, 'Check positive y' );
        assert.isOk( texture.getImage( Texture.TEXTURE_CUBE_MAP_NEGATIVE_Y ) !== undefined, 'Check negative y' );

        assert.isOk( texture.getImage( Texture.TEXTURE_CUBE_MAP_POSITIVE_Z ) !== undefined, 'Check positive z' );
        assert.isOk( texture.getImage( Texture.TEXTURE_CUBE_MAP_NEGATIVE_Z ) !== undefined, 'Check negative z' );
    } );
};
