'use strict';
/* eslint-env node, mocha */
process.chdir( __dirname );
var mockupForNode = require( './mockup/mockupForNode.js' );
mockupForNode();

var Mocha = require( 'mocha' );

var mocha = new Mocha( {
    ui: 'qunit',
    reporter: 'spec'
} );

mocha.addFile( '../builds/tests/tests.js' );

// In case the file has no tests we should make mocha fail
mocha.loadFiles( function () {
    // upon completion list the tests found
    var count = 0;
    mocha.suite.eachTest( function ( ) {
        count += 1;
    } )
    if ( count === 0 ) {
        console.error( 'No tests found' );
        process.exit( -1 );
    }
} );

// in case we have tests, but they don't run
mocha.run().on( 'end', function () {
    if ( this.stats.passes === 0 ) {
        console.error( 'No tests passed' );
        process.exit( -1 );
    }
} );
