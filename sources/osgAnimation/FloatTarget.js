/*global define */

define( [
    'osg/Utils',
    'osgAnimation/Target'
], function ( MACROUTILS, Target ) {

    /** -*- compile-command: "jslint-cli Target.js" -*-
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

    var FloatTarget = function ( value ) {
        Target.call( this );
        this._target = [ value ];
    };

    FloatTarget.prototype = MACROUTILS.objectInehrit( Target.prototype, {
        update: function ( weight, val, priority ) {
            if ( this._weight || this._priorityWeight ) {

                if ( this._lastPriority != priority ) {
                    // change in priority
                    // add to weight with the same previous priority cumulated weight
                    this._weight += this._priorityWeight * ( 1.0 - this._weight );
                    this._priorityWeight = 0;
                    this._lastPriority = priority;
                }

                this._priorityWeight += weight;
                t = ( 1.0 - this._weight ) * weight / this._priorityWeight;
                this._target += ( val - this._target ) * t;
            } else {

                this._priorityWeight = weight;
                this._lastPriority = priority;
                this._target = val;
            }
        }
    } );

    return FloatTarget;
} );