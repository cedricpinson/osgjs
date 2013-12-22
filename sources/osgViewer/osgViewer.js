/*global define */

define( [
    'osgViewer/View',
    'osgViewer/Viewer',
    'osgViewer/eventProxy/EventProxy'
], function ( View, Viewer, EventProxy ) {

    /** -*- compile-command: "jslint-cli osgViewer.js" -*-
     * Authors:
     *  Cedric Pinson <cedric.pinson@plopbyte.com>
     */

    var osgViewer = {};

    osgViewer.View = View;
    osgViewer.Viewer = Viewer;
    osgViewer.EventProxy = EventProxy;

    return osgViewer;
} );