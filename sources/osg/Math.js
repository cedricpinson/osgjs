define( [], function () {

    var clamp = function ( x, min, max ) {
        // http://jsperf.com/math-clamp
        // http://jsperf.com/clamping-methods/2
        return Math.min( max, Math.max( min, x ) );
    };

    var smoothStep = function ( edge0, edge1, x ) {
        var t = clamp( ( x - edge0 ) / ( edge1 - edge0 ), 0.0, 1.0 );
        return t * t * ( 3.0 - 2.0 * t );
    };

    return {
        clamp: clamp,
        smoothStep: smoothStep
    };
} );
