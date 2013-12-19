/** -*- compile-command: 'jslint-cli osg.js' -*- */

define( [
    'osg/osg',
    'osgAnimation/osgAnimation',
    'osgDB/osgDB',
    'osgGA/osgGA',
    'osgUtil/osgUtil',
    'osgViewer/osgViewer'
], function ( osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer ) {

    var OSG = {};

    OSG.version = '0.0.5';
    OSG.copyright = 'Cedric Pinson - cedric.pinson@plopbyte.com';

    window.osg = OSG.osg = osg;
    window.osgAnimation = OSG.osgAnimation = osgAnimation;
    window.osgDB = OSG.osgDB = osgDB;
    window.osgGA = OSG.osgGA = osgGA;
    window.osgUtil = OSG.osgUtil = osgUtil;
    window.osgViewer = OSG.osgViewer = osgViewer;

    return OSG;
} );