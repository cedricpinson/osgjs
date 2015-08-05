define( [
    'osg/Utils',
    'osgAnimation/Animation',
    'osgAnimation/AnimationAttribute',
    'osgAnimation/AnimationUpdateCallback',
    'osgAnimation/BasicAnimationManager',
    'osgAnimation/Bone',
    'osgAnimation/Channel',
    'osgAnimation/CollectAnimationUpdateCallbackVisitor',
    'osgAnimation/Easing',
    'osgAnimation/Interpolator',
    'osgAnimation/RigGeometry',
    'osgAnimation/Skeleton',
    'osgAnimation/StackedMatrixElement',
    'osgAnimation/StackedQuaternion',
    'osgAnimation/StackedRotateAxis',
    'osgAnimation/StackedScaleElement',
    'osgAnimation/StackedTranslate',
    'osgAnimation/UpdateBone',
    'osgAnimation/UpdateMatrixTransform',
    'osgAnimation/UpdateSkeleton'
], function ( MACROUTILS, Animation, AnimationAttribute, AnimationUpdateCallback, BasicAnimationManager, Bone, Channel, CollectAnimationUpdateCallbackVisitor, Easing, Interpolator, RigGeometry, Skeleton, StackedMatrixElement, StackedQuaternion, StackedRotateAxis, StackedScaleElement, StackedTranslate, UpdateBone, UpdateMatrixTransform, UpdateSkeleton ) {

    'use strict';

    var osgAnimation = {};

    MACROUTILS.objectMix( osgAnimation, Easing );
    MACROUTILS.objectMix( osgAnimation, Interpolator );
    osgAnimation.Animation = Animation;
    osgAnimation.AnimationAttribute = AnimationAttribute;
    osgAnimation.AnimationUpdateCallback = AnimationUpdateCallback;
    osgAnimation.BasicAnimationManager = BasicAnimationManager;
    osgAnimation.Bone = Bone;
    osgAnimation.Channel = Channel;
    osgAnimation.CollectAnimationUpdateCallbackVisitor = CollectAnimationUpdateCallbackVisitor;
    osgAnimation.RigGeometry = RigGeometry;
    osgAnimation.Skeleton = Skeleton;
    osgAnimation.StackedMatrixElement = StackedMatrixElement;
    osgAnimation.StackedQuaternion = StackedQuaternion;
    osgAnimation.StackedRotateAxis = StackedRotateAxis;
    osgAnimation.StackedScaleElement = StackedScaleElement;
    osgAnimation.StackedTranslate = StackedTranslate;
    osgAnimation.UpdateBone = UpdateBone;
    osgAnimation.UpdateMatrixTransform = UpdateMatrixTransform;
    osgAnimation.UpdateSkeleton = UpdateSkeleton;

    return osgAnimation;
} );
