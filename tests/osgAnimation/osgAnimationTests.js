define( [
    'tests/osgAnimation/Animation',
    'tests/osgAnimation/BasicAnimationManager',
    'tests/osgAnimation/Channel',
    'tests/osgAnimation/Interpolator',
], function ( Animation, BasicAnimationManager, Channel, Interpolator ) {

    'use strict';

    return function () {
        Animation();
        BasicAnimationManager();
        Channel();
        Interpolator();
    };
} );
