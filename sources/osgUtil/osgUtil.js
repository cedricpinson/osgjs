define( [
    'osgUtil/Composer',
    'osgUtil/DebugHashAttributes',
    'osgUtil/DisplayNormalVisitor',
    'osgUtil/DisplayGeometryVisitor',
    'osgUtil/DisplayNodeGraphVisitor',
    'osgUtil/IntersectionVisitor',
    'osgUtil/LineSegmentIntersector',
    'osgUtil/NodeGizmo',
    'osgUtil/Oculus',
    'osgUtil/ParameterVisitor',
    'osgUtil/PolytopeIntersector',
    'osgUtil/PolytopePrimitiveIntersector',
    'osgUtil/SphereIntersector',
    'osgUtil/TangentSpaceGenerator',
    'osgUtil/TriangleIntersector',
    'osgUtil/WebVR',

], function ( Composer,
    DebugHashAttribute,
    DisplayNormalVisitor,
    DisplayGeometryVisitor,
    DisplayNodeGraphVisitor,
    IntersectionVisitor,
    LineSegmentIntersector,
    NodeGizmo,
    Oculus,
    ParameterVisitor,
    PolytopeIntersector,
    PolytopePrimitiveIntersector,
    SphereIntersector,
    TangentSpaceGenerator,
    TriangleIntersect,
    WebVR ) {

    'use strict';

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.DebugHashAttribute = DebugHashAttribute;
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

    return osgUtil;

} );
