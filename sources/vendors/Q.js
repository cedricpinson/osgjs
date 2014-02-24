define( function ( ) {
    if ( window.Q ) {
        return Q;
    }
    return window.require( 'Q' );
} );
