'use strict';
var MainPerformance = require( 'benchmarks/osg/mainPerformance' );
var Geometry = require( 'benchmarks/osg/Geometry' );
var Visitor = require( 'benchmarks/osg/Visitor' );


module.exports = function () {

    suite( 'MainPerformance' );
    MainPerformance();

    suite( 'Visitor' );
    Visitor();

    suite( 'Geometry' );
    Geometry();

};
