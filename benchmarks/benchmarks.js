
// add missing class for phantom js execution context
if ( window.HTMLVideoElement === undefined ) {
    // dummy class
    window.HTMLVideoElement = function () {};
}

var OSG = require( 'OSG' );
var osgBenchmarks = require( 'benchmarks/osg/osgBenchmarks' );
OSG.osg.setNotifyLevel( OSG.osg.ERROR );

// hack because of osgPool
OSG.osg.init();

osgBenchmarks();
