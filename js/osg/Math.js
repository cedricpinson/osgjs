
osg.clamp = function( x, min, max ) {
    // http://jsperf.com/math-clamp
    if (x > max) {
        x = max;
    } else if (x < min) {
        x = min;
    }
    return x;
};

osg.smoothStep = function ( edge0, edge1, x ) {
    var t = osg.clamp( (x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
};
