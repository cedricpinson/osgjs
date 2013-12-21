define( [
    'test/osgUtil/IntersectVisitor',
    'test/osgUtil/TriangleIntersect'
], function ( IntersectVisitor, TriangleIntersect ) {

    return function () {
        IntersectVisitor();
        TriangleIntersect();
    };
} );