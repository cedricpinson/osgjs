requirejs.config( {
    baseUrl: '../sources',
    paths: {
        test: '../test/'
    }
} );

/*global QUnit,define,module,test,ok */
QUnit.config.testTimeout = 2000;
define( [
    'OSG',
    'osgViewer/Viewer',
    'test/osg',
    'test/osgAnimation',
    'test/osgDB',
    'test/osgGA',
    'test/osgUtil',
    'test/osgViewer'
], function ( OSG, Viewer, osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer ) {

    // #FIXME for gl context and memory pool I think...? (it was already here and needed before)
    var viewer = new Viewer( document.getElementById( '3DView' ) );

    osg();
    osgAnimation();
    osgDB();
    osgGA();
    osgUtil();
    osgViewer();
} );