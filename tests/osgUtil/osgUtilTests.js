define( [
    'tests/osgUtil/IntersectVisitor',
    'tests/osgUtil/TriangleIntersect'
], function ( IntersectVisitor, TriangleIntersect ) {

    return function () {
        IntersectVisitor();
        TriangleIntersect();
    };
} );
