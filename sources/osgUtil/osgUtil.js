define( [
    'osgUtil/Composer',
    'osgUtil/ParameterVisitor',
    'osgUtil/Oculus',
    'osgUtil/WebVR',
    'osgUtil/IntersectionVisitor',
    'osgUtil/PolytopeIntersector'
], function( Composer, ParameterVisitor, Oculus, WebVR, IntersectionVisitor, PolytopeIntersector ) {

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.Oculus = Oculus;
    osgUtil.WebVR = WebVR;
    osgUtil.IntersectionVisitor = IntersectionVisitor;
    osgUtil.PolytopeIntersector = PolytopeIntersector;

    return osgUtil;
} );
