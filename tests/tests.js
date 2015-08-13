// polyfill for phantomjs
require( 'tests/vendors/es5-shim' );
require( 'tests/vendors/es6-shim' );


// add missing class for phantom js execution context
if ( window.HTMLVideoElement === undefined ) {
    // dummy class
    window.HTMLVideoElement = function() {
    };
}


/*global QUnit,define,module,test,ok */
QUnit.config.testTimeout = 5000;

define( [
    'OSG',

    'tests/osg/osgTests',
    'tests/osgAnimation/osgAnimationTests',
    'tests/osgDB/osgDBTests',
    'tests/osgGA/osgGATests',
    'tests/osgUtil/osgUtilTests',
    'tests/osgViewer/osgViewerTests',
    'tests/osgShader/osgShaderTests',
    'tests/osgShadow/osgShadowTests',
    'tests/osgText/osgTextTests',
    'tests/osgWrappers/osgWrappersTests'

], function ( OSG, osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer, osgShader, osgShadow, osgText, osgWrappers ) {

    // hack because of osgPool
    OSG.osg.init();

    osg();
    osgDB();
    osgAnimation();
    osgGA();
    osgUtil();
    osgViewer();
    osgShader();
    osgShadow();
    osgText();
    osgWrappers();
    // start test when require finished its job
    QUnit.load();
    QUnit.start();


} );
