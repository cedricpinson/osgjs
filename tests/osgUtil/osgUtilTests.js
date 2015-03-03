define( [
    'tests/osgUtil/LineSegmentIntersector',
    'tests/osgUtil/TriangleIntersector',
    'tests/osgUtil/PolytopeIntersector',
    'tests/osgUtil/IntersectionVisitor'
], function ( LineSegmentIntersector, TriangleIntersector, PolytopeIntersector, IntersectionVisitor ) {

    'use strict';

    return function () {
        LineSegmentIntersector();
        TriangleIntersector();
        PolytopeIntersector();
        IntersectionVisitor();
    };
} );
