define( [
    'osgUtil/Composer',
    'osgUtil/ParameterVisitor',
    'osgUtil/Oculus',
    'osgUtil/WebVR',
    'osgUtil/IntersectionVisitor',
    'osgUtil/LineSegmentIntersector',
    'osgUtil/PolytopeIntersector'
], function( Composer, ParameterVisitor, Oculus, WebVR, IntersectionVisitor, LineSegmentIntersector, PolytopeIntersector ) {

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.Oculus = Oculus;
    osgUtil.WebVR = WebVR;
    osgUtil.IntersectionVisitor = IntersectionVisitor;
    osgUtil.PolytopeIntersector = PolytopeIntersector;
    osgUtil.LineSegmentIntersector = LineSegmentIntersector;
    return osgUtil;
} );
