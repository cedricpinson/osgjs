/*global define */

define( [
    'osgUtil/Composer',
    'osgUtil/IntersectVisitor',
    'osgUtil/ParameterVisitor',
    'osgUtil/TriangleIntersect'
], function (Composer, IntersectVisitor, ParameterVisitor, TriangleIntersect) {

    /** -*- compile-command: "jslint-cli osgUtil.js" -*-
     * Authors:
     *  Cedric Pinson <cedric.pinson@plopbyte.com>
     */

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.IntersectVisitor = IntersectVisitor;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.TriangleIntersect = TriangleIntersect;

    return osgUtil;
} );