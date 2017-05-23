'use strict';
var MACROUTILS = require( 'osg/Utils' );
var ShaderUtils = require( 'osgShader/utils' );
var Node = require( 'osgShader/node/Node' );

var ShadowReceive = function () {
    Node.call( this );

};

ShadowReceive.prototype = MACROUTILS.objectInherit( Node.prototype, {
    type: 'ShadowReceiveNode',

    validInputs: [
        'lighted',
        'shadowTexture',
        //'shadowTextureMapSize',
        'shadowTextureRenderSize',
        'shadowTextureProjectionMatrix',
        'shadowTextureViewMatrix',
        'shadowTextureDepthRange',
        'normalWorld',
        'vertexWorld',
        'shadowBias'
        // 'shadowNormalBias'
    ],
    validOutputs: [ 'float' ],

    globalFunctionDeclaration: function () {
        return '#pragma include "shadowsReceive.glsl"';
    },

    setShadowAttribute: function ( shadowAttr ) {
        this._shadow = shadowAttr;
        return this;
    },

    // must return an array of defines
    // because it will be passed to the ShaderGenerator
    getDefines: function () {
        return this._shadow.getDefines();
    },
    getExtensions: function () {
        return this._shadow.getExtensions();
    },
    computeShader: function () {

        var inp = this._inputs;

        // common inputs
        var inputs = [
            inp.lighted,
            inp.shadowTexture
        ];

        if ( this._shadow.getAtlas() ) {
            inputs.push( inp.shadowTextureMapSize );
        }

        inputs = inputs.concat( [
            inp.shadowTextureRenderSize,
            inp.shadowTextureProjectionMatrix,
            inp.shadowTextureViewMatrix,
            inp.shadowTextureDepthRange,
            inp.normalWorld,
            inp.vertexWorld,
            inp.shadowBias
        ] );

        if ( this._shadow.getNormalBias() ) {
            inputs.push( inp.shadowNormalBias );
        }

        return ShaderUtils.callFunction( 'computeShadow', this._outputs.float, inputs );
    }

} );

var ShadowCast = function () {
    Node.call( this );

};

ShadowCast.prototype = MACROUTILS.objectInherit( Node.prototype, {

    type: 'ShadowCast',
    validInputs: [ 'shadowDepthRange', 'fragEye' ],
    validOutputs: [ 'color' ],

    globalFunctionDeclaration: function () {
        return '#pragma include "shadowsCastFrag.glsl"';
    },

    setShadowCastAttribute: function ( shadowAttr ) {
        this._shadowCast = shadowAttr;
        return this;
    },

    // must return an array of defines
    // because it will be passed to the ShaderGenerator
    getDefines: function () {
        return this._shadowCast.getDefines();
    },

    computeShader: function () {

        var inp = this._inputs;
        var inputs = [].concat( [ inp.fragEye, inp.shadowDepthRange ] );

        if ( this._shadowCast.getReceiveAttribute().getAtlas() && !this._shadowCast.getScissor() ) {
            inputs.push( inp.shadowTextureMapSize );
        }

        return ShaderUtils.callFunction( 'computeShadowDepth', this._outputs.color, inputs );
    }

} );

module.exports = {
    ShadowCast: ShadowCast,
    ShadowReceive: ShadowReceive
};
