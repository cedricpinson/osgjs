define( [
    'tests/mockup/mockup',
    'osg/TextureCubeMap',
    'osg/Texture',
    'osg/State',
    'osgDB/ReaderParser'
], function ( mockup, TextureCubeMap, Texture, State, ReaderParser ) {

    return function () {

        module( 'osg' );

        test( 'TextureCubeMap', function () {

            var ready = undefined;
            var loadingComplete = function () {
                loadingComplete.nbLoad--;
                if ( loadingComplete.nbLoad === 0 ) {
                    ready();
                }
            };
            loadingComplete.nbLoad = 0;
            loadingComplete.addRessource = function () {
                loadingComplete.nbLoad++;
            };

            var loadTexture = function ( name, format ) {
                loadingComplete.addRessource();
                var image = new Image();
                image.onload = function () {
                    texture.setImage( image, format );
                    loadingComplete();
                };
                image.src = name;
                return texture;
            };

            var greyscale = ReaderParser.readImage( 'mockup/greyscale.png', {
                promise: false
            } );

            var state = new State();
            state.setGraphicContext( mockup.createFakeRenderer() );

            var texture = new TextureCubeMap();
            texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_X', greyscale, Texture.ALPHA );
            texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_X', greyscale, Texture.ALPHA );
            texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Y', greyscale, Texture.ALPHA );
            texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Y', greyscale, Texture.ALPHA );
            texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Z', greyscale, Texture.ALPHA );
            texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Z', greyscale, Texture.ALPHA );

            texture.apply( state );

            ok( texture.getImage( Texture.TEXTURE_CUBE_MAP_POSITIVE_X ) !== undefined, 'Check positive x' );
            ok( texture.getImage( Texture.TEXTURE_CUBE_MAP_NEGATIVE_X ) !== undefined, 'Check negative x' );

            ok( texture.getImage( Texture.TEXTURE_CUBE_MAP_POSITIVE_Y ) !== undefined, 'Check positive y' );
            ok( texture.getImage( Texture.TEXTURE_CUBE_MAP_NEGATIVE_Y ) !== undefined, 'Check negative y' );

            ok( texture.getImage( Texture.TEXTURE_CUBE_MAP_POSITIVE_Z ) !== undefined, 'Check positive z' );
            ok( texture.getImage( Texture.TEXTURE_CUBE_MAP_NEGATIVE_Z ) !== undefined, 'Check negative z' );
        } );
    };
} );
