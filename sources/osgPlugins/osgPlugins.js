'use strict';
var ReaderWriterGLTF = require( 'osgPlugins/ReaderWriterGLTF' );
var ReaderWriterB3DM = require( 'osgPlugins/ReaderWriterB3DM' );
var ReaderWriterGLB = require( 'osgPlugins/ReaderWriterGLB' );
var ReaderWriter3DTiles = require( 'osgPlugins/ReaderWriter3DTiles' );
var osgPlugins = {};

osgPlugins.ReaderWriterGLTF = ReaderWriterGLTF;
osgPlugins.ReaderWriterB3DM = ReaderWriterB3DM;
osgPlugins.ReaderWriterGLB = ReaderWriterGLB;
osgPlugins.ReaderWriter3DTiles = ReaderWriter3DTiles;

module.exports = osgPlugins;
