'use strict';
var osg = require( 'osgWrappers/serializers/osg' );
var osgAnimation = require( 'osgWrappers/serializers/osgAnimation' );


var osgWrappers = {};

osgWrappers.osg = osg;
osgWrappers.osgAnimation = osgAnimation;

module.exports = osgWrappers;
