// polyfill for phantomjs
require( 'tests/vendors/es5-shim' );
require( 'tests/vendors/es6-shim' );


// add missing class for phantom js execution context
if ( window.HTMLVideoElement === undefined ) {
    // dummy class
    window.HTMLVideoElement = function () {};
}


/*global QUnit,define,module,test,ok */
QUnit.config.testTimeout = 5000;
var cliOutputBenchs = [];
QUnit.log( function ( details ) {
    cliOutputBenchs.push( details.message );
} );
QUnit.done( function () {
    console.log( '' );
    console.log( cliOutputBenchs.join( '\n' ) );
} );

var OSG = require( 'OSG' );
var osgBenchmarks = require( 'benchmarks/osg/osgBenchmarks' );
OSG.osg.setNotifyLevel( OSG.osg.ERROR );
// start test when require finished its job
QUnit.load();
QUnit.start();

// hack because of osgPool
OSG.osg.init();

osgBenchmarks();
