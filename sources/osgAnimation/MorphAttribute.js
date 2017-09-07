'use strict';

var MACROUTILS = require('osg/Utils');
var StateAttribute = require('osg/StateAttribute');
var Uniform = require('osg/Uniform');

/**
 * MorphAttribute encapsulate Animation State
 * @class MorphAttribute
 * @inherits StateAttribute
 */
var MorphAttribute = function(nbTarget, disable) {
    StateAttribute.call(this);
    this._nbTarget = nbTarget;
    this._enable = !disable;

    this._targetNames = {};
    this._hashNames = ''; // compute only once target hash names

    this._hash = ''; // cache of hash
    this._dirtyHash = true;
};

MorphAttribute.uniforms = {};

MACROUTILS.createPrototypeStateAttribute(
    MorphAttribute,
    MACROUTILS.objectInherit(StateAttribute.prototype, {
        attributeType: 'Morph',

        cloneType: function() {
            return new MorphAttribute(undefined, true);
        },

        hasTarget: function(name) {
            return !!this._targetNames[name];
        },

        copyTargetNames: function(names) {
            var tNames = this._targetNames;
            var hash = '';
            var nbNames = (tNames.length = names.length);

            for (var i = 0; i < nbNames; ++i) {
                var att = names[i];
                tNames[att] = true;
                hash += att;
            }

            this._hashNames = hash;
            this._dirtyHash = true;
        },

        getOrCreateUniforms: function() {
            var obj = MorphAttribute;
            var unifHash = this.getNumTargets();

            if (obj.uniforms[unifHash]) return obj.uniforms[unifHash];

            obj.uniforms[unifHash] = {
                uTargetWeights: Uniform.createFloat4('uTargetWeights')
            };

            return obj.uniforms[unifHash];
        },

        setNumTargets: function(nb) {
            this._nbTarget = nb;
            this._dirtyHash = true;
        },

        getNumTargets: function() {
            return this._nbTarget;
        },

        setTargetWeights: function(targetWeight) {
            this._targetWeights = targetWeight;
        },

        getTargetWeights: function() {
            return this._targetWeights;
        },

        isEnabled: function() {
            return this._enable;
        },

        getHash: function() {
            if (!this._dirtyHash) return this._hash;

            this._hash = this._computeInternalHash();
            this._dirtyHash = false;
            return this._hash;
        },

        _computeInternalHash: function() {
            return this.getTypeMember() + this._hashNames + this.getNumTargets() + this.isEnabled();
        },

        apply: function() {
            if (!this._enable) return;

            var uniformMap = this.getOrCreateUniforms();
            uniformMap.uTargetWeights.setFloat4(this._targetWeights);
        }
    }),
    'osgAnimation',
    'MorphAttribute'
);

module.exports = MorphAttribute;
