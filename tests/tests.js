requirejs.config( {
    baseUrl: '../sources',
    paths: {
        vr: '../sources/vendors/vr',
        Q: '../sources/vendors/Q',
        Hammer: '../sources/vendors/Hammer',
        Leap: '../sources/vendors/Leap',
        tests: '../tests/'
    }
} );

/*global QUnit,define,module,test,ok */
QUnit.config.testTimeout = 2000;
define( [
    'OSG',

    'tests/osg/osgTests',
    'tests/osgAnimation/osgAnimationTests',
    'tests/osgDB/osgDBTests',
    'tests/osgGA/osgGATests',
    'tests/osgUtil/osgUtilTests',
    'tests/osgViewer/osgViewerTests'
], function ( OSG, osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer ) {

    // start test when require finished its job
    QUnit.start();

    // hack because of osgPool
    OSG.osg.init();

    osg();
    osgAnimation();
    osgDB();
    osgGA();
    osgUtil();
    osgViewer();
} );
