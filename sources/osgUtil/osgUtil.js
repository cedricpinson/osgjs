define( [
    'osgUtil/Composer',
    'osgUtil/IntersectVisitor',
    'osgUtil/ParameterVisitor',
    'osgUtil/TriangleIntersect',
    'osgUtil/Oculus'
], function( Composer, IntersectVisitor, ParameterVisitor, TriangleIntersect, Oculus ) {

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.IntersectVisitor = IntersectVisitor;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.TriangleIntersect = TriangleIntersect;
    osgUtil.Oculus = Oculus;

    return osgUtil;
} );
