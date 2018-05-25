//
// Visualisations:
// https://greensock.com/docs/Easing
// https://htmlpreview.github.io/?https://github.com/Michaelangel007/easing/blob/master/compare.html
//
// Maths
// https://www.essentialmath.com/tutorial.htm
// Interpolation and Splines + demo (Squirrel Eiserloh)
//

// Power Easings
//
//    IN
//
function easeLinear(p) {
    return p;
} // p^1
function easeInQuadratic(p) {
    return p * p;
} // p^2 = Math.pow(p;2)
function easeInCubic(p) {
    return p * p * p;
} // p^3 = Math.pow(p;3)
function easeInQuartic(p) {
    return p * p * p * p;
} // p^4 = Math.pow(p;4)
function easeInQuintic(p) {
    return p * p * p * p * p;
} // p^5 = Math.pow(p;5)
function easeInSextic(p) {
    return p * p * p * p * p * p;
} // p^6 = Math.pow(p;6)
function easeInSeptic(p) {
    return p * p * p * p * p * p * p;
} // p^7 = Math.pow(p;7)
function easeInOctic(p) {
    return p * p * p * p * p * p * p * p;
} // p^8 = Math.pow(p;8)
//
//   OUT
//
function easeOutQuadratic(p) {
    var m = p - 1;
    return 1 - m * m;
}
function easeOutCubic(p) {
    var m = p - 1;
    return 1 + m * m * m;
}
function easeOutQuartic(p) {
    var m = p - 1;
    return 1 - m * m * m * m;
}
function easeOutQuintic(p) {
    var m = p - 1;
    return 1 + m * m * m * m * m;
}
function easeOutSextic(p) {
    var m = p - 1;
    return 1 - m * m * m * m * m * m;
}
function easeOutSeptic(p) {
    var m = p - 1;
    return 1 + m * m * m * m * m * m * m;
}
function easeOutOctic(p) {
    var m = p - 1;
    return 1 - m * m * m * m * m * m * m * m;
}
//
//   INOUT
//
function easeInOutQuadratic(p) {
    var m = p - 1;
    var t = p * 2;
    if (t < 1) return p * t;
    return 1 - m * m * 2;
}
function easeInOutCubic(p) {
    var m = p - 1;
    var t = p * 2;
    if (t < 1) return p * t * t;
    return 1 + m * m * m * 4;
}
function easeInOutQuartic(p) {
    var m = p - 1;
    var t = p * 2;
    if (t < 1) return p * t * t * t;
    return 1 - m * m * m * m * 8;
}
function easeInOutQuintic(p) {
    var m = p - 1;
    var t = p * 2;
    if (t < 1) return p * t * t * t * t;
    return 1 + m * m * m * m * m * 16;
}
function easeInOutSextic(p) {
    var m = p - 1;
    var t = p * 2;
    if (t < 1) return p * t * t * t * t * t;
    return 1 - m * m * m * m * m * m * 32;
}
function easeInOutSeptic(p) {
    var m = p - 1;
    var t = p * 2;
    if (t < 1) return p * t * t * t * t * t * t;
    return 1 + m * m * m * m * m * m * m * 64;
}
function easeInOutOctic(p) {
    var m = p - 1;
    var t = p * 2;
    if (t < 1) return p * t * t * t * t * t * t * t;
    return 1 - m * m * m * m * m * m * m * m * 128;
}
//
// Back
//
function easeInBack(p) {
    var k = 1.70158;
    return p * p * (p * (k + 1) - k);
}
function easeInOutBack(p) {
    var m = p - 1;
    var t = p * 2;
    var k = 1.70158 * 1.525;
    if (p < 0.5) return p * t * (t * (k + 1) - k);
    else return 1 + 2 * m * m * (2 * m * (k + 1) + k);
} // NOTE: Can go negative! i.e. p = 0.008
function easeOutBack(p) {
    var m = p - 1;
    var k = 1.70158;
    return 1 + m * m * (m * (k + 1) + k);
}

//
// Circle
//
function easeInCircle(p) {
    return 1 - Math.sqrt(1 - p * p);
}
function easeInOutCircle(p) {
    var m = p - 1;
    var t = p * 2;
    if (t < 1) return (1 - Math.sqrt(1 - t * t)) * 0.5;
    else return (Math.sqrt(1 - 4 * m * m) + 1) * 0.5;
}
function easeOutCircle(p) {
    var m = p - 1;
    return Math.sqrt(1 - m * m);
}

//
// elastic
//
function easeInElastic(t) {
    return -(1.0 * Math.pow(2, 10 * t) * Math.sin((t - 1.0 - 0.075) * 2.0 * Math.PI / 0.3));
}
function easeOutElastic(t) {
    return Math.pow(2.0, -10.0 * t) * Math.sin((t - 0.3 / 4.0) * (2.0 * Math.PI) / 0.3) + 1.0;
}
function easeInOutElastic(t) {
    return (t *= 2) < 1.0
        ? -0.5 * (1.0 * Math.pow(2, 10 * t)) * Math.sin((t - 1.0 - 0.45) * 2.0 * Math.PI / 0.45)
        : 1.0 * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - 0.45) * 2.0 * Math.PI / 0.45) * 0.5 + 1;
}

// Bounce
function easeOutBounce(t) {
    if (t < 1 / 2.75) {
        return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
}
function easeInBounce(t) {
    if ((t = 1 - t) < 1 / 2.75) {
        return 1 - 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
        return 1 - (7.5625 * (t -= 1.5 / 2.75) * t + 0.75);
    } else if (t < 2.5 / 2.75) {
        return 1 - (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375);
    } else {
        return 1 - (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375);
    }
}
function easeInOutBounce(t) {
    var invert;
    if (t < 0.5) {
        invert = true;
        t = 1 - t * 2;
    } else {
        t = t * 2 - 1;
    }
    if (t < 1 / 2.75) {
        t = 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
        t = 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
        t = 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
        t = 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
    return invert ? (1 - t) * 0.5 : t * 0.5 + 0.5;
}

export default {
    easeLinear: easeLinear,

    easeOutQuad: easeOutQuadratic,
    easeInQuad: easeInQuadratic,
    easeInOutQuad: easeInOutQuadratic,

    easeOutCubic: easeOutCubic,
    easeInCubic: easeInCubic,
    easeInOutCubic: easeInOutCubic,

    easeOutQuart: easeOutQuartic,
    easeInQuart: easeInQuartic,
    easeInOutQuart: easeInOutQuartic,

    easeOutQuintic: easeOutQuintic,
    easeInQuintic: easeInQuintic,
    easeInOutQuintic: easeInOutQuintic,

    easeOutSextic: easeOutSextic,
    easeInSextic: easeInSextic,
    easeInOutSextic: easeInOutSextic,

    easeOutSeptic: easeOutSeptic,
    easeInSeptic: easeInSeptic,
    easeInOutSeptic: easeInOutSeptic,

    easeOutOctic: easeOutOctic,
    easeInOctic: easeInOctic,
    easeInOutOctic: easeInOutOctic,

    easeOutBack: easeOutBack,
    easeInBack: easeInBack,
    easeInOutBack: easeInOutBack,

    easeOutCircle: easeOutCircle,
    easeInCircle: easeInCircle,
    easeInOutCircle: easeInOutCircle,

    easeOutElastic: easeOutElastic,
    easeInElastic: easeInElastic,
    easeInOutElastic: easeInOutElastic,

    easeOutBounce: easeOutBounce,
    easeInBounce: easeInBounce,
    easeInOutBounce: easeInOutBounce
};
