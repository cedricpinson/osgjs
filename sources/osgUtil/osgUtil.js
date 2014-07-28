define( [
    'osgUtil/Composer',
    'osgUtil/IntersectVisitor',
    'osgUtil/ParameterVisitor',
    'osgUtil/TriangleIntersect',
    'osgUtil/Oculus',
    'osgUtil/WebVR'
], function( Composer, IntersectVisitor, ParameterVisitor, TriangleIntersect, Oculus, WebVR ) {

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.IntersectVisitor = IntersectVisitor;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.TriangleIntersect = TriangleIntersect;
    osgUtil.Oculus = Oculus;
    osgUtil.WebVR = WebVR;

    return osgUtil;
} );
