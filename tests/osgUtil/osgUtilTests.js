define( [
    'tests/osgUtil/LineSegmentIntersector',
    'tests/osgUtil/TriangleIntersector', 
    'tests/osgUtil/PolytopeIntersector'
], function ( LineSegmentIntersector, TriangleIntersector, PolytopeIntersector ) {

    return function () {
        LineSegmentIntersector();
        TriangleIntersector();
        PolytopeIntersector();
    };
} );
