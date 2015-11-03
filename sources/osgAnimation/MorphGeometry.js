'use strict';
var MACROUTILS = require( 'osg/Utils' );
var BufferArrayProxy = require( 'osg/BufferArrayProxy' );
var Notify = require( 'osg/Notify' );
var Geometry = require( 'osg/Geometry' );
var StateSet = require( 'osg/StateSet' );
var MorphAttribute = require( 'osgAnimation/MorphAttribute' );
var StateAttribute = require( 'osg/StateAttribute' );


/**
 * MorphGeometry manage up to 4 morphTargets
 * @class MorphGeometry
 * @inherits Geometry
 */

var MorphGeometry = function () {
    Geometry.call( this );

    this._targets = []; // Target list (Geometry)
    this._stateSetAnimation = new StateSet(); // StateSet to handle morphAttribute
    this._targetWeights = new Float32Array( 4 ); // Fixed length array feed by UpdateMorph

    this._morphTargetNames = undefined;

    this._isInitialized = false;
};

MorphGeometry.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Geometry.prototype, {

    init: function () {
        var animAttrib = new MorphAttribute( Math.min( 4, this.getMorphTargets().length ) );
        this.getStateSetAnimation().setAttributeAndModes( animAttrib, StateAttribute.ON );
        animAttrib.setTargetWeights( this.getTargetsWeight() );


        if ( this._targets[ 0 ] ) {
            this._morphTargetNames = window.Object.keys( this._targets[ 0 ].getVertexAttributeList() );
            animAttrib.copyTargetNames( this._morphTargetNames );
        } else {
            this._morphTargetNames = [];
            Notify.error( 'No Targets in the MorphGeometry !' );
        }

        this._isInitialized = true;
        return true;
    },

    getMorphTargetNames: function () {
        return this._morphTargetNames;
    },

    getStateSetAnimation: function () {
        return this._stateSetAnimation;
    },

    getMorphTargets: function () {
        return this._targets;
    },

    isInitialized: function () {
        return this._isInitialized;
    },

    getTargetsWeight: function () {
        return this._targetWeights;
    },

    mergeChildrenVertexAttributeList: function () {

        var target;

        for ( var i = 0, l = this._targets.length; i < l; i++ ) {

            target = this._targets[ i ];

            // change BufferArray to BufferArrayProxy
            var attributeList = target.getVertexAttributeList();
            var names = window.Object.keys( attributeList );
            for ( var j = 0, jn = names.length; j < jn; j++ ) {

                var name = names[ j ];
                var att = attributeList[ name ];
                // check it's a buffer array before swtiching to proxy
                if ( att && !att.getBufferArray ) {

                    attributeList[ name ] = new BufferArrayProxy( att );

                }

            }

            Geometry.appendVertexAttributeToList( target.getVertexAttributeList(), this.getVertexAttributeList(), i );

        }

    }


} ), 'osgAnimation', 'MorphGeometry' );

MACROUTILS.setTypeID( MorphGeometry );

module.exports = MorphGeometry;
