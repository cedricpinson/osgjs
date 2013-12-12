/*global define */

define( [
    'osgUtil/Composer',
    'osgUtil/IntersectVisitor',
    'osgUtil/ShaderParameterVisitor',
    'osgUtil/TriangleIntersect'
], function (Composer, IntersectVisitor, ShaderParameterVisitor, TriangleIntersect) {

    /** -*- compile-command: "jslint-cli osgUtil.js" -*-
     * Authors:
     *  Cedric Pinson <cedric.pinson@plopbyte.com>
     */

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.IntersectVisitor = IntersectVisitor;
    osgUtil.ShaderParameterVisitor = ShaderParameterVisitor;
    osgUtil.TriangleIntersect = TriangleIntersect;

    return osgUtil;
} );