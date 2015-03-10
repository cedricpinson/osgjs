define( [
    'tests/osgViewer/View',
    'tests/osgViewer/Viewer'
], function ( View, Viewer ) {

    'use strict';

    return function () {
        View();
        Viewer();
    };
} );
