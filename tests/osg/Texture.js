define( [
    'tests/mockup/mockup',
    'osg/Texture',
    'osg/State'
], function ( mockup, Texture, State ) {

    return function () {

        module( 'osg' );

        asyncTest( 'Texture', function () {
            //stop();

            var textureFromURL = Texture.createFromURL( '"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII="' );
            ok( textureFromURL !== undefined, 'Check textureFromURL' );

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
                var texture = new Texture();
                var image = new Image();
                image.onload = function () {
                    texture.setImage( image, format );
                    loadingComplete();
                };
                image.src = name;
                return texture;
            };

            var greyscale = loadTexture( 'mockup/greyscale.png', Texture.ALPHA );
            greyscale.setUnrefImageDataAfterApply( true );

            var rgb24 = loadTexture( 'mockup/rgb24.png', Texture.RGB );
            var rgba32 = loadTexture( 'mockup/rgba32.png', Texture.RGBA );

            ready = function () {
                var cnv = document.createElement( 'canvas' );
                cnv.setAttribute( 'width', 128 );
                cnv.setAttribute( 'height', 128 );
                var tcanvas = new Texture();
                tcanvas.setImage( cnv );

                var gl = mockup.createFakeRenderer();
                gl.createTexture = function() { return 1; }; // simulate texture creation
                var state = new State();
                state.setGraphicContext( gl );

                // check is ready api
                var texture = new Texture();
                texture.setImage( greyscale._image );
                ok( texture.getImage().isReady() === true, 'Image is ready' );

                texture = new Texture();
                texture.setImage( cnv );
                ok( texture.getImage().isReady() === true, 'Image is ready because of canvas' );


                ok( greyscale.isDirty() === true, 'dirty is true' );
                greyscale.apply( state );
                ok( greyscale._image === undefined, 'image should be undefined because of unrefAfterApply' );
                ok( greyscale._textureObject !== undefined, 'texture object' );
                ok( greyscale.isDirty() === false, 'dirty is false' );

                start();
            };
        } );
    };
} );
