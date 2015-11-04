'use strict';
var MainPerformance = require( 'benchmarks/osg/mainPerformance' );
var Animations = require( 'benchmarks/osgAnimation/mainPerformance' );

module.exports = function () {

    MainPerformance();
    Animations();

};
