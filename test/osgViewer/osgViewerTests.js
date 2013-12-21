define( [
    'test/osgViewer/View',
    'test/osgViewer/Viewer'
], function ( View, Viewer ) {

    return function () {
        View();
        Viewer();
    };
} );