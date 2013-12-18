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

    OSG.osg = osg;
    OSG.osgAnimation = osgAnimation;
    OSG.osgDB = osgDB;
    OSG.osgGA = osgGA;
    OSG.osgUtil = osgUtil;
    OSG.osgViewer = osgViewer;

    return OSG;
} );