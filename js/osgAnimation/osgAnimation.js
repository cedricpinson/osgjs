/*global define */

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
	'osgAnimation/QuatSLerpChannel',
	'osgAnimation/QuatTarget',
	'osgAnimation/Sampler',
	'osgAnimation/StackedQuaternion',
	'osgAnimation/StackedRotateAxis',
	'osgAnimation/StackedTranslate',
	'osgAnimation/Target',
	'osgAnimation/UpdateMatrixTransform',
	'osgAnimation/Vec3LerpChannel',
	'osgAnimation/Vec3Target'
], function ( MACROUTILS, Animation, AnimationUpdateCallback, BasicAnimationManager, Channel, Easing, FloatLerpChannel, FloatTarget, Interpolator, Keyframe, LinkVisitor, QuatLerpChannel, QuatSLerpChannel, QuatTarget, Sampler, StackedQuaternion, StackedRotateAxis, StackedTranslate, Target, UpdateMatrixTransform, Vec3LerpChannel, Vec3Target ) {

	/** -*- compile-command: "jslint-cli osgAnimation.js" -*-
	 *
	 *  Copyright (C) 2010 Cedric Pinson
	 *
	 *                  GNU LESSER GENERAL PUBLIC LICENSE
	 *                      Version 3, 29 June 2007
	 *
	 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
	 * Everyone is permitted to copy and distribute verbatim copies
	 * of this license document, but changing it is not allowed.
	 *
	 * This version of the GNU Lesser General Public License incorporates
	 * the terms and conditions of version 3 of the GNU General Public
	 * License
	 *
	 * Authors:
	 *  Cedric Pinson <cedric.pinson@plopbyte.com>
	 *
	 */

	var osgAnimation = {};

	osgAnimation.Animation = Animation;
	osgAnimation.AnimationUpdateCallback = AnimationUpdateCallback;
	osgAnimation.BasicAnimationManager = BasicAnimationManager;
	osgAnimation.Channel = Channel;
	MACROUTILS.objectMix( osgAnimation, Easing );
	osgAnimation.FloatLerpChannel = FloatLerpChannel;
	osgAnimation.FloatTarget = FloatTarget;
	MACROUTILS.objectMix( osgAnimation, Interpolator );
	MACROUTILS.objectMix( osgAnimation, Keyframe );
	osgAnimation.LinkVisitor = LinkVisitor;
	osgAnimation.QuatLerpChannel = QuatLerpChannel;
	osgAnimation.QuatSLerpChannel = QuatSLerpChannel;
	osgAnimation.QuatTarget = QuatTarget;
	osgAnimation.Sampler = Sampler;
	osgAnimation.StackedQuaternion = StackedQuaternion;
	osgAnimation.StackedRotateAxis = StackedRotateAxis;
	osgAnimation.StackedTranslate = StackedTranslate;
	osgAnimation.Target = Target;
	osgAnimation.UpdateMatrixTransform = UpdateMatrixTransform;
	osgAnimation.Vec3LerpChannel = Vec3LerpChannel;
	osgAnimation.Vec3Target = Vec3Target;

	return osgAnimation;
} );