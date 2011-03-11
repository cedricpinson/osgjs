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
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */


var osgAnimation = {};

osgAnimation.EaseOutQuad = function(t) { return - (t* (t-2.0)); };
osgAnimation.EaseInQuad = function(t) { return (t*t); };
osgAnimation.EaseOutCubic = function(t) { t = t-1.0; return (t*t*t + 1); };
osgAnimation.EaseInCubic = function(t) { return (t*t*t); };
osgAnimation.EaseOutQuart = function(t) { t = t - 1; return - (t*t*t*t -1); };
osgAnimation.EaseInQuart = function(t) { return (t*t*t*t); };
osgAnimation.EaseOutElastic = function(t) { return Math.pow(2.0, -10.0 * t) * Math.sin((t - 0.3 / 4.0) * (2.0 * Math.PI) / 0.3) + 1.0; };
//osgAnimation.EaseInElastic = function(t) { return ; };
