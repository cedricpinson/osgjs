/*global define */

define( [], function () {

	/** -*- compile-command: "jslint-cli Keyframe.js" -*-
	 *
	 *  Copyright (C) 2010-2011 Cedric Pinson
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

	// #FIXME Separate stuffs

	createVec3Keyframe = function ( t, array ) {
		var k = array.slice( 0 );
		k.t = t;
		return k;
	};

	createQuatKeyframe = function ( t, array ) {
		var k = array.slice( 0 );
		k.t = t;
		return k;
	};

	createFloatKeyframe = function ( t, value ) {
		var k = [ value ];
		k.t = t;
		return k;
	};

	return {
		createVec3Keyframe: createVec3Keyframe,
		createQuatKeyframe: createQuatKeyframe,
		createFloatKeyframe,
		createFloatKeyframe
	};
} );