'use strict';
var BasicAnimationManager = require( 'tests/osgAnimation/BasicAnimationManager' );
var Interpolator = require( 'tests/osgAnimation/Interpolator' );
var StackedTransform = require( 'tests/osgAnimation/StackedTransform' );


module.exports = function () {
    BasicAnimationManager();
    Interpolator();
    StackedTransform();
};
