define( [
    'osg/BufferArray'
], function ( BufferArray ) {

    return function () {

        module( 'BlendColor' );

        test( 'Test BlendColor', function () {

            ( function () {
                var gl = createFakeRenderer();
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