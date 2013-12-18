/*global define */

define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osgAnimation/QuatTarget',
    'osg/Quat'
], function ( MACROUTILS, Object, Matrix, QuatTarget, Quat ) {

    /** -*- compile-command: "jslint-cli StackedTransformElement.js" -*-
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
     *  StackedQuaternion
     *  @class StackedQuaternion
     */
    var StackedQuaternion = function ( name, quat ) {
        Object.call( this );
        if ( !quat ) {
            quat = [ 0, 0, 0, 1 ];
        }
        this._quaternion = quat;
        this._target = undefined;
        this._matrixTmp = [];
        Matrix.makeIdentity( this._matrixTmp );
        this.setName( name );
    };

    /** @lends StackedQuaternion.prototype */
    StackedQuaternion.prototype = MACROUTILS.objectInehrit( Object.prototype, {
        setQuaternion: function ( q ) {
            Quat.copy( q, this._quaternion );
        },
        setTarget: function ( target ) {
            this._target = target;
        },
        getTarget: function () {
            return this._target;
        },
        update: function () {
            if ( this._target !== undefined ) {
                Quat.copy( this._target.getValue(), this._quaternion );
            }
        },
        getOrCreateTarget: function () {
            if ( !this._target ) {
                this._target = new QuatTarget( this._quaternion );
            }
            return this._target;
        },
        applyToMatrix: function ( m ) {
            var mtmp = this._matrixTmp;
            Matrix.setRotateFromQuat( mtmp, this._quaternion );
            Matrix.preMult( m, mtmp );
        }
    } );

    return StackedQuaternion;
} );