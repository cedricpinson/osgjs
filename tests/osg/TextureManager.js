define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/TextureManager',
    'osg/Texture'
], function ( QUnit, mockup, TextureManager, Texture ) {

    'use strict';

    return function () {

        QUnit.module( 'osg' );

        QUnit.test( 'TextureManager', function () {
            var tm = new TextureManager();
            var gl = mockup.createFakeRenderer();
            var batch0 = [];
            var batch1 = [];
            ( function () {
                for ( var i = 0, l = 4; i < l; i++ ) {
                    var to = tm.generateTextureObject( gl, {},
                        Texture.TEXTURE_2D,
                        Texture.RGBA,
                        1024,
                        1024 );
                    batch0.push( to );
                }
            } )();

            ( function () {
                for ( var i = 0, l = 2; i < l; i++ ) {
                    var to = tm.generateTextureObject( gl, {},
                        Texture.TEXTURE_2D,
                        Texture.ALPHA,
                        512,
                        1024 );
                    batch1.push( to );
                }
            } )();

            equal( tm._textureSetMap[ '3553640810241024' ].getUsedTextureObjects().length, 4, 'check nb texture 1024x1024 created' );
            equal( tm._textureSetMap[ '355364065121024' ].getUsedTextureObjects().length, 2, 'check nb texture 512x1024 created' );

            equal( tm._textureSetMap[ '3553640810241024' ].getOrphanedTextureObjects().length, 0, 'check orphan texture 1024x1024 null' );
            equal( tm._textureSetMap[ '355364065121024' ].getOrphanedTextureObjects().length, 0, 'check orphan texture 512x1024 null' );

            batch1.forEach( function ( to ) {
                tm.releaseTextureObject( to );
            } );

            batch0.forEach( function ( to ) {
                tm.releaseTextureObject( to );
            } );

            equal( tm._textureSetMap[ '3553640810241024' ].getOrphanedTextureObjects().length, 4, 'check orphan 1024x1024 after release' );
            equal( tm._textureSetMap[ '355364065121024' ].getOrphanedTextureObjects().length, 2, 'check orphan 512x1024 after release' );

            equal( tm._textureSetMap[ '3553640810241024' ].getUsedTextureObjects().length, 0, 'check used 1024x1024 empty after release' );
            equal( tm._textureSetMap[ '355364065121024' ].getUsedTextureObjects().length, 0, 'check used 512x1024 empty after release' );

            tm.flushAllDeletedTextureObjects( gl );

            equal( tm._textureSetMap[ '3553640810241024' ].getOrphanedTextureObjects().length, 0, 'check orphan 1024x1024 empty delete' );
            equal( tm._textureSetMap[ '355364065121024' ].getOrphanedTextureObjects().length, 0, 'check orphan 512x1024 empty after delete' );

        } );

        QUnit.test( 'TextureManager flushDeletedTextureObjects', function () {
            var tm = new TextureManager();
            var gl = mockup.createFakeRenderer();
            var batch0 = [];
            // Create a bunch of texture objects
            ( function () {
                for ( var i = 0, l = 40000; i < l; i++ ) {
                    var to = tm.generateTextureObject( gl, {},
                        Texture.TEXTURE_2D,
                        Texture.RGBA,
                        1024,
                        1024 );
                    batch0.push( to );
                }
            } )();

            // Release all TO's;
            batch0.forEach( function ( to ) {
                tm.releaseTextureObject( to );
            } );

            equal( tm._textureSetMap[ '3553640810241024' ].getOrphanedTextureObjects().length, 40000, 'check orphan 1024x1024 after release' );
            equal( tm._textureSetMap[ '3553640810241024' ].getUsedTextureObjects().length, 0, 'check used 1024x1024 empty after release' );

            // flush TO's in 0.001 seconds 
            tm.flushDeletedTextureObjects( gl, 0.0001 );
            // There is no time to flush all the released texture objects
            ok( tm._textureSetMap[ '3553640810241024' ].getOrphanedTextureObjects().length > 0, 'check orphan 1024x1024 delete not empty' );
            // flush all TO's
            tm.flushAllDeletedTextureObjects( gl );
            // now all the TO's should be flushed. 
            equal( tm._textureSetMap[ '3553640810241024' ].getOrphanedTextureObjects().length, 0, 'check orphan 1024x1024 empty delete' );
        } );
    };

} );
