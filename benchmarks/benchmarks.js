import { osg } from 'OSG';
import osgBenchmarks from 'benchmarks/osg/osgBenchmarks';

// add missing class for phantom js execution context
if (window.HTMLVideoElement === undefined) {
    // dummy class
    window.HTMLVideoElement = function() {};
}

osg.setNotifyLevel(osg.ERROR);

osgBenchmarks();
