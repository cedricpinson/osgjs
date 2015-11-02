'use strict';
var Composer = require( 'osgUtil/Composer' );
var DisplayNormalVisitor = require( 'osgUtil/DisplayNormalVisitor' );
var DisplayGeometryVisitor = require( 'osgUtil/DisplayGeometryVisitor' );
var DisplayNodeGraphVisitor = require( 'osgUtil/DisplayNodeGraphVisitor' );
var IntersectionVisitor = require( 'osgUtil/IntersectionVisitor' );
var LineSegmentIntersector = require( 'osgUtil/LineSegmentIntersector' );
var NodeGizmo = require( 'osgUtil/NodeGizmo' );
var Oculus = require( 'osgUtil/Oculus' );
var ParameterVisitor = require( 'osgUtil/ParameterVisitor' );
var PolytopeIntersector = require( 'osgUtil/PolytopeIntersector' );
var PolytopePrimitiveIntersector = require( 'osgUtil/PolytopePrimitiveIntersector' );
var SphereIntersector = require( 'osgUtil/SphereIntersector' );
var TangentSpaceGenerator = require( 'osgUtil/TangentSpaceGenerator' );
var TriangleIntersect = require( 'osgUtil/TriangleIntersector' );
var WebVR = require( 'osgUtil/WebVR' );


var osgUtil = {};

osgUtil.Composer = Composer;
osgUtil.DisplayNormalVisitor = DisplayNormalVisitor;
osgUtil.DisplayGeometryVisitor = DisplayGeometryVisitor;
osgUtil.DisplayNodeGraphVisitor = DisplayNodeGraphVisitor;
osgUtil.IntersectionVisitor = IntersectionVisitor;
osgUtil.LineSegmentIntersector = LineSegmentIntersector;
osgUtil.NodeGizmo = NodeGizmo;
osgUtil.Oculus = Oculus;
osgUtil.ParameterVisitor = ParameterVisitor;
osgUtil.PolytopeIntersector = PolytopeIntersector;
osgUtil.PolytopePrimitiveIntersector = PolytopePrimitiveIntersector;
osgUtil.SphereIntersector = SphereIntersector;
osgUtil.TangentSpaceGenerator = TangentSpaceGenerator;
osgUtil.TriangleIntersect = TriangleIntersect;
osgUtil.WebVR = WebVR;

module.exports = osgUtil;
