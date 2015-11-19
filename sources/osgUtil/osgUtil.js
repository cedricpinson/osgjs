'use strict';
var Composer = require( 'osgUtil/Composer' );
var DisplayNormalVisitor = require( 'osgUtil/DisplayNormalVisitor' );
var DisplayGeometryVisitor = require( 'osgUtil/DisplayGeometryVisitor' );
var DisplayGraph = require( 'osgUtil/DisplayGraph' );
var IntersectionVisitor = require( 'osgUtil/IntersectionVisitor' );
var LineSegmentIntersector = require( 'osgUtil/LineSegmentIntersector' );
var NodeGizmo = require( 'osgUtil/NodeGizmo' );
var ParameterVisitor = require( 'osgUtil/ParameterVisitor' );
var PolytopeIntersector = require( 'osgUtil/PolytopeIntersector' );
var PolytopePrimitiveIntersector = require( 'osgUtil/PolytopePrimitiveIntersector' );
var SphereIntersector = require( 'osgUtil/SphereIntersector' );
var TangentSpaceGenerator = require( 'osgUtil/TangentSpaceGenerator' );
var TriangleIntersect = require( 'osgUtil/TriangleIntersector' );
var WebVRCustom = require( 'osgUtil/WebVRCustom' );
var WebVR = require( 'osgUtil/WebVR' );


var osgUtil = {};

osgUtil.Composer = Composer;
osgUtil.DisplayNormalVisitor = DisplayNormalVisitor;
osgUtil.DisplayGeometryVisitor = DisplayGeometryVisitor;
osgUtil.DisplayGraph = DisplayGraph;
osgUtil.IntersectionVisitor = IntersectionVisitor;
osgUtil.LineSegmentIntersector = LineSegmentIntersector;
osgUtil.NodeGizmo = NodeGizmo;
osgUtil.WebVRCustom = WebVRCustom;
osgUtil.ParameterVisitor = ParameterVisitor;
osgUtil.PolytopeIntersector = PolytopeIntersector;
osgUtil.PolytopePrimitiveIntersector = PolytopePrimitiveIntersector;
osgUtil.SphereIntersector = SphereIntersector;
osgUtil.TangentSpaceGenerator = TangentSpaceGenerator;
osgUtil.TriangleIntersect = TriangleIntersect;
osgUtil.WebVR = WebVR;

module.exports = osgUtil;
