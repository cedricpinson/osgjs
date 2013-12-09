/*global define */

define( [
    'osg/osg',
    'osg/Object',
    'osg/Matrix',
    'osgAnimation/Vec3Target',
    'osg/Vec3'
], function ( osg, Object, Matrix, Vec3Target, Vec3 ) {

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
     *  StackedTranslate
     *  @class StackedTranslate
     */
    var StackedTranslate = function ( name, translate ) {
        Object.call( this );
        if ( !translate ) {
            translate = [ 0, 0, 0 ];
        }
        this._translate = translate;
        this._target = undefined;
        this.setName( name );
    };

    /** @lends StackedTranslate.prototype */
    StackedTranslate.prototype = osg.objectInehrit( Object.prototype, {
        setTranslate: function ( translate ) {
            Vec3.copy( translate, this._translate );
        },
        setTarget: function ( target ) {
            this._target = target;
        },
        getTarget: function () {
            return this._target;
        },
        update: function () {
            if ( this._target !== undefined ) {
                Vec3.copy( this._target.getValue(), this._translate );
            }
        },
        getOrCreateTarget: function () {
            if ( !this._target ) {
                this._target = new Vec3Target( this._translate );
            }
            return this._target;
        },
        applyToMatrix: function ( m ) {
            Matrix.preMultTranslate( m, this._translate );
        }
    } );

    return StackedTranslate;
} );