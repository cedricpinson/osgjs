define( [
    'tests/osgAnimation/Animation',
    'tests/osgAnimation/BasicAnimationManager',
    'tests/osgAnimation/Channel',
    'tests/osgAnimation/Interpolator',
    'tests/osgAnimation/StackedTransform'
], function ( Animation, BasicAnimationManager, Channel, Interpolator, StackedTransform ) {

    'use strict';

    return function () {
        Animation();
        BasicAnimationManager();
        Channel();
        Interpolator();
        StackedTransform();
    };
} );
