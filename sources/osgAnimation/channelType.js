define( [], function () {

    'use strict';

    // must be sync wiht Interpolator Type
    return {
        Vec3: 0,
        Quat: 1,
        Float: 2,
        FloatCubicBezier: 3,
        Vec3CubicBezier: 4,
        QuatSlerp: 5,
        Matrix: 6,
        Count: 7
    };

} );
