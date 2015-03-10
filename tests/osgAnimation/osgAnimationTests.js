define( [
    'tests/osgAnimation/Animation',
    'tests/osgAnimation/BasicAnimationManager',
    'tests/osgAnimation/Channel',
    'tests/osgAnimation/Interpolator',
    'tests/osgAnimation/Keyframe',
    'tests/osgAnimation/Sampler'
], function ( Animation, BasicAnimationManager, Channel, Interpolator, Keyframe, Sampler ) {

    'use strict';

    return function () {
        Animation();
        BasicAnimationManager();
        Channel();
        Interpolator();
        Keyframe();
        Sampler();
    };
} );
