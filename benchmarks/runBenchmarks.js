'use strict';
process.chdir( __dirname );
var mockupForNode = require( '../tests/mockup/mockupForNode.js' );
mockupForNode();

var Mocha = require( 'mocha' );

var mocha = new Mocha( {
    ui: 'qunit',
    reporter: 'list'
} );

mocha.addFile( '../builds/tests/benchmarks.js' );
mocha.run();