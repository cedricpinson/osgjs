define( [
    'osg/Utils',
    'osgAnimation/Animation',
    'osgAnimation/AnimationUpdateCallback',
    'osgAnimation/BasicAnimationManager',
    'osgAnimation/Channel',
    'osgAnimation/Easing',
    'osgAnimation/FloatLerpChannel',
    'osgAnimation/FloatTarget',
    'osgAnimation/Interpolator',
    'osgAnimation/Keyframe',
    'osgAnimation/CollectAnimationUpdateCallbackVisitor',
    'osgAnimation/QuatLerpChannel',
    'osgAnimation/QuatSlerpChannel',
    'osgAnimation/QuatTarget',
    'osgAnimation/Sampler',
    'osgAnimation/StackedQuaternion',
    'osgAnimation/StackedRotateAxis',
    'osgAnimation/StackedTranslate',
    'osgAnimation/Target',
    'osgAnimation/UpdateMatrixTransform',
    'osgAnimation/Vec3LerpChannel',
    'osgAnimation/Vec3Target',
    'osgAnimation/Skeleton',
    'osgAnimation/UpdateSkeleton',
    'osgAnimation/UpdateBone',
    'osgAnimation/StackedMatrixElement',
    'osgAnimation/MatrixTarget',
    'osgAnimation/Bone'
], function ( MACROUTILS, Animation, AnimationUpdateCallback, BasicAnimationManager, Channel, Easing, FloatLerpChannel, FloatTarget, Interpolator, Keyframe, CollectAnimationUpdateCallbackVisitor, QuatLerpChannel, QuatSlerpChannel, QuatTarget, Sampler, StackedQuaternion, StackedRotateAxis, StackedTranslate, Target, UpdateMatrixTransform, Vec3LerpChannel, Vec3Target, Skeleton, UpdateSkeleton, UpdateBone, StackedMatrixElement, MatrixTarget, Bone ) {

    var osgAnimation = {};

    osgAnimation.Animation = Animation;
    osgAnimation.AnimationUpdateCallback = AnimationUpdateCallback;
    osgAnimation.BasicAnimationManager = BasicAnimationManager;
    osgAnimation.Bone = Bone;
    osgAnimation.Channel = Channel;
    MACROUTILS.objectMix( osgAnimation, Easing );
    osgAnimation.FloatLerpChannel = FloatLerpChannel;
    osgAnimation.FloatTarget = FloatTarget;
    MACROUTILS.objectMix( osgAnimation, Interpolator );
    MACROUTILS.objectMix( osgAnimation, Keyframe );
    osgAnimation.CollectAnimationUpdateCallbackVisitor = CollectAnimationUpdateCallbackVisitor;
    osgAnimation.MatrixTarget = MatrixTarget;
    osgAnimation.QuatLerpChannel = QuatLerpChannel;
    osgAnimation.QuatSlerpChannel = QuatSlerpChannel;
    osgAnimation.QuatTarget = QuatTarget;
    osgAnimation.Sampler = Sampler;
    osgAnimation.Skeleton = Skeleton;
    osgAnimation.StackedMatrixElement = StackedMatrixElement;
    osgAnimation.StackedQuaternion = StackedQuaternion;
    osgAnimation.StackedRotateAxis = StackedRotateAxis;
    osgAnimation.StackedTranslate = StackedTranslate;
    osgAnimation.Target = Target;
    osgAnimation.UpdateBone = UpdateBone;
    osgAnimation.UpdateMatrixTransform = UpdateMatrixTransform;
    osgAnimation.UpdateSkeleton = UpdateSkeleton;
    osgAnimation.Vec3LerpChannel = Vec3LerpChannel;
    osgAnimation.Vec3Target = Vec3Target;

    return osgAnimation;
} );
