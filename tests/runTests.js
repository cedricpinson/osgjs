'use strict';
process.chdir( __dirname );
var mockupForNode = require( './mockup/mockupForNode.js' );
mockupForNode();

var Mocha = require( 'mocha' );

var mocha = new Mocha( {
    ui: 'qunit',
    reporter: 'spec'
} );

mocha.addFile( '../builds/dist/tests.js' );
mocha.run();
