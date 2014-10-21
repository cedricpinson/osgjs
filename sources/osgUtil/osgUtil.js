define( [
    'osgUtil/Composer',
    'osgUtil/ParameterVisitor',
    'osgUtil/Oculus',
    'osgUtil/WebVR',
    'osgUtil/IntersectionVisitor',
    'osgUtil/LineSegmentIntersector',
    'osgUtil/PolytopeIntersector',
    'osgUtil/DisplayNormalVisitor',
    'osgUtil/DisplayGeometryVisitor'
], function ( Composer, ParameterVisitor, Oculus, WebVR, IntersectionVisitor, LineSegmentIntersector, PolytopeIntersector, DisplayNormalVisitor, DisplayGeometryVisitor ) {

    'use strict';

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.Oculus = Oculus;
    osgUtil.WebVR = WebVR;
    osgUtil.IntersectionVisitor = IntersectionVisitor;
    osgUtil.PolytopeIntersector = PolytopeIntersector;
    osgUtil.LineSegmentIntersector = LineSegmentIntersector;
    osgUtil.DisplayNormalVisitor = DisplayNormalVisitor;
    osgUtil.DisplayGeometryVisitor = DisplayGeometryVisitor;
    return osgUtil;
} );
