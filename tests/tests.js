require('OSG');

var osg = require('tests/osg/osgTests');
var osgAnimation = require('tests/osgAnimation/osgAnimationTests');
var osgDB = require('tests/osgDB/osgDBTests');
var osgGA = require('tests/osgGA/osgGATests');
var osgUtil = require('tests/osgUtil/osgUtilTests');
var osgViewer = require('tests/osgViewer/osgViewerTests');
var osgShader = require('tests/osgShader/osgShaderTests');
var osgShadow = require('tests/osgShadow/osgShadowTests');
var osgText = require('tests/osgText/osgTextTests');
var osgWrappers = require('tests/osgWrappers/osgWrappersTests');

suite('osgWrappers');
osgWrappers();

suite('osgText');
osgText();

suite('osgShadow');
osgShadow();

suite('osgShader');
osgShader();

suite('osgViewer');
osgViewer();

suite('osgUtil');
osgUtil();

suite('osgGA');
osgGA();

suite('osgDB');
osgDB();

suite('osg');
osg();

suite('osgAnimation');
osgAnimation();
