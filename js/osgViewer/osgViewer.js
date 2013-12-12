/*global define */

define( [
    'osgViewer/View',
    'osgViewer/Viewer'
], function ( View, Viewer ) {

    /** -*- compile-command: "jslint-cli osgViewer.js" -*-
     * Authors:
     *  Cedric Pinson <cedric.pinson@plopbyte.com>
     */

    var osgViewer = {};

    osgViewer.View = View;
    osgViewer.Viewer = Viewer;

    return osgViewer;
} );