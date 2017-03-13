'use strict';

var MACROUTILS = require( 'osg/Utils' );
var StateAttribute = require( 'osg/StateAttribute' );
var Uniform = require( 'osg/Uniform' );


/**
 * MorphAttribute encapsulate Animation State
 * @class MorphAttribute
 * @inherits StateAttribute
 */
var MorphAttribute = function ( nbTarget, disable ) {
    StateAttribute.call( this );
    this._nbTarget = nbTarget;
    this._enable = !disable;

    this._targetNames = {};
    this._hashNames = ''; // compute only once target hash names

    this._hash = ''; // cache of hash
};

MorphAttribute.uniforms = {};

MorphAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

    attributeType: 'Morph',

    cloneType: function () {
        return new MorphAttribute( undefined, true );
    },

    hasTarget: function ( name ) {
        return !!this._targetNames[ name ];
    },

    copyTargetNames: function ( names ) {
        var tNames = this._targetNames;
        var hash = '';
        var nbNames = tNames.length = names.length;

        for ( var i = 0; i < nbNames; ++i ) {
            var att = names[ i ];
            tNames[ att ] = true;
            hash += att;
        }

        this._hashNames = hash;
        this._hash = '';
    },

    getOrCreateUniforms: function () {
        var obj = MorphAttribute;
        var unifHash = this.getNumTargets();

        if ( obj.uniforms[ unifHash ] ) return obj.uniforms[ unifHash ];

        obj.uniforms[ unifHash ] = {
            uTargetWeights: Uniform.createFloat4( 'uTargetWeights' )
        };

        return obj.uniforms[ unifHash ];
    },

    setNumTargets: function ( nb ) {
        this._nbTarget = nb;
        this._hash = '';
    },

    getNumTargets: function () {
        return this._nbTarget;
    },

    setTargetWeights: function ( targetWeight ) {
        this._targetWeights = targetWeight;
    },

    getTargetWeights: function () {
        return this._targetWeights;
    },

    isEnabled: function () {
        return this._enable;
    },

    getHash: function () {
        if ( !this._hash ) this._hash = this.getTypeMember() + this._hashNames + this.getNumTargets() + this.isEnabled();
        return this._hash;
    },

    apply: function () {

        if ( !this._enable ) return;

        var uniformMap = this.getOrCreateUniforms();
        uniformMap.uTargetWeights.setFloat4( this._targetWeights );

    }

} ), 'osgAnimation', 'MorphAttribute' );

MACROUTILS.setTypeID( MorphAttribute );

module.exports = MorphAttribute;
