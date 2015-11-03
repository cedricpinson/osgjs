'use strict';
var Animation = require( 'tests/osgAnimation/Animation' );
var BasicAnimationManager = require( 'tests/osgAnimation/BasicAnimationManager' );
var Channel = require( 'tests/osgAnimation/Channel' );
var Interpolator = require( 'tests/osgAnimation/Interpolator' );
var StackedTransform = require( 'tests/osgAnimation/StackedTransform' );


module.exports = function () {
    Animation();
    BasicAnimationManager();
    Channel();
    Interpolator();
    StackedTransform();
};
