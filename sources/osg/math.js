var clamp = function(x, min, max) {
    // http://jsperf.com/math-clamp
    // http://jsperf.com/clamping-methods/2
    return Math.min(max, Math.max(min, x));
};

var smoothStep = function(edge0, edge1, x) {
    if (x <= edge0) return 0.0;
    if (x >= edge1) return 1.0;
    var y = (x - edge0) / (edge1 - edge0);
    return y * y * (3.0 - 2.0 * y);
};

// native isNaN is slow (e.g: https://jsperf.com/isnan-performance/2)
// note : native isNaN will return true for undefined but
// this function assume that x is a number
var fastIsNaN = function(x) {
    return x !== x;
};

export default {
    clamp: clamp,
    smoothStep: smoothStep,
    isNaN: fastIsNaN
};
