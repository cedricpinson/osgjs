define( [
    'tests/mockup/mockup',
    'osg/BufferArray'
], function ( mockup, BufferArray ) {

    return function () {

        module( 'osg' );

        test( 'BufferArray', function () {

            ( function () {
                var gl = mockup.createFakeRenderer();
                gl.createBuffer = function () {
                    return {};
                };

                var content = [];
                for ( var i = 0, l = 3 * 50; i < l; i++ ) {
                    content.push( i );
                }
                var b = new BufferArray( BufferArray.ARRAY_BUFFER, content, 3 );
                b.bind( gl );
                ok( b._buffer !== undefined, 'Check we created gl buffer' );
                b.releaseGLObjects( gl );
                ok( b._buffer === undefined, 'Check we released gl buffer' );
            } )();
        } );
    };
} );
