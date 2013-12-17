requirejs.config( {
    baseUrl: '../',
    paths: {
        osg: 'js/osg',
        osgAnimation: 'js/osgAnimation',
        osgDB: 'js/osgDB',
        osgGA: 'js/osgGA',
        osgUtil: 'js/osgUtil',
        osgViewer: 'js/osgViewer',
        osgWrappers: 'js/osgWrappers',
        vendors: 'js/vendors'
    }
} );

/*global QUnit,define,module,test,ok */
QUnit.config.testTimeout = 2000;
define( [
    'js/OSG',
    'osgViewer/Viewer',
    'test/osg',
    'test/osgAnimation',
    'test/osgDB',
    'test/osgGA',
    'test/osgUtil',
    'test/osgViewer'
], function ( OSG, Viewer, osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer ) {

    // #FIXME we don't need to load OSG if we fix the getObjectWrapper issue (cf #FIXME in Input.js)
    window.osg = OSG.osg; // for osgDB
    window.osgAnimation = OSG.osgAnimation; //for osgAnimation

    // #FIXME for gl context and memory pool I think...?
    var viewer = new Viewer( document.getElementById( '3DView' ) );

    osg();
    osgAnimation();
    osgDB();
    osgGA();
    osgUtil();
    osgViewer();
} );