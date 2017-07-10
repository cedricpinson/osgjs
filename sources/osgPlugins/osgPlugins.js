'use strict';
var ReaderWriterGLTF = require('osgPlugins/ReaderWriterGLTF');
var ReaderWriterZIP = require('osgPlugins/ReaderWriterZIP');

var osgPlugins = {};

osgPlugins.ReaderWriterGLTF = ReaderWriterGLTF;
osgPlugins.ReaderWriterZIP = ReaderWriterZIP;

module.exports = osgPlugins;
