define( [
    'osgViewer/Renderer',
    'osgViewer/View',
    'osgViewer/Viewer',
    'osgViewer/eventProxy/EventProxy'
], function ( Renderer, View, Viewer, EventProxy ) {

    'use strict';

    var osgViewer = {};

    osgViewer.Renderer = Renderer;
    osgViewer.View = View;
    osgViewer.Viewer = Viewer;
    osgViewer.EventProxy = EventProxy;

    return osgViewer;
} );
