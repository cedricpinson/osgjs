'use strict';
var LineSegmentIntersector = require( 'tests/osgUtil/LineSegmentIntersector' );
var TriangleIntersector = require( 'tests/osgUtil/TriangleIntersector' );
var PolytopeIntersector = require( 'tests/osgUtil/PolytopeIntersector' );
var IntersectionVisitor = require( 'tests/osgUtil/IntersectionVisitor' );


module.exports = function () {
    LineSegmentIntersector();
    TriangleIntersector();
    PolytopeIntersector();
    IntersectionVisitor();
};
