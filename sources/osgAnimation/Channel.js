/*global define */

define( [
    'osg/Utils',
    'osg/Object'
], function ( MACROUTILS, Object ) {

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

    /** 
     *  Channel is responsible to interpolate keys
     *  @class Channel
     */
    var Channel = function ( sampler, target ) {
        Object.call( this );
        this._sampler = sampler;
        this._target = target;
        this._targetName = undefined;
        this._data = {
            'value': undefined,
            'key': 0
        };
    };

    /** @lends Channel.prototype */
    Channel.prototype = MACROUTILS.objectInehrit( Object.prototype, {
        getKeyframes: function () {
            return this._sampler.getKeyframes();
        },
        setKeyframes: function ( keys ) {
            this._sampler.setKeyframes( keys );
        },
        getStartTime: function () {
            return this._sampler.getStartTime();
        },
        getEndTime: function () {
            return this._sampler.getEndTime();
        },
        getSampler: function () {
            return this._sampler;
        },
        setSampler: function ( sampler ) {
            this._sampler = sampler;
        },
        getTarget: function () {
            return this._target;
        },
        setTarget: function ( target ) {
            this._target = target;
        },
        setTargetName: function ( name ) {
            this._targetName = name;
        },
        getTargetName: function () {
            return this._targetName;
        },
        update: function ( t, weight, priority ) {
            weight = weight || 1.0;
            priority = priority || 0.0;

            // skip if weight == 0
            if ( weight < 1e-4 )
                return;
            var data = this._data;
            this._sampler.getValueAt( t, data );
            this._target.update.call( this._target, weight, data.value, priority );
        },
        reset: function () {
            this._target.reset();
        }
    } );

    return Channel;
} );