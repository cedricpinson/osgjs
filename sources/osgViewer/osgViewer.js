'use strict';
var Renderer = require( 'osgViewer/Renderer' );
var View = require( 'osgViewer/View' );
var Viewer = require( 'osgViewer/Viewer' );
var EventProxy = require( 'osgViewer/eventProxy/EventProxy' );


var osgViewer = {};

osgViewer.Renderer = Renderer;
osgViewer.View = View;
osgViewer.Viewer = Viewer;
osgViewer.EventProxy = EventProxy;

module.exports = osgViewer;
