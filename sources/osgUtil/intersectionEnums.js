'use strict';
module.exports = {
    NO_LIMIT: 0,
    LIMIT_ONE_PER_DRAWABLE: 1,
    LIMIT_ONE: 2,

    // PrimitiveMask
    POINT_PRIMITIVES: ( 1 << 0 ), /// check for points
    LINE_PRIMITIVES: ( 1 << 1 ), /// check for lines
    TRIANGLE_PRIMITIVES: ( 1 << 2 ), /// check for triangles and other primitives like quad, polygons that can be decomposed into triangles
    ALL_PRIMITIVES: ( ( 1 << 0 ) | ( 1 << 1 ) | ( 1 << 2 ) )
};
