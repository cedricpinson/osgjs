define( [
    'tests/osgViewer/View',
    'tests/osgViewer/Viewer'
], function ( View, Viewer ) {

    return function () {
        View();
        Viewer();
    };
} );
