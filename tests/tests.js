'use strict';

require( 'tests/vendors/es5-shim' );
require( 'tests/vendors/es6-shim' );

// add missing class for phantom js execution context
if ( window.HTMLVideoElement === undefined ) {
    window.HTMLVideoElement = function () {}; // dummy class
}

var QUnit = require( 'qunit' );
var OSG = require( 'OSG' );
var osg = require( 'tests/osg/osgTests' );
var osgAnimation = require( 'tests/osgAnimation/osgAnimationTests' );
var osgDB = require( 'tests/osgDB/osgDBTests' );
var osgGA = require( 'tests/osgGA/osgGATests' );
var osgUtil = require( 'tests/osgUtil/osgUtilTests' );
var osgViewer = require( 'tests/osgViewer/osgViewerTests' );
var osgShader = require( 'tests/osgShader/osgShaderTests' );
var osgShadow = require( 'tests/osgShadow/osgShadowTests' );
var osgText = require( 'tests/osgText/osgTextTests' );
var osgWrappers = require( 'tests/osgWrappers/osgWrappersTests' );

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
