'use strict';
var Composer = require( 'osgUtil/Composer' );
var debug = require( 'osgUtil/debug' );
var DelayInterpolator = require( 'osgUtil/DelayInterpolator' );
var DisplayNormalVisitor = require( 'osgUtil/DisplayNormalVisitor' );
var DisplayGeometryVisitor = require( 'osgUtil/DisplayGeometryVisitor' );
var DisplayGraph = require( 'osgUtil/DisplayGraph' );
var IntersectionVisitor = require( 'osgUtil/IntersectionVisitor' );
var LineSegmentIntersector = require( 'osgUtil/LineSegmentIntersector' );
var LineSegmentIntersectFunctor = require( 'osgUtil/LineSegmentIntersectFunctor' );
var MACROUTILS = require( 'osg/Utils' );
var NodeGizmo = require( 'osgUtil/NodeGizmo' );
var GizmoGeometry = require( 'osgUtil/gizmoGeometry' );
var PolytopeIntersector = require( 'osgUtil/PolytopeIntersector' );
var PolytopeIntersectFunctor = require( 'osgUtil/PolytopeIntersectFunctor' );
var SphereIntersector = require( 'osgUtil/SphereIntersector' );
var TangentSpaceGenerator = require( 'osgUtil/TangentSpaceGenerator' );
var WebVRCustom = require( 'osgUtil/WebVRCustom' );
var WebVR = require( 'osgUtil/WebVR' );
var intersectionEnums = require( 'osgUtil/intersectionEnums' );


var osgUtil = {};

osgUtil.Composer = Composer;
MACROUTILS.objectMix( osgUtil, debug );
osgUtil.DelayInterpolator = DelayInterpolator;
osgUtil.DisplayNormalVisitor = DisplayNormalVisitor;
osgUtil.DisplayGeometryVisitor = DisplayGeometryVisitor;
osgUtil.DisplayGraph = DisplayGraph;
osgUtil.IntersectionVisitor = IntersectionVisitor;
osgUtil.LineSegmentIntersector = LineSegmentIntersector;
osgUtil.LineSegmentIntersectFunctor = LineSegmentIntersectFunctor;
osgUtil.NodeGizmo = NodeGizmo;
osgUtil.GizmoGeometry = GizmoGeometry;
osgUtil.WebVRCustom = WebVRCustom;
osgUtil.PolytopeIntersector = PolytopeIntersector;
osgUtil.PolytopeIntersectFunctor = PolytopeIntersectFunctor;
osgUtil.SphereIntersector = SphereIntersector;
osgUtil.TangentSpaceGenerator = TangentSpaceGenerator;
osgUtil.WebVR = WebVR;

osgUtil.NO_LIMIT = intersectionEnums.NO_LIMIT;
osgUtil.LIMIT_ONE_PER_DRAWABLE = intersectionEnums.LIMIT_ONE_PER_DRAWABLE;
osgUtil.LIMIT_ONE = intersectionEnums.LIMIT_ONE;

osgUtil.POINT_PRIMITIVES = intersectionEnums.POINT_PRIMITIVES;
osgUtil.LINE_PRIMITIVES = intersectionEnums.LINE_PRIMITIVES;
osgUtil.TRIANGLE_PRIMITIVES = intersectionEnums.TRIANGLE_PRIMITIVES;
osgUtil.ALL_PRIMITIVES = intersectionEnums.ALL_PRIMITIVES;

module.exports = osgUtil;
