define( function ( ) {
    if ( window.Q ) {
        return window.Q;
    }
    return window.require( 'Q' );
} );
