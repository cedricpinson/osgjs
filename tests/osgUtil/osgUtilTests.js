'use strict';
var LineSegmentIntersector = require( 'tests/osgUtil/LineSegmentIntersector' );
var LineSegmentIntersectFunctor = require( 'tests/osgUtil/LineSegmentIntersectFunctor' );
var PolytopeIntersector = require( 'tests/osgUtil/PolytopeIntersector' );
var IntersectionVisitor = require( 'tests/osgUtil/IntersectionVisitor' );


module.exports = function () {
    LineSegmentIntersector();
    LineSegmentIntersectFunctor();
    PolytopeIntersector();
    IntersectionVisitor();
};
