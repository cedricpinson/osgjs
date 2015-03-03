define( [
    'tests/mockup/mockup',
    'osg/Image'
], function ( mockup, Image ) {

    return function () {

        module( 'osg' );

        asyncTest( 'Image.isGreyScale grey image', function () {


            var test = function( img ) {
                var n = new Image( img );

                equal( n.isGreyscale( 2 ), true, "check image is grey");
                start();
            };

            var img = new window.Image();
            img.onload = function () {
                test( this );
            };
            img.src = 'mockup/greyscale.png';

        } );

        asyncTest( 'Image.isGreyScale color image', function () {


            var test = function( img ) {
                var n = new Image( img );

                equal( n.isGreyscale( 2 ), false, "check image is not grey");
                start();
            };

            var img = new window.Image();
            img.onload = function () {
                test( this );
            };
            img.src = 'mockup/rgba32.png';

        } );

    };
} );
