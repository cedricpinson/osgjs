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

    'test/osg/osgTests',
    'test/osgAnimation/osgAnimationTests',
    'test/osgDB/osgDBTests',
    'test/osgGA/osgGATests',
    'test/osgUtil/osgUtilTests',
    'test/osgViewer/osgViewerTests'
], function ( OSG, osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer ) {

    osg();
    osgAnimation();
    osgDB();
    osgGA();
    osgUtil();
    osgViewer();
} );
