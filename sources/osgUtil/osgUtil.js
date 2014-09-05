define( [
    'osgUtil/Composer',
    'osgUtil/ParameterVisitor',
    'osgUtil/Oculus',
    'osgUtil/WebVR',
    'osgUtil/IntersectionVisitor',
    'osgUtil/LineSegmentIntersector',
    'osgUtil/PolytopeIntersector',
    'osgUtil/DisplayNormalVisitor'
], function ( Composer, ParameterVisitor, Oculus, WebVR, IntersectionVisitor, LineSegmentIntersector, PolytopeIntersector, DisplayNormalVisitor ) {

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
    return osgUtil;
} );
