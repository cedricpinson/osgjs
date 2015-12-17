'use strict';
var MainPerformance = require( 'benchmarks/osg/mainPerformance' );
var Geometry = require( 'benchmarks/osg/Geometry' );
var Visitor = require( 'benchmarks/osg/Visitor' );
var Animations = require( 'benchmarks/osgAnimation/mainPerformance' );


module.exports = function () {

    MainPerformance();
    Animations();
    Visitor();
    Geometry();

};
