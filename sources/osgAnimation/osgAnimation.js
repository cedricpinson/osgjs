define( [
    'osg/Utils',
    'osgAnimation/Animation',
    'osgAnimation/SkinningAttribute',
    'osgAnimation/AnimationUpdateCallback',
    'osgAnimation/BasicAnimationManager',
    'osgAnimation/Bone',
    'osgAnimation/Channel',
    'osgAnimation/CollectAnimationUpdateCallbackVisitor',
    'osgAnimation/Easing',
    'osgAnimation/Interpolator',
    'osgAnimation/MorphAttribute',
    'osgAnimation/MorphGeometry',
    'osgAnimation/RigGeometry',
    'osgAnimation/Skeleton',
    'osgAnimation/StackedMatrix',
    'osgAnimation/StackedQuaternion',
    'osgAnimation/StackedRotateAxis',
    'osgAnimation/StackedScale',
    'osgAnimation/StackedTranslate',
    'osgAnimation/UpdateBone',
    'osgAnimation/UpdateMatrixTransform',
    'osgAnimation/UpdateMorph',
    'osgAnimation/UpdateSkeleton'
], function ( MACROUTILS, Animation, SkinningAttribute, AnimationUpdateCallback, BasicAnimationManager, Bone, Channel, CollectAnimationUpdateCallbackVisitor, Easing, Interpolator, MorphAttribute, MorphGeometry, RigGeometry, Skeleton, StackedMatrix, StackedQuaternion, StackedRotateAxis, StackedScale, StackedTranslate, UpdateBone, UpdateMatrixTransform, UpdateMorph, UpdateSkeleton ) {

    'use strict';

    var osgAnimation = {};

    MACROUTILS.objectMix( osgAnimation, Easing );
    MACROUTILS.objectMix( osgAnimation, Interpolator );
    osgAnimation.Animation = Animation;
    osgAnimation.SkinningAttribute = SkinningAttribute;
    osgAnimation.AnimationUpdateCallback = AnimationUpdateCallback;
    osgAnimation.BasicAnimationManager = BasicAnimationManager;
    osgAnimation.Bone = Bone;
    osgAnimation.Channel = Channel;
    osgAnimation.CollectAnimationUpdateCallbackVisitor = CollectAnimationUpdateCallbackVisitor;
    osgAnimation.MorphAttribute = MorphAttribute;
    osgAnimation.MorphGeometry = MorphGeometry;
    osgAnimation.RigGeometry = RigGeometry;
    osgAnimation.Skeleton = Skeleton;
    osgAnimation.StackedMatrix = StackedMatrix;
    osgAnimation.StackedQuaternion = StackedQuaternion;
    osgAnimation.StackedRotateAxis = StackedRotateAxis;
    osgAnimation.StackedScale = StackedScale;
    osgAnimation.StackedTranslate = StackedTranslate;
    osgAnimation.UpdateBone = UpdateBone;
    osgAnimation.UpdateMatrixTransform = UpdateMatrixTransform;
    osgAnimation.UpdateMorph = UpdateMorph;
    osgAnimation.UpdateSkeleton = UpdateSkeleton;

    return osgAnimation;
} );
