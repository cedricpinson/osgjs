'use strict';
var LineSegmentIntersector = require( 'tests/osgUtil/LineSegmentIntersector' );
var TriangleLineSegmentIntersector = require( 'tests/osgUtil/TriangleLineSegmentIntersector' );
var PolytopeIntersector = require( 'tests/osgUtil/PolytopeIntersector' );
var IntersectionVisitor = require( 'tests/osgUtil/IntersectionVisitor' );


module.exports = function () {
    LineSegmentIntersector();
    TriangleLineSegmentIntersector();
    PolytopeIntersector();
    IntersectionVisitor();
};
