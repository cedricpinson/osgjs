define( [
    'osgViewer/View',
    'osgViewer/Viewer',
    'osgViewer/eventProxy/EventProxy'
], function ( View, Viewer, EventProxy ) {

    var osgViewer = {};

    osgViewer.View = View;
    osgViewer.Viewer = Viewer;
    osgViewer.EventProxy = EventProxy;

    return osgViewer;
} );
