import 'osg/polyfill';
import osgNameSpace from 'osgNameSpace';
import osg from 'osg/osg';
import osgAnimation from 'osgAnimation/osgAnimation';
import osgDB from 'osgDB/osgDB';
import osgGA from 'osgGA/osgGA';
import osgUtil from 'osgUtil/osgUtil';
import osgViewer from 'osgViewer/osgViewer';
import osgShader from 'osgShader/osgShader';
import osgShadow from 'osgShadow/osgShadow';
import osgStats from 'osgStats/osgStats';
import osgText from 'osgText/osgText';
import osgWrappers from 'osgWrappers/osgWrappers';
import osgPlugins from 'osgPlugins/osgPlugins';

var OSG = osgNameSpace;

OSG.osg = osg;
OSG.osgAnimation = osgAnimation;
OSG.osgDB = osgDB;
OSG.osgGA = osgGA;
OSG.osgUtil = osgUtil;
OSG.osgViewer = osgViewer;
OSG.osgShader = osgShader;
OSG.osgShadow = osgShadow;
OSG.osgStats = osgStats;
OSG.osgText = osgText;
OSG.osgWrappers = osgWrappers;
OSG.osgPlugins = osgPlugins;

// for backward compatibility
OSG.globalify = function() {
    window.osg = OSG.osg;
    window.osgAnimation = OSG.osgAnimation;
    window.osgDB = OSG.osgDB;
    window.osgGA = OSG.osgGA;
    window.osgUtil = OSG.osgUtil;
    window.osgViewer = OSG.osgViewer;
    window.osgShader = OSG.osgShader;
    window.osgShadow = OSG.osgShadow;
    window.osgStats = OSG.osgStats;
    window.osgText = OSG.osgText;
    window.osgWrappers = OSG.osgWrappers;
    window.osgPlugins = OSG.osgPlugins;
};

export {
    osg,
    osgAnimation,
    osgDB,
    osgGA,
    osgUtil,
    osgViewer,
    osgShader,
    osgShadow,
    osgStats,
    osgText,
    osgWrappers,
    osgPlugins
};

export default OSG;
