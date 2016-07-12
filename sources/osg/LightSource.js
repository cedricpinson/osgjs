'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Node = require( 'osg/Node' );
var TransformEnums = require( 'osg/TransformEnums' );
var Vec3 = require( 'osg/Vec3' );

/**
 * LightSource is a positioned node to use with StateAttribute Light
 * @class LightSource
 * @memberof osg
 * @extends Node
 */
var LightSource = function () {
    Node.call( this );
    this._light = undefined;
    this._referenceFrame = TransformEnums.RELATIVE_RF;
};

LightSource.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Node.prototype, {
    getLight: function () {
        return this._light;
    },
    setLight: function ( light ) {
        this._light = light;
    },
    setReferenceFrame: function ( value ) {
        this._referenceFrame = value;
    },
    getReferenceFrame: function () {
        return this._referenceFrame;
    },
    computeBoundingSphere: ( function () {
        var tmp = Vec3.create();

        return function ( bsphere ) {
            Node.prototype.computeBoundingSphere.call( this, bsphere );

            if ( this._light !== undefined && this._referenceFrame === TransformEnums.RELATIVE_RF ) {
                var position = this._light.getPosition();

                if ( position[ 3 ] !== 0.0 ) {
                    bsphere.expandByVec3( Vec3.mult( position, 1.0 / position[ 3 ], tmp ) );
                }
            }

            return bsphere;
        };
    } )()

} ), 'osg', 'LightSource' );

MACROUTILS.setTypeID( LightSource );

module.exports = LightSource;
