/*global define */

define( [
    'osgAnimation/Channel',
    'osgAnimation/Sampler',
    'osgAnimation/Interpolator',
    'osgAnimation/QuatTarget',
    'osg/Quat'
], function ( Channel, Sampler, Interpolator, Vec3Target, Vec3 ) {

    /** -*- compile-command: "jslint-cli Channel.js" -*-
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

    var QuatLerpChannel = function ( keys, target ) {
        var sampler = new Sampler();
        if ( !keys ) {
            keys = [];
        }
        if ( !target ) {
            target = new QuatTarget();
        }
        Channel.call( this, sampler, target );
        sampler.setInterpolator( Interpolator.QuatLerpInterpolator );
        this.setKeyframes( keys );
        this._data.value = Quat.copy( target.getValue(), [] );
    };

    QuatLerpChannel.prototype = Channel.prototype;

    return QuatLerpChannel;
} );