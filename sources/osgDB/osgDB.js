'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Input = require( 'osgDB/Input' );
var ReaderParser = require( 'osgDB/ReaderParser' );
var DatabasePager = require( 'osgDB/DatabasePager' );
var osgWrappers = require( 'osgWrappers/serializers/osg' );
var osgAnimationWrappers = require( 'osgWrappers/serializers/osgAnimation' );
var osgTextWrappers = require( 'osgWrappers/serializers/osgText' );
/** @namespace osgDB */
var osgDB = {};
osgDB.Input = Input;
MACROUTILS.objectMix( osgDB, ReaderParser );
osgDB.DatabasePager = DatabasePager;
osgDB.ObjectWrapper.serializers.osg = osgWrappers;
osgDB.ObjectWrapper.serializers.osgAnimation = osgAnimationWrappers;
osgDB.ObjectWrapper.serializers.osgText = osgTextWrappers;

module.exports = osgDB;
