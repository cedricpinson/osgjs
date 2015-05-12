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
    'osgAnimation/LinkVisitor',
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
    'osgAnimation/FloatCubicBezierChannel',
    'osgAnimation/Vec3CubicBezierChannel',
    'osgAnimation/Skeleton',
    'osgAnimation/StackedMatrixElement',
    'osgAnimation/MatrixTarget',
    'osgAnimation/UpdateSkeleton',
    'osgAnimation/RigGeometry',
    'osgAnimation/Bone',
    'osgAnimation/UpdateBone'
], function ( MACROUTILS, Animation, AnimationUpdateCallback, BasicAnimationManager, Channel, Easing, FloatLerpChannel, FloatTarget, Interpolator, Keyframe, LinkVisitor, QuatLerpChannel, QuatSlerpChannel, QuatTarget, Sampler, StackedQuaternion, StackedRotateAxis, StackedTranslate, Target, UpdateMatrixTransform, Vec3LerpChannel, Vec3Target, FloatCubicBezierChannel, Vec3CubicBezierChannel, Skeleton, StackedMatrixElement, MatrixTarget, UpdateSkeleton, RigGeometry, Bone, UpdateBone ) {

    var osgAnimation = {};

    osgAnimation.Animation = Animation;
    osgAnimation.AnimationUpdateCallback = AnimationUpdateCallback;
    osgAnimation.BasicAnimationManager = BasicAnimationManager;
    osgAnimation.Bone = Bone;
    osgAnimation.Channel = Channel;
    MACROUTILS.objectMix( osgAnimation, Easing );
    osgAnimation.FloatCubicBezierChannel = FloatCubicBezierChannel;
    osgAnimation.FloatLerpChannel = FloatLerpChannel;
    osgAnimation.FloatTarget = FloatTarget;
    MACROUTILS.objectMix( osgAnimation, Interpolator );
    MACROUTILS.objectMix( osgAnimation, Keyframe );
    osgAnimation.LinkVisitor = LinkVisitor;
    osgAnimation.MatrixTarget = MatrixTarget;
    osgAnimation.QuatLerpChannel = QuatLerpChannel;
    osgAnimation.QuatSlerpChannel = QuatSlerpChannel;
    osgAnimation.QuatTarget = QuatTarget;
    osgAnimation.RigGeometry = RigGeometry;
    osgAnimation.Sampler = Sampler;
    osgAnimation.Skeleton = Skeleton;
    osgAnimation.StackedMatrixElement = StackedMatrixElement;
    osgAnimation.StackedQuaternion = StackedQuaternion;
    osgAnimation.StackedRotateAxis = StackedRotateAxis;
    osgAnimation.StackedTranslate = StackedTranslate;
    osgAnimation.Target = Target;
    osgAnimation.UpdateMatrixTransform = UpdateMatrixTransform;
    osgAnimation.UpdateBone = UpdateBone;
    osgAnimation.Vec3CubicBezierChannel = Vec3CubicBezierChannel;
    osgAnimation.Vec3LerpChannel = Vec3LerpChannel;
    osgAnimation.Vec3Target = Vec3Target;
    osgAnimation.UpdateSkeleton = UpdateSkeleton;

    return osgAnimation;
} );
