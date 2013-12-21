define( [
    'test/osgAnimation/Animation',
    'test/osgAnimation/BasicAnimationManager',
    'test/osgAnimation/Channel',
    'test/osgAnimation/Interpolator',
    'test/osgAnimation/Keyframe',
    'test/osgAnimation/Sampler'
], function ( Animation, BasicAnimationManager, Channel, Interpolator, Keyframe, Sampler ) {

    return function () {
        Animation();
        BasicAnimationManager();
        Channel();
        Interpolator();
        Keyframe();
        Sampler();
    };
} );