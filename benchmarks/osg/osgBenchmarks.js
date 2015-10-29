define( [
    'benchmarks/osg/mainPerformance',
    'benchmarks/osgAnimation/mainPerformance'
], function ( MainPerformance, Animations ) {

    'use strict';

    return function () {

        MainPerformance();
        Animations();

    };
} );
